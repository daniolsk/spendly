"use client";

import { createContext, use, useEffect, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, getTranslator, type Language, type MessageKey, type Vars } from "./index";

const LanguageContext = createContext<Language>(DEFAULT_LANGUAGE);

/** Provides the account's UI language to client components and sets <html lang>. */
export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return <LanguageContext value={language}>{children}</LanguageContext>;
}

export function useLanguage() {
  return use(LanguageContext);
}

export function useT() {
  return getTranslator(use(LanguageContext));
}

/** Translated text for server components outside the data-loading boundaries (headers, labels). */
export function T({ k, vars }: { k: MessageKey; vars?: Vars }) {
  return useT()(k, vars);
}
