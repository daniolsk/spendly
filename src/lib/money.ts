// All amounts are integers in minor units (e.g. grosze, cents). Never do money math with floats.
// Every account has one currency (user_settings.currency); it only changes how amounts are shown.

import { evaluate, isExpression } from "./calc";
import { currencyLocale, DEFAULT_CURRENCY } from "./currency";

const formatters = new Map<string, Intl.NumberFormat>();

function cached(key: string, make: () => Intl.NumberFormat) {
  let f = formatters.get(key);
  if (!f) {
    f = make();
    formatters.set(key, f);
  }
  return f;
}

function moneyFormatter(currency: string, signed: boolean) {
  return cached(`money:${currency}:${signed}`, () =>
    new Intl.NumberFormat(currencyLocale(currency), {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: signed ? "exceptZero" : "auto",
      // Some locales (pl-PL) skip grouping for 4-digit numbers by default.
      useGrouping: "always",
    }),
  );
}

export function formatMoney(minor: number, opts: { currency?: string; signed?: boolean } = {}) {
  return moneyFormatter(opts.currency ?? DEFAULT_CURRENCY, opts.signed ?? false).format(minor / 100);
}

/** Short symbol for input adornments ("zł", "$", "€", "CHF") and whether the locale writes it before the number. */
export function currencySymbol(currency: string = DEFAULT_CURRENCY) {
  const parts = cached(`symbol:${currency}`, () =>
    new Intl.NumberFormat(currencyLocale(currency), { style: "currency", currency, currencyDisplay: "narrowSymbol" }),
  ).formatToParts(1);
  const index = parts.findIndex((p) => p.type === "currency");
  const number = parts.findIndex((p) => p.type === "integer");
  return { symbol: parts[index]?.value ?? currency, prefix: index < number };
}

function decimalSeparator(currency: string) {
  return (
    cached(`number:${currency}`, () => new Intl.NumberFormat(currencyLocale(currency)))
      .formatToParts(1.5)
      .find((p) => p.type === "decimal")?.value ?? "."
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses user input into positive minor units, whatever number style it was typed in:
 * "1 035,50", "1.035,50", "1,035.50", "1035.5", "-12", "12 zł", "$12". Returns null when invalid.
 */
export function parseMoney(input: string, currency: string = DEFAULT_CURRENCY): number | null {
  const { symbol } = currencySymbol(currency);
  const symbols = [...new Set([symbol, currency, "zł"])].sort((a, b) => b.length - a.length).map(escapeRegExp);
  let s = input
    .replace(new RegExp(symbols.join("|"), "gi"), "")
    .replace(/[\s'’]/g, "")
    .replace(/^[-+]/, "");
  if (!/^\d[\d.,]*$/.test(s)) return null;

  // Work out which mark is the decimal separator: the last one when both are used; a single mark
  // followed by exactly three digits is a thousands separator (amounts never have 3 decimals).
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let decimal: string | null = null;
  if (lastDot >= 0 && lastComma >= 0) decimal = lastDot > lastComma ? "." : ",";
  else if (lastDot >= 0 || lastComma >= 0) {
    const mark = lastDot >= 0 ? "." : ",";
    const single = s.indexOf(mark) === s.lastIndexOf(mark);
    if (single && s.length - s.lastIndexOf(mark) - 1 !== 3) decimal = mark;
  }
  let frac = "";
  if (decimal) {
    const at = s.lastIndexOf(decimal);
    frac = s.slice(at + 1);
    s = s.slice(0, at);
    if (s.includes(decimal)) return null;
  }
  // Thousands groups: 3 digits, or 2 before the last group (Indian style "12,34,567").
  const groups = s.split(/[.,]/);
  if (groups.length > 1 && (groups.at(-1)!.length !== 3 || groups.slice(1).some((g) => g.length < 2 || g.length > 3))) {
    return null;
  }
  const whole = groups.join("");
  if (!/^\d+$/.test(whole) || !/^\d{0,2}$/.test(frac)) return null;

  const value = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Like parseMoney, but also accepts arithmetic ("150/2", "12,99*3 + 5"); the result is
 * rounded to minor units. Expressions that come out negative are invalid.
 */
export function parseMoneyInput(input: string, currency: string = DEFAULT_CURRENCY): number | null {
  if (!isExpression(input)) return parseMoney(input, currency);
  const v = evaluate(input);
  if (v === null || v < 0) return null;
  const minor = Math.round(v * 100);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Minor units -> editable string in the currency's number style, e.g. 103550 -> "1035,50" (PLN) or "1035.50" (USD). */
export function toInputValue(minor: number, currency: string = DEFAULT_CURRENCY) {
  return (minor / 100).toFixed(2).replace(".", decimalSeparator(currency));
}

export function formatPercent(ratio: number, currency: string = DEFAULT_CURRENCY) {
  return cached(`percent:${currency}`, () =>
    new Intl.NumberFormat(currencyLocale(currency), { style: "percent", maximumFractionDigits: 1 }),
  ).format(ratio);
}

/** Plain number (hours etc.) in the same style as the account's money. */
export function formatNumber(value: number, currency: string = DEFAULT_CURRENCY) {
  return cached(`plain:${currency}`, () =>
    new Intl.NumberFormat(currencyLocale(currency), { maximumFractionDigits: 2, useGrouping: false }),
  ).format(value);
}

/** Compact axis labels like "12 tys." / "12K", in the account's number style. */
export function formatCompact(minor: number, currency: string = DEFAULT_CURRENCY) {
  return cached(`compact:${currency}`, () =>
    new Intl.NumberFormat(currencyLocale(currency), { notation: "compact", maximumFractionDigits: 1 }),
  ).format(minor / 100);
}
