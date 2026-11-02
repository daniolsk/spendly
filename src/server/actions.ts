"use server";

import "server-only";
import { and, asc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { category, monthPlan, transaction, user as userTable, userSettings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { CATEGORY_COLOR_KEYS } from "@/lib/colors";
import { CURRENCY_CODES } from "@/lib/currency";
import { LIMITS } from "@/lib/limits";
import { monthRange } from "@/lib/month";
import { requireUser } from "./dal";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_AMOUNT = 100_000_000_00; // 100M in minor units
const plannedAmount = z.number().int().min(0).max(MAX_AMOUNT);
const monthKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const dateKey = z.iso.date();

function fail(error: unknown): ActionResult {
  unstable_rethrow(error); // let auth redirects through
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
  console.error(error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

async function assertOwnCategory(userId: string, categoryId: string) {
  const row = await db.query.category.findFirst({
    where: and(eq(category.id, categoryId), eq(category.userId, userId)),
    columns: { id: true },
  });
  if (!row) throw new z.ZodError([{ code: "custom", message: "Unknown category", path: ["categoryId"], input: categoryId }]);
}

const n = (v: number) => v.toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

/**
 * Checks the per-user transaction caps (see lib/limits.ts) before a write.
 * New transactions count against every cap; an edit only against the month it
 * moves into (`excludeId` keeps it from counting itself). Returns an error or null.
 */
async function checkTransactionLimits(userId: string, date: string, excludeId?: string) {
  const { start, end } = monthRange(date.slice(0, 7));
  const inMonth = and(gte(transaction.date, start), lte(transaction.date, end), excludeId ? ne(transaction.id, excludeId) : undefined);
  const [row] = await db
    .select({
      month: sql<number>`count(*) filter (where ${inMonth})`.mapWith(Number),
      day: sql<number>`count(*) filter (where ${transaction.createdAt} > now() - interval '24 hours')`.mapWith(Number),
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(transaction)
    .where(eq(transaction.userId, userId));

  if (row.month >= LIMITS.transactionsPerMonth)
    return `A month can have at most ${n(LIMITS.transactionsPerMonth)} transactions.`;
  if (excludeId) return null;
  if (row.day >= LIMITS.transactionsPerDay)
    return `You can add at most ${n(LIMITS.transactionsPerDay)} transactions in 24 hours. Try again later.`;
  if (row.total >= LIMITS.transactionsTotal)
    return `You've reached the limit of ${n(LIMITS.transactionsTotal)} transactions.`;
  return null;
}

const transactionInput = z
  .object({
    id: z.uuid().optional(),
    type: z.enum(["expense", "income"]),
    date: dateKey,
    description: z.string().trim().max(200),
    categoryId: z.uuid().nullable(),
    /** Ignored for hourly income, where it is computed as hours × rate. */
    amount: z.number().int().min(-MAX_AMOUNT).max(MAX_AMOUNT),
    hours: z.number().positive("Enter hours worked").max(1000).nullable(),
    /** Hourly rate in minor units; set only for hourly income. */
    rate: z.number().int().positive("Enter the hourly rate").max(MAX_AMOUNT).nullable(),
  })
  .refine((t) => t.type === "income" || t.categoryId, { message: "Pick a category", path: ["categoryId"] })
  .refine((t) => t.type === "expense" || t.description.length > 0, {
    message: "Enter the income source",
    path: ["description"],
  })
  .refine((t) => t.type === "income" || t.rate === null, { message: "Only income can be hourly", path: ["rate"] })
  .refine((t) => t.rate === null || t.hours !== null, { message: "Enter hours worked", path: ["hours"] })
  .transform((t) => {
    // Hours are stored with 2 decimals; compute the amount from that same value.
    const hours = t.hours === null ? null : Math.round(t.hours * 100) / 100;
    return t.rate !== null && hours !== null ? { ...t, hours, amount: Math.round(hours * t.rate) } : { ...t, hours };
  })
  .refine((t) => t.amount !== 0, { message: "Amount cannot be 0", path: ["amount"] })
  .refine((t) => t.amount <= MAX_AMOUNT, { message: "Amount is too large", path: ["amount"] })
  .refine((t) => t.type === "expense" || t.amount > 0, { message: "Income must be positive", path: ["amount"] });

export type TransactionInput = z.input<typeof transactionInput>;

export async function saveTransaction(input: TransactionInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = transactionInput.parse(input);
    if (data.categoryId) await assertOwnCategory(user.id, data.categoryId);
    const limitError = await checkTransactionLimits(user.id, data.date, data.id);
    if (limitError) return { ok: false, error: limitError };

    const values = {
      type: data.type,
      date: data.date,
      description: data.description,
      categoryId: data.categoryId,
      amount: data.amount,
      // Hours/rate only exist on hourly income; flat income and expenses clear them.
      hours: data.rate !== null && data.hours !== null ? String(data.hours) : null,
      rate: data.rate,
    };

    if (data.id) {
      const updated = await db
        .update(transaction)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(transaction.id, data.id), eq(transaction.userId, user.id)))
        .returning({ id: transaction.id });
      if (updated.length === 0) return { ok: false, error: "Transaction not found" };
    } else {
      await db.insert(transaction).values({ ...values, userId: user.id });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const txId = z.uuid().parse(id);
    await db.delete(transaction).where(and(eq(transaction.id, txId), eq(transaction.userId, user.id)));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categoryInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(50),
  color: z.enum(CATEGORY_COLOR_KEYS as [string, ...string[]]),
  excludeFromLiving: z.boolean(),
  defaultPlan: plannedAmount,
});

export type CategoryInput = z.input<typeof categoryInput>;

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { id, ...data } = categoryInput.parse(input);

    if (id) {
      const updated = await db
        .update(category)
        .set(data)
        .where(and(eq(category.id, id), eq(category.userId, user.id)))
        .returning({ id: category.id });
      if (updated.length === 0) return { ok: false, error: "Category not found" };
    } else {
      const [{ next, count }] = await db
        .select({
          next: sql<number>`coalesce(max(${category.sortOrder}), -1) + 1`.mapWith(Number),
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(category)
        .where(eq(category.userId, user.id));
      if (count >= LIMITS.categories)
        return { ok: false, error: `You can have at most ${n(LIMITS.categories)} categories, archived ones included.` };
      await db.insert(category).values({ ...data, userId: user.id, sortOrder: next });
    }
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setCategoryArchived(id: string, archived: boolean): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const categoryId = z.uuid().parse(id);
    await db
      .update(category)
      .set({ archived: z.boolean().parse(archived) })
      .where(and(eq(category.id, categoryId), eq(category.userId, user.id)));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Deletes a category only if no transactions use it; otherwise archive it. */
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const categoryId = z.uuid().parse(id);
    const used = await db.query.transaction.findFirst({
      where: and(eq(transaction.categoryId, categoryId), eq(transaction.userId, user.id)),
      columns: { id: true },
    });
    if (used) return { ok: false, error: "This category has transactions. Archive it instead." };
    await db.delete(category).where(and(eq(category.id, categoryId), eq(category.userId, user.id)));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const categoryId = z.uuid().parse(id);
    const dir = z.enum(["up", "down"]).parse(direction);

    const list = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.userId, user.id))
      .orderBy(asc(category.sortOrder), asc(category.createdAt));
    const index = list.findIndex((c) => c.id === categoryId);
    const target = dir === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= list.length) return { ok: true };

    [list[index], list[target]] = [list[target], list[index]];
    await db.batch(
      list.map((c, i) =>
        db
          .update(category)
          .set({ sortOrder: i })
          .where(and(eq(category.id, c.id), eq(category.userId, user.id))),
      ) as [never, ...never[]],
    );
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Monthly plan & settings
// ---------------------------------------------------------------------------

const planInput = z.object({
  month: monthKey,
  entries: z.array(z.object({ categoryId: z.uuid(), amount: plannedAmount })).max(100),
});

export async function saveMonthPlan(input: z.input<typeof planInput>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { month, entries } = planInput.parse(input);
    const owned = new Set(
      (await db.select({ id: category.id }).from(category).where(eq(category.userId, user.id))).map((c) => c.id),
    );
    const valid = entries.filter((e) => owned.has(e.categoryId));
    if (valid.length !== entries.length) return { ok: false, error: "Unknown category" };

    if (valid.length) {
      const [{ months, hasThis }] = await db
        .select({
          months: sql<number>`count(distinct ${monthPlan.month})`.mapWith(Number),
          hasThis: sql<boolean>`bool_or(${monthPlan.month} = ${month})`.mapWith(Boolean),
        })
        .from(monthPlan)
        .where(eq(monthPlan.userId, user.id));
      if (!hasThis && months >= LIMITS.planMonths)
        return { ok: false, error: `At most ${n(LIMITS.planMonths)} months can have a custom plan.` };
    }

    await db.batch([
      db.delete(monthPlan).where(and(eq(monthPlan.userId, user.id), eq(monthPlan.month, month))),
      ...(valid.length
        ? [db.insert(monthPlan).values(valid.map((e) => ({ ...e, month, userId: user.id })))]
        : []),
    ]);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function resetMonthPlan(month: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const m = monthKey.parse(month);
    await db.delete(monthPlan).where(and(eq(monthPlan.userId, user.id), eq(monthPlan.month, m)));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const settingsInput = z.object({
  openingBalance: z.number().int().min(-MAX_AMOUNT).max(MAX_AMOUNT),
});

export async function saveSettings(input: z.input<typeof settingsInput>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = settingsInput.parse(input);
    await db
      .insert(userSettings)
      .values({ userId: user.id, ...data })
      .onConflictDoUpdate({ target: userSettings.userId, set: { ...data, updatedAt: new Date() } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const currencyInput = z.enum(CURRENCY_CODES);

/** Sets the account currency. It only changes how amounts are labelled; stored amounts are not converted. */
export async function saveCurrency(input: z.input<typeof currencyInput>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const currency = currencyInput.parse(input);
    const now = new Date();
    await db
      .insert(userSettings)
      .values({ userId: user.id, currency, currencyConfirmedAt: now })
      .onConflictDoUpdate({ target: userSettings.userId, set: { currency, currencyConfirmedAt: now, updatedAt: now } });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const onboardingInput = z.object({
  currency: currencyInput,
  /** Existing categories to keep, in display order; the user's other active categories are removed. */
  keep: z.array(z.object({ id: z.uuid(), defaultPlan: plannedAmount })).max(LIMITS.categories),
  /** New categories created during setup. */
  add: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Name is required").max(50),
        color: z.enum(CATEGORY_COLOR_KEYS as [string, ...string[]]),
        defaultPlan: plannedAmount,
      }),
    )
    .max(30),
  /** null when the step was skipped (keeps the current value). */
  openingBalance: z.number().int().min(-MAX_AMOUNT).max(MAX_AMOUNT).nullable(),
});

/**
 * First-run setup (src/app/welcome): currency plus the optional categories, monthly plans and
 * opening balance, applied in one batch. Only allowed until the currency is confirmed, so it
 * can't be used later to wipe categories.
 */
export async function completeOnboarding(input: z.input<typeof onboardingInput>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { currency, keep, add, openingBalance } = onboardingInput.parse(input);
    if (keep.length + add.length === 0) return { ok: false, error: "Keep at least one category." };

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
      columns: { currencyConfirmedAt: true },
    });
    if (settings?.currencyConfirmedAt) return { ok: false, error: "Setup is already done. Use Settings instead." };

    const owned = await db
      .select({ id: category.id, archived: category.archived })
      .from(category)
      .where(eq(category.userId, user.id));
    const ownedIds = new Set(owned.map((c) => c.id));
    if (keep.some((k) => !ownedIds.has(k.id))) return { ok: false, error: "Unknown category" };
    if (owned.length + add.length > LIMITS.categories)
      return { ok: false, error: `You can have at most ${n(LIMITS.categories)} categories.` };

    // Removed categories are deleted, or archived if they already have transactions (see deleteCategory).
    const keepIds = new Set(keep.map((k) => k.id));
    const removeIds = owned.filter((c) => !c.archived && !keepIds.has(c.id)).map((c) => c.id);
    const usedIds = removeIds.length
      ? new Set(
          (
            await db
              .selectDistinct({ id: transaction.categoryId })
              .from(transaction)
              .where(and(eq(transaction.userId, user.id), inArray(transaction.categoryId, removeIds)))
          ).map((r) => r.id),
        )
      : new Set<string | null>();
    const archiveIds = removeIds.filter((id) => usedIds.has(id));
    const deleteIds = removeIds.filter((id) => !usedIds.has(id));

    const now = new Date();
    const settingsValues = { currency, currencyConfirmedAt: now, ...(openingBalance !== null && { openingBalance }) };
    const writes: BatchItem<"pg">[] = keep.map(({ id, defaultPlan }, i) =>
      db
        .update(category)
        .set({ defaultPlan, sortOrder: i })
        .where(and(eq(category.id, id), eq(category.userId, user.id))),
    );
    if (archiveIds.length)
      writes.push(
        db
          .update(category)
          .set({ archived: true })
          .where(and(eq(category.userId, user.id), inArray(category.id, archiveIds))),
      );
    if (deleteIds.length)
      writes.push(db.delete(category).where(and(eq(category.userId, user.id), inArray(category.id, deleteIds))));
    if (add.length)
      writes.push(db.insert(category).values(add.map((c, i) => ({ ...c, userId: user.id, sortOrder: keep.length + i }))));
    // Confirming the currency ends the first-run setup; it's in the same batch, so it's all or nothing.
    writes.push(
      db
        .insert(userSettings)
        .values({ userId: user.id, ...settingsValues })
        .onConflictDoUpdate({ target: userSettings.userId, set: { ...settingsValues, updatedAt: now } }),
    );
    await db.batch(writes as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/**
 * Permanently deletes the signed-in user and every row that belongs to them, then
 * clears the auth cookies. Signing in again with the same Google account starts a
 * brand-new user (default categories, first-run currency picker).
 * `confirmEmail` must match the account's email, so a stray click can't trigger it.
 * Any new per-user table must be deleted here too.
 */
export async function deleteAccount(confirmEmail: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (z.string().trim().toLowerCase().parse(confirmEmail) !== user.email.toLowerCase()) {
      return { ok: false, error: "The email doesn’t match your account." };
    }
    // Children first: transaction.categoryId is ON DELETE RESTRICT, so categories can only
    // go once their transactions are gone. Deleting the user cascades to session + account.
    // neon-http runs a batch as one transaction, so it's all or nothing.
    await db.batch([
      db.delete(transaction).where(eq(transaction.userId, user.id)),
      db.delete(monthPlan).where(eq(monthPlan.userId, user.id)),
      db.delete(category).where(eq(category.userId, user.id)),
      db.delete(userSettings).where(eq(userSettings.userId, user.id)),
      db.delete(userTable).where(eq(userTable.id, user.id)),
    ]);
    // The session row is gone, but the cached session cookie would keep the user
    // "signed in" for a few minutes, so drop every auth cookie now.
    const { authCookies } = await auth.$context;
    const store = await cookies();
    for (const { name, attributes } of Object.values(authCookies)) {
      store.set(name, "", { path: attributes.path, secure: attributes.secure, domain: attributes.domain, maxAge: 0 });
    }
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
