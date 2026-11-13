-- Additive: every existing account gets "en", the only UI language before this migration.
ALTER TABLE "user_settings" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;