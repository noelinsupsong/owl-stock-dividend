/**
 * 시가총액 + 시장구분 일괄 수집 스크립트.
 *
 * 동작:
 *  1. 가장 최근 영업일을 찾아 (오늘부터 거꾸로) 주식시세정보 API 호출
 *  2. 모든 종목의 mrktTotAmt(시총), mrktCtg(KOSPI/KOSDAQ/KONEX) 수집
 *  3. stocks 테이블의 market_cap, market 컬럼 batch UPDATE
 *
 * 실행: npx tsx scripts/ingest-prices.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { fetchAllPricesForDate, fetchPrices } from "../src/lib/api/public-data-price";
import { getSupabaseServerClient } from "../src/lib/supabase";

interface StockRow {
  id: number;
  stock_code: string;
  market: string;
  market_cap: number | null;
  current_price: number | null;
  instrument_type: string;
}

async function fetchAllStocks(): Promise<StockRow[]> {
  const supabase = getSupabaseServerClient();
  const all: StockRow[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("stocks")
      .select("id, stock_code, market, market_cap, current_price, instrument_type")
      .eq("instrument_type", "STOCK")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Fetch stocks failed: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as StockRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

/** 오늘부터 거꾸로 최대 7일 검사하여 데이터가 있는 가장 최근 영업일 반환 */
async function findLatestDateWithData(): Promise<string> {
  const today = new Date();
  for (let i = 0; i < 10; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ymd =
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    const probe = await fetchPrices({ basDt: ymd, numOfRows: 1, pageNo: 1 });
    if (probe.totalCount > 0) {
      console.log(`[ingest-prices] latest data date: ${ymd} (totalCount=${probe.totalCount})`);
      return ymd;
    }
    console.log(`  no data for ${ymd}, trying earlier...`);
  }
  throw new Error("No price data found in last 10 days");
}

async function main() {
  const basDt = await findLatestDateWithData();

  console.log("[ingest-prices] fetching all prices...");
  const items = await fetchAllPricesForDate(basDt, ({ pageNo, fetched, totalCount }) => {
    if (pageNo % 5 === 0 || fetched >= totalCount) {
      console.log(`  fetched ${fetched}/${totalCount} (page ${pageNo})`);
    }
  });
  console.log(`[ingest-prices] fetched ${items.length} price records`);

  // ISIN → {market_cap, market} 매핑
  const byIsin = new Map<string, { market_cap: number | null; market: string }>();
  for (const it of items) {
    const cap = Number(it.mrktTotAmt);
    byIsin.set(it.isinCd, {
      market_cap: Number.isFinite(cap) && cap > 0 ? cap : null,
      market: it.mrktCtg || "ETC",
    });
  }
  console.log(`[ingest-prices] unique ISIN: ${byIsin.size}`);

  // stocks 매핑: stock_code → {id, current market, current market_cap}
  // 우리 DB의 isin_code 컬럼으로 매핑하는 게 안전.
  const supabase = getSupabaseServerClient();
  const stocks = await fetchAllStocks();

  // stock_code → id (시세 API의 srtnCd가 stock_code와 동일)
  const idByCode = new Map<string, StockRow>();
  for (const s of stocks) idByCode.set(s.stock_code, s);

  // 시세 API items는 srtnCd 기준 매칭 (우선주 stock_code 포함)
  // (market, market_cap, current_price) 동일 tuple끼리 그룹핑하여 batch update.
  type Update = {
    market: string;
    market_cap: number | null;
    current_price: number | null;
    ids: number[];
  };
  let matched = 0;
  let updated = 0;
  const groupKey = (m: string, c: number | null, p: number | null) =>
    `${m}__${c ?? "null"}__${p ?? "null"}`;
  const groups = new Map<string, Update>();

  for (const it of items) {
    const stock = idByCode.get(it.srtnCd);
    if (!stock) continue;
    matched += 1;

    const cap = Number(it.mrktTotAmt);
    const price = Number(it.clpr);
    const newMarket = it.mrktCtg || "ETC";
    const capValue = Number.isFinite(cap) && cap > 0 ? cap : null;
    const priceValue = Number.isFinite(price) && price > 0 ? price : null;

    if (
      stock.market === newMarket &&
      stock.market_cap === capValue &&
      stock.current_price === priceValue
    ) {
      continue;
    }
    updated += 1;

    const key = groupKey(newMarket, capValue, priceValue);
    const g = groups.get(key);
    if (g) g.ids.push(stock.id);
    else
      groups.set(key, {
        market: newMarket,
        market_cap: capValue,
        current_price: priceValue,
        ids: [stock.id],
      });
  }
  console.log(
    `[ingest-prices] matched=${matched} updates=${updated} groups=${groups.size}`
  );

  let processed = 0;
  for (const { market, market_cap, current_price, ids } of groups.values()) {
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { error } = await supabase
        .from("stocks")
        .update({ market, market_cap, current_price })
        .in("id", chunk);
      if (error) throw new Error(`Update failed: ${error.message}`);
      processed += chunk.length;
    }
  }
  console.log(`[ingest-prices] done. updated=${processed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
