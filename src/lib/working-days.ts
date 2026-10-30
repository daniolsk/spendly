// Polish statutory working time: Mon–Fri minus public holidays. A holiday on a Saturday
// also lowers the month's working time by one day (Kodeks pracy art. 130 §2).

import { daysInMonth, parseMonthKey } from "@/lib/month";

/** Easter Sunday (Gregorian, anonymous algorithm) as [month, day]. */
function easter(year: number): [number, number] {
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
  return [Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1];
}

function polishHolidays(year: number) {
  const [em, ed] = easter(year);
  const fromEaster = (days: number) => new Date(year, em - 1, ed + days);
  const dates = [
    new Date(year, 0, 1),
    new Date(year, 0, 6),
    fromEaster(0),
    fromEaster(1),
    new Date(year, 4, 1),
    new Date(year, 4, 3),
    fromEaster(49), // Pentecost
    fromEaster(60), // Corpus Christi
    new Date(year, 7, 15),
    new Date(year, 10, 1),
    new Date(year, 10, 11),
    new Date(year, 11, 25),
    new Date(year, 11, 26),
  ];
  if (year >= 2025) dates.push(new Date(year, 11, 24)); // Christmas Eve, a holiday since 2025
  return new Set(dates.map((d) => `${d.getMonth() + 1}-${d.getDate()}`));
}

export function workingDays(monthKey: string) {
  const { year, month } = parseMonthKey(monthKey);
  const holidays = polishHolidays(year);
  let count = 0;
  for (let day = 1; day <= daysInMonth(monthKey); day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    if (weekday === 0) continue;
    const holiday = holidays.has(`${month}-${day}`);
    if (weekday === 6) count -= holiday ? 1 : 0;
    else if (!holiday) count++;
  }
  return count;
}
