"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export const SWIPE_DISTANCE = 70; // px of horizontal travel that commits a swipe
const AXIS_LOCK = 10; // px before deciding whether the gesture is a swipe or a scroll
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

/**
 * Swipe left → `next`, swipe right → `prev` on touch screens.
 * `onDrag` gets the live horizontal drag (0 when released or cancelled) once per frame, outside React,
 * so the indicator can follow the finger without re-rendering. Returns the direction of a navigation
 * in flight and whether it is still loading.
 */
export function useSwipeNavigation(prev: string, next: string, onDrag: (dx: number) => void) {
  const router = useRouter();
  const [target, setTarget] = useState<"prev" | "next" | null>(null);
  const [pending, startTransition] = useTransition();
  const hrefs = useRef({ prev, next });
  const dragRef = useRef(onDrag);
  useEffect(() => {
    hrefs.current = { prev, next };
    dragRef.current = onDrag;
  }, [prev, next, onDrag]);

  useEffect(() => {
    // axis: null while undecided, "x" once it's a swipe, "y" once it's a scroll (ignored until the next touch).
    let start: { x: number; y: number; axis: "x" | "y" | null } | null = null;
    let lastDx = 0;
    let frame = 0;

    function emit(dx: number) {
      lastDx = dx;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => dragRef.current(dx));
    }

    function reset() {
      const wasDragging = start?.axis === "x";
      start = null;
      if (wasDragging) emit(0);
      lastDx = 0;
    }

    function onStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (
        e.touches.length !== 1 ||
        touch.clientX < EDGE ||
        touch.clientX > window.innerWidth - EDGE ||
        blocksSwipe(e.target) ||
        document.querySelector('[role="dialog"]')
      ) {
        reset();
        return;
      }
      start = { x: touch.clientX, y: touch.clientY, axis: null };
    }

    function onMove(e: TouchEvent) {
      if (!start || start.axis === "y") return;
      if (e.touches.length !== 1) return reset();
      const touch = e.touches[0];
      const moveX = touch.clientX - start.x;
      const moveY = touch.clientY - start.y;
      if (!start.axis) {
        if (Math.max(Math.abs(moveX), Math.abs(moveY)) < AXIS_LOCK) return;
        start.axis = Math.abs(moveX) > Math.abs(moveY) * 1.5 ? "x" : "y";
        if (start.axis === "y") return;
      }
      // Selecting text with a long press shouldn't turn into a swipe.
      if (window.getSelection()?.toString()) return reset();
      emit(moveX);
    }

    function onEnd() {
      const committed = start?.axis === "x" && Math.abs(lastDx) >= SWIPE_DISTANCE;
      const dir = lastDx < 0 ? "next" : "prev";
      if (!committed) return reset();
      cancelAnimationFrame(frame);
      start = null;
      lastDx = 0;
      setTarget(dir);
      startTransition(() => router.push(hrefs.current[dir]));
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", reset, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", reset);
      cancelAnimationFrame(frame);
    };
  }, [router]);

  return { target: pending ? target : null, pending };
}
