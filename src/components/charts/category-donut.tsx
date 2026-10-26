"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { colorVar } from "@/lib/colors";
import { formatMoney } from "@/lib/money";

export type DonutSlice = { id: string; name: string; color: string; value: number };

export function CategoryDonut({ data, currency, centerLabel }: { data: DonutSlice[]; currency: string; centerLabel: string }) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((a, d) => a + d.value, 0);
  const config = Object.fromEntries(
    slices.map((d) => [d.id, { label: d.name, color: colorVar(d.color) }]),
  ) satisfies ChartConfig;

  if (total === 0) {
    return (
      <div className="flex aspect-square max-h-64 w-full items-center justify-center rounded-full border-[18px] border-muted text-sm text-muted-foreground">
        No expenses
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-64 w-full">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="id"
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.payload.fill }} />
                  <span className="text-muted-foreground">{item.payload.name}</span>
                  <span className="ml-auto pl-3 font-mono font-medium tabular-nums text-foreground">
                    {formatMoney(Number(value), { currency })}
                    <span className="ml-1.5 text-muted-foreground">
                      {Math.round((Number(value) / total) * 100)}%
                    </span>
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={slices.map((d) => ({ ...d, fill: colorVar(d.color) }))}
          dataKey="value"
          nameKey="id"
          innerRadius="62%"
          outerRadius="100%"
          paddingAngle={0}
          stroke="var(--card)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {slices.map((d) => (
            <Cell key={d.id} fill={colorVar(d.color)} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={cx} y={cy - 4} className="fill-foreground text-base font-semibold">
                    {formatMoney(total, { currency })}
                  </tspan>
                  <tspan x={cx} y={cy + 16} className="fill-muted-foreground text-xs">
                    {centerLabel}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
