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
import { formatMoney, formatPercent } from "@/lib/money";
import { monthName } from "@/lib/month";
import { requireUser } from "@/server/dal";
import { getT } from "@/server/i18n";
import { getYearData } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/y/[year]">): Promise<Metadata> {
  const { year } = await params;
  const t = await getT();
  return { title: t("year.title", { year }) };
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
  const [data, t] = await Promise.all([getYearData(user.id, year), getT()]);
  const { totals, months, categories, categoryTotals, settings } = data;
  const currency = settings.currency;
  const money = (v: number) => formatMoney(v, { currency });
  const breakdown = categories.map((c) => ({ id: c.id, name: c.name, color: c.color, spent: categoryTotals[c.id] ?? 0 }));
  const excludedNames = categories.filter((c) => c.excludeFromLiving).map((c) => c.name);

  return (
    <div className="flex flex-col gap-5">
      <header className="-ml-2 flex items-center gap-1">
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href={`/y/${year - 1}`} aria-label={t("year.previous")}>
            <ChevronLeftIcon />
          </Link>
        </Button>
        <h1 className="px-1 text-xl font-semibold tracking-tight sm:text-2xl">{year}</h1>
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href={`/y/${year + 1}`} aria-label={t("year.next")}>
            <ChevronRightIcon />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          icon={<ArrowDownLeftIcon className="size-3.5" />}
          label={t("common.income")}
          value={<span className="text-income">{money(totals.income)}</span>}
          hint={totals.activeMonths ? t("year.avgPerMonth", { amount: money(totals.avgMonthlyIncome) }) : undefined}
        />
        <StatTile
          icon={<ArrowUpRightIcon className="size-3.5" />}
          label={t("common.expenses")}
          value={money(totals.expenses)}
          hint={totals.activeMonths ? t("year.avgPerMonth", { amount: money(totals.avgMonthlyExpenses) }) : undefined}
        />
        <StatTile icon={<ScaleIcon className="size-3.5" />} label={t("year.saved")} value={<Money value={totals.balance} currency={currency} />} />
        <StatTile
          icon={<HomeIcon className="size-3.5" />}
          label={t("stats.livingCost")}
          value={money(totals.livingCost)}
          hint={excludedNames.length ? t("stats.excludes", { names: excludedNames.join(", ") }) : undefined}
        />
        <StatTile
          icon={<SigmaIcon className="size-3.5" />}
          label={t("year.savingsRate")}
          value={totals.income ? formatPercent(Math.round((totals.balance / totals.income) * 100) / 100, currency) : "—"}
          hint={t("year.savingsRateHint")}
        />
        <StatTile
          icon={<PiggyBankIcon className="size-3.5" />}
          label={t("year.endBalance")}
          value={<Money value={totals.endBalance} currency={currency} />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("year.incomeVsExpenses")}</CardTitle>
            <CardDescription>{t("year.perMonth")}</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={months} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("stats.balanceSinceStart")}</CardTitle>
            <CardDescription>{t("year.runningTotal")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CumulativeBalanceChart data={months} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("stats.byCategory")}</CardTitle>
          <CardDescription>{t("year.wholeYear")}</CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
          <CategoryDonut data={breakdown.map((b) => ({ ...b, value: b.spent }))} currency={currency} centerLabel={t("year.donutCenter", { year: String(year) })} />
          <CategoryBreakdown rows={breakdown} currency={currency} />
        </CardContent>
      </Card>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>{t("year.months")}</CardTitle>
          <CardDescription>{t("year.monthsHint")}</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("nav.month")}</TableHead>
              <TableHead className="text-right">{t("common.income")}</TableHead>
              <TableHead className="text-right">{t("common.expenses")}</TableHead>
              <TableHead className="text-right">{t("common.balance")}</TableHead>
              <TableHead className="pr-4 text-right">{t("common.sinceStart")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((m) => {
              const empty = !m.income && !m.expenses;
              return (
                <TableRow key={m.key} className={cn(empty && "text-muted-foreground")}>
                  <TableCell className="pl-4 font-medium">
                    <Link href={`/m/${m.key}`} className="hover:underline">
                      {monthName(m.month, "long", t.locale)}
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
              <TableCell className="pl-4">{t("common.total")}</TableCell>
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
            <CardTitle>{t("year.categoriesByMonth")}</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-card pl-4">{t("common.category")}</TableHead>
                {months.map((m) => (
                  <TableHead key={m.key} className="text-right">
                    {monthName(m.month, "short", t.locale)}
                  </TableHead>
                ))}
                <TableHead className="pr-4 text-right">{t("common.total")}</TableHead>
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
