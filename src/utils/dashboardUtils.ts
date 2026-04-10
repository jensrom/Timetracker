import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { getWeekDates } from './dateUtils';

function toISO(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export type Period = '1uge' | '1mdr' | '3mdr' | '6mdr' | '12mdr' | 'custom';

export const PERIODS: { id: Period; label: string }[] = [
  { id: '1uge',   label: '1 uge' },
  { id: '1mdr',   label: '1 mdr' },
  { id: '3mdr',   label: '3 mdr' },
  { id: '6mdr',   label: '6 mdr' },
  { id: '12mdr',  label: '12 mdr' },
  { id: 'custom', label: 'Tilpasset' },
];

export function getPeriodRange(
  period: Period,
  customStart: string,
  customEnd: string
): { start: string; end: string } {
  const today = new Date();
  switch (period) {
    case '1uge':  return getWeekDates(today);
    case '1mdr':  return { start: toISO(startOfMonth(today)),           end: toISO(endOfMonth(today)) };
    case '3mdr':  return { start: toISO(startOfMonth(subMonths(today, 2))), end: toISO(endOfMonth(today)) };
    case '6mdr':  return { start: toISO(startOfMonth(subMonths(today, 5))), end: toISO(endOfMonth(today)) };
    case '12mdr': return { start: toISO(startOfMonth(subMonths(today, 11))), end: toISO(endOfMonth(today)) };
    case 'custom': return { start: customStart, end: customEnd };
  }
}

/** Parse a user-entered hours string — accepts both "," and "." as decimal separator */
export function parseHoursInput(value: string): number | '' {
  const normalized = value.trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed <= 0 || parsed > 24) return '';
  // Round to nearest 0.25 to avoid floating point issues
  return Math.round(parsed * 4) / 4;
}
