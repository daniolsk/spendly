import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, PiggyBankIcon, ScaleIcon, SigmaIcon } from "lucide-react";
import { cn } from "cn";
import { CategoryDonut } from "@/components/charts/category-donut";
import { CumulativeBalanceChart, IncomeExpenseChart } from "@/components/charts/year-charts";
import { CategoryLabel } from "@/components/category-dot";
import { Money } from "@/components/money";
import { StatTile } from "@/components/stat-tile";
import { CategoryBreakdown } from "@/components/stats/category-breakdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { monthName } from "@/lib/month";
import { requireUser } from "@/server/dal";
import { getYearData } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/y/[year]">): Promise<Metadata> {
  const { year } = await params;
  return { title: `Year ${year}` };
}

export default function YearPage(props: PageProps<"/y/[year]">) {
  return (
    <Suspense fallback={<YearSkeleton />}>
      <YearContent {...props} />
    </Suspense>
  );
}

async function YearContent({ params }: PageProps<"/y/[year]">) {
  const { year: yearParam } = await params;
  if (!/^\d{4}$/.test(yearParam)) notFound();
  const year = Number(yearParam);

  const user = await requireUser();
  const data = await getYearData(user.id, year);
  const { totals, months, categories, categoryTotals, settings } = data;
  const currency = settings.currency;
  const money = (v: number) => formatMoney(v, { currency });
  const breakdown = categories.map((c) => ({ id: c.id, name: c.name, color: c.color, spent: categoryTotals[c.id] ?? 0 }));
  const excludedNames = categories.filter((c) => c.excludeFromLiving).map((c) => c.name);

  return (
    <div className="flex flex-col gap-5">
      <header className="-ml-2 flex items-center gap-1">
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href={`/y/${year - 1}`} aria-label="Previous year">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <h1 className="px-1 text-xl font-semibold tracking-tight sm:text-2xl">{year}</h1>
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href={`/y/${year + 1}`} aria-label="Next year">
            <ChevronRightIcon />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          icon={<ArrowDownLeftIcon className="size-3.5" />}
          label="Income"
          value={<span className="text-income">{money(totals.income)}</span>}
          hint={totals.activeMonths ? `avg. ${money(totals.avgMonthlyIncome)} / month` : undefined}
        />
        <StatTile
          icon={<ArrowUpRightIcon className="size-3.5" />}
          label="Expenses"
          value={money(totals.expenses)}
          hint={totals.activeMonths ? `avg. ${money(totals.avgMonthlyExpenses)} / month` : undefined}
        />
        <StatTile icon={<ScaleIcon className="size-3.5" />} label="Saved this year" value={<Money value={totals.balance} currency={currency} />} />
        <StatTile
          icon={<HomeIcon className="size-3.5" />}
          label="Cost of living"
          value={money(totals.livingCost)}
          hint={excludedNames.length ? `Excludes ${excludedNames.join(", ")}` : undefined}
        />
        <StatTile
          icon={<SigmaIcon className="size-3.5" />}
          label="Savings rate"
          value={totals.income ? `${Math.round((totals.balance / totals.income) * 100)}%` : "—"}
          hint="Share of income not spent"
        />
        <StatTile
          icon={<PiggyBankIcon className="size-3.5" />}
          label="Balance at year end"
          value={<Money value={totals.endBalance} currency={currency} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs. expenses</CardTitle>
            <CardDescription>Per month</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={months} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance since start</CardTitle>
            <CardDescription>Running total at the end of each month</CardDescription>
          </CardHeader>
          <CardContent>
            <CumulativeBalanceChart data={months} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses by category</CardTitle>
          <CardDescription>Whole year</CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
          <CategoryDonut data={breakdown.map((b) => ({ ...b, value: b.spent }))} currency={currency} centerLabel={`in ${year}`} />
          <CategoryBreakdown rows={breakdown} currency={currency} />
        </CardContent>
      </Card>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Months</CardTitle>
          <CardDescription>Tap a month to open it</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Month</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="pr-4 text-right">Since start</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((m) => {
              const empty = !m.income && !m.expenses;
              return (
                <TableRow key={m.key} className={cn(empty && "text-muted-foreground")}>
                  <TableCell className="pl-4 font-medium">
                    <Link href={`/m/${m.key}`} className="hover:underline">
                      {monthName(m.month, "long")}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular text-right">{empty ? "—" : money(m.income)}</TableCell>
                  <TableCell className="tabular text-right">{empty ? "—" : money(m.expenses)}</TableCell>
                  <TableCell className="text-right">{empty ? "—" : <Money value={m.balance} currency={currency} />}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Money value={m.cumulative} currency={currency} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4">Total</TableCell>
              <TableCell className="tabular text-right">{money(totals.income)}</TableCell>
              <TableCell className="tabular text-right">{money(totals.expenses)}</TableCell>
              <TableCell className="text-right">
                <Money value={totals.balance} currency={currency} />
              </TableCell>
              <TableCell className="pr-4" />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {categories.length ? (
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Categories by month</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-card pl-4">Category</TableHead>
                {months.map((m) => (
                  <TableHead key={m.key} className="text-right">
                    {monthName(m.month)}
                  </TableHead>
                ))}
                <TableHead className="pr-4 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="sticky left-0 z-10 max-w-44 bg-card pl-4">
                    <CategoryLabel name={c.name} color={c.color} />
                  </TableCell>
                  {months.map((m) => (
                    <TableCell key={m.key} className="tabular text-right text-muted-foreground">
                      {m.byCategory[c.id] ? (
                        <span className="text-foreground">{formatMoney(m.byCategory[c.id], { currency })}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="tabular pr-4 text-right font-medium">{money(categoryTotals[c.id] ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}

function YearSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-10 w-40" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
