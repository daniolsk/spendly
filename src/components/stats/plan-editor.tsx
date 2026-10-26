"use client";

import { useState, useTransition } from "react";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { CategoryLabel } from "@/components/category-dot";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { formatMoney, parseMoney, toInputValue } from "@/lib/money";
import { monthLabel } from "@/lib/month";
import { resetMonthPlan, saveMonthPlan } from "@/server/actions";

type PlanRow = { id: string; name: string; color: string; planned: number };

export function PlanEditor({
  month,
  rows,
  currency,
  hasCustomPlan,
}: {
  month: string;
  rows: PlanRow[];
  currency: string;
  hasCustomPlan: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function openEditor() {
    setValues(Object.fromEntries(rows.map((r) => [r.id, toInputValue(r.planned)])));
    setOpen(true);
  }

  const parsed = rows.map((r) => ({ categoryId: r.id, amount: values[r.id]?.trim() ? parseMoney(values[r.id]) : 0 }));
  const invalid = parsed.some((p) => p.amount === null);
  const total = parsed.reduce((a, p) => a + (p.amount ?? 0), 0);

  function save() {
    if (invalid) return;
    startTransition(async () => {
      const res = await saveMonthPlan({ month, entries: parsed.map((p) => ({ ...p, amount: p.amount! })) });
      if (res.ok) {
        toast.success("Plan saved");
        setOpen(false);
      } else toast.error(res.error);
    });
  }

  function reset() {
    startTransition(async () => {
      const res = await resetMonthPlan(month);
      if (res.ok) {
        toast.success("Plan reset to category defaults");
        setOpen(false);
      } else toast.error(res.error);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openEditor}>
        <PencilIcon />
        Edit plan
      </Button>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={`Plan for ${monthLabel(month)}`}
        description="Planned spending per category. Defaults come from Settings."
      >
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <label key={r.id} className="flex items-center gap-3">
              <CategoryLabel name={r.name} color={r.color} className="flex-1 text-sm" />
              <InputGroup className="h-10 w-36">
                <InputGroupInput
                  inputMode="decimal"
                  className="tabular text-right"
                  value={values[r.id] ?? ""}
                  aria-invalid={values[r.id]?.trim() ? parseMoney(values[r.id]) === null : false}
                  onChange={(e) => setValues((v) => ({ ...v, [r.id]: e.target.value }))}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>zł</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </label>
          ))}
          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Total planned</span>
            <span className="tabular font-semibold">{formatMoney(total, { currency })}</span>
          </div>
          <div className="flex gap-2 pt-1">
            {hasCustomPlan ? (
              <Button variant="outline" size="lg" className="h-11" onClick={reset} disabled={pending}>
                Reset
              </Button>
            ) : null}
            <Button size="lg" className="h-11 flex-1" onClick={save} disabled={pending || invalid}>
              {pending ? "Saving…" : "Save plan"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
