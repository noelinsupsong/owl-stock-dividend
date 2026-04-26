import { NextResponse } from "next/server";
import { z } from "zod";
import { getDividendHistory } from "@/lib/repositories/stock-repository";

const QuerySchema = z.object({
  from: z.coerce.number().int().min(1990).max(2100).optional(),
  to: z.coerce.number().int().min(1990).max(2100).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid stock code" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  try {
    const data = await getDividendHistory(code, parsed.data);
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
