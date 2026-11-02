"use client";

import { useId, useState } from "react";
import { MinusIcon, PlusIcon, TargetIcon } from "lucide-react";
import { cn } from "cn";
import { CategoryDot } from "@/components/category-dot";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { evaluate, isExpression } from "@/lib/calc";
import { formatMoney, parseMoney } from "@/lib/money";

// Interactive feature demos for the public landing page. Sample data only, nothing is saved.

const cat = (color: string) => `var(--cat-${color})`;

function Bar({ ratio, color, over }: { ratio: number; color: string; over?: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-[width,background-color] duration-500 ease-out"
        style={{ width: `${Math.min(ratio, 1) * 100}%`, backgroundColor: over ? "var(--destructive)" : cat(color) }}
      />
    </div>
  );
}

/* ---------- Plans ---------- */

const INCOME = 980000;
const PLAN_STEP = 5000;
const PLAN_START = [
  { name: "Groceries", color: "aqua", spent: 31240, plan: 40000 },
  { name: "Housing & bills", color: "gray", spent: 161299, plan: 161299 },
  { name: "Transport", color: "blue", spent: 24750, plan: 30000 },
  { name: "Eating out", color: "orange", spent: 52300, plan: 45000 },
];

export function PlanDemo() {
  const [plans, setPlans] = useState(() => PLAN_START.map((c) => c.plan));
  const planned = plans.reduce((s, p) => s + p, 0);
  const spent = PLAN_START.reduce((s, c) => s + c.spent, 0);
  const change = (i: number, delta: number) =>
    setPlans((prev) => prev.map((p, j) => (j === i ? Math.max(PLAN_STEP, p + delta) : p)));

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3.5">
        {PLAN_START.map((c, i) => {
          const plan = plans[i];
          const over = c.spent > plan;
          return (
            <li key={c.name} className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium">
                    <CategoryDot color={c.color} className="size-2" />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className={cn("tabular shrink-0", over ? "text-destructive" : "text-muted-foreground")}>
                    {formatMoney(c.spent)} / {formatMoney(plan)}
                  </span>
                </div>
                <Bar ratio={c.spent / plan} color={c.color} over={over} />
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  aria-label={`Lower ${c.name} plan`}
                  onClick={() => change(i, -PLAN_STEP)}
                  disabled={plan <= PLAN_STEP}
                >
                  <MinusIcon />
                </Button>
                <Button variant="outline" size="icon-xs" aria-label={`Raise ${c.name} plan`} onClick={() => change(i, PLAN_STEP)}>
                  <PlusIcon />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-2 gap-2.5">
        <MiniTile label="Spent of planned" value={`${Math.round((spent / planned) * 100)}%`} />
        <MiniTile
          icon={<TargetIcon />}
          label="Predicted balance"
          value={<Money value={INCOME - planned} />}
          live
        />
      </div>
    </div>
  );
}

function MiniTile({
  icon,
  label,
  value,
  hint,
  live,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  live?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground [&_svg]:size-3">
        {icon}
        {label}
      </div>
      <div className="tabular truncate text-base font-semibold tracking-tight" aria-live={live ? "polite" : undefined}>
        {value}
      </div>
      {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/* ---------- Hourly income ---------- */

export function HourlyDemo() {
  const id = useId();
  const [hours, setHours] = useState("22 × 8");
  const [rate, setRate] = useState("60,00");
  const h = evaluate(hours);
  const r = parseMoney(rate);
  const valid = h !== null && h > 0 && r !== null && r > 0;
  const amount = valid ? Math.round(h * r) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" htmlFor={`${id}-h`}>
          Hours
          <Input
            id={`${id}-h`}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={h === null || h <= 0}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" htmlFor={`${id}-r`}>
          Rate (zł/h)
          <Input
            id={`${id}-r`}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={r === null || r <= 0}
          />
        </label>
      </div>
      <p className="tabular min-h-4 text-[11px] text-muted-foreground">
        {h !== null && isExpression(hours) ? `= ${+h.toFixed(2)} h` : "Try 160 + 12 or 7,5 × 20"}
        {hours === "22 × 8" ? " · 22 working days in October" : ""}
      </p>
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5">
        <span className="text-xs text-muted-foreground">Income</span>
        <span className="tabular text-base font-semibold tracking-tight" aria-live="polite">
          {amount !== null ? <Money value={amount} type="income" /> : "—"}
        </span>
      </div>
    </div>
  );
}

/* ---------- Refunds ---------- */

const SHOPPING_BEFORE = 41250;
const RETURN = 12999;
const SHOPPING_PLAN = 40000;

export function RefundDemo() {
  const id = useId();
  const [refund, setRefund] = useState(true);
  const spent = SHOPPING_BEFORE + (refund ? -RETURN : RETURN);
  const over = spent > SHOPPING_PLAN;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-xs">
        <CategoryDot color="magenta" className="size-2" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">Online order return</span>
          <span className="truncate text-[11px] text-muted-foreground">Shopping{refund ? " · Refund" : ""}</span>
        </div>
        <Money value={refund ? -RETURN : RETURN} type="expense" className="font-medium" />
      </div>
      <div className="flex items-center justify-between gap-3 px-1">
        <label htmlFor={`${id}-refund`} className="text-xs font-medium">
          Refund / money back
        </label>
        <Switch id={`${id}-refund`} checked={refund} onCheckedChange={setRefund} />
      </div>
      <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <CategoryDot color="magenta" className="size-2" />
            Shopping this month
          </span>
          <span className={cn("tabular", over ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
            {formatMoney(spent)} / {formatMoney(SHOPPING_PLAN)}
          </span>
        </div>
        <Bar ratio={spent / SHOPPING_PLAN} color="magenta" over={over} />
      </div>
    </div>
  );
}

/* ---------- Cost of living ---------- */

const LIVING = [
  { name: "Housing & bills", color: "gray", v: 161299 },
  { name: "Groceries", color: "aqua", v: 98700 },
  { name: "Transport", color: "blue", v: 41500 },
  { name: "Eating out", color: "orange", v: 52300 },
  { name: "Entertainment", color: "violet", v: 50000 },
  { name: "Savings", color: "green", v: 150000 },
];

export function LivingDemo() {
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set(["Savings"]));
  const total = LIVING.filter((c) => !excluded.has(c.name)).reduce((s, c) => s + c.v, 0);
  const toggle = (name: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {LIVING.map((c) => {
          const on = !excluded.has(c.name);
          return (
            <button
              key={c.name}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c.name)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "bg-card text-foreground" : "border-dashed bg-transparent text-muted-foreground line-through",
              )}
            >
              <CategoryDot color={c.color} className={cn("size-2 transition-opacity", !on && "opacity-40")} />
              {c.name}
            </button>
          );
        })}
      </div>
      <div className="flex items-end justify-between gap-3 rounded-xl border bg-card px-3 py-2.5">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">Cost of living</span>
          <span className="text-[11px] text-muted-foreground">
            {excluded.size ? `Excludes ${[...excluded].join(", ")}` : "All categories"}
          </span>
        </div>
        <span className="tabular shrink-0 text-base font-semibold tracking-tight" aria-live="polite">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}

/* ---------- Year ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_INCOME = [920000, 920000, 965000, 980000, 980000, 1015000, 980000, 980000, 1030000, 980000];
const YEAR_EXPENSE = [712000, 648000, 781000, 695000, 839000, 724000, 1012000, 689000, 746000, 612389];
// Opening balance chosen so October matches the hero preview's "Since start".
const OPENING = 123968;
const YEAR_MAX = 1100000;

export function YearDemo() {
  const [active, setActive] = useState(YEAR_INCOME.length - 1);
  const income = YEAR_INCOME[active];
  const expense = YEAR_EXPENSE[active];
  const since =
    OPENING + YEAR_INCOME.slice(0, active + 1).reduce((s, v) => s + v, 0) - YEAR_EXPENSE.slice(0, active + 1).reduce((s, v) => s + v, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">2026</span>
          <span className="flex gap-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-(--chart-income)" />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-(--chart-expense)" />
              Expenses
            </span>
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Month"
          className="grid min-h-40 flex-1 grid-cols-12 items-end gap-0.5 sm:min-h-48 sm:gap-1.5"
          onKeyDown={(e) => {
            const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const next = Math.min(Math.max(active + d, 0), YEAR_INCOME.length - 1);
            setActive(next);
            e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[next]?.focus();
          }}
        >
          {MONTHS.map((m, i) => {
            const has = i < YEAR_INCOME.length;
            const on = i === active;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${m} 2026`}
                tabIndex={on ? 0 : -1}
                disabled={!has}
                onClick={() => setActive(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && has && setActive(i)}
                className={cn(
                  "group flex h-full min-w-0 flex-col items-center justify-end gap-1.5 rounded-md pt-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on && "bg-muted/70",
                )}
              >
                <span className="flex h-full w-full items-end justify-center gap-px sm:gap-0.5">
                  {has ? (
                    <>
                      <span
                        className={cn("w-[38%] max-w-3 rounded-t-[3px] bg-(--chart-income) transition-opacity", !on && "opacity-55")}
                        style={{ height: `${(YEAR_INCOME[i] / YEAR_MAX) * 100}%` }}
                      />
                      <span
                        className={cn("w-[38%] max-w-3 rounded-t-[3px] bg-(--chart-expense) transition-opacity", !on && "opacity-55")}
                        style={{ height: `${(YEAR_EXPENSE[i] / YEAR_MAX) * 100}%` }}
                      />
                    </>
                  ) : (
                    <span className="h-1 w-[60%] rounded-full bg-muted" />
                  )}
                </span>
                <span className={cn("text-[10px] leading-none", on ? "font-medium text-foreground" : "text-muted-foreground")}>
                  <span className="sm:hidden">{m[0]}</span>
                  <span className="max-sm:hidden">{m}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5" aria-live="polite">
        <MiniTile label={`Income · ${MONTHS[active]}`} value={<Money value={income} className="text-income" />} />
        <MiniTile label={`Expenses · ${MONTHS[active]}`} value={<Money value={expense} />} />
        <MiniTile
          label="Balance"
          value={<Money value={income - expense} />}
          hint={income >= expense ? `${Math.round(((income - expense) / income) * 100)}% of income kept` : "Spent more than earned"}
        />
        <MiniTile label="Since start" value={<Money value={since} />} hint="Opening balance + every month" />
      </div>
    </div>
  );
}
