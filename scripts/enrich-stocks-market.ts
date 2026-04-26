/**
 * stocks.market 컬럼을 DART corp_cls 기반으로 갱신.
 *
 * 동작:
 *  1. DART /api/corpCode.xml (ZIP) 다운로드 → stock_code↔corp_code 매핑
 *  2. 우리 DB의 stocks 전수 조회 (페이지네이션)
 *  3. 각 종목의 corp_code로 DART /api/company.json 병렬 호출 → corp_cls 추출
 *  4. market 별로 batch UPDATE (Y=KOSPI, K=KOSDAQ, N=KONEX, 그 외=ETC)
 *
 * 실행: npx tsx scripts/enrich-stocks-market.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { downloadCorpCodeZip } from "../src/lib/api/dart";
import { getSupabaseServerClient } from "../src/lib/supabase";

interface DartCorp {
  corp_code: string;
  corp_name: string;
  stock_code: string;
}

interface DartCompany {
  status: string;
  message: string;
  corp_cls?: string;
}

const CONCURRENCY = 4;
const BASE_URL = "https://opendart.fss.or.kr/api";
const MAX_RETRIES = 4;

function dartClsToMarket(cls?: string): string {
  switch (cls) {
    case "Y":
      return "KOSPI";
    case "K":
      return "KOSDAQ";
    case "N":
      return "KONEX";
    default:
      return "ETC";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchCompanyCorpCls(
  corpCode: string,
  apiKey: string
): Promise<string | null> {
  const url = `${BASE_URL}/company.json?crtfc_key=${apiKey}&corp_code=${corpCode}`;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as DartCompany;
      if (json.status !== "000") return null;
      return json.corp_cls ?? null;
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.warn(
          `  ! ${corpCode} failed after ${MAX_RETRIES} retries: ${(err as Error).message}`
        );
        return null;
      }
      // exponential backoff: 500ms, 1s, 2s
      await sleep(500 * Math.pow(2, attempt));
    }
  }
  return null;
}

/** 동시 실행 워커 풀 */
async function pool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  size: number,
  onProgress?: (done: number, total: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let completed = 0;

  async function next(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx]);
      completed += 1;
      if (completed % 100 === 0 || completed === items.length) {
        onProgress?.(completed, items.length);
      }
    }
  }

  await Promise.all(Array.from({ length: size }, () => next()));
  return results;
}

async function fetchAllStocks(): Promise<{ id: number; stock_code: string; market: string }[]> {
  const supabase = getSupabaseServerClient();
  const all: { id: number; stock_code: string; market: string }[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("stocks")
      .select("id, stock_code, market")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Fetch stocks failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as typeof all));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) throw new Error("DART_API_KEY missing");

  console.log("[enrich] downloading DART corpCode.xml.zip...");
  const zipBuffer = await downloadCorpCodeZip();
  const zip = new AdmZip(Buffer.from(zipBuffer));
  const xmlEntry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".xml"));
  if (!xmlEntry) throw new Error("CORPCODE.xml not found");
  const xml = xmlEntry.getData().toString("utf-8");

  console.log("[enrich] parsing XML...");
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });
  const parsed = parser.parse(xml) as { result: { list: DartCorp[] | DartCorp } };
  const list = Array.isArray(parsed.result.list) ? parsed.result.list : [parsed.result.list];

  // stock_code(6자리) → corp_code(8자리) 매핑
  const codeToCorp = new Map<string, string>();
  for (const c of list) {
    const s = String(c.stock_code ?? "").trim();
    if (s.length === 6) codeToCorp.set(s, String(c.corp_code).padStart(8, "0"));
  }
  console.log(`[enrich] DART listed mappings: ${codeToCorp.size}`);

  console.log("[enrich] loading our stocks...");
  const stocks = await fetchAllStocks();
  console.log(`[enrich] our stocks: ${stocks.length}`);

  // corp_code 매핑되는 것만 골라 DART 조회
  const toFetch = stocks
    .map((s) => ({ ...s, corp_code: codeToCorp.get(s.stock_code) }))
    .filter((s): s is typeof s & { corp_code: string } => Boolean(s.corp_code));
  console.log(`[enrich] to fetch from DART: ${toFetch.length}  unmapped: ${stocks.length - toFetch.length}`);

  console.log(`[enrich] fetching corp_cls (concurrency=${CONCURRENCY})...`);
  const fetched = await pool(
    toFetch,
    async (s) => ({
      id: s.id,
      stock_code: s.stock_code,
      currentMarket: s.market,
      newMarket: dartClsToMarket((await fetchCompanyCorpCls(s.corp_code, apiKey)) ?? undefined),
    }),
    CONCURRENCY,
    (done, total) => console.log(`  progress ${done}/${total}`)
  );

  // 변경분만 추출 + market별 그룹핑
  const byMarket = new Map<string, number[]>();
  let unchanged = 0;
  for (const r of fetched) {
    if (r.currentMarket === r.newMarket) {
      unchanged += 1;
      continue;
    }
    (byMarket.get(r.newMarket) ?? byMarket.set(r.newMarket, []).get(r.newMarket)!).push(r.id);
  }
  console.log(`[enrich] to update: ${[...byMarket.values()].reduce((a, b) => a + b.length, 0)}  unchanged: ${unchanged}`);

  const supabase = getSupabaseServerClient();
  for (const [market, ids] of byMarket) {
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { error } = await supabase.from("stocks").update({ market }).in("id", chunk);
      if (error) throw new Error(`Update failed (${market}): ${error.message}`);
    }
    console.log(`  set market=${market} for ${ids.length} stocks`);
  }
  console.log("[enrich] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
