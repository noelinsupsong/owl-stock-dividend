"use client";

interface Props {
  year: number;
  month: number; // 1~12
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onYearChange: (year: number) => void;
}

const YEAR_RANGE = 6;

export function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  onYearChange,
}: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: YEAR_RANGE * 2 + 1 },
    (_, i) => currentYear - YEAR_RANGE + i
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="이전 달"
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          ◀
        </button>
        <div className="flex items-baseline gap-1">
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="rounded-md border border-neutral-200 bg-transparent px-2 py-1 text-lg font-semibold dark:border-neutral-800"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <span className="text-lg font-semibold">{month}월</span>
        </div>
        <button
          type="button"
          onClick={onNext}
          aria-label="다음 달"
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          ▶
        </button>
      </div>

      <button
        type="button"
        onClick={onToday}
        className="rounded-md border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
      >
        오늘
      </button>
    </div>
  );
}
