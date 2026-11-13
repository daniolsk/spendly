"use client";

import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";

/** Renders nothing; lets server pages opt into swipe-to-change-period on touch screens. */
export function SwipeNavigation({ prev, next }: { prev: string; next: string }) {
  useSwipeNavigation(prev, next);
  return null;
}
