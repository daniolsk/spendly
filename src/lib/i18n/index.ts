import { createElement, Fragment, type ReactNode } from "react";
import { en, type MessageKey, type Messages } from "./en";
import { pl } from "./pl";

// UI languages. Each account picks one (user_settings.language); it only changes the UI text and
// date formatting. Money keeps the number style of the account currency (lib/currency.ts).

export const LANGUAGES = [
  { code: "en", name: "English", locale: "en-GB" },
  { code: "pl", name: "Polski", locale: "pl-PL" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [Language, ...Language[]];

export const DEFAULT_LANGUAGE: Language = "en";

const MESSAGES: Record<Language, Messages> = { en, pl };

export function isLanguage(v: unknown): v is Language {
  return typeof v === "string" && (LANGUAGE_CODES as string[]).includes(v);
}

/** Stored values are validated on write; anything unexpected falls back to English. */
export function toLanguage(v: unknown): Language {
  return isLanguage(v) ? v : DEFAULT_LANGUAGE;
}

/** Locale for dates and plain numbers in the UI language. */
export function languageLocale(lang: Language) {
  return LANGUAGES.find((l) => l.code === lang)?.locale ?? "en-GB";
}

/** Best guess from browser languages like ["pl-PL", "en"]; English unless Polish comes first. */
export function guessLanguage(languages: readonly string[]): Language {
  for (const tag of languages) {
    const code = tag.split("-")[0].toLowerCase();
    if (isLanguage(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}

export type { MessageKey };
export type Vars = Record<string, string | number>;

export type Translator = {
  (key: MessageKey, vars?: Vars): string;
  /** Like t(), but placeholders can be React nodes, e.g. t.rich("x", { amount: <Money /> }). */
  rich: (key: MessageKey, vars: Record<string, ReactNode>) => ReactNode;
  /** Whether a string is a message key (used for Zod messages, which are keys). */
  has: (key: string) => key is MessageKey;
  /** Integer in the UI language's style, e.g. "1,000" / "1000". */
  n: (value: number) => string;
  lang: Language;
  locale: string;
};

const translators = new Map<Language, Translator>();

export function getTranslator(lang: Language): Translator {
  const cached = translators.get(lang);
  if (cached) return cached;

  const messages = MESSAGES[lang];
  const locale = languageLocale(lang);
  const plural = new Intl.PluralRules(locale);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  function template(key: MessageKey, count: unknown) {
    const message = messages[key] ?? en[key];
    if (typeof message === "string") return message;
    const form = typeof count === "number" ? plural.select(count) : "other";
    return (message as Record<string, string>)[form] ?? message.other;
  }

  function format(value: string | number) {
    return typeof value === "number" ? number.format(value) : value;
  }

  const t = ((key, vars) => {
    const text = template(key, vars?.count);
    return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? format(vars[name]) : m)) : text;
  }) as Translator;

  t.rich = (key, vars) => {
    const parts = template(key, vars.count).split(/\{(\w+)\}/g);
    // split() with a capture group alternates text and placeholder names.
    return parts.map((part, i) => {
      if (i % 2 === 0) return part;
      const value = vars[part];
      return createElement(Fragment, { key: i }, typeof value === "number" ? format(value) : value);
    });
  };
  t.has = (key): key is MessageKey => key in en;
  t.n = (value) => number.format(value);
  t.lang = lang;
  t.locale = locale;

  translators.set(lang, t);
  return t;
}
