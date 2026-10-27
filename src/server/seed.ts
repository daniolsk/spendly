import "server-only";
import { db } from "@/db";
import { category, userSettings } from "@/db/schema";

// Generic starter set for new accounts; plans start at 0 so each user sets their own.
const DEFAULT_CATEGORIES = [
  { name: "Groceries", color: "aqua", excludeFromLiving: false },
  { name: "Housing & bills", color: "gray", excludeFromLiving: false },
  { name: "Transport", color: "blue", excludeFromLiving: false },
  { name: "Eating out", color: "orange", excludeFromLiving: false },
  { name: "Shopping", color: "magenta", excludeFromLiving: false },
  { name: "Health", color: "red", excludeFromLiving: false },
  { name: "Entertainment", color: "violet", excludeFromLiving: false },
  { name: "Savings", color: "green", excludeFromLiving: true },
  { name: "Other", color: "yellow", excludeFromLiving: false },
];

export async function seedDefaultsForUser(userId: string) {
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  await db.insert(category).values(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, defaultPlan: 0, userId, sortOrder: i })));
}
