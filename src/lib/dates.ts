import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns';

export type DateStr = string; // 'YYYY-MM-DD', always in the device's local timezone

export const toDateStr = (d: Date): DateStr => format(d, 'yyyy-MM-dd');

export const todayStr = (): DateStr => toDateStr(new Date());

export const fromDateStr = (s: DateStr): Date => parseISO(s);

/** Start of the week containing `d`. weekStartsOn: 1 = Monday, 0 = Sunday. */
export function weekStartOf(d: Date | DateStr, weekStartsOn: 0 | 1 = 1): DateStr {
  const date = typeof d === 'string' ? fromDateStr(d) : d;
  return toDateStr(startOfWeek(date, { weekStartsOn }));
}

export const addDaysStr = (s: DateStr, n: number): DateStr =>
  toDateStr(addDays(fromDateStr(s), n));

/** The 7 dates of the week beginning at `weekStart`. */
export const weekDates = (weekStart: DateStr): DateStr[] =>
  Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

export const daysBetween = (a: DateStr, b: DateStr): number =>
  differenceInCalendarDays(fromDateStr(b), fromDateStr(a));

/** 1..7 — how many days of this week have started, as of `today`. */
export function daysElapsedInWeek(weekStart: DateStr, today: DateStr): number {
  return Math.min(7, Math.max(1, daysBetween(weekStart, today) + 1));
}

export const fmtDayTitle = (s: DateStr): string => format(fromDateStr(s), 'EEEE, MMM d');
export const fmtShort = (s: DateStr): string => format(fromDateStr(s), 'MMM d');
export const fmtWeekRange = (weekStart: DateStr): string =>
  `${format(fromDateStr(weekStart), 'MMM d')} – ${format(fromDateStr(addDaysStr(weekStart, 6)), 'MMM d')}`;
export const weekdayLetter = (s: DateStr): string => format(fromDateStr(s), 'EEEEE');

export function greetingFor(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
