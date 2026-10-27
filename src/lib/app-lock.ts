// Client-side privacy lock: after inactivity the dashboard is hidden behind the
// landing page until "Open dashboard" is clicked again. Not a security boundary,
// the session itself stays valid.

/** Idle time (while the page is visible) before locking. */
export const IDLE_LIMIT_MS = 10 * 60 * 1000;
/** Time in the background (screen locked, app switched) before locking. */
export const HIDDEN_LIMIT_MS = 15 * 1000;

const KEY = "spendly:locked";

export function lockApp() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export function unlockApp() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

export function isAppLocked() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
