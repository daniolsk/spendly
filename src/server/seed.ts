import "server-only";
import { db } from "@/db";
import { category, userSettings } from "@/db/schema";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

export async function seedDefaultsForUser(userId: string) {
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  await db.insert(category).values(
    DEFAULT_CATEGORIES.map(({ name, color, excludeFromLiving }, i) => ({
      name,
      color,
      excludeFromLiving,
      defaultPlan: 0,
      userId,
      sortOrder: i,
    })),
  );
}
