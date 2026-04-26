import type { NextDividendSchedule } from "@/types/dividend";
import { formatKRW } from "@/lib/format";

interface Props {
  next: NextDividendSchedule | null;
}

export function NextDividendCard({ next }: Props) {
  if (!next) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold text-neutral-500">다음 배당 일정</h2>
        <p className="mt-3 text-sm text-neutral-500">
          예정된 배당 일정이 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-neutral-500">
          다음 배당 일정
        </h2>
        <span className="text-xs text-neutral-500">
          {next.fiscal_year}년 {next.dividend_type}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-4">
        <ScheduleItem
          label="배당기준일"
          value={next.record_date}
          tone="neutral"
        />
        <ScheduleItem
          label="배당락일"
          value={next.ex_dividend_date}
          tone="warn"
        />
        <ScheduleItem
          label="예상 입금일"
          value={next.payment_date}
          tone="accent"
        />
      </dl>

      {next.dividend_per_share != null && (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
          예상 주당 배당금:{" "}
          <span className="font-semibold">
            {formatKRW(next.dividend_per_share)}원
          </span>
        </p>
      )}
    </section>
  );
}

function ScheduleItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | null;
  tone: "neutral" | "warn" | "accent";
}) {
  const toneClass =
    tone === "warn"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "accent"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-neutral-700 dark:text-neutral-200";
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className={`mt-1 text-base font-semibold ${toneClass}`}>
        {value ?? "-"}
      </dd>
    </div>
  );
}
