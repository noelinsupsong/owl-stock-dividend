/** 캘린더 모드: 배당 입금일 vs 배당락일 */
export type CalendarMode = "payment" | "ex_dividend";

/**
 * 캘린더 카테고리 필터.
 *  - ALL: 전체
 *  - KOSPI / KOSDAQ / KONEX: stocks.market 일치 + instrument_type='STOCK' (ETF 제외)
 *  - ETF: instrument_type='ETF' (시장 무관 — 한국 ETF는 모두 유가증권)
 *  - ETC: legacy
 */
export type MarketFilter = "ALL" | "KOSPI" | "KOSDAQ" | "ETF" | "KONEX" | "ETC";

/** 캘린더 셀에 표시되는 종목 요약 (시총 상위) */
export interface CalendarEventSummary {
  stock_code: string;
  stock_name: string;
  market: string;
  market_cap: number | null;
  dividend_per_share: number | null;
  dividend_type: string;
}

/** 날짜별 캘린더 응답: { "YYYY-MM-DD": CalendarEventSummary[] } */
export interface CalendarMonthData {
  [isoDate: string]: {
    total: number;
    top: CalendarEventSummary[];
  };
}

/** 날짜 상세 모달용 단건 */
export interface DateDetailEvent {
  stock_code: string;
  stock_name: string;
  market: string;
  market_cap: number | null;
  record_date: string | null;
  ex_dividend_date: string | null;
  payment_date: string | null;
  dividend_per_share: number | null;
  dividend_yield: number | null;
  yoy_change: number | null;
  dividend_type: string;
  fiscal_year: number;
}

/** 종목 검색 결과 */
export interface StockSearchResult {
  stock_code: string;
  stock_name: string;
  market: string;
  instrument_type: "STOCK" | "ETF";
}

/** 종목 상세: 기본 정보 */
export interface StockDetail {
  stock_code: string;
  stock_name: string;
  market: string;
  instrument_type: "STOCK" | "ETF";
  market_cap: number | null;
  sector: string | null;
  /** 가장 최근 거래일 종가 (원) */
  current_price: number | null;
  /** 가장 최근 배당수익률 (참고치) */
  latest_dividend_yield: number | null;
}

/** 종목 상세: 다음 배당 일정 (가장 가까운 미래 이벤트) */
export interface NextDividendSchedule {
  fiscal_year: number;
  dividend_type: string;
  record_date: string | null;
  ex_dividend_date: string | null;
  payment_date: string | null;
  dividend_per_share: number | null;
}

/** 종목별 배당 히스토리 단건 */
export interface DividendHistoryRow {
  fiscal_year: number;
  dividend_type: string;
  stock_type: string;
  record_date: string | null;
  ex_dividend_date: string | null;
  payment_date: string | null;
  dividend_per_share: number | null;
  dividend_yield: number | null;
  /** 동일 (dividend_type, stock_type) 기준 직전 사업연도 대비 증감률 (%) */
  yoy_change: number | null;
}
