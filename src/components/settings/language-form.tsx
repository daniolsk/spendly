"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getTranslator, type Language } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import { saveLanguage } from "@/server/actions";
import { LanguageSelect } from "./language-select";

export function LanguageForm({ language }: { language: Language }) {
  const [value, setValue] = useState<Language>(language);
  const [pending, startTransition] = useTransition();
  const t = useT();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveLanguage(value);
      // The action's refresh() re-renders the whole app, shell included, in the new language.
      if (res.ok) toast.success(getTranslator(value)("settings.languageSaved"));
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <LanguageSelect value={value} onChange={setValue} className="h-10! max-w-56" aria-label={t("settings.language")} />
      <Button type="submit" variant="outline" className="h-10" disabled={pending || value === language}>
        {t("common.save")}
      </Button>
    </form>
  );
}
