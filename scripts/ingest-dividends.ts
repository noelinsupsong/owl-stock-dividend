/**
 * 배당정보 일괄 수집 배치 스크립트 (V2)
 *
 * 실행:
 *   npm run ingest:dividends                          # 사업연도 2020+ (기본)
 *   npm run ingest:dividends -- --fromYear 2023       # 사업연도 2023+
 *   npm run ingest:dividends -- --isinCd KR7005930003 # 특정 종목만
 *
 * 동작:
 *  1. 공공데이터포털 V2 API에서 전체 페이지 순회
 *  2. 무배당 / 금액 0 / 사업연도 필터 후
 *  3. ISIN → stocks 배치 upsert (id 매핑)
 *  4. 배당락일 자동 계산 + dividend_events 배치 upsert
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import {
  fetchAllDividends,
  type PublicDataDividendItem,
} from "../src/lib/api/public-data";
import { getSupabaseServerClient } from "../src/lib/supabase";
import {
  calculateExDividendDate,
  formatISODate,
  toDate,
} from "../src/lib/business-day";

interface CliArgs {
  fromYear: number;
  isinCd?: string;
  clean: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { fromYear: 2020, clean: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--fromYear") out.fromYear = Number(argv[++i]);
    else if (a === "--isinCd") out.isinCd = argv[++i];
    else if (a === "--clean") out.clean = true;
  }
  return out;
}

function ymdToISO(s?: string): string | null {
  if (!s || !/^\d{8}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function num(s?: string): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** ISIN(KR + 종목번호 6자리 + 체크) → 종목코드 6자리 */
function isinToStockCode(isin?: string): string | null {
  return isin && isin.length >= 9 ? isin.slice(3, 9) : null;
}

/** 주당 배당금 산출: stckGenrDvdnAmt 우선, 없으면 액면가 × 배당률 / 100 */
function computeDividendPerShare(item: PublicDataDividendItem): number | null {
  const direct = num(item.stckGenrDvdnAmt);
  if (direct != null && direct > 0) return direct;
  const par = num(item.stckParPrc);
  const rate = num(item.stckGenrCashDvdnRt);
  if (par != null && rate != null && par > 0 && rate > 0) {
    return Math.round(((par * rate) / 100) * 100) / 100;
  }
  return null;
}

interface NormalizedRow {
  stock_code: string;
  isin_code: string;
  stock_name: string;
  fiscal_year: number;
  dividend_type: string;
  stock_type: "보통주" | "우선주";
  record_date: string;
  ex_dividend_date: string;
  payment_date: string | null;
  dividend_per_share: number;
  dividend_rate: number | null;
}

function normalize(item: PublicDataDividendItem): NormalizedRow | null {
  // 무배당 / 주식배당 제외 — 캘린더는 현금배당만 의미 있음
  if (item.stckDvdnRcdNm && !item.stckDvdnRcdNm.includes("현금")) return null;

  const recordISO = ymdToISO(item.dvdnBasDt);
  if (!recordISO) return null;

  const stockCode = isinToStockCode(item.isinCd);
  if (!stockCode) return null;

  const dps = computeDividendPerShare(item);
  if (dps == null || dps <= 0) return null;

  const fiscalYear = Number(item.dvdnBasDt!.slice(0, 4));
  const month = Number(item.dvdnBasDt!.slice(4, 6));
  const stockType: "보통주" | "우선주" = item.scrsItmsKcdNm?.includes("우선")
    ? "우선주"
    : "보통주";

  // dvdnBasDt의 월로 배당종류 추정 (V2 API에 명시 필드 없음).
  //  - 12월: 구 제도 결산 (사업연도 말일 record)
  //  - 1~5월: 신 제도 결산 (정기주총 후 별도 지정한 record)
  //  - 6월: 중간 (반기)
  //  - 9월: 분기 (Q3)
  //  - 그 외: 기타
  //
  // 한계: 분기배당사(예: 삼성전자)의 3월 record는 1Q인데 결산으로 잘못 분류됨.
  // 정확한 구분은 회사별 배당정책 metadata 필요.
  const dividendType =
    month >= 1 && month <= 5
      ? "결산"
      : month === 6
      ? "중간"
      : month === 9
      ? "분기"
      : month === 12
      ? "결산"
      : "기타";

  // 스키마 dividend_rate DECIMAL(8,4) 한계 (max 9999.9999%) — 그 이상은 캡
  const rawRate = num(item.stckGenrCashDvdnRt);
  const rate =
    rawRate == null ? null : Math.min(Math.max(rawRate, -9999.9999), 9999.9999);

  // 한국 증시 관행: 우선주는 회사명 뒤에 "우" 접미사 (예: 삼성전자 → 삼성전자우)
  const displayName =
    stockType === "우선주" && !item.stckIssuCmpyNm.endsWith("우")
      ? `${item.stckIssuCmpyNm}우`
      : item.stckIssuCmpyNm;

  return {
    stock_code: stockCode,
    isin_code: item.isinCd,
    stock_name: displayName,
    fiscal_year: fiscalYear,
    dividend_type: dividendType,
    stock_type: stockType,
    record_date: recordISO,
    ex_dividend_date: formatISODate(calculateExDividendDate(toDate(item.dvdnBasDt!))),
    payment_date: ymdToISO(item.cashDvdnPayDt),
    dividend_per_share: dps,
    dividend_rate: rate,
  };
}

