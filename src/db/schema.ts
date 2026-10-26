import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp().notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index().on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    password: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [index().on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const transactionType = pgEnum("transaction_type", ["expense", "income"]);

export const userSettings = pgTable("user_settings", {
  userId: text()
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currency: text().notNull().default("PLN"),
  /** Balance carried over from before the first tracked month, in minor units. */
  openingBalance: integer().notNull().default(0),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const category = pgTable(
  "category",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text().notNull(),
    color: text().notNull(),
    /** Excluded from the "cost of living" figure (e.g. savings, one-offs). */
    excludeFromLiving: boolean().notNull().default(false),
    /** Planned monthly spend used when a month has no explicit plan, minor units. */
    defaultPlan: integer().notNull().default(0),
    sortOrder: integer().notNull().default(0),
    archived: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [index().on(t.userId)],
);

export const transaction = pgTable(
  "transaction",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: transactionType().notNull(),
    date: date({ mode: "string" }).notNull(),
    description: text().notNull().default(""),
    /** Required for expenses, optional for income. */
    categoryId: uuid().references(() => category.id, { onDelete: "restrict" }),
    /** Always positive, minor units (grosze). Sign comes from `type`. */
    amount: integer().notNull(),
    /** Hours worked, for income entries. */
    hours: numeric({ precision: 7, scale: 2 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [index().on(t.userId, t.date), index().on(t.categoryId)],
);

/** Per-month override of a category's planned spend. */
export const monthPlan = pgTable(
  "month_plan",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    /** YYYY-MM */
    month: text().notNull(),
    amount: integer().notNull(),
  },
  (t) => [uniqueIndex().on(t.userId, t.categoryId, t.month)],
);

export type Category = typeof category.$inferSelect;
export type Transaction = typeof transaction.$inferSelect;
