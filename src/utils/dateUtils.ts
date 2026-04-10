import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'd. MMM yyyy', { locale: da });
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM', { locale: da });
}

export function formatDayName(dateStr: string): string {
  return format(new Date(dateStr), 'EEEE', { locale: da });
}

export function formatWeekDay(dateStr: string): string {
  return format(new Date(dateStr), 'EEE d/M', { locale: da });
}

export function getWeekDates(date: Date = new Date()): { start: string; end: string } {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start: toISODate(start), end: toISODate(end) };
}

export function getMonthDates(date: Date = new Date()): { start: string; end: string } {
  return {
    start: toISODate(startOfMonth(date)),
    end: toISODate(endOfMonth(date)),
  };
}

export function getWeekdays(start: string, end: string): string[] {
  return eachDayOfInterval({ start: new Date(start), end: new Date(end) })
    .filter(d => d.getDay() !== 0 && d.getDay() !== 6)
    .map(toISODate);
}

export function getWeekNumber(dateStr: string): number {
  return getISOWeek(new Date(dateStr));
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}t`;
  return `${h}t ${m}m`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Returns Mon-Fri dates for the week containing `date` */
export function getWorkWeekDates(date: string): string[] {
  const d = new Date(date);
  const { start, end } = getWeekDates(d);
  return getWeekdays(start, end);
}

/** Group entries by week start date */
export function getWeekStart(dateStr: string): string {
  const start = startOfWeek(new Date(dateStr), { weekStartsOn: 1 });
  return toISODate(start);
}
