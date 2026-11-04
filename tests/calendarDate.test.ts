import { describe, expect, it } from 'vitest';
import { addDays, addMonths, addYears, calendarMonth, daysInMonth, formatISODate, isoWeekday, parseISODate } from '../src/components/calendarDate';
import type { CalendarDate } from '../src/components/calendarDate';

function date(value: string): CalendarDate {
  const parsed = parseISODate(value);
  if (!parsed) throw new Error(`Invalid test date: ${value}`);
  return parsed;
}
function iso(value: CalendarDate) { return formatISODate(value); }

describe('integer Gregorian calendar dates', () => {
  it.each(['0001-01-01', '0004-02-29', '1900-02-28', '2000-02-29', '2024-02-29', '9999-12-31'])('round-trips exact ISO %s', value => {
    expect(iso(date(value))).toBe(value);
  });
  it.each(['', '2024-2-29', '24-02-29', '02024-02-29', '2024-02-29T00:00:00Z', ' 2024-02-29', '2024-02-29\n', '0000-01-01', '10000-01-01', '0001-02-29', '1900-02-29', '2100-02-29', '2024-00-01', '2024-13-01', '2024-01-00', '2024-04-31'])('rejects invalid or noncanonical ISO %j', value => {
    expect(parseISODate(value)).toBeNull();
  });
  it('uses Gregorian century leap rules and full month lengths', () => {
    expect([1, 4, 1900, 2000, 2100, 9999].map(year => daysInMonth(year, 2))).toEqual([28, 29, 28, 29, 28, 28]);
    expect(Array.from({ length: 12 }, (_, index) => daysInMonth(2023, index + 1))).toEqual([31,28,31,30,31,30,31,31,30,31,30,31]);
    expect(() => daysInMonth(0, 1)).toThrow(RangeError);
    expect(() => daysInMonth(2024, 13)).toThrow(RangeError);
    expect(() => formatISODate({ year: 2023, month: 2, day: 29 })).toThrow(RangeError);
  });
  it.each([['0001-01-01', 0], ['1970-01-01', 3], ['2000-01-01', 5], ['2000-02-29', 1], ['2024-02-29', 3], ['9999-12-31', 4]] as const)('has Monday-first weekday for %s', (value, weekday) => {
    expect(isoWeekday(date(value))).toBe(weekday);
  });
  it('steps through leap days, common centuries and year boundaries', () => {
    expect(iso(addDays(date('2000-02-28'), 1))).toBe('2000-02-29');
    expect(iso(addDays(date('1900-02-28'), 1))).toBe('1900-03-01');
    expect(iso(addDays(date('2000-03-01'), -1))).toBe('2000-02-29');
    expect(iso(addDays(date('2024-12-31'), 1))).toBe('2025-01-01');
    expect(iso(addDays(date('2025-01-01'), -1))).toBe('2024-12-31');
    expect(iso(addDays(date('0001-01-01'), 3652058))).toBe('9999-12-31');
    expect(iso(addDays(date('9999-12-31'), -3652058))).toBe('0001-01-01');
    expect(iso(addDays(date('0001-01-01'), -1))).toBe('0001-01-01');
    expect(iso(addDays(date('9999-12-31'), 1))).toBe('9999-12-31');
  });
  it('clamps month navigation to month ends without overflowing into another month', () => {
    expect(iso(addMonths(date('2024-01-31'), 1))).toBe('2024-02-29');
    expect(iso(addMonths(date('2023-03-31'), -1))).toBe('2023-02-28');
    expect(iso(addMonths(date('2024-12-15'), 1))).toBe('2025-01-15');
    expect(iso(addMonths(date('2024-01-15'), -13))).toBe('2022-12-15');
    expect(iso(addMonths(date('0001-01-31'), -1))).toBe('0001-01-31');
    expect(iso(addMonths(date('9999-12-31'), 1))).toBe('9999-12-31');
  });
  it('clamps yearly navigation and preserves leap-day intent when possible', () => {
    expect(iso(addYears(date('2000-02-29'), 1))).toBe('2001-02-28');
    expect(iso(addYears(date('2000-02-29'), 4))).toBe('2004-02-29');
    expect(iso(addYears(date('2000-02-29'), -100))).toBe('1900-02-28');
    expect(iso(addYears(date('0001-01-01'), -1))).toBe('0001-01-01');
    expect(iso(addYears(date('9999-12-31'), 1))).toBe('9999-12-31');
  });
  it('rejects fractional, nonfinite and unsafe navigation offsets', () => {
    for (const operation of [addDays, addMonths, addYears]) {
      for (const offset of [.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => operation(date('2024-02-29'), offset)).toThrow(RangeError);
    }
  });
  it('builds six whole Monday-first weeks including adjacent months', () => {
    const cells = calendarMonth(date('2024-02-29'));
    expect(cells).toHaveLength(42);
    expect(iso(cells[0]!)).toBe('2024-01-29');
    expect(iso(cells[41]!)).toBe('2024-03-10');
    expect(cells.filter(cell => cell?.month === 2)).toHaveLength(29);
    expect(cells.every((cell, index) => cell !== null && isoWeekday(cell) === index % 7)).toBe(true);
    expect(calendarMonth(date('2024-02-01'))).toEqual(cells);
  });
  it('leaves unsupported boundary cells empty instead of repeating clamped dates', () => {
    const first = calendarMonth(date('0001-01-01'));
    expect(iso(first[0]!)).toBe('0001-01-01');
    const last = calendarMonth(date('9999-12-31'));
    expect(iso(last[32]!)).toBe('9999-12-31');
    expect(last.slice(33)).toEqual(Array(9).fill(null));
  });
  it('preserves weekdays across one complete 400-year Gregorian cycle', () => {
    expect(iso(addDays(date('2000-01-01'), 146097))).toBe('2400-01-01');
    expect(isoWeekday(date('2000-01-01'))).toBe(isoWeekday(date('2400-01-01')));
    for (const value of ['0001-03-01', '1900-03-01', '2000-02-29', '2024-12-31', '9999-12-01']) {
      const original = date(value);
      expect(addDays(addDays(original, 17), -17)).toEqual(original);
      expect(isoWeekday(addDays(original, 17))).toBe((isoWeekday(original) + 17) % 7);
    }
  });
});
