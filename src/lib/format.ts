/** 숫자 포맷 유틸 */

const krw = new Intl.NumberFormat("ko-KR");

export function formatKRW(n: number | null | undefined): string {
  if (n == null) return "-";
  return krw.format(n);
}

/** 시가총액(원) → "12.3조" / "4,567억" */
export function formatMarketCap(won: number | null | undefined): string {
  if (won == null) return "-";
  const trillion = 1_000_000_000_000;
  const hundredMillion = 100_000_000;
  if (won >= trillion) {
    return `${(won / trillion).toFixed(1)}조`;
  }
  if (won >= hundredMillion) {
    return `${krw.format(Math.round(won / hundredMillion))}억`;
  }
  return `${krw.format(won)}원`;
}

/** 증감률 포맷: +5.1% ↑ / -3.2% ↓ / 신규 */
export function formatYoY(pct: number | null | undefined): {
  text: string;
  tone: "up" | "down" | "flat" | "new";
} {
  if (pct == null) return { text: "신규", tone: "new" };
  if (pct > 0) return { text: `+${pct.toFixed(1)}% ↑`, tone: "up" };
  if (pct < 0) return { text: `${pct.toFixed(1)}% ↓`, tone: "down" };
  return { text: "0.0%", tone: "flat" };
}

export function formatPercent(pct: number | null | undefined): string {
  if (pct == null) return "-";
  return `${pct.toFixed(2)}%`;
}

/** "2025-04-25" → "04/25" (시각용 짧은 표기) */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = iso.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return m ? `${m[1]}/${m[2]}` : iso;
}

/**
 * 배당종류 표시용 라벨 + 색상.
 * DB의 dividend_type: "결산" | "중간" | "1Q" | "3Q" | "기타"
 *
 * NOTE: V2 API는 결산/중간/분기 구분을 직접 제공하지 않아 record_date의 월로
 * 추정한 값. 신 배당제도(2023~) 적용 기업의 4월 record는 실제로는 "결산"인데
 * 우리 분류상 "기타"로 떨어질 수 있음.
 */
export function dividendTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "결산":
      return "결산";
    case "중간":
      return "중간";
    case "분기":
      return "분기";
    case "1Q":
      return "1분기";
    case "3Q":
      return "3분기";
    case "기타":
      return "기타";
    default:
      return type || "기타";
  }
}

/** Tailwind 색상 클래스 (라이트/다크 모드 모두) */
export function dividendTypeBadgeClass(type: string | null | undefined): string {
  switch (type) {
    case "결산":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200";
    case "중간":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200";
    case "분기":
    case "1Q":
    case "3Q":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "기타":
    default:
      return "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  }
}
