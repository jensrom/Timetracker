/**
 * Danish public holidays calculator using the Gauss Easter algorithm.
 * Returns holidays as 'YYYY-MM-DD' strings.
 */

function getEasterSunday(year: number): Date {
  // Anonymous Gregorian algorithm (Gauss)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DanishHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export function getDanishHolidays(year: number): DanishHoliday[] {
  const easter = getEasterSunday(year);
  const holidays: DanishHoliday[] = [
    { date: `${year}-01-01`, name: 'Nytårsdag' },
    { date: toISO(addDays(easter, -3)), name: 'Skærtorsdag' },
    { date: toISO(addDays(easter, -2)), name: 'Langfredag' },
    { date: toISO(easter),             name: 'Påskedag' },
    { date: toISO(addDays(easter, 1)), name: '2. Påskedag' },
    { date: toISO(addDays(easter, 39)), name: 'Kristi Himmelfartsdag' },
    { date: toISO(addDays(easter, 49)), name: 'Pinsedag' },
    { date: toISO(addDays(easter, 50)), name: '2. Pinsedag' },
    { date: `${year}-06-05`, name: 'Grundlovsdag' },
    { date: `${year}-12-24`, name: 'Juleaftensdag' },
    { date: `${year}-12-25`, name: '1. Juledag' },
    { date: `${year}-12-26`, name: '2. Juledag' },
  ];
  return holidays;
}

/** Cached lookup: date string → holiday name (or undefined) */
const cache = new Map<number, Map<string, string>>();

export function getHolidayName(dateStr: string): string | undefined {
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (!cache.has(year)) {
    const map = new Map<string, string>();
    getDanishHolidays(year).forEach(h => map.set(h.date, h.name));
    cache.set(year, map);
  }
  return cache.get(year)!.get(dateStr);
}

export function isHoliday(dateStr: string): boolean {
  return getHolidayName(dateStr) !== undefined;
}

/** Count working days in a date range, excluding weekends and holidays */
export function countWorkingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    const iso = toISO(cur);
    if (day !== 0 && day !== 6 && !isHoliday(iso)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Count holiday working days (holidays that fall on Mon-Fri) in a date range */
export function countHolidaysInRange(start: string, end: string): DanishHoliday[] {
  const s = new Date(start);
  const e = new Date(end);
  const result: DanishHoliday[] = [];
  const yearStart = s.getFullYear();
  const yearEnd = e.getFullYear();
  for (let year = yearStart; year <= yearEnd; year++) {
    getDanishHolidays(year).forEach(h => {
      const hDate = new Date(h.date);
      const dow = hDate.getDay();
      if (hDate >= s && hDate <= e && dow !== 0 && dow !== 6) {
        result.push(h);
      }
    });
  }
  return result;
}
