"use client";

import dynamic from "next/dynamic";
import type { DividendHistoryRow } from "@/types/dividend";

const DividendTrendChart = dynamic(
  () => import("./DividendTrendChart").then((m) => m.DividendTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
    ),
  }
);

interface Props {
  rows: DividendHistoryRow[];
}

export function StockDetailChartClient({ rows }: Props) {
  return <DividendTrendChart rows={rows} />;
}
