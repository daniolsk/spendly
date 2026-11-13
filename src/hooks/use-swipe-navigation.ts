"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const MIN_DISTANCE = 70; // px of horizontal travel
const MAX_DURATION = 800; // ms; slower drags are scrolling or reading, not a swipe
const EDGE = 24; // px; leave the screen edges to the browser's back/forward gesture

/** Where a swipe must not navigate: dialogs/sheets, form controls, charts and anything that scrolls sideways. */
function blocksSwipe(target: EventTarget | null) {
  if (!(target instanceof Element)) return true;
  if (target.closest('[role="dialog"], [data-vaul-drawer], input, textarea, select, [contenteditable], .recharts-wrapper, [data-no-swipe]')) {
    return true;
  }
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth) {
      const { overflowX } = getComputedStyle(el);
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
  }
  return false;
}

/** Swipe left → `next`, swipe right → `prev` on touch screens. */
export function useSwipeNavigation(prev: string, next: string) {
  const router = useRouter();
  const hrefs = useRef({ prev, next });
  useEffect(() => {
    hrefs.current = { prev, next };
  }, [prev, next]);

  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;

    function onStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (
        e.touches.length !== 1 ||
        touch.clientX < EDGE ||
        touch.clientX > window.innerWidth - EDGE ||
        blocksSwipe(e.target) ||
        document.querySelector('[role="dialog"]')
      ) {
        start = null;
        return;
      }
      start = { x: touch.clientX, y: touch.clientY, t: e.timeStamp };
    }

    function onEnd(e: TouchEvent) {
      if (!start) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const quick = e.timeStamp - start.t < MAX_DURATION;
      start = null;
      if (!quick || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return;
      // Don't hijack a text selection.
      if (window.getSelection()?.toString()) return;
      router.push(dx < 0 ? hrefs.current.next : hrefs.current.prev);
    }

    function onCancel() {
      start = null;
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, [router]);
}
