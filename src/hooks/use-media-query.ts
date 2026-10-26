"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverFallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");

const noopSubscribe = () => () => {};

/** False during SSR/hydration, true afterwards. For client-only values like the theme. */
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
