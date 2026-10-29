import { cn } from "cn";
import { Progress } from "@/components/ui/progress";
import { LIMITS, type Usage } from "@/lib/limits";
import { monthLabel } from "@/lib/month";

const n = (v: number) => v.toLocaleString("en-US");

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
      {rows.map((r) => {
        const pct = Math.min(100, (r.used / r.limit) * 100);
        return (
          <li key={r.label} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{r.label}</span>
                {r.hint ? <span className="text-xs text-muted-foreground">{r.hint}</span> : null}
              </div>
              <span className="tabular shrink-0 text-muted-foreground">
                {n(r.used)} / {n(r.limit)}
              </span>
            </div>
            <Progress
              value={pct}
              aria-label={r.label}
              className={cn(pct >= 80 && "[&>[data-slot=progress-indicator]]:bg-destructive")}
            />
          </li>
        );
      })}
    </ul>
  );
}
