/**
 * Set only inside the iOS home-screen app, which has its own cookie jar separate from
 * Safari, so proxy.ts can open it straight on the dashboard instead of the landing page.
 */
export const STANDALONE_COOKIE = "spendly-standalone";
