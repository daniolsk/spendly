"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAppLocked } from "@/lib/app-lock";

/**
 * Opened as a home-screen app (and signed in): skip the landing page and go to the
 * dashboard. Covers installs whose start URL is still "/" (iOS keeps the one from
 * when it was added). Not while the inactivity lock is on, so the lock still shows here.
 */
export function StandaloneRedirect() {
  const router = useRouter();
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone && !isAppLocked()) router.replace("/m");
  }, [router]);
  return null;
}
