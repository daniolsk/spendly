"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMoney } from "@/lib/money";
import { monthName } from "@/lib/month";

export type YearPoint = { month: number; income: number; expenses: number; cumulative: number };

const compact = new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 });

function moneyTooltip(currency: string) {
  return (
    <ChartTooltipContent
      labelFormatter={(_, payload) => monthName(Number(payload?.[0]?.payload?.month), "long")}
      formatter={(value, name, item) => (
        <div className="flex w-full items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.color }} />
          <span className="text-muted-foreground">{barConfig[name as keyof typeof barConfig]?.label ?? "Balance"}</span>
          <span className="ml-auto pl-3 font-mono font-medium tabular-nums text-foreground">
            {formatMoney(Number(value), { currency })}
          </span>
        </div>
      )}
    />
  );
}

const barConfig = {
  income: { label: "Income", color: "var(--chart-income)" },
  expenses: { label: "Expenses", color: "var(--chart-expense)" },
} satisfies ChartConfig;

export function IncomeExpenseChart({ data, currency }: { data: YearPoint[]; currency: string }) {
  return (
    <ChartContainer config={barConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} barGap={2} margin={{ left: 0, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="0" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(m) => monthName(m).slice(0, 3)} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => compact.format(v / 100)}
        />
        <ChartTooltip cursor content={moneyTooltip(currency)} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  );
}

const balanceConfig = {
  cumulative: { label: "Balance since start", color: "var(--chart-balance)" },
} satisfies ChartConfig;

export function CumulativeBalanceChart({ data, currency }: { data: YearPoint[]; currency: string }) {
  return (
    <ChartContainer config={balanceConfig} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cumulative)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-cumulative)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(m) => monthName(m).slice(0, 3)} />
        <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => compact.format(v / 100)} />
        <ChartTooltip cursor content={moneyTooltip(currency)} />
        <Area
          dataKey="cumulative"
          type="monotone"
          stroke="var(--color-cumulative)"
          strokeWidth={2}
          fill="url(#balanceFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
