"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyAddon } from "@/components/money";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { useT } from "@/lib/i18n/client";
import { parseMoney, toInputValue } from "@/lib/money";
import { saveSettings } from "@/server/actions";

export function OpeningBalanceForm({ openingBalance, currency }: { openingBalance: number; currency: string }) {
  const [value, setValue] = useState(toInputValue(openingBalance, currency));
  const [pending, startTransition] = useTransition();
  const t = useT();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const negative = value.trim().startsWith("-");
    const parsed = value.trim() ? parseMoney(value, currency) : 0;
    if (parsed === null) {
      toast.error(t("common.invalidAmount"));
      return;
    }
    startTransition(async () => {
      const res = await saveSettings({ openingBalance: negative ? -parsed : parsed });
      if (res.ok) toast.success(t("settings.openingBalanceSaved"));
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <InputGroup className="h-10 max-w-56">
        <InputGroupInput
          aria-label={t("settings.openingBalance")}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="tabular"
        />
        <CurrencyAddon currency={currency} />
      </InputGroup>
      <Button type="submit" variant="outline" className="h-10" disabled={pending}>
        {t("common.save")}
      </Button>
    </form>
  );
}
