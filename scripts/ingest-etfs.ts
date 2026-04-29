/**
 * ETF 마스터 + 시세/시총 일괄 수집 스크립트.
 *
 * 동작:
 *  1. 가장 최근 영업일을 KRX Open API로 자동 탐지
 *  2. 그 날의 ETF 일별매매정보 전체 수집 (한 번의 호출에 모든 ETF)
 *  3. stocks 테이블에 instrument_type='ETF', market='KOSPI'로 upsert
 *     (ETF는 모두 유가증권시장 상장)
 *  4. 시가총액(MKTCAP), 종가(TDD_CLSPRC) 함께 갱신
 *
 * 실행: npm run ingest:etfs
 *
 * 사전 요구:
 *  - KRX_AUTH_KEY 환경변수 (.env.local)
 *  - 마이그레이션 002 적용 (instrument_type 컬럼)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import {
  fetchEtfDailyTrades,
  findLatestEtfTradeDate,
  type KrxEtfTradeItem,
} from "../src/lib/api/krx-open";
import { getSupabaseServerClient } from "../src/lib/supabase";

interface EtfRow {
  stock_code: string;
  stock_name: string;
  market: string;
  instrument_type: "ETF";
  market_cap: number | null;
  current_price: number | null;
}

/** ETF 종목코드 정규화: 12자리(KR7XXXXXX0001 등) → 6자리 단축코드 */
function normalizeIsuCd(isuCd: string): string | null {
  if (!isuCd) return null;
  const s = isuCd.trim();
  if (/^\d{6}$/.test(s)) return s;
  // 한국 표준코드(12자리)는 KR7 + 6자리 + 4자리 체크. KR로 시작하면 4~9 자리 추출.
  if (s.length === 12 && /^[A-Z]{2}\d{10}$/.test(s)) return s.slice(3, 9);
  return null;
}

function num(s?: string): number | null {
  if (s == null) return null;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalize(item: KrxEtfTradeItem): EtfRow | null {
  const code = normalizeIsuCd(item.ISU_CD);
  if (!code) return null;
  const name = (item.ISU_NM ?? "").trim();
  if (!name) return null;

  return {
    stock_code: code,
    stock_name: name,
    market: "KOSPI", // 한국 ETF는 모두 유가증권시장 상장
    instrument_type: "ETF",
    market_cap: num(item.MKTCAP),
    current_price: num(item.TDD_CLSPRC),
  };
}

async function chunkedUpsert(rows: EtfRow[], chunkSize = 500): Promise<void> {
  const supabase = getSupabaseServerClient();
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("stocks")
      .upsert(chunk as object[], { onConflict: "stock_code" });
    if (error) {
      throw new Error(
        `ETF upsert failed at batch ${i}-${i + chunk.length}: ${error.message}`
      );
    }
    console.log(
      `  upserted ${Math.min(i + chunk.length, rows.length)}/${rows.length} ETFs`
    );
  }
}

async function main() {
  console.log("[ingest-etfs] discovering latest trade date...");
  const basDd = await findLatestEtfTradeDate();
  console.log(`[ingest-etfs] latest trade date: ${basDd}`);

  const items = await fetchEtfDailyTrades({ basDd });
  console.log(`[ingest-etfs] fetched ${items.length} ETF rows`);

  // 단일 응답에 동일 ISU_CD가 중복될 일은 없지만 방어적으로 dedupe.
  const dedupe = new Map<string, EtfRow>();
  for (const item of items) {
    const row = normalize(item);
    if (!row) continue;
    dedupe.set(row.stock_code, row);
  }
  const rows = [...dedupe.values()];
  console.log(`[ingest-etfs] normalized to ${rows.length} unique ETFs`);

  if (rows.length === 0) {
    console.log("[ingest-etfs] nothing to upsert. exiting.");
    return;
  }

  await chunkedUpsert(rows);
  console.log(`[ingest-etfs] done. upserted=${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
