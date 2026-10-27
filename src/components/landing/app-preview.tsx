import type { ReactNode } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, CalendarIcon, ChartColumnIcon, PiggyBankIcon, ScaleIcon, SettingsIcon, WalletIcon } from "lucide-react";
import { cn } from "cn";
import { CategoryDot } from "@/components/category-dot";
import { Money } from "@/components/money";

// Made-up sample data: the landing page is public, so it never shows real records.
const DAYS = [
  {
    day: "Tue 14 Oct",
    items: [
      { name: "Supermarket", category: "Groceries", color: "aqua", amount: 8640 },
      { name: "Fuel", category: "Transport", color: "blue", amount: 24750 },
    ],
  },
  {
    day: "Mon 13 Oct",
    items: [
      { name: "Concert tickets", category: "Entertainment", color: "violet", amount: 50000 },
      { name: "Dinner out", category: "Eating out", color: "orange", amount: 5800 },
      { name: "Online order return", category: "Shopping · Refund", color: "magenta", amount: -12999 },
    ],
  },
  {
    day: "Fri 10 Oct",
    items: [{ name: "Internet & phone", category: "Housing & bills", color: "gray", amount: 11900 }],
  },
];

const PLAN = [
  { name: "Groceries", color: "aqua", spent: 31240, plan: 40000 },
  { name: "Housing & bills", color: "gray", spent: 161299, plan: 161299 },
  { name: "Transport", color: "blue", spent: 24750, plan: 41500 },
  { name: "Entertainment", color: "violet", spent: 100000, plan: 150000 },
  { name: "Eating out", color: "orange", spent: 52300, plan: 45000 },
];

function Tile({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground [&_svg]:size-3">
        {icon}
        {label}
      </div>
      <div className="tabular text-base font-semibold tracking-tight">{value}</div>
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/** A static, scaled-down rendition of the month view, used as the landing page "screenshot". */
export function AppPreview({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-black/10 dark:shadow-black/50", className)}>
      <div className="flex h-9 items-center gap-1.5 border-b bg-muted/50 px-4">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto rounded-md bg-background px-10 py-0.5 text-[11px] text-muted-foreground max-sm:hidden">
          spendly · October 2026
        </span>
      </div>

      <div className="grid text-left md:grid-cols-[11rem_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-1 border-r bg-sidebar p-3 md:flex">
          <div className="mb-3 flex items-center gap-2 px-1.5 pt-1 text-sm font-semibold tracking-tight">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <WalletIcon className="size-3.5" />
            </span>
            Spendly
          </div>
          {[
            { icon: CalendarIcon, label: "Month", active: true },
            { icon: ChartColumnIcon, label: "Year" },
            { icon: SettingsIcon, label: "Settings" },
          ].map(({ icon: Icon, label, active }) => (
            <span
              key={label}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium",
                active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </aside>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-semibold tracking-tight">October 2026</span>
            <div className="flex gap-1.5 text-[11px] font-medium max-sm:hidden">
              <span className="rounded-md border px-2.5 py-1">+ Income</span>
              <span className="rounded-md bg-primary px-2.5 py-1 text-primary-foreground">− Expense</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Tile icon={<ArrowDownLeftIcon />} label="Income" value={<Money value={980000} className="text-income" />} />
            <Tile icon={<ArrowUpRightIcon />} label="Expenses" value={<Money value={612389} />} hint="of 6 427,99 zł planned" />
            <Tile icon={<ScaleIcon />} label="Balance" value={<Money value={367611} />} />
            <Tile icon={<PiggyBankIcon />} label="Since start" value={<Money value={2415579} />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="overflow-hidden rounded-xl border bg-card">
              {DAYS.map(({ day, items }) => (
                <div key={day}>
                  <div className="flex justify-between border-b bg-muted/60 px-3 py-1.5 text-[11px] font-medium">
                    {day}
                    <Money
                      value={-items.reduce((sum, t) => sum + t.amount, 0)}
                      className="font-normal text-muted-foreground"
                    />
                  </div>
                  {items.map((t) => (
                    <div key={t.name} className="flex items-center gap-2.5 border-b px-3 py-2 text-xs last:border-b-0">
                      <CategoryDot color={t.color} className="size-2" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{t.name}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{t.category}</span>
                      </div>
                      <Money value={t.amount} type="expense" className="font-medium" />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 max-lg:hidden">
              <span className="text-xs font-semibold">Plan vs. spent</span>
              {PLAN.map((c) => {
                const ratio = Math.min(c.spent / c.plan, 1);
                return (
                  <div key={c.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <CategoryDot color={c.color} className="size-2" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className={cn("tabular", c.spent > c.plan ? "text-destructive" : "text-muted-foreground")}>
                        {Math.round((c.spent / c.plan) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${ratio * 100}%`, backgroundColor: `var(--cat-${c.color})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
