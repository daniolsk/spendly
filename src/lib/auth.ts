import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDefaultsForUser } from "@/server/seed";

// Vercel previews get their own URLs, which Google doesn't know. Sign-in there
// is relayed through production (the only callback registered with Google) by
// the OAuth proxy plugin, then the session is created on the preview itself.
const isPreview = process.env.VERCEL_ENV === "preview";
const previewOrigins = isPreview
  ? [process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL].filter(Boolean).map((host) => `https://${host}`)
  : [];
// Production itself keeps using BETTER_AUTH_URL, so its own sign-in is never proxied.
const productionURL =
  isPreview && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  baseURL: previewOrigins[0] ?? process.env.BETTER_AUTH_URL,
  trustedOrigins: previewOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  databaseHooks: {
    user: {
      create: {
        // Any Google account can sign up; each new user starts with the default categories.
        after: async (user) => {
          await seedDefaultsForUser(user.id);
        },
      },
    },
  },
  plugins: [oAuthProxy({ productionURL }), nextCookies()],
});
