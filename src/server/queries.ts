import "server-only";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { category, monthPlan, transaction, userSettings, type Category } from "@/db/schema";
import { daysInMonth, monthRange } from "@/lib/month";

// Every function here takes the authenticated userId and scopes all queries by it.

export async function getSettings(userId: string) {
  const row = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, userId) });
  return row ?? { userId, currency: "PLN", openingBalance: 0, updatedAt: new Date() };
}

export async function getCategories(userId: string, { includeArchived = false } = {}) {
  return db
    .select()
    .from(category)
    .where(includeArchived ? eq(category.userId, userId) : and(eq(category.userId, userId), eq(category.archived, false)))
    .orderBy(asc(category.sortOrder), asc(category.createdAt));
}

export async function getMonthTransactions(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return db
    .select()
    .from(transaction)
    .where(and(eq(transaction.userId, userId), gte(transaction.date, start), lte(transaction.date, end)))
    .orderBy(desc(transaction.date), desc(transaction.createdAt));
}

async function getBalanceUpTo(userId: string, endDate: string) {
  const [row] = await db
    .select({
      net: sql<number>`coalesce(sum(case when ${transaction.type} = 'income' then ${transaction.amount} else -${transaction.amount} end), 0)`.mapWith(
        Number,
      ),
    })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), lte(transaction.date, endDate)));
  return row?.net ?? 0;
}

export type CategoryStat = {
  category: Pick<Category, "id" | "name" | "color" | "excludeFromLiving" | "archived">;
  spent: number;
  planned: number;
};

/** Most recent rate (or null for flat) per income source, to prefill the income form. */
async function getIncomeSources(userId: string) {
  const rows = await db
    .selectDistinctOn([transaction.description], { source: transaction.description, rate: transaction.rate })
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.type, "income")))
    .orderBy(transaction.description, desc(transaction.date), desc(transaction.createdAt));
  return rows.filter((r) => r.source);
}

export type IncomeSource = Awaited<ReturnType<typeof getIncomeSources>>[number];

export async function getMonthData(userId: string, month: string) {
  const { end } = monthRange(month);
  const [settings, categories, transactions, plans, balanceToDate, incomeSources] = await Promise.all([
    getSettings(userId),
    getCategories(userId, { includeArchived: true }),
    getMonthTransactions(userId, month),
    db
      .select()
      .from(monthPlan)
      .where(and(eq(monthPlan.userId, userId), eq(monthPlan.month, month))),
    getBalanceUpTo(userId, end),
    getIncomeSources(userId),
  ]);

  const planByCategory = new Map(plans.map((p) => [p.categoryId, p.amount]));
  const spentByCategory = new Map<string, number>();
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expenses += t.amount;
      if (t.categoryId) spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
    }
  }

  const categoryStats: CategoryStat[] = categories
    .filter((c) => !c.archived || spentByCategory.has(c.id))
    .map((c) => ({
      category: { id: c.id, name: c.name, color: c.color, excludeFromLiving: c.excludeFromLiving, archived: c.archived },
      spent: spentByCategory.get(c.id) ?? 0,
      planned: c.archived ? 0 : (planByCategory.get(c.id) ?? c.defaultPlan),
    }));

  const excluded = categoryStats.filter((s) => s.category.excludeFromLiving).reduce((a, s) => a + s.spent, 0);
  const plannedTotal = categoryStats.reduce((a, s) => a + s.planned, 0);
  const days = daysInMonth(month);

  return {
    settings,
    categories: categories.filter((c) => !c.archived),
    allCategories: categories,
    transactions,
    incomeSources,
    stats: {
      income,
      expenses,
      balance: income - expenses,
      cumulativeBalance: settings.openingBalance + balanceToDate,
      dailyIncome: Math.round(income / days),
      dailyExpenses: Math.round(expenses / days),
      livingCost: expenses - excluded,
      plannedTotal,
      predictedBalance: income - plannedTotal,
      byCategory: categoryStats,
      hasCustomPlan: plans.length > 0,
    },
  };
}

export type MonthData = Awaited<ReturnType<typeof getMonthData>>;

export async function getYearData(userId: string, year: number) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const monthExpr = sql<string>`to_char(${transaction.date}, 'YYYY-MM')`;

  const [settings, categories, rows, balanceBefore] = await Promise.all([
    getSettings(userId),
    getCategories(userId, { includeArchived: true }),
    db
      .select({
        month: monthExpr,
        type: transaction.type,
        categoryId: transaction.categoryId,
        total: sql<number>`sum(${transaction.amount})`.mapWith(Number),
      })
      .from(transaction)
      .where(and(eq(transaction.userId, userId), gte(transaction.date, start), lte(transaction.date, end)))
      .groupBy(monthExpr, transaction.type, transaction.categoryId),
    getBalanceUpTo(userId, `${year - 1}-12-31`),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return { key, month: i + 1, income: 0, expenses: 0, byCategory: {} as Record<string, number> };
  });

  const categoryTotals = new Map<string, number>();
  for (const r of rows) {
    const m = months[Number(r.month.slice(5, 7)) - 1];
    if (r.type === "income") {
      m.income += r.total;
    } else {
      m.expenses += r.total;
      if (r.categoryId) {
        m.byCategory[r.categoryId] = (m.byCategory[r.categoryId] ?? 0) + r.total;
        categoryTotals.set(r.categoryId, (categoryTotals.get(r.categoryId) ?? 0) + r.total);
      }
    }
  }

  let running = settings.openingBalance + balanceBefore;
  const monthsWithBalance = months.map((m) => {
    running += m.income - m.expenses;
    return { ...m, balance: m.income - m.expenses, cumulative: running };
  });

  const activeMonths = months.filter((m) => m.income > 0 || m.expenses > 0).length;
  const income = months.reduce((a, m) => a + m.income, 0);
  const expenses = months.reduce((a, m) => a + m.expenses, 0);
  const excluded = categories
    .filter((c) => c.excludeFromLiving)
    .reduce((a, c) => a + (categoryTotals.get(c.id) ?? 0), 0);

  return {
    settings,
    categories: categories.filter((c) => !c.archived || categoryTotals.has(c.id)),
    months: monthsWithBalance,
    categoryTotals: Object.fromEntries(categoryTotals),
    totals: {
      income,
      expenses,
      balance: income - expenses,
      livingCost: expenses - excluded,
      activeMonths,
      avgMonthlyIncome: activeMonths ? Math.round(income / activeMonths) : 0,
      avgMonthlyExpenses: activeMonths ? Math.round(expenses / activeMonths) : 0,
      endBalance: running,
    },
  };
}

export type YearData = Awaited<ReturnType<typeof getYearData>>;

export async function getTrackedYears(userId: string) {
  const rows = await db
    .selectDistinct({ year: sql<number>`extract(year from ${transaction.date})::int`.mapWith(Number) })
    .from(transaction)
    .where(eq(transaction.userId, userId));
  return rows.map((r) => r.year).sort((a, b) => b - a);
}
