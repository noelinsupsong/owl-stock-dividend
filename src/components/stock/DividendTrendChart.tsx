"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DividendHistoryRow } from "@/types/dividend";
import { formatKRW } from "@/lib/format";

interface Props {
  rows: DividendHistoryRow[];
}

interface ChartPoint {
  year: number;
  total: number;       // 사업연도 합계 (보통주 결산 + 중간/분기)
  yoy: number | null;  // 전년 대비 합계 증감률
}

/**
 * 같은 사업연도에 보통주 / 결산·중간·분기가 여러 행이면 합산해서 한 막대로 표시.
 * 우선주는 별도 그룹이지만 단순화를 위해 보통주만 차트에 사용.
 */
function buildChartData(rows: DividendHistoryRow[]): ChartPoint[] {
  const byYear = new Map<number, number>();
  for (const r of rows) {
    if (r.stock_type !== "보통주" || r.dividend_per_share == null) continue;
    byYear.set(
      r.fiscal_year,
      (byYear.get(r.fiscal_year) ?? 0) + r.dividend_per_share
    );
  }
  const sorted = [...byYear.entries()].sort(([a], [b]) => a - b);
  return sorted.map(([year, total], idx) => {
    const prev = idx > 0 ? sorted[idx - 1][1] : null;
    const yoy =
      prev != null && prev !== 0
        ? Math.round(((total - prev) / prev) * 1000) / 10
        : null;
    return { year, total, yoy };
  });
}

export function DividendTrendChart({ rows }: Props) {
  const data = useMemo(() => buildChartData(rows), [rows]);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700">
        차트로 표시할 보통주 배당 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">연도별 주당 배당금 (보통주)</h3>
        <span className="text-[10px] text-neutral-500">
          같은 연도 결산·중간·분기 합산
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.2)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(120,120,120,0.3)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              tickFormatter={(v: number) => formatKRW(v)}
              tickLine={false}
              axisLine={{ stroke: "rgba(120,120,120,0.3)" }}
              width={64}
            />
            <Tooltip
              cursor={{ fill: "rgba(120,120,120,0.08)" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid rgba(120,120,120,0.3)",
                background: "rgba(20,20,20,0.95)",
                color: "white",
              }}
              formatter={(value, _name, item) => {
                const v = typeof value === "number" ? value : Number(value);
                const yoy = (item?.payload as ChartPoint | undefined)?.yoy;
                const yoyText =
                  yoy == null
                    ? ""
                    : yoy > 0
                    ? ` (+${yoy.toFixed(1)}%)`
                    : ` (${yoy.toFixed(1)}%)`;
                return [`${formatKRW(v)}원${yoyText}`, "주당 배당금"];
              }}
              labelFormatter={(label) => `${label}년`}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.year}
                  fill={
                    d.yoy == null
                      ? "#6b7280"
                      : d.yoy >= 0
                      ? "#ef4444"
                      : "#3b82f6"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-neutral-500">
        <Legend color="#ef4444" label="전년 대비 증가" />
        <Legend color="#3b82f6" label="전년 대비 감소" />
        <Legend color="#6b7280" label="비교 없음" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
