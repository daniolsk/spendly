// All amounts are integers in minor units (grosze). Never do money math with floats.

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, signed: boolean) {
  const key = `${currency}:${signed}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: signed ? "exceptZero" : "auto",
      useGrouping: "always",
    });
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(minor: number, opts: { currency?: string; signed?: boolean } = {}) {
  return formatter(opts.currency ?? "PLN", opts.signed ?? false).format(minor / 100);
}

/** Parses user input like "1 035,50", "1035.5", "-12" into positive minor units. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s zł]/gi, "").replace(",", ".").replace(/^[-+]/, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const value = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(value) ? value : null;
}

/** Minor units -> editable string, e.g. 103550 -> "1035,50". */
export function toInputValue(minor: number) {
  return (minor / 100).toFixed(2).replace(".", ",");
}

export function formatPercent(ratio: number) {
  return new Intl.NumberFormat("pl-PL", { style: "percent", maximumFractionDigits: 1 }).format(ratio);
}
