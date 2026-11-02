"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import { saveCurrency } from "@/server/actions";
import { CurrencyExample, CurrencySelect } from "./currency-select";

export function CurrencyForm({ currency }: { currency: string }) {
  const initial = (CURRENCY_CODES as string[]).includes(currency) ? (currency as CurrencyCode) : "PLN";
  const [value, setValue] = useState<CurrencyCode>(initial);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCurrency(value);
      if (res.ok) toast.success("Currency saved");
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <CurrencySelect value={value} onChange={setValue} className="h-10! max-w-56" />
        <Button type="submit" variant="outline" className="h-10" disabled={pending || value === currency}>
          Save
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Amounts look like <CurrencyExample currency={value} className="font-medium text-foreground" />
      </p>
    </form>
  );
}
