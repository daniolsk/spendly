import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, PiggyBankIcon, ScaleIcon } from "lucide-react";
import { Money } from "@/components/money";
import { DesktopAddButtons, MobileAddButton } from "@/components/month/month-actions";
import { MonthSwitcher } from "@/components/month/month-switcher";
import { MonthTabs } from "@/components/month/month-tabs";
import { StatTile } from "@/components/stat-tile";
import { MonthStats } from "@/components/stats/month-stats";
import { IncomeList } from "@/components/transactions/income-list";
import { TransactionEditorProvider } from "@/components/transactions/transaction-editor";
import { TransactionList } from "@/components/transactions/transaction-list";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";
import { isMonthKey, monthLabel } from "@/lib/month";
import { requireUser } from "@/server/dal";
import { getMonthData } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/m/[month]">): Promise<Metadata> {
  const { month } = await params;
  return { title: isMonthKey(month) ? monthLabel(month) : "Month" };
}

export default function MonthPage(props: PageProps<"/m/[month]">) {
  return (
    <Suspense fallback={<MonthSkeleton />}>
      <MonthContent {...props} />
    </Suspense>
  );
}

async function MonthContent({ params, searchParams }: PageProps<"/m/[month]">) {
  const [{ month }, query] = await Promise.all([params, searchParams]);
  if (!isMonthKey(month)) notFound();

  const user = await requireUser();
  const data = await getMonthData(user.id, month);
  const { stats, settings } = data;
  const currency = settings.currency;
  const tab = typeof query.tab === "string" ? query.tab : undefined;

  return (
    <TransactionEditorProvider month={month} categories={data.allCategories} currency={currency}>
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between gap-2">
          <div className="-ml-2">
            <MonthSwitcher month={month} />
          </div>
          <DesktopAddButtons />
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            icon={<ArrowDownLeftIcon className="size-3.5" />}
            label="Income"
            value={<span className="text-income">{formatMoney(stats.income, { currency })}</span>}
          />
          <StatTile
            icon={<ArrowUpRightIcon className="size-3.5" />}
            label="Expenses"
            value={formatMoney(stats.expenses, { currency })}
            hint={stats.plannedTotal ? `of ${formatMoney(stats.plannedTotal, { currency })} planned` : undefined}
          />
          <StatTile
            icon={<ScaleIcon className="size-3.5" />}
            label="Balance"
            value={<Money value={stats.balance} currency={currency} />}
          />
          <StatTile
            icon={<PiggyBankIcon className="size-3.5" />}
            label="Since start"
            value={<Money value={stats.cumulativeBalance} currency={currency} />}
          />
        </div>

        <MonthTabs
          initialTab={tab}
          transactions={
            <TransactionList transactions={data.transactions} categories={data.allCategories} currency={currency} />
          }
          income={<IncomeList transactions={data.transactions} currency={currency} />}
          stats={<MonthStats month={month} data={data} />}
        />
      </div>
      <MobileAddButton />
    </TransactionEditorProvider>
  );
}

function MonthSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
