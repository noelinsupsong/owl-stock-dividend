/**
 * Vercel Cron이 매일 호출하는 시세 갱신 엔드포인트.
 *
 * 동작:
 *  - 가장 최근 영업일을 자동 탐지 후 KRX 전 종목 시세 수집
 *  - srtnCd 매칭 → stocks.market / market_cap / current_price batch update
 *
 * 보호:
 *  - CRON_SECRET 환경변수 일치 검사 (Vercel Cron이 자동으로 헤더 부착)
 *
 * 제한:
 *  - Vercel Hobby 함수 최대 60초 — 1500종목 batch update가 통상 30~50초.
 */

import { NextResponse } from "next/server";
import {
  fetchAllPricesForDate,
  fetchPrices,
} from "@/lib/api/public-data-price";
import { getSupabaseServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface StockRow {
  id: number;
  stock_code: string;
  market: string;
  market_cap: number | null;
  current_price: number | null;
}

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
    if (probe.totalCount > 0) return ymd;
  }
  throw new Error("No price data found in last 10 days");
}

async function fetchAllStocks(): Promise<StockRow[]> {
  const supabase = getSupabaseServerClient();
  const all: StockRow[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("stocks")
      .select("id, stock_code, market, market_cap, current_price")
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

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  let basDt: string;
  try {
    basDt = await findLatestDateWithData();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  const items = await fetchAllPricesForDate(basDt);

  const stocks = await fetchAllStocks();
  const idByCode = new Map<string, StockRow>();
  for (const s of stocks) idByCode.set(s.stock_code, s);

  type Update = {
    market: string;
    market_cap: number | null;
    current_price: number | null;
    ids: number[];
  };
  const groupKey = (m: string, c: number | null, p: number | null) =>
    `${m}__${c ?? "null"}__${p ?? "null"}`;
  const groups = new Map<string, Update>();

  let matched = 0;
  let updated = 0;
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
    )
      continue;
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

  const supabase = getSupabaseServerClient();
  for (const { market, market_cap, current_price, ids } of groups.values()) {
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { error } = await supabase
        .from("stocks")
        .update({ market, market_cap, current_price })
        .in("id", chunk);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    basDt,
    raw: items.length,
    matched,
    updated,
    groups: groups.size,
    ms: Date.now() - t0,
  });
}
