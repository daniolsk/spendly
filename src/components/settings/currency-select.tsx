"use client";

import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, currencyName, type CurrencyCode } from "@/lib/currency";
import { useLanguage } from "@/lib/i18n/client";
import { formatMoney } from "@/lib/money";

export function CurrencySelect({
  value,
  onChange,
  id,
  className,
}: {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  id?: string;
  className?: string;
}) {
  const language = useLanguage();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)}>
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="w-9 font-medium">{c.code}</span>
            <span className="truncate text-muted-foreground">{currencyName(c.code, language)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "1 234,56 zł" in the given currency, to show what amounts will look like. */
export function CurrencyExample({ currency, className }: { currency: string; className?: string }) {
  return (
    <span className={cn("tabular", className)}>
      {formatMoney(123456, { currency })}
    </span>
  );
}
