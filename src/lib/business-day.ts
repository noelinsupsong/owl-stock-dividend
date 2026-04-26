/**
 * 한국 주식시장 영업일 / 배당락일 계산 유틸리티
 *
 * - 배당락일 = 배당기준일의 1영업일 전 (주말·공휴일 제외)
 * - 한국 공휴일은 date-holidays 패키지로 산출 (대체공휴일 포함)
 *
 * NOTE: 거래소 임시 휴장일(예: 12월 31일 폐장일)은 date-holidays에 포함되지 않을 수
 *       있으므로, 정확도가 필요한 경우 KRX 휴장일 데이터를 추가로 주입해야 한다.
 *       holidays 테이블에 수동 등록한 일자는 isHoliday()의 manualHolidays 인자로 전달.
 */

import Holidays from "date-holidays";

const hd = new Holidays("KR");

/** YYYY-MM-DD 또는 YYYYMMDD 또는 Date를 Date(00:00:00 KST 기준)로 정규화 */
export function toDate(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }
  const s = input.replace(/-/g, "");
  if (!/^\d{8}$/.test(s)) {
    throw new Error(`Invalid date format: ${input} (expected YYYYMMDD or YYYY-MM-DD)`);
  }
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  return new Date(y, m, d);
}

/** Date → "YYYY-MM-DD" */
export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 주말 여부 */
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * 한국 공휴일 여부 (대체공휴일 포함).
 * @param manualHolidays 추가로 휴장일 처리할 날짜 집합 (YYYY-MM-DD)
 */
export function isHoliday(d: Date, manualHolidays?: Set<string>): boolean {
  if (manualHolidays?.has(formatISODate(d))) return true;
  const result = hd.isHoliday(d);
  // date-holidays는 type=public/bank/optional/observance 등을 반환.
  // 한국은 대부분 'public'이며, 영업일 판단에는 public/bank만 인정.
  if (!result) return false;
  const list = Array.isArray(result) ? result : [result];
  return list.some((h) => h.type === "public" || h.type === "bank");
}

/** 영업일 여부 (주말 X, 공휴일 X) */
export function isBusinessDay(d: Date, manualHolidays?: Set<string>): boolean {
  return !isWeekend(d) && !isHoliday(d, manualHolidays);
}

/**
 * 기준일로부터 N영업일 이동한 날짜를 반환한다.
 * @param days 양수면 미래, 음수면 과거 방향 (영업일 단위)
 */
export function shiftBusinessDays(
  base: Date | string,
  days: number,
  manualHolidays?: Set<string>
): Date {
  const date = toDate(base);
  if (days === 0) return date;

  const direction = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  const cursor = new Date(date);

  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + direction);
    if (isBusinessDay(cursor, manualHolidays)) remaining -= 1;
  }
  return cursor;
}

/**
 * 배당기준일(record date)로부터 배당락일(ex-dividend date)을 계산한다.
 * 한국 시장: 배당락일 = 배당기준일의 1영업일 전.
 */
export function calculateExDividendDate(
  recordDate: Date | string,
  manualHolidays?: Set<string>
): Date {
  return shiftBusinessDays(recordDate, -1, manualHolidays);
}
