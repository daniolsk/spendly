"use client";

import { useRef, useState } from "react";
import { cn } from "cn";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LIMITS, type Usage } from "@/lib/limits";
import { monthLabel } from "@/lib/month";

const n = (v: number) => v.toLocaleString("en-US");

// Floor so a cap is only shown as 100% once it is actually reached.
function percent(used: number, limit: number) {
  if (used === 0) return "0%";
  const pct = (used / limit) * 100;
  return pct < 1 ? "<1%" : `${Math.min(100, Math.floor(pct))}%`;
}

export function UsageLimits({ usage, month }: { usage: Usage; month: string }) {
  const rows = [
    {
      label: `Transactions in ${monthLabel(month)}`,
      hint: "Limit applies to each month",
      used: usage.transactionsThisMonth,
      limit: LIMITS.transactionsPerMonth,
    },
    {
      label: "Added in the last 24 hours",
      hint: "Rolling window",
      used: usage.transactionsToday,
      limit: LIMITS.transactionsPerDay,
    },
    { label: "All transactions", used: usage.transactionsTotal, limit: LIMITS.transactionsTotal },
    { label: "Categories", hint: "Archived ones included", used: usage.categories, limit: LIMITS.categories },
    { label: "Months with a custom plan", used: usage.planMonths, limit: LIMITS.planMonths },
  ];

  return (
    <ul className="flex flex-col divide-y">
      {rows.map((r) => (
        <UsageRow key={r.label} {...r} />
      ))}
    </ul>
  );
}

function UsageRow({ label, hint, used, limit }: { label: string; hint?: string; used: number; limit: number }) {
  // Radix tooltips only open on hover/focus. On touch screens a tap toggles it
  // instead, decided from the state at pointerdown (before Radix closes it).
  const [open, setOpen] = useState(false);
  const tap = useRef<boolean | null>(null);
  const pct = Math.min(100, (used / limit) * 100);
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onPointerDown={(e) => {
            tap.current = e.pointerType === "touch" ? open : null;
          }}
          onPointerLeave={(e) => e.pointerType === "touch" && e.preventDefault()}
          onClick={(e) => {
            if (tap.current === null) return;
            e.preventDefault();
            setOpen(!tap.current);
            tap.current = null;
          }}
        >
          {/* A div, not a button: the row contains the progress bar's div. */}
          <div
            tabIndex={0}
            className="flex cursor-default flex-col gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{label}</span>
                {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
              </div>
              <span className="tabular shrink-0 text-muted-foreground">{percent(used, limit)} used</span>
            </div>
            <Progress
              value={pct}
              aria-label={label}
              className={cn(pct >= 80 && "[&>[data-slot=progress-indicator]]:bg-destructive")}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" className="tabular">
          {n(used)} of {n(limit)}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}
