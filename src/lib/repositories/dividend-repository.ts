import { getSupabaseServerClient } from "@/lib/supabase";
import type {
  CalendarEventSummary,
  CalendarMode,
  CalendarMonthData,
  DateDetailEvent,
  MarketFilter,
  StockSearchResult,
} from "@/types/dividend";

const TOP_N_PER_DATE = 3;

function dateColumn(mode: CalendarMode): "payment_date" | "ex_dividend_date" {
  return mode === "payment" ? "payment_date" : "ex_dividend_date";
}


/** YYYY-MM의 첫날과 다음달 첫날(배타)을 반환 */
function monthRange(year: number, month: number): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${year}-${pad(month)}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const to = `${nextYear}-${pad(nextMonth)}-01`;
  return { from, to };
}

/**
 * 월별 캘린더 데이터: 날짜별로 시총 상위 N개 + 전체 건수.
 * 단일 쿼리로 모든 행을 받아온 뒤 메모리에서 그룹핑한다.
 *
 * 데이터 규모: 한 달에 평균 수백 건 수준이라 충분히 안전.
 * 더 커지면 PostgreSQL window function 기반 RPC로 교체.
 */
export async function getCalendarMonth(
  year: number,
  month: number,
  mode: CalendarMode,
  market: MarketFilter = "ALL"
): Promise<CalendarMonthData> {
  const supabase = getSupabaseServerClient();
  const col = dateColumn(mode);
  const { from, to } = monthRange(year, month);

  let query = supabase
    .from("dividend_events")
    .select(
      `
      ${col},
      dividend_per_share,
      dividend_type,
      stock:stocks!inner ( stock_code, stock_name, market, market_cap )
    `
    )
    .gte(col, from)
    .lt(col, to)
    .not(col, "is", null);

  if (market !== "ALL") {
    query = query.eq("stock.market", market);
  }

  const { data, error } = await query;

  if (error) throw new Error(`getCalendarMonth failed: ${error.message}`);

  const grouped: Record<string, CalendarEventSummary[]> = {};
  for (const row of (data ?? []) as unknown as Array<{
    payment_date?: string;
    ex_dividend_date?: string;
    dividend_per_share: number | null;
    dividend_type: string;
    stock: {
      stock_code: string;
      stock_name: string;
      market: string;
      market_cap: number | null;
    };
  }>) {
    const date = (row as unknown as Record<string, string | undefined>)[col];
    if (!date) continue;
    (grouped[date] ??= []).push({
      stock_code: row.stock.stock_code,
      stock_name: row.stock.stock_name,
      market: row.stock.market,
      market_cap: row.stock.market_cap,
      dividend_per_share: row.dividend_per_share,
      dividend_type: row.dividend_type,
    });
  }

  const result: CalendarMonthData = {};
  for (const [date, events] of Object.entries(grouped)) {
    const sorted = events.sort(
      (a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0)
    );
    result[date] = {
      total: sorted.length,
      top: sorted.slice(0, TOP_N_PER_DATE),
    };
  }
  return result;
}

/** 특정 날짜의 전체 배당 이벤트 (모달용) */
export async function getDateDetail(
  date: string,
  mode: CalendarMode,
  market: MarketFilter = "ALL"
): Promise<DateDetailEvent[]> {
  const supabase = getSupabaseServerClient();
  const col = dateColumn(mode);

  let query = supabase
    .from("dividend_events")
    .select(
      `
      record_date,
      ex_dividend_date,
      payment_date,
      dividend_per_share,
      dividend_yield,
      yoy_change,
      dividend_type,
      fiscal_year,
      stock:stocks!inner ( stock_code, stock_name, market, market_cap )
    `
    )
    .eq(col, date);

  if (market !== "ALL") {
    query = query.eq("stock.market", market);
  }

  const { data, error } = await query;

  if (error) throw new Error(`getDateDetail failed: ${error.message}`);

  const rows = (data ?? []) as unknown as Array<{
    record_date: string | null;
    ex_dividend_date: string | null;
    payment_date: string | null;
    dividend_per_share: number | null;
    dividend_yield: number | null;
    yoy_change: number | null;
    dividend_type: string;
    fiscal_year: number;
    stock: {
      stock_code: string;
      stock_name: string;
      market: string;
      market_cap: number | null;
    };
  }>;

  return rows
    .map<DateDetailEvent>((r) => ({
      stock_code: r.stock.stock_code,
      stock_name: r.stock.stock_name,
      market: r.stock.market,
      market_cap: r.stock.market_cap,
      record_date: r.record_date,
      ex_dividend_date: r.ex_dividend_date,
      payment_date: r.payment_date,
      dividend_per_share: r.dividend_per_share,
      dividend_yield: r.dividend_yield,
      yoy_change: r.yoy_change,
      dividend_type: r.dividend_type,
      fiscal_year: r.fiscal_year,
    }))
    .sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
}

/**
 * 가장 최근에 적재/갱신된 dividend_event의 updated_at.
 * "마지막 갱신 시각" 표시용.
 */
export async function getLastIngestTime(): Promise<Date | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("dividend_events")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.updated_at) return null;
  return new Date(data.updated_at as string);
}

/** 종목 검색: 종목명 부분일치 또는 종목코드 prefix */
export async function searchStocks(
  query: string,
  limit = 10
): Promise<StockSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const supabase = getSupabaseServerClient();
  const isCode = /^\d+$/.test(q);

  const builder = supabase
    .from("stocks")
    .select("stock_code, stock_name, market")
    .order("market_cap", { ascending: false, nullsFirst: false })
    .limit(limit);

  const filtered = isCode
    ? builder.like("stock_code", `${q}%`)
    : builder.ilike("stock_name", `%${q}%`);

  const { data, error } = await filtered;
  if (error) throw new Error(`searchStocks failed: ${error.message}`);
  return (data ?? []) as StockSearchResult[];
}
