import type { MessageKey } from "@/lib/i18n";

// Generic starter set for new accounts (seeded in English by server/seed.ts); plans start at 0
// so each user sets their own. First-run setup shows them, and saves them, in the picked language.
export const DEFAULT_CATEGORIES = [
  { name: "Groceries", key: "seed.groceries", color: "aqua", excludeFromLiving: false },
  { name: "Housing & bills", key: "seed.housing", color: "gray", excludeFromLiving: false },
  { name: "Transport", key: "seed.transport", color: "blue", excludeFromLiving: false },
  { name: "Eating out", key: "seed.eatingOut", color: "orange", excludeFromLiving: false },
  { name: "Shopping", key: "seed.shopping", color: "magenta", excludeFromLiving: false },
  { name: "Health", key: "seed.health", color: "red", excludeFromLiving: false },
  { name: "Entertainment", key: "seed.entertainment", color: "violet", excludeFromLiving: false },
  { name: "Savings", key: "seed.savings", color: "green", excludeFromLiving: true },
  { name: "Other", key: "seed.other", color: "yellow", excludeFromLiving: false },
] as const satisfies readonly { name: string; key: MessageKey; color: string; excludeFromLiving: boolean }[];

/** Message key of a default category name, so setup can show it translated. */
export function defaultCategoryKey(name: string): MessageKey | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.name === name)?.key;
}
