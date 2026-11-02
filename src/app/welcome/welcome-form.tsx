"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";
import { CurrencyExample, CurrencySelect } from "@/components/settings/currency-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { DEFAULT_CURRENCY, guessCurrency, type CurrencyCode } from "@/lib/currency";
import { saveCurrency } from "@/server/actions";

const subscribeNever = () => () => {};

export function WelcomeForm() {
  // Pre-selected from the browser language (server render and hydration use the default).
  const guessed = useSyncExternalStore(subscribeNever, () => guessCurrency(navigator.languages), () => DEFAULT_CURRENCY);
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const value = currency ?? guessed;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveCurrency(value);
      if (res.ok) router.replace("/m");
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="welcome-currency">Currency</FieldLabel>
            <CurrencySelect id="welcome-currency" value={value} onChange={setCurrency} className="h-11!" />
            <FieldDescription>
              Amounts will look like <CurrencyExample currency={value} className="font-medium text-foreground" />. You can
              change it later in Settings.
            </FieldDescription>
          </Field>
          <Button type="submit" size="lg" className="h-11 w-full gap-2" disabled={pending}>
            Continue
            <ArrowRightIcon />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
