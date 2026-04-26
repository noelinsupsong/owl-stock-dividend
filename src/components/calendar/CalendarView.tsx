"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  CalendarMode,
  CalendarMonthData,
  MarketFilter as Market,
} from "@/types/dividend";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarModeToggle } from "./CalendarModeToggle";
import { MarketFilter } from "./MarketFilter";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarDisclaimer } from "./CalendarDisclaimer";
import { DateDetailModal } from "./DateDetailModal";

function clampMonth(year: number, month: number) {
  if (month < 1) return { year: year - 1, month: 12 };
  if (month > 12) return { year: year + 1, month: 1 };
  return { year, month };
}

export function CalendarView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = useMemo(() => new Date(), []);
  const initialYear = Number(searchParams.get("year")) || today.getFullYear();
  const initialMonth = Number(searchParams.get("month")) || today.getMonth() + 1;
  const initialMode = (searchParams.get("mode") as CalendarMode) || "payment";
  const initialMarket = (searchParams.get("market") as Market) || "ALL";

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [mode, setMode] = useState<CalendarMode>(initialMode);
  const [market, setMarket] = useState<Market>(initialMarket);
  const [data, setData] = useState<CalendarMonthData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // URL 동기화 (얕은 라우팅)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("month", String(month));
    params.set("mode", mode);
    if (market !== "ALL") params.set("market", market);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [year, month, mode, market, router]);

  // 데이터 로드
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/calendar?year=${year}&month=${month}&type=${mode}&market=${market}`
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "조회 실패");
        return json.data as CalendarMonthData;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, mode, market]);

  const move = (delta: number) => {
    const next = clampMonth(year, month + delta);
    setYear(next.year);
    setMonth(next.month);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <MarketFilter market={market} onChange={setMarket} />
        <div>
          <CalendarModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      <CalendarHeader
        year={year}
        month={month}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onToday={() => {
          setYear(today.getFullYear());
          setMonth(today.getMonth() + 1);
        }}
        onYearChange={(y) => setYear(y)}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className={loading ? "opacity-60 transition-opacity" : ""}>
        <CalendarGrid
          year={year}
          month={month}
          data={data}
          mode={mode}
          onDateClick={setSelectedDate}
        />
      </div>

      <CalendarDisclaimer mode={mode} />

      <DateDetailModal
        date={selectedDate}
        mode={mode}
        market={market}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}
