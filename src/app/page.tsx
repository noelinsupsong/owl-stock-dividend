import { Suspense } from "react";
import { AdSense } from "@/components/ads/AdSense";
import { CalendarView } from "@/components/calendar/CalendarView";
import { StockSearch } from "@/components/search/StockSearch";
import { getLastIngestTime } from "@/lib/repositories/dividend-repository";

// 1시간마다 재검증 — 외부 API/Supabase 일시 장애 시에도 직전 캐시 응답 유지
export const revalidate = 3600;

function formatLastUpdated(d: Date | null): string {
  if (!d) return "데이터 없음";
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(d)} KST`;
}

export default async function Home() {
  const lastUpdated = await getLastIngestTime().catch(() => null);

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/owl.svg"
              alt="Owl Stock Dividend"
              width={32}
              height={32}
              className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
              style={{ imageRendering: "pixelated" }}
            />
            Owl Stock Dividend
          </h1>
          <p className="mt-1 text-[11px] text-neutral-500 sm:text-xs">
            KOSPI · KOSDAQ 상장 기업의 배당 입금일과 배당락일을 한눈에.
          </p>
          <p className="mt-1 text-[10px] text-neutral-400">
            🕒 마지막 갱신: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        <Suspense fallback={null}>
          <StockSearch />
        </Suspense>
      </header>

      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP_BANNER}
        className="mb-4 sm:mb-6"
      />

      <Suspense fallback={<CalendarFallback />}>
        <CalendarView />
      </Suspense>
    </main>
  );
}

function CalendarFallback() {
  return (
    <div className="h-96 animate-pulse rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
  );
}
