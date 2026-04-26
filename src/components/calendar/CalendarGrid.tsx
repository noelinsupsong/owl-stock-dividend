"use client";

import { buildMonthGrid, WEEKDAY_LABELS } from "@/lib/calendar-grid";
import type { CalendarMode, CalendarMonthData } from "@/types/dividend";
import { DateCell } from "./DateCell";

interface Props {
  year: number;
  month: number;
  data: CalendarMonthData;
  mode: CalendarMode;
  onDateClick: (iso: string) => void;
}

export function CalendarGrid({ year, month, data, mode, onDateClick }: Props) {
  const cells = buildMonthGrid(year, month);

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center text-xs font-medium dark:border-neutral-800 dark:bg-neutral-900">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={
              "py-2 " +
              (i === 0
                ? "text-red-500"
                : i === 6
                ? "text-blue-500"
                : "text-neutral-600 dark:text-neutral-300")
            }
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const entry = data[cell.iso];
          return (
            <DateCell
              key={cell.iso}
              iso={cell.iso}
              day={cell.date.getDate()}
              inMonth={cell.inMonth}
              isToday={cell.isToday}
              isWeekend={cell.isWeekend}
              weekday={cell.date.getDay()}
              events={entry?.top ?? []}
              total={entry?.total ?? 0}
              mode={mode}
              onClick={onDateClick}
            />
          );
        })}
      </div>
    </div>
  );
}
