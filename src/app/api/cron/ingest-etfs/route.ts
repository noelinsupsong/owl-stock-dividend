/**
 * Vercel Cron이 매일 호출하는 ETF 마스터/시세 갱신 엔드포인트.
 *
 * 동작:
 *  - 가장 최근 영업일을 KRX Open API로 자동 탐지
 *  - 그 날의 ETF 일별매매정보 전체를 받아 stocks 테이블에 upsert
 *  - instrument_type='ETF', market='KOSPI' 고정 (한국 ETF는 모두 유가증권시장 상장)
 *
 * 보호:
 *  - CRON_SECRET 환경변수 검사 (Vercel Cron이 자동으로 헤더 부착)
 *
 * 제한:
 *  - Vercel Hobby 함수 60s — ETF 약 800종목 단일 호출이라 통상 5~10초 내 완료
 */

import { NextResponse } from "next/server";
import {
  fetchEtfDailyTrades,
  findLatestEtfTradeDate,
  type KrxEtfTradeItem,
} from "@/lib/api/krx-open";
import { getSupabaseServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface EtfRow {
  stock_code: string;
  stock_name: string;
  market: "KOSPI";
  instrument_type: "ETF";
  market_cap: number | null;
  current_price: number | null;
}

function normalizeIsuCd(isuCd: string): string | null {
  if (!isuCd) return null;
  const s = isuCd.trim();
  if (/^\d{6}$/.test(s)) return s;
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
    market: "KOSPI",
    instrument_type: "ETF",
    market_cap: num(item.MKTCAP),
    current_price: num(item.TDD_CLSPRC),
  };
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
  let basDd: string;
  try {
    basDd = await findLatestEtfTradeDate();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  const items = await fetchEtfDailyTrades({ basDd });

  const dedupe = new Map<string, EtfRow>();
  for (const item of items) {
    const row = normalize(item);
    if (!row) continue;
    dedupe.set(row.stock_code, row);
  }
  const rows = [...dedupe.values()];

  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      basDd,
      raw: items.length,
      upserted: 0,
      ms: Date.now() - t0,
    });
  }

  const supabase = getSupabaseServerClient();
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("stocks")
      .upsert(chunk as object[], { onConflict: "stock_code" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    basDd,
    raw: items.length,
    upserted: rows.length,
    ms: Date.now() - t0,
  });
}
