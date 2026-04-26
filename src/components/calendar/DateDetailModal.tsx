"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  CalendarMode,
  DateDetailEvent,
  MarketFilter,
} from "@/types/dividend";
import {
  dividendTypeBadgeClass,
  dividendTypeLabel,
  formatKRW,
  formatMarketCap,
  formatPercent,
  formatYoY,
} from "@/lib/format";

interface Props {
  date: string | null;
  mode: CalendarMode;
  market: MarketFilter;
  onClose: () => void;
}

export function DateDetailModal({ date, mode, market, onClose }: Props) {
  const [events, setEvents] = useState<DateDetailEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setEvents(null);
    setError(null);

    fetch(`/api/calendar/${date}?type=${mode}&market=${market}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "조회 실패");
        return json.data as DateDetailEvent[];
      })
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [date, mode, market]);

  useEffect(() => {
    if (!date) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onClose]);

  if (!date) return null;

  const title =
    mode === "payment"
      ? `${formatTitle(date)} 배당 입금 예정`
      : `${formatTitle(date)} 배당락 (추정) 예정`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-xl bg-white shadow-xl sm:max-h-[80vh] sm:rounded-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {events && (
              <p className="mt-0.5 text-xs text-neutral-500">
                총 {events.length}개 종목
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-md px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        {mode === "ex_dividend" && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-[11px] leading-snug text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            ⚠️ 배당락일은 배당기준일 직전 영업일로 <b>추정</b>한 값입니다. 신
            배당제도(2023~) 적용 기업은 회사가 별도 공시한 배당락일이 다를 수
            있으니 매수 전 KRX 공시 또는 증권사 HTS에서 반드시 확인하세요.
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
          {error && (
            <p className="py-6 text-center text-sm text-red-500">{error}</p>
          )}
          {!error && events === null && (
            <p className="py-6 text-center text-sm text-neutral-500">
              불러오는 중...
            </p>
          )}
          {events && events.length === 0 && (
            <p className="py-6 text-center text-sm text-neutral-500">
              해당 날짜의 배당 이벤트가 없습니다.
            </p>
          )}
          {events && events.length > 0 && (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {events.map((e) => (
                <DetailRow key={e.stock_code} event={e} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ event }: { event: DateDetailEvent }) {
  const yoy = formatYoY(event.yoy_change);
  const yoyClass =
    yoy.tone === "up"
      ? "text-red-500"
      : yoy.tone === "down"
      ? "text-blue-500"
      : "text-neutral-500";
  const typeLabel = dividendTypeLabel(event.dividend_type);

  return (
    <li className="py-3">
      <Link
        href={`/stock/${event.stock_code}`}
        className="block rounded-md px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
      >
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0 font-semibold">
            🏢 {event.stock_name}{" "}
            <span className="text-xs font-normal text-neutral-500">
              ({event.stock_code})
            </span>
            <span
              className={`ml-2 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-medium ${dividendTypeBadgeClass(event.dividend_type)}`}
              title={`${event.fiscal_year}년 사업연도 ${typeLabel} 배당`}
            >
              {event.fiscal_year} {typeLabel}
            </span>
          </div>
          <span className={`shrink-0 text-xs font-medium ${yoyClass}`}>
            {yoy.text}
          </span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-neutral-600 dark:text-neutral-300">
          <span>주당 배당금: {formatKRW(event.dividend_per_share)}원</span>
          <span>배당수익률: {formatPercent(event.dividend_yield)}</span>
          <span>시총: {formatMarketCap(event.market_cap)}</span>
          <span>시장: {event.market}</span>
        </div>
      </Link>
    </li>
  );
}

function formatTitle(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}
