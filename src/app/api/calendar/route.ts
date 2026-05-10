import { NextResponse } from "next/server";
import { z } from "zod";
import { getCalendarMonth } from "@/lib/repositories/dividend-repository";

const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  type: z.enum(["payment", "ex_dividend"]).default("payment"),
  market: z.enum(["ALL", "KOSPI", "KOSDAQ", "KONEX", "ETC"]).default("ALL"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    year: searchParams.get("year"),
    month: searchParams.get("month"),
    type: searchParams.get("type") ?? undefined,
    market: searchParams.get("market") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const data = await getCalendarMonth(
      parsed.data.year,
      parsed.data.month,
      parsed.data.type,
      parsed.data.market
    );
    return NextResponse.json(
      { data },
      {
        // Vercel CDN: 1시간 캐시 + 24시간 stale-while-revalidate
        // → Supabase 일시 장애 시 직전 캐시로 응답 유지
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
