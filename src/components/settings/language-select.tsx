"use client";

import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, type Language } from "@/lib/i18n";

/** Language names are shown in their own language, so they're readable whatever is selected. */
export function LanguageSelect({
  value,
  onChange,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  value: Language;
  onChange: (value: Language) => void;
  id?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Language)}>
      <SelectTrigger id={id} className={cn("w-full", className)} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code} lang={l.code}>
            {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
