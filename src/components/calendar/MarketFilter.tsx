"use client";

import type { MarketFilter as Market } from "@/types/dividend";

interface Props {
  market: Market;
  onChange: (market: Market) => void;
}

const OPTIONS: { value: Market; label: string }[] = [
  { value: "KOSPI", label: "KOSPI" },
  { value: "KOSDAQ", label: "KOSDAQ" },
  { value: "ETF", label: "ETF" },
];

export function MarketFilter({ market, onChange }: Props) {
  return (
    <div
      className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950"
      role="radiogroup"
      aria-label="카테고리 필터"
    >
      {OPTIONS.map((opt) => {
        const active = market === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
