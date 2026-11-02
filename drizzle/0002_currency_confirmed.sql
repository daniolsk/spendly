ALTER TABLE "user_settings" ADD COLUMN "currency_confirmed_at" timestamp;--> statement-breakpoint
-- Backfill: every existing account keeps PLN and skips the first-run currency picker.
-- Users who never saved settings get the same row getSettings() already assumed (PLN, opening balance 0).
INSERT INTO "user_settings" ("user_id") SELECT "id" FROM "user" ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint
UPDATE "user_settings" SET "currency_confirmed_at" = now() WHERE "currency_confirmed_at" IS NULL;
