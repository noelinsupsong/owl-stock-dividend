"use client";

import type { CalendarEventSummary, CalendarMode } from "@/types/dividend";
import {
  dividendTypeBadgeClass,
  dividendTypeLabel,
  formatKRW,
} from "@/lib/format";

interface Props {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  weekday: number; // 0=Sun, 6=Sat
  events: CalendarEventSummary[];
  total: number;
  mode: CalendarMode;
  onClick: (iso: string) => void;
}

export function DateCell({
  iso,
  day,
  inMonth,
  isToday,
  isWeekend,
  weekday,
  events,
  total,
  mode,
  onClick,
}: Props) {
  const hasEvents = total > 0;

  const dayColorClass = !inMonth
    ? "text-neutral-300 dark:text-neutral-700"
    : weekday === 0
    ? "text-red-500"
    : weekday === 6
    ? "text-blue-500"
    : "text-neutral-700 dark:text-neutral-200";

  return (
    <button
      type="button"
      onClick={() => hasEvents && onClick(iso)}
      disabled={!hasEvents}
      className={
        "flex min-h-[78px] flex-col gap-1 border border-neutral-200 p-1 text-left transition-colors sm:min-h-[110px] sm:p-2 dark:border-neutral-800 " +
        (hasEvents
          ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
          : "cursor-default ") +
        (isWeekend ? "bg-neutral-50/40 dark:bg-neutral-950/40 " : "") +
        (!inMonth ? "opacity-60 " : "")
      }
    >
      <div className="flex items-center justify-between">
        <span
          className={
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold sm:h-6 sm:min-w-6 sm:text-xs " +
            dayColorClass +
            (isToday
              ? " bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "")
          }
        >
          {day}
        </span>
        {mode === "ex_dividend" && hasEvents && (
          <span
            className="rounded bg-amber-100 px-1 text-[9px] text-amber-700 sm:text-[10px] dark:bg-amber-900/40 dark:text-amber-200"
            title="배당기준일 직전 영업일로 계산한 추정값. 회사 공시와 다를 수 있습니다."
          >
            락*
          </span>
        )}
      </div>

      {/* 모바일에선 종목 이벤트 갯수만 점으로 표시 */}
      {hasEvents && (
        <div className="flex sm:hidden">
          <span className="rounded-full bg-blue-500 px-1.5 text-[10px] font-medium text-white">
            {total}
          </span>
        </div>
      )}

      {/* sm 이상에선 종목명/금액 디테일 */}
      <ul className="hidden space-y-0.5 sm:block">
        {events.slice(0, 3).map((e) => {
          const typeLabel = dividendTypeLabel(e.dividend_type);
          return (
            <li
              key={`${e.stock_code}-${e.dividend_type}`}
              className="truncate text-[11px] leading-tight text-neutral-700 dark:text-neutral-300"
              title={`${e.stock_name} · ${typeLabel} · ${formatKRW(e.dividend_per_share)}원`}
            >
              <span
                className={`mr-1 inline-block rounded px-1 text-[9px] leading-tight ${dividendTypeBadgeClass(e.dividend_type)}`}
              >
                {typeLabel}
              </span>
              <span className="font-medium">{e.stock_name}</span>
              {e.dividend_per_share != null && (
                <span className="text-neutral-500">
                  {" "}
                  {formatKRW(e.dividend_per_share)}원
                </span>
              )}
            </li>
          );
        })}
        {total > 3 && (
          <li className="text-[10px] font-medium text-neutral-500">
            +{total - 3}개 더보기
          </li>
        )}
      </ul>
    </button>
  );
}
