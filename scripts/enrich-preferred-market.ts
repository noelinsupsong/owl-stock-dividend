/**
 * 우선주의 market 컬럼을 보통주의 값으로 채우는 스크립트.
 *
 * 배경:
 *  - 우리 DB의 stock_code는 ISIN(KR7XXXXXX...)에서 추출 → 보통주는 XXXXX0,
 *    우선주는 XXXXX1/2/3... (ISIN 채번 규칙)
 *  - DART corpCode.xml은 회사 단위 매핑이라 우선주 stock_code는 매칭 안 됨
 *  - 결과: enrich-stocks-market 실행 후에도 우선주는 market='UNKNOWN'으로 남음
 *
 * 동작:
 *  - 보통주(끝자리 0) → market 매핑 빌드
 *  - 우선주(끝자리 1~9)에서 market이 UNKNOWN 또는 ETC인 것들에 대해
 *    동일 prefix 5자리 + "0"의 보통주 market 값을 찾아 복사
 *
 * 실행: npx tsx scripts/enrich-preferred-market.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { getSupabaseServerClient } from "../src/lib/supabase";

interface StockRow {
  id: number;
  stock_code: string;
  market: string;
}

async function fetchAllStocks(): Promise<StockRow[]> {
  const supabase = getSupabaseServerClient();
  const all: StockRow[] = [];
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
    all.push(...(data as StockRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  console.log("[enrich-preferred] loading stocks...");
  const stocks = await fetchAllStocks();
  console.log(`[enrich-preferred] total stocks: ${stocks.length}`);

  // 보통주 (끝자리 0) → market 매핑
  const commonMarket = new Map<string, string>();
  for (const s of stocks) {
    if (s.stock_code.endsWith("0") && s.market !== "UNKNOWN" && s.market !== "ETC") {
      commonMarket.set(s.stock_code.slice(0, 5), s.market);
    }
  }
  console.log(`[enrich-preferred] common-stock market mappings: ${commonMarket.size}`);

  // 우선주(끝자리 0이 아닌)에서 market 보정 대상 추출
  const updates: { id: number; market: string }[] = [];
  for (const s of stocks) {
    if (s.stock_code.endsWith("0")) continue;
    if (s.market !== "UNKNOWN" && s.market !== "ETC") continue;
    const market = commonMarket.get(s.stock_code.slice(0, 5));
    if (market) updates.push({ id: s.id, market });
  }
  console.log(`[enrich-preferred] preferred stocks to fix: ${updates.length}`);

  if (updates.length === 0) {
    console.log("[enrich-preferred] nothing to update.");
    return;
  }

  // market별 그룹 후 chunked update
  const byMarket = new Map<string, number[]>();
  for (const u of updates) {
    (byMarket.get(u.market) ?? byMarket.set(u.market, []).get(u.market)!).push(u.id);
  }

  const supabase = getSupabaseServerClient();
  for (const [market, ids] of byMarket) {
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { error } = await supabase
        .from("stocks")
        .update({ market })
        .in("id", chunk);
      if (error) throw new Error(`Update failed (${market}): ${error.message}`);
    }
    console.log(`  set market=${market} for ${ids.length} preferred stocks`);
  }

  console.log("[enrich-preferred] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
