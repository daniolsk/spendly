"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { parseMoney, toInputValue } from "@/lib/money";
import { saveSettings } from "@/server/actions";

export function OpeningBalanceForm({ openingBalance }: { openingBalance: number }) {
  const [value, setValue] = useState(toInputValue(openingBalance));
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const negative = value.trim().startsWith("-");
    const parsed = value.trim() ? parseMoney(value) : 0;
    if (parsed === null) {
      toast.error("Invalid amount");
      return;
    }
    startTransition(async () => {
      const res = await saveSettings({ openingBalance: negative ? -parsed : parsed });
      if (res.ok) toast.success("Opening balance saved");
      else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <InputGroup className="h-10 max-w-56">
        <InputGroupInput
          aria-label="Opening balance"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="tabular"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>zł</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <Button type="submit" variant="outline" className="h-10" disabled={pending}>
        Save
      </Button>
    </form>
  );
}
