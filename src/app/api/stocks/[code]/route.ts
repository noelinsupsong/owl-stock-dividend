import { NextResponse } from "next/server";
import {
  getNextDividendSchedule,
  getStockDetail,
} from "@/lib/repositories/stock-repository";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid stock code" }, { status: 400 });
  }

  try {
    const [detail, next] = await Promise.all([
      getStockDetail(code),
      getNextDividendSchedule(code),
    ]);
    if (!detail) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }
    return NextResponse.json(
      { data: { detail, next } },
      {
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
