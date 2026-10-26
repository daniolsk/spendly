import "server-only";
import { db } from "@/db";
import { category, userSettings } from "@/db/schema";

const DEFAULT_CATEGORIES = [
  { name: "Codzienne wydatki", color: "aqua", defaultPlan: 40000, excludeFromLiving: false },
  { name: "Inne", color: "orange", defaultPlan: 200000, excludeFromLiving: true },
  { name: "Konto wspólne", color: "violet", defaultPlan: 150000, excludeFromLiving: false },
  { name: "Koszty stałe", color: "gray", defaultPlan: 161299, excludeFromLiving: false },
  { name: "Samochód", color: "blue", defaultPlan: 41500, excludeFromLiving: false },
  { name: "Oszczędności", color: "red", defaultPlan: 50000, excludeFromLiving: true },
];

export async function seedDefaultsForUser(userId: string) {
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  await db.insert(category).values(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, userId, sortOrder: i })));
}