async function chunkedUpsert<T>(
  table: string,
  rows: T[],
  conflictKey: string,
  chunkSize = 500
): Promise<void> {
  const supabase = getSupabaseServerClient();
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk as object[], { onConflict: conflictKey });
    if (error) {
      throw new Error(
        `Upsert failed (${table}) at batch ${i}-${i + chunk.length}: ${error.message}`
      );
    }
    console.log(
      `  upserted ${Math.min(i + chunk.length, rows.length)}/${rows.length} into ${table}`
    );
  }
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(
    `[ingest-dividends] start fromYear=${args.fromYear} isinCd=${args.isinCd ?? "(all)"} clean=${args.clean}`
  );

  // 0) Optional clean — dividend_type 분류 변경 등으로 unique key가 바뀔 때 사용
  if (args.clean) {
    console.log("[ingest-dividends] DELETING all dividend_events rows...");
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("dividend_events")
      .delete()
      .neq("id", 0);
    if (error) throw new Error(`Clean delete failed: ${error.message}`);
    console.log("[ingest-dividends] cleared dividend_events.");
  }

  // 1) Fetch
  const items = await fetchAllDividends(
    args.isinCd ? { isinCd: args.isinCd, numOfRows: 1000 } : { numOfRows: 1000 },
    ({ pageNo, fetched, totalCount }) => {
      if (pageNo % 5 === 0 || fetched >= totalCount) {
        console.log(`  fetched ${fetched}/${totalCount} (page ${pageNo})`);
      }
    }
  );
  console.log(`[ingest-dividends] fetched ${items.length} raw items`);

  // 2) Normalize + filter + dedupe by unique key
  const dedupeMap = new Map<string, NormalizedRow>();
  for (const item of items) {
    const row = normalize(item);
    if (!row) continue;
    if (row.fiscal_year < args.fromYear) continue;

    const key = `${row.stock_code}|${row.fiscal_year}|${row.dividend_type}|${row.stock_type}`;
    const existing = dedupeMap.get(key);
    // 중복 시 더 큰 배당금(보통 더 정확한 최신 데이터) 우선
    if (!existing || row.dividend_per_share > existing.dividend_per_share) {
      dedupeMap.set(key, row);
    }
  }
  const normalized = [...dedupeMap.values()];
  console.log(`[ingest-dividends] normalized to ${normalized.length} unique rows (fiscal_year >= ${args.fromYear})`);

  if (normalized.length === 0) {
    console.log("[ingest-dividends] nothing to insert. exiting.");
    return;
  }

  // 3) Upsert stocks (unique by stock_code)
  const stockMap = new Map<string, { stock_code: string; isin_code: string; stock_name: string; market: string }>();
  for (const r of normalized) {
    if (!stockMap.has(r.stock_code)) {
      stockMap.set(r.stock_code, {
        stock_code: r.stock_code,
        isin_code: r.isin_code,
        stock_name: r.stock_name,
        market: "UNKNOWN", // ingest-stocks에서 KOSPI/KOSDAQ 보강
      });
    }
  }
  const stockRows = [...stockMap.values()];
  console.log(`[ingest-dividends] upserting ${stockRows.length} unique stocks...`);
  await chunkedUpsert("stocks", stockRows, "stock_code");

  // 4) Fetch stocks id mapping
  const supabase = getSupabaseServerClient();
  const codes = [...stockMap.keys()];
  const idByCode = new Map<string, number>();
  for (let i = 0; i < codes.length; i += 500) {
    const chunk = codes.slice(i, i + 500);
    const { data, error } = await supabase
      .from("stocks")
      .select("id, stock_code")
      .in("stock_code", chunk);
    if (error) throw new Error(`Stock id lookup failed: ${error.message}`);
    for (const row of data ?? []) {
      idByCode.set(row.stock_code as string, row.id as number);
    }
  }

  // 5) Upsert dividend events
  const eventRows = normalized.flatMap((r) => {
    const stockId = idByCode.get(r.stock_code);
    if (stockId == null) return [];
    return [
      {
        stock_id: stockId,
        fiscal_year: r.fiscal_year,
        dividend_type: r.dividend_type,
        record_date: r.record_date,
        ex_dividend_date: r.ex_dividend_date,
        payment_date: r.payment_date,
        dividend_per_share: r.dividend_per_share,
        dividend_rate: r.dividend_rate,
        stock_type: r.stock_type,
        source: "PUBLIC_DATA",
      },
    ];
  });
  console.log(`[ingest-dividends] upserting ${eventRows.length} dividend events...`);
  await chunkedUpsert(
    "dividend_events",
    eventRows,
    "stock_id,fiscal_year,dividend_type,stock_type"
  );

  console.log(`[ingest-dividends] done. stocks=${stockRows.length} events=${eventRows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
