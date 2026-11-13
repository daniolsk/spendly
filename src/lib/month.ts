// Months are identified by "YYYY-MM" strings; dates by "YYYY-MM-DD".

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonthKey(v: string) {
  return MONTH_RE.test(v);
}

/** Server-side "now" in the user's timezone (servers usually run in UTC). */
export function zonedToday(timeZone = process.env.APP_TIMEZONE ?? "Europe/Warsaw") {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date())
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
}

export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function todayKey(now = new Date()) {
  return `${currentMonthKey(now)}-${String(now.getDate()).padStart(2, "0")}`;
}

export function parseMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function shiftMonth(key: string, delta: number) {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return currentMonthKey(d);
}

export function daysInMonth(key: string) {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month, 0).getDate();
}

export function monthRange(key: string) {
  return { start: `${key}-01`, end: `${key}-${String(daysInMonth(key)).padStart(2, "0")}` };
}

// Formatters take the UI locale (lib/i18n languageLocale); month and weekday names are
// capitalized because Polish writes them lowercase.

export function monthLabel(key: string, style: "long" | "short" = "long", locale = "en-GB") {
  const { year, month } = parseMonthKey(key);
  return capitalize(new Intl.DateTimeFormat(locale, { month: style, year: "numeric" }).format(new Date(year, month - 1, 1)));
}

export function monthName(month: number, style: "long" | "short" = "short", locale = "en-GB") {
  return capitalize(new Intl.DateTimeFormat(locale, { month: style }).format(new Date(2000, month - 1, 1)));
}

export function formatDay(dateKey: string, locale = "en-GB") {
  const [y, m, d] = dateKey.split("-").map(Number);
  return capitalize(
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(new Date(y, m - 1, d)),
  );
}

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}
