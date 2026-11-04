/** Proleptic Gregorian calendar dates, independent of time zones and JavaScript Date. */
export interface CalendarDate { year: number; month: number; day: number }

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const MAX_ORDINAL = 3652058;

function assertYear(year: number) {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) throw new RangeError('Year must be an integer from 1 to 9999.');
}
function leapYear(year: number) { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0); }
export function daysInMonth(year: number, month: number): number {
  assertYear(year);
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Month must be an integer from 1 to 12.');
  return month === 2 && leapYear(year) ? 29 : MONTH_LENGTHS[month - 1]!;
}
function validDate(date: CalendarDate) {
  return Number.isInteger(date.year) && date.year >= MIN_YEAR && date.year <= MAX_YEAR
    && Number.isInteger(date.month) && date.month >= 1 && date.month <= 12
    && Number.isInteger(date.day) && date.day >= 1 && date.day <= daysInMonth(date.year, date.month);
}
function assertDate(date: CalendarDate) {
  if (!validDate(date)) throw new RangeError('Date must be a valid Gregorian date from 0001-01-01 to 9999-12-31.');
}
export function parseISODate(value: string): CalendarDate | null {
  if (value.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = { year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)), day: Number(value.slice(8, 10)) };
  return validDate(date) ? date : null;
}
export function formatISODate(date: CalendarDate): string {
  assertDate(date);
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}
function daysBeforeYear(year: number) {
  const previous = year - 1;
  return previous * 365 + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400);
}
function ordinal(date: CalendarDate) {
  assertDate(date);
  let result = daysBeforeYear(date.year) + date.day - 1;
  for (let month = 1; month < date.month; month++) result += daysInMonth(date.year, month);
  return result;
}
function fromOrdinal(value: number): CalendarDate {
  let lower = MIN_YEAR;
  let upper = MAX_YEAR;
  while (lower < upper) {
    const middle = Math.ceil((lower + upper) / 2);
    if (daysBeforeYear(middle) <= value) lower = middle; else upper = middle - 1;
  }
  let remaining = value - daysBeforeYear(lower);
  let month = 1;
  while (remaining >= daysInMonth(lower, month)) remaining -= daysInMonth(lower, month++);
  return { year: lower, month, day: remaining + 1 };
}
function assertDelta(delta: number) {
  if (!Number.isSafeInteger(delta)) throw new RangeError('Calendar offsets must be safe integers.');
}
/** Monday is 0 and Sunday is 6; 0001-01-01 was a Monday. */
export function isoWeekday(date: CalendarDate): number { return ordinal(date) % 7; }
/** Navigation clamps at the supported date boundaries. */
export function addDays(date: CalendarDate, delta: number): CalendarDate {
  assertDelta(delta);
  return fromOrdinal(Math.max(0, Math.min(MAX_ORDINAL, ordinal(date) + delta)));
}
/** Month navigation preserves the day where possible and otherwise uses the last day. */
export function addMonths(date: CalendarDate, delta: number): CalendarDate {
  assertDate(date); assertDelta(delta);
  const index = Math.max(0, Math.min(MAX_YEAR * 12 - 1, (date.year - 1) * 12 + date.month - 1 + delta));
  const year = Math.floor(index / 12) + 1;
  const month = index % 12 + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}
export function addYears(date: CalendarDate, delta: number): CalendarDate {
  assertDate(date); assertDelta(delta);
  const year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, date.year + delta));
  return { year, month: date.month, day: Math.min(date.day, daysInMonth(year, date.month)) };
}
/** Six Monday-first weeks; cells outside the supported years are empty. */
export function calendarMonth(date: CalendarDate): (CalendarDate | null)[] {
  assertDate(date);
  const first = ordinal({ year: date.year, month: date.month, day: 1 });
  const start = first - first % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const value = start + index;
    return value < 0 || value > MAX_ORDINAL ? null : fromOrdinal(value);
  });
}
