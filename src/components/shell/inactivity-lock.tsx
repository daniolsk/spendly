"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HIDDEN_LIMIT_MS, IDLE_LIMIT_MS, isAppLocked, lockApp } from "@/lib/app-lock";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/** Sends the user back to the landing page after inactivity or a screen lock. */
export function InactivityLock() {
  const router = useRouter();

  useEffect(() => {
    // Covers back/forward into the dashboard after a lock. Activity also re-runs
    // this effect when a preserved route is shown again, so all timing starts fresh here.
    if (isAppLocked()) {
      router.replace("/");
      return;
    }

    let lastActive = Date.now();
    let hiddenAt: number | null = null;

    function lock() {
      lockApp();
      router.replace("/");
    }
    function markActive() {
      lastActive = Date.now();
    }
    function onVisibilityChange() {
      const now = Date.now();
      if (document.visibilityState === "hidden") {
        hiddenAt = now;
        return;
      }
      // Timers are frozen while the phone is locked, so check elapsed time on return.
      if ((hiddenAt !== null && now - hiddenAt > HIDDEN_LIMIT_MS) || now - lastActive > IDLE_LIMIT_MS) {
        lock();
        return;
      }
      hiddenAt = null;
      lastActive = now;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastActive > IDLE_LIMIT_MS) lock();
    }, 15_000);
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, markActive, { passive: true, capture: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, markActive, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
