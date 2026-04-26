/**
 * Vercel Cron이 매일 호출하는 데이터 갱신 엔드포인트.
 *
 * 동작:
 *  - basDt = 오늘 날짜로 공공데이터 API 호출 → DART가 어제까지 갱신한 데이터만 수집
 *  - 정상 처리: 무배당/금액 0/이전 사업연도(<2020) 필터, 우선주 이름 보정
 *  - upsert: stocks (stock_code 기준), dividend_events (unique key 기준)
 *
 * 보호:
 *  - Vercel Cron은 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더를 붙임.
 *  - CRON_SECRET 환경변수가 설정되어 있으면 일치 여부 검사.
 *
 * 제한:
 *  - Vercel Hobby 플랜의 함수 최대 실행 시간(60s)에 맞춰 incremental ingest만 수행.
 *  - 전체 재적재가 필요한 경우 로컬에서 npm run ingest:dividends 사용.
 */

import { NextResponse } from "next/server";
import {
  fetchAllDividends,
  type PublicDataDividendItem,
} from "@/lib/api/public-data";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  calculateExDividendDate,
  formatISODate,
  toDate,
} from "@/lib/business-day";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FROM_YEAR = 2020;

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

function ymdToISO(s?: string): string | null {
  if (!s || !/^\d{8}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function num(s?: string): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function isinToStockCode(isin?: string): string | null {
  return isin && isin.length >= 9 ? isin.slice(3, 9) : null;
}

function computeDPS(item: PublicDataDividendItem): number | null {
  const direct = num(item.stckGenrDvdnAmt);
  if (direct != null && direct > 0) return direct;
  const par = num(item.stckParPrc);
  const rate = num(item.stckGenrCashDvdnRt);
  if (par != null && rate != null && par > 0 && rate > 0) {
    return Math.round(((par * rate) / 100) * 100) / 100;
  }
  return null;
}

function classifyType(month: number): string {
  if (month >= 1 && month <= 5) return "결산";
  if (month === 6) return "중간";
  if (month === 9) return "분기";
  if (month === 12) return "결산";
  return "기타";
}

function normalize(item: PublicDataDividendItem): NormalizedRow | null {
  if (item.stckDvdnRcdNm && !item.stckDvdnRcdNm.includes("현금")) return null;
  const recordISO = ymdToISO(item.dvdnBasDt);
  if (!recordISO) return null;
  const stockCode = isinToStockCode(item.isinCd);
  if (!stockCode) return null;
  const dps = computeDPS(item);
  if (dps == null || dps <= 0) return null;

  const fiscalYear = Number(item.dvdnBasDt!.slice(0, 4));
  if (fiscalYear < FROM_YEAR) return null;

  const month = Number(item.dvdnBasDt!.slice(4, 6));
  const stockType: "보통주" | "우선주" = item.scrsItmsKcdNm?.includes("우선")
    ? "우선주"
    : "보통주";
  const displayName =
    stockType === "우선주" && !item.stckIssuCmpyNm.endsWith("우")
      ? `${item.stckIssuCmpyNm}우`
      : item.stckIssuCmpyNm;

  const rawRate = num(item.stckGenrCashDvdnRt);
  const rate =
    rawRate == null ? null : Math.min(Math.max(rawRate, -9999.9999), 9999.9999);

  return {
    stock_code: stockCode,
    isin_code: item.isinCd,
    stock_name: displayName,
    fiscal_year: fiscalYear,
    dividend_type: classifyType(month),
    stock_type: stockType,
    record_date: recordISO,
    ex_dividend_date: formatISODate(calculateExDividendDate(toDate(item.dvdnBasDt!))),
    payment_date: ymdToISO(item.cashDvdnPayDt),
    dividend_per_share: dps,
    dividend_rate: rate,
  };
}

async function chunkedUpsert<T extends object>(
  table: string,
  rows: T[],
  conflictKey: string,
  chunkSize = 500
) {
  const supabase = getSupabaseServerClient();
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictKey });
    if (error) throw new Error(`Upsert ${table} batch failed: ${error.message}`);
  }
}

export async function GET(req: Request) {
  // Vercel Cron 인증
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const t0 = Date.now();
  // basDt = 오늘 (YYYYMMDD) — DART가 갱신한 incremental만
  const today = new Date();
  const yyyymmdd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  let raw: PublicDataDividendItem[] = [];
  try {
    raw = await fetchAllDividends({ basDt: yyyymmdd, numOfRows: 1000 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  // dedupe by unique key
  const dedupe = new Map<string, NormalizedRow>();
  for (const item of raw) {
    const row = normalize(item);
    if (!row) continue;
    const key = `${row.stock_code}|${row.fiscal_year}|${row.dividend_type}|${row.stock_type}`;
    const existing = dedupe.get(key);
    if (!existing || row.dividend_per_share > existing.dividend_per_share) {
      dedupe.set(key, row);
    }
  }
  const normalized = [...dedupe.values()];

  if (normalized.length === 0) {
    return NextResponse.json({
      ok: true,
      basDt: yyyymmdd,
      raw: raw.length,
      normalized: 0,
      stocks: 0,
      events: 0,
      ms: Date.now() - t0,
    });
  }

  // upsert stocks
  const stockMap = new Map<string, { stock_code: string; isin_code: string; stock_name: string; market: string }>();
  for (const r of normalized) {
    if (!stockMap.has(r.stock_code)) {
      stockMap.set(r.stock_code, {
        stock_code: r.stock_code,
        isin_code: r.isin_code,
        stock_name: r.stock_name,
        market: "UNKNOWN",
      });
    }
  }
  const stockRows = [...stockMap.values()];
  await chunkedUpsert("stocks", stockRows, "stock_code");

  // map stock_code → id
  const supabase = getSupabaseServerClient();
  const codes = [...stockMap.keys()];
  const idByCode = new Map<string, number>();
  for (let i = 0; i < codes.length; i += 500) {
    const chunk = codes.slice(i, i + 500);
    const { data, error } = await supabase
      .from("stocks")
      .select("id, stock_code")
      .in("stock_code", chunk);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    for (const row of data ?? []) {
      idByCode.set(row.stock_code as string, row.id as number);
    }
  }

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
  await chunkedUpsert(
    "dividend_events",
    eventRows,
    "stock_id,fiscal_year,dividend_type,stock_type"
  );

  return NextResponse.json({
    ok: true,
    basDt: yyyymmdd,
    raw: raw.length,
    normalized: normalized.length,
    stocks: stockRows.length,
    events: eventRows.length,
    ms: Date.now() - t0,
  });
}
