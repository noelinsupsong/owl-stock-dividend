/**
 * 종목 기본정보 보강 스크립트 (placeholder)
 *
 * KRX Open API 또는 KRX Data Marketplace에서 시가총액, 시장구분(KOSPI/KOSDAQ),
 * 업종 정보를 받아와 stocks 테이블을 갱신한다.
 *
 * 현재는 인증 키 발급/엔드포인트가 환경에 따라 달라 placeholder만 둔다.
 * 실제 연동은 KRX 키 발급 후 fetchKrxMarketSnapshot()을 구현해 사용한다.
 *
 * 실행: npm run ingest:stocks
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { getSupabaseServerClient } from "../src/lib/supabase";

interface KrxStockRow {
  stock_code: string;
  stock_name: string;
  market: "KOSPI" | "KOSDAQ";
  market_cap: number;
  sector?: string;
}

async function fetchKrxMarketSnapshot(): Promise<KrxStockRow[]> {
  // TODO: KRX Open API 키 발급 후 구현.
  // 참고: https://openapi.krx.co.kr/
  console.warn(
    "[ingest-stocks] fetchKrxMarketSnapshot() is a placeholder. " +
      "Implement after KRX API key is provisioned."
  );
  return [];
}

async function main() {
  const rows = await fetchKrxMarketSnapshot();
  if (rows.length === 0) {
    console.log("[ingest-stocks] no rows to upsert. exiting.");
    return;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("stocks")
    .upsert(rows, { onConflict: "stock_code" });

  if (error) {
    console.error("[ingest-stocks] upsert failed:", error.message);
    process.exit(1);
  }
  console.log(`[ingest-stocks] upserted ${rows.length} stocks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
