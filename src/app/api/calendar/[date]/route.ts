import { NextResponse } from "next/server";
import { z } from "zod";
import { getDateDetail } from "@/lib/repositories/dividend-repository";

const ParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const QuerySchema = z.object({
  type: z.enum(["payment", "ex_dividend"]).default("payment"),
  market: z.enum(["ALL", "KOSPI", "KOSDAQ", "KONEX", "ETC"]).default("ALL"),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const resolved = await params;
  const parsedParams = ParamsSchema.safeParse(resolved);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsedQuery = QuerySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    market: searchParams.get("market") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const data = await getDateDetail(
      parsedParams.data.date,
      parsedQuery.data.type,
      parsedQuery.data.market
    );
    return NextResponse.json(
      { data },
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
