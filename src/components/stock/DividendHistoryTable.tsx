import type { DividendHistoryRow } from "@/types/dividend";
import {
  formatKRW,
  formatPercent,
  formatShortDate,
  formatYoY,
} from "@/lib/format";

interface Props {
  rows: DividendHistoryRow[];
}

export function DividendHistoryTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
        배당 이력이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900">
          <tr>
            <Th>연도</Th>
            <Th>구분</Th>
            <Th>주식종류</Th>
            <Th>배당기준일</Th>
            <Th>배당락일</Th>
            <Th>입금일</Th>
            <Th align="right">주당 배당금</Th>
            <Th align="right">배당수익률</Th>
            <Th align="right">전년 대비</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {rows.map((r) => (
            <Row key={`${r.fiscal_year}-${r.dividend_type}-${r.stock_type}`} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row }: { row: DividendHistoryRow }) {
  const yoy = formatYoY(row.yoy_change);
  const yoyClass =
    yoy.tone === "up"
      ? "text-red-500"
      : yoy.tone === "down"
      ? "text-blue-500"
      : "text-neutral-500";

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
      <Td>{row.fiscal_year}</Td>
      <Td>{row.dividend_type}</Td>
      <Td>{row.stock_type}</Td>
      <Td>{formatShortDate(row.record_date)}</Td>
      <Td>{formatShortDate(row.ex_dividend_date)}</Td>
      <Td>{formatShortDate(row.payment_date)}</Td>
      <Td align="right" className="font-medium">
        {row.dividend_per_share != null
          ? `${formatKRW(row.dividend_per_share)}원`
          : "-"}
      </Td>
      <Td align="right">{formatPercent(row.dividend_yield)}</Td>
      <Td align="right" className={`font-medium ${yoyClass}`}>
        {yoy.text}
      </Td>
    </tr>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-3 py-2 font-medium uppercase tracking-wide ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`px-3 py-2 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}
