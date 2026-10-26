"use server";

import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { category, monthPlan, transaction, userSettings } from "@/db/schema";
import { CATEGORY_COLOR_KEYS } from "@/lib/colors";
import { requireUser } from "./dal";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_AMOUNT = 100_000_000_00; // 100M in minor units
const amount = z.number().int().positive().max(MAX_AMOUNT);
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

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

const transactionInput = z
  .object({
    id: z.uuid().optional(),
    type: z.enum(["expense", "income"]),
    date: dateKey,
    description: z.string().trim().max(200),
    categoryId: z.uuid().nullable(),
    amount,
    hours: z.number().min(0).max(1000).nullable(),
  })
  .refine((t) => t.type === "income" || t.categoryId, { message: "Pick a category", path: ["categoryId"] })
  .refine((t) => t.type === "expense" || t.description.length > 0, {
    message: "Enter the income source",
    path: ["description"],
  });

export type TransactionInput = z.input<typeof transactionInput>;

export async function saveTransaction(input: TransactionInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = transactionInput.parse(input);
    if (data.categoryId) await assertOwnCategory(user.id, data.categoryId);

    const values = {
      type: data.type,
      date: data.date,
      description: data.description,
      categoryId: data.categoryId,
      amount: data.amount,
      hours: data.type === "income" && data.hours != null ? String(data.hours) : null,
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
      const [{ next }] = await db
        .select({ next: sql<number>`coalesce(max(${category.sortOrder}), -1) + 1`.mapWith(Number) })
        .from(category)
        .where(eq(category.userId, user.id));
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
