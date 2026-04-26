import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDividendHistory,
  getNextDividendSchedule,
  getStockDetail,
} from "@/lib/repositories/stock-repository";
import { StockDetailHeader } from "@/components/stock/StockDetailHeader";
import { NextDividendCard } from "@/components/stock/NextDividendCard";
import { DividendHistoryTable } from "@/components/stock/DividendHistoryTable";
import { StockDetailChartClient } from "@/components/stock/StockDetailClient";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  if (!/^\d{6}$/.test(code)) return { title: "종목" };

  try {
    const detail = await getStockDetail(code);
    if (!detail) return { title: `${code} 종목` };

    const title = `${detail.stock_name} (${code}) 배당 정보`;
    const description = `${detail.stock_name}의 과거 배당 이력, 다음 배당 일정, 주당 배당금 추이를 확인하세요.`;
    return {
      title,
      description,
      openGraph: { title, description, type: "article" },
      twitter: { title, description },
    };
  } catch {
    return { title: `${code} 종목` };
  }
}

export default async function StockDetailPage({ params }: PageProps) {
  const { code } = await params;
  if (!/^\d{6}$/.test(code)) notFound();

  const [detail, next, history] = await Promise.all([
    getStockDetail(code),
    getNextDividendSchedule(code),
    getDividendHistory(code),
  ]);

  if (!detail) notFound();

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← 캘린더로
      </Link>

      <StockDetailHeader detail={detail} />
      <NextDividendCard next={next} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">배당 히스토리</h2>
        <DividendHistoryTable rows={history} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">배당금 추이</h2>
        <StockDetailChartClient rows={history} />
      </section>
    </main>
  );
}
