// Currencies a user can pick for their account. Amounts are stored as integer minor units with
// two decimals, so only currencies that use exactly two decimal places are offered.
// Each currency is shown in the number style of the locale it is most used in.

export const CURRENCIES = [
  { code: "PLN", name: "Polish złoty", locale: "pl-PL" },
  { code: "EUR", name: "Euro", locale: "de-DE" },
  { code: "USD", name: "US dollar", locale: "en-US" },
  { code: "GBP", name: "British pound", locale: "en-GB" },
  { code: "CHF", name: "Swiss franc", locale: "de-CH" },
  { code: "CZK", name: "Czech koruna", locale: "cs-CZ" },
  { code: "SEK", name: "Swedish krona", locale: "sv-SE" },
  { code: "NOK", name: "Norwegian krone", locale: "nb-NO" },
  { code: "DKK", name: "Danish krone", locale: "da-DK" },
  { code: "RON", name: "Romanian leu", locale: "ro-RO" },
  { code: "UAH", name: "Ukrainian hryvnia", locale: "uk-UA" },
  { code: "CAD", name: "Canadian dollar", locale: "en-CA" },
  { code: "AUD", name: "Australian dollar", locale: "en-AU" },
  { code: "NZD", name: "New Zealand dollar", locale: "en-NZ" },
  { code: "MXN", name: "Mexican peso", locale: "es-MX" },
  { code: "BRL", name: "Brazilian real", locale: "pt-BR" },
  { code: "ZAR", name: "South African rand", locale: "en-ZA" },
  { code: "INR", name: "Indian rupee", locale: "en-IN" },
  { code: "SGD", name: "Singapore dollar", locale: "en-SG" },
  { code: "HKD", name: "Hong Kong dollar", locale: "en-HK" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]];

export const DEFAULT_CURRENCY: CurrencyCode = "PLN";

/** Locale used to format numbers for a currency; falls back to Polish for unknown codes. */
export function currencyLocale(currency: string) {
  return CURRENCIES.find((c) => c.code === currency)?.locale ?? "pl-PL";
}

const EURO_REGIONS = new Set(
  "AT BE HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES BG".split(" "),
);
const REGION_CURRENCY: Record<string, CurrencyCode> = {
  PL: "PLN", US: "USD", GB: "GBP", CH: "CHF", LI: "CHF", CZ: "CZK", SE: "SEK", NO: "NOK", DK: "DKK",
  RO: "RON", UA: "UAH", CA: "CAD", AU: "AUD", NZ: "NZD", MX: "MXN", BR: "BRL", ZA: "ZAR", IN: "INR",
  SG: "SGD", HK: "HKD",
};
const LANGUAGE_CURRENCY: Record<string, CurrencyCode> = {
  pl: "PLN", cs: "CZK", sv: "SEK", nb: "NOK", nn: "NOK", no: "NOK", da: "DKK", ro: "RON", uk: "UAH",
  de: "EUR", fr: "EUR", it: "EUR", es: "EUR", nl: "EUR", pt: "EUR", fi: "EUR", el: "EUR", sk: "EUR",
  sl: "EUR", et: "EUR", lv: "EUR", lt: "EUR", hr: "EUR", ga: "EUR", mt: "EUR",
};

/** Best guess from browser languages like ["en-GB", "pl"]; region wins over language. */
export function guessCurrency(languages: readonly string[]): CurrencyCode {
  for (const tag of languages) {
    let region: string | undefined;
    try {
      region = new Intl.Locale(tag).maximize().region;
    } catch {
      continue;
    }
    if (region && REGION_CURRENCY[region]) return REGION_CURRENCY[region];
    if (region && EURO_REGIONS.has(region)) return "EUR";
    const language = tag.split("-")[0].toLowerCase();
    if (LANGUAGE_CURRENCY[language]) return LANGUAGE_CURRENCY[language];
  }
  return DEFAULT_CURRENCY;
}

/** Currency name in the UI language, e.g. "Polish złoty" / "Złoty polski". */
export function currencyName(code: string, language: string) {
  const fallback = CURRENCIES.find((c) => c.code === code)?.name ?? code;
  if (language === "en") return fallback;
  try {
    const name = new Intl.DisplayNames([language], { type: "currency" }).of(code) ?? fallback;
    return name.charAt(0).toLocaleUpperCase() + name.slice(1);
  } catch {
    return fallback;
  }
}
