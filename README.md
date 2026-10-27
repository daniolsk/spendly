# Spendly

Personal expense tracker: monthly expenses & income, custom categories, monthly plans, and month/year statistics.

**Stack:** Next.js 16 (App Router, Cache Components) · shadcn/ui · Tailwind v4 · Better Auth (Google) · Drizzle ORM · Neon Postgres · Recharts

## Setup

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill it in (see below).
3. `npm run db:migrate` to create the tables.
4. `npm run dev` and open http://localhost:3000

### Google OAuth

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) create an **OAuth client ID** (type *Web application*):

- Authorized JavaScript origins: `http://localhost:3000` (+ your production URL)
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (+ `https://<prod-domain>/api/auth/callback/google`)

Put the client ID/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### Access control

Only emails listed in `ALLOWED_EMAILS` (comma-separated) can sign in. It is checked when an account is created **and** on every new session, so removing an email revokes sign-in. An empty list means nobody can sign in.

## Project layout

```
src/
  app/
    (app)/m/[month]     month view: transactions, income, statistics (YYYY-MM)
    (app)/y/[year]      year statistics
    (app)/settings      categories, opening balance, account
    api/auth/[...all]   Better Auth handler
  db/schema.ts          Drizzle schema (auth + app tables)
  server/
    dal.ts              requireUser(): the auth check used by every page & action
    queries.ts          read model (all queries scoped by userId)
    actions.ts          server actions (Zod-validated, re-authenticated, ownership-checked)
    seed.ts             default categories for new users
  lib/                  money (integer grosze), month helpers, category colors
  components/           UI (shadcn in components/ui)
  proxy.ts              optimistic auth redirect to the landing page
```

## Conventions

- Money is stored as **integers in minor units** (grosze); amounts are always positive and the sign comes from `type` (`expense` / `income`).
- Planned spending: each category has a default monthly plan; a month can override it (`month_plan`).
- "Cost of living" excludes categories flagged *Exclude from cost of living* (e.g. Inne, Oszczędności).
- "Balance since start" = opening balance (Settings) + all income − all expenses up to the end of that month.

## Database

- Change `src/db/schema.ts`, then `npm run db:generate` and `npm run db:migrate`.
- `npm run db:studio` to browse data.
