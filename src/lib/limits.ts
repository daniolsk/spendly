// Per-user caps that stop a single account from flooding the database.
// They sit far above real use (a busy month is ~200 transactions), so normal
// users never reach them. Shown on the settings page.

export const LIMITS = {
  /** Transactions dated in any single month. */
  transactionsPerMonth: 1_000,
  /** Transactions created in a rolling 24-hour window. */
  transactionsPerDay: 500,
  /** All transactions of one user. */
  transactionsTotal: 50_000,
  /** Categories, archived ones included. */
  categories: 100,
  /** Months with a custom plan (overriding the categories' default plans). */
  planMonths: 600,
} as const;

export type Usage = {
  transactionsThisMonth: number;
  transactionsToday: number;
  transactionsTotal: number;
  categories: number;
  planMonths: number;
};
