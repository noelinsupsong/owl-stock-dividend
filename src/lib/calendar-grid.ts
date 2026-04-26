/**
 * 월 캘린더 그리드 생성 유틸 (일~토 6주 고정)
 */
import { formatISODate } from "./business-day";

export interface CalendarCell {
  date: Date;
  iso: string;        // YYYY-MM-DD
  inMonth: boolean;   // 해당 월에 속한 날짜인지
  isToday: boolean;
  isWeekend: boolean;
}

/** YYYY, MM(1-12) → 6주 × 7일 = 42칸 그리드 */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay(); // 0(일) ~ 6(토)
  const gridStart = new Date(year, month - 1, 1 - startOffset);

  const todayISO = formatISODate(new Date());
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const day = d.getDay();
    cells.push({
      date: d,
      iso: formatISODate(d),
      inMonth: d.getMonth() === month - 1,
      isToday: formatISODate(d) === todayISO,
      isWeekend: day === 0 || day === 6,
    });
  }
  return cells;
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
