ALTER TABLE "transaction" ADD COLUMN "rate" integer;--> statement-breakpoint
-- Backfill: income with hours becomes hourly when amount = hours × a whole-grosz rate.
UPDATE "transaction" SET "rate" = round("amount" / "hours")
WHERE "type" = 'income' AND "hours" > 0 AND round(round("amount" / "hours") * "hours") = "amount";
