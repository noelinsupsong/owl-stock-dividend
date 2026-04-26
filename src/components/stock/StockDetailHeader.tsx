import type { StockDetail } from "@/types/dividend";
import { formatMarketCap, formatPercent } from "@/lib/format";

interface Props {
  detail: StockDetail;
}

const MARKET_BADGE: Record<string, string> = {
  KOSPI: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  KOSDAQ: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function StockDetailHeader({ detail }: Props) {
  const badgeClass =
    MARKET_BADGE[detail.market] ??
    "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {detail.stock_name}
        </h1>
        <span className="text-sm font-mono text-neutral-500">
          {detail.stock_code}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {detail.market}
        </span>
        {detail.sector && (
          <span className="text-xs text-neutral-500">{detail.sector}</span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="시가총액" value={formatMarketCap(detail.market_cap)} />
        <Stat
          label="배당수익률"
          value={formatPercent(detail.latest_dividend_yield)}
          hint="가장 최근 사업연도 기준"
        />
        <Stat label="시장구분" value={detail.market} />
        <Stat label="현재가" value="-" hint="실시간 시세 미연동" />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 text-base font-semibold">{value}</dd>
      {hint && <p className="text-[10px] text-neutral-400">{hint}</p>}
    </div>
  );
}
