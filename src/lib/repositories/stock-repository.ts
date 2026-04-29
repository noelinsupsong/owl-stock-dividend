import { getSupabaseServerClient } from "@/lib/supabase";
import { formatISODate } from "@/lib/business-day";
import type {
  DividendHistoryRow,
  NextDividendSchedule,
  StockDetail,
} from "@/types/dividend";

interface StockRow {
  id: number;
  stock_code: string;
  stock_name: string;
  market: string;
  instrument_type: "STOCK" | "ETF";
  market_cap: number | null;
  sector: string | null;
  current_price: number | null;
}

interface DividendRow {
  fiscal_year: number;
  dividend_type: string;
  stock_type: string;
  record_date: string | null;
  ex_dividend_date: string | null;
  payment_date: string | null;
  dividend_per_share: number | null;
  dividend_yield: number | null;
}

async function getStockRowByCode(code: string): Promise<StockRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("stocks")
    .select("id, stock_code, stock_name, market, instrument_type, market_cap, sector, current_price")
    .eq("stock_code", code)
    .maybeSingle();
  if (error) throw new Error(`getStockRowByCode failed: ${error.message}`);
  return (data as StockRow | null) ?? null;
}

/** 종목 기본정보 + 가장 최근 배당수익률 */
export async function getStockDetail(code: string): Promise<StockDetail | null> {
  const stock = await getStockRowByCode(code);
  if (!stock) return null;

  const supabase = getSupabaseServerClient();
  const { data: latest } = await supabase
    .from("dividend_events")
    .select("dividend_yield")
    .eq("stock_id", stock.id)
    .order("fiscal_year", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    stock_code: stock.stock_code,
    stock_name: stock.stock_name,
    market: stock.market,
    instrument_type: stock.instrument_type,
    market_cap: stock.market_cap,
    sector: stock.sector,
    current_price: stock.current_price,
    latest_dividend_yield: (latest?.dividend_yield as number | null) ?? null,
  };
}

/**
 * 다음 배당 일정 (오늘 이후 가장 가까운 record_date 기준).
 * record_date가 미정인 경우 ex_dividend_date / payment_date를 우선순위로 사용.
 */
export async function getNextDividendSchedule(
  code: string
): Promise<NextDividendSchedule | null> {
  const stock = await getStockRowByCode(code);
  if (!stock) return null;

  const todayISO = formatISODate(new Date());
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("dividend_events")
    .select(
      "fiscal_year, dividend_type, record_date, ex_dividend_date, payment_date, dividend_per_share"
    )
    .eq("stock_id", stock.id)
    .or(
      `record_date.gte.${todayISO},ex_dividend_date.gte.${todayISO},payment_date.gte.${todayISO}`
    )
    .order("record_date", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`getNextDividendSchedule failed: ${error.message}`);
  if (!data) return null;
  return data as NextDividendSchedule;
}

/**
 * 종목별 배당 히스토리.
 * 동일 (dividend_type, stock_type) 그룹 내에서 직전 사업연도 대비 증감률을 동적으로 계산한다.
 */
export async function getDividendHistory(
  code: string,
  range?: { from?: number; to?: number }
): Promise<DividendHistoryRow[]> {
  const stock = await getStockRowByCode(code);
  if (!stock) return [];

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("dividend_events")
    .select(
      "fiscal_year, dividend_type, stock_type, record_date, ex_dividend_date, payment_date, dividend_per_share, dividend_yield"
    )
    .eq("stock_id", stock.id)
    .order("fiscal_year", { ascending: false });

  if (range?.from != null) query = query.gte("fiscal_year", range.from);
  if (range?.to != null) query = query.lte("fiscal_year", range.to);

  const { data, error } = await query;
  if (error) throw new Error(`getDividendHistory failed: ${error.message}`);
  const rows = (data ?? []) as DividendRow[];

  // (dividend_type, stock_type) 그룹별로 사업연도 오름차순 정렬 후 직전값 대비 증감률 계산.
  const grouped = new Map<string, DividendRow[]>();
  for (const r of rows) {
    const key = `${r.dividend_type}__${r.stock_type}`;
    (grouped.get(key) ?? grouped.set(key, []).get(key)!).push(r);
  }

  const yoyMap = new Map<string, number | null>(); // key: fy|type|stock
  for (const [, list] of grouped) {
    const asc = [...list].sort((a, b) => a.fiscal_year - b.fiscal_year);
    for (let i = 0; i < asc.length; i += 1) {
      const cur = asc[i];
      const prev = asc[i - 1];
      const k = `${cur.fiscal_year}|${cur.dividend_type}|${cur.stock_type}`;
      if (
        prev &&
        prev.dividend_per_share != null &&
        prev.dividend_per_share !== 0 &&
        cur.dividend_per_share != null
      ) {
        const change =
          ((cur.dividend_per_share - prev.dividend_per_share) /
            prev.dividend_per_share) *
          100;
        yoyMap.set(k, Math.round(change * 10) / 10);
      } else {
        yoyMap.set(k, null);
      }
    }
  }

  return rows.map<DividendHistoryRow>((r) => ({
    fiscal_year: r.fiscal_year,
    dividend_type: r.dividend_type,
    stock_type: r.stock_type,
    record_date: r.record_date,
    ex_dividend_date: r.ex_dividend_date,
    payment_date: r.payment_date,
    dividend_per_share: r.dividend_per_share,
    dividend_yield: r.dividend_yield,
    yoy_change:
      yoyMap.get(`${r.fiscal_year}|${r.dividend_type}|${r.stock_type}`) ?? null,
  }));
}
