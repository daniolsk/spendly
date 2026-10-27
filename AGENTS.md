<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Spendly — notes for AI agents

Personal spend tracker (single owner, Google sign-in allowlist). **It is in daily use with real financial data in the production database.** Treat every change that touches data as if it could lose someone's money history — because it can.

## ⚠️ Data safety (read before any schema, migration, or data-writing change)

The production Neon Postgres DB holds real transactions, categories, plans and the opening balance. Nothing may be lost or silently altered.

- **Never** run `drizzle-kit push`, `DROP`, `TRUNCATE`, or ad-hoc `DELETE`/`UPDATE` against the real DB. Never reset, recreate, or re-seed it.
- Schema changes go only through **generated, committed migrations**: edit `src/db/schema.ts` → `npm run db:generate` → **read the generated SQL** → commit → `npm run db:migrate`. Never edit a migration that is already in `drizzle/` (they are applied in prod); add a new one instead.
- Migrations must be **additive and backward-compatible**:
  - New columns are nullable or have a `DEFAULT`; never add `NOT NULL` without a default/backfill.
  - Renames: drizzle-kit may emit `DROP COLUMN` + `ADD COLUMN` (data loss). Rewrite as `ALTER TABLE … RENAME COLUMN`, or add new → backfill → drop old in a *later* migration.
  - Type changes must convert existing values (`USING …`) and be checked for lossy casts (e.g. money is `integer` grosze — never move it to float).
  - Enum values: only add, never remove/rename values that may exist in rows.
  - Existing rows need a hand-written backfill in the same migration when the new column's meaning depends on old data (see `drizzle/0001_income_rate.sql` for the pattern).
- Don't change `onDelete` behaviour toward `cascade` on user data. `transaction.categoryId` is `restrict` on purpose; categories with transactions are archived, not deleted (`deleteCategory` in `src/server/actions.ts`).
- Don't change how stored values are *interpreted* (sign of `amount`, minor units, `rate`/`hours` semantics, month key format) without a migration that converts existing rows, so history keeps showing the same numbers.
- Before any destructive or bulk data step, tell the user and recommend a backup first (Neon branch / `pg_dump`). Prefer reversible steps.
- In the PR/commit description, state explicitly what a migration does to existing rows.
- Agents in cloud sessions normally have no DB access (no `.env.local`); don't try to obtain production credentials. Never commit `.env*` files.

## Stack

Next.js 16 (App Router, `cacheComponents`, `proxy.ts` instead of middleware) · React 19 · TypeScript · Tailwind v4 + shadcn/ui (`radix-ui`) · Better Auth (Google OAuth) · Drizzle ORM (`casing: "snake_case"`) on Neon serverless (`neon-http` driver — use `db.batch([...])`, not interactive transactions) · Zod 4 · Recharts · date-fns · sonner.

## Project structure

```
drizzle/                 SQL migrations + meta snapshots (applied in prod — append only)
src/
  proxy.ts               optimistic auth redirect to "/" (public: "/", "/privacy"); /login → "/", /m → current month, /y → current year
  app/
    page.tsx             public landing page: Google sign-in when signed out, "Open dashboard" when signed in
    privacy/             public privacy policy (linked from the landing page and Google's OAuth consent screen; keep it accurate when data handling changes)
    (app)/layout.tsx     authenticated shell (nav, user menu, inactivity lock)
    (app)/m/[month]      month view (YYYY-MM): transactions, income, stats, plan
    (app)/y/[year]       year statistics / charts
    (app)/settings       categories, opening balance, account
    api/auth/[...all]    Better Auth handler
  db/schema.ts           Drizzle schema: Better Auth tables + user_settings, category, transaction, month_plan
  db/index.ts            db client (DATABASE_URL_POOLED ?? DATABASE_URL)
  server/
    dal.ts               requireUser() — auth check used by every page and action
    queries.ts           read model; every query scoped by userId
    actions.ts           server actions: Zod-validated, re-authenticated, ownership-checked
    seed.ts              default categories for a newly created user
  lib/
    auth.ts              Better Auth config + ALLOWED_EMAILS allowlist (checked on user and session create)
    money.ts             format/parse integer grosze
    month.ts             YYYY-MM / YYYY-MM-DD helpers, zonedToday() (APP_TIMEZONE, default Europe/Warsaw)
    app-lock.ts          client-side inactivity lock (privacy only, not security)
    colors.ts            category color keys
  components/            feature UI (transactions, month, stats, charts, settings, shell); shadcn in components/ui
```

## Domain rules

- Money is **integer minor units (grosze)**; never do money math with floats. Format with `formatMoney`, parse with `parseMoney`.
- `transaction.type` is `expense` | `income`. Income amount > 0. Expense amount > 0, or **< 0 for a refund** (reduces that category's spend).
- Expenses require a category; income doesn't (its description is the income source).
- Hourly income: `rate` (grosze/hour) + `hours` (numeric 7,2), `amount = round(hours × rate)`. Flat income has `rate = null`.
- Plans: `category.defaultPlan` applies to every month unless `month_plan` overrides it for that month.
- "Cost of living" excludes categories with `excludeFromLiving`.
- "Balance since start" = `user_settings.openingBalance` + all income − all expenses up to the end of that month.
- Archived categories are hidden from pickers but keep their history.

## Code conventions

- Every page and server action calls `requireUser()`; every query/mutation filters by `userId`; actions verify ownership of referenced ids (`assertOwnCategory`).
- Actions return `ActionResult` (`{ ok } | { ok: false, error }`), use `fail()` for errors and `refresh()` after writes.
- Match surrounding style: short comments only where intent isn't obvious, UI text in English, default category names in Polish.

## Checks

No test suite yet. Before committing run `npm run lint` and `npm run typecheck` (and `npm run build` for larger changes; it needs env vars).

## Workflow

- After pushing work, always open a pull request and give the user its link.
- When the change touches app code (anything that affects the running app, not just docs), also give the link to the Vercel preview deployment for that PR.
