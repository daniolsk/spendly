import { CalendarDaysIcon, HomeIcon, PiggyBankIcon, TargetIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { CategoryDonut } from "@/components/charts/category-donut";
import { Money } from "@/components/money";
import { StatTile } from "@/components/stat-tile";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { MonthData } from "@/server/queries";
import { CategoryBreakdown } from "./category-breakdown";
import { PlanEditor } from "./plan-editor";

export function MonthStats({ month, data }: { month: string; data: MonthData }) {
  const { stats, settings } = data;
  const currency = settings.currency;
  const excludedNames = stats.byCategory.filter((c) => c.category.excludeFromLiving).map((c) => c.category.name);
  const rows = stats.byCategory.map((s) => ({
    id: s.category.id,
    name: s.category.name,
    color: s.category.color,
    spent: s.spent,
    planned: s.planned,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Expenses by category</CardTitle>
          <CardDescription>Actual vs. planned this month</CardDescription>
          <CardAction>
            <PlanEditor
              month={month}
              currency={currency}
              hasCustomPlan={stats.hasCustomPlan}
              rows={rows.filter((_, i) => !stats.byCategory[i].category.archived)}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="grid items-center gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
          <CategoryDonut data={rows.map((r) => ({ ...r, value: r.spent }))} currency={currency} centerLabel="spent" />
          <CategoryBreakdown rows={rows} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          icon={<TrendingUpIcon className="size-3.5" />}
          label="Avg. daily income"
          value={formatMoney(stats.dailyIncome, { currency })}
        />
        <StatTile
          icon={<TrendingDownIcon className="size-3.5" />}
          label="Avg. daily spending"
          value={formatMoney(stats.dailyExpenses, { currency })}
        />
        <StatTile
          icon={<HomeIcon className="size-3.5" />}
          label="Cost of living"
          value={formatMoney(stats.livingCost, { currency })}
          hint={excludedNames.length ? `Excludes ${excludedNames.join(", ")}` : undefined}
        />
        <StatTile
          icon={<CalendarDaysIcon className="size-3.5" />}
          label="Balance this month"
          value={<Money value={stats.balance} currency={currency} />}
          hint={`${formatMoney(stats.income, { currency })} in − ${formatMoney(stats.expenses, { currency })} out`}
        />
        <StatTile
          icon={<TargetIcon className="size-3.5" />}
          label="Predicted balance"
          value={<Money value={stats.predictedBalance} currency={currency} />}
          hint={`Income − planned ${formatMoney(stats.plannedTotal, { currency })}`}
        />
        <StatTile
          icon={<PiggyBankIcon className="size-3.5" />}
          label="Balance since start"
          value={<Money value={stats.cumulativeBalance} currency={currency} />}
          hint="Opening balance + all months up to this one"
        />
      </div>
    </div>
  );
}
