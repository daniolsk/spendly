"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { cn } from "cn";
import { useMounted } from "@/hooks/use-media-query";
import { SWIPE_DISTANCE, useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { isMonthKey, monthLabel, shiftMonth } from "@/lib/month";

const HIDDEN_OFFSET = 56; // px the pill sits off its resting spot when hidden
const SETTLE = "cubic-bezier(0.22, 1, 0.36, 1)"; // ease-out (quint)

/**
 * Swipe between months on /m/… and years on /y/…. Lives in the app layout rather than the pages,
 * so the indicator survives the navigation and can slide out once the new page is in.
 */
export function PeriodSwipe() {
  const pathname = usePathname();
  // Keep the open month tab, like the arrows do.
  const tab = useSearchParams().get("tab");
  const [, kind, key] = pathname.split("/");

  if (kind === "m" && key && isMonthKey(key)) {
    const href = (k: string) => `/m/${k}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`;
    const before = shiftMonth(key, -1);
    const after = shiftMonth(key, 1);
    return <SwipeNavigation prev={href(before)} next={href(after)} prevLabel={monthLabel(before)} nextLabel={monthLabel(after)} />;
  }
  if (kind === "y" && key && /^\d{4}$/.test(key)) {
    const year = Number(key);
    return <SwipeNavigation prev={`/y/${year - 1}`} next={`/y/${year + 1}`} prevLabel={String(year - 1)} nextLabel={String(year + 1)} />;
  }
  return null;
}

/**
 * Swipe left/right on touch screens to go to the next/previous period. While dragging, a pill naming
 * the destination eases in from that side and fills in once letting go would navigate; it stays,
 * with a spinner, until the new page has loaded.
 */
function SwipeNavigation({
  prev,
  next,
  prevLabel,
  nextLabel,
}: {
  prev: string;
  next: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const pill = useRef<HTMLDivElement>(null);
  // Which side the pill is on; kept after release so it slides out where it was, label included.
  const [side, setSide] = useState<"prev" | "next">("next");
  const sideRef = useRef(side);
  // The destination's name, held after a swipe commits so it doesn't change to the next one while sliding out.
  const [frozenLabel, setFrozenLabel] = useState<string | null>(null);

  // Drag frames are written straight to the element, so following the finger never waits on React.
  const paint = useCallback((dx: number, animate: boolean) => {
    const el = pill.current;
    if (!el) return;
    const dir = sideRef.current === "next" ? 1 : -1;
    const distance = Math.abs(dx);
    const p = Math.min(distance / SWIPE_DISTANCE, 1);
    const eased = 1 - (1 - p) ** 3;
    // Past the threshold it keeps giving a little, like a rubber band, instead of stopping dead.
    const stretch = 14 * (1 - Math.exp(-Math.max(distance - SWIPE_DISTANCE, 0) / 60));
    const x = dir * ((1 - eased) * HIDDEN_OFFSET - stretch);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.style.transition =
      animate && !reduce
        ? `transform 380ms ${SETTLE}, opacity 260ms ${SETTLE}, background-color 150ms, color 150ms, border-color 150ms`
        : "background-color 150ms, color 150ms, border-color 150ms";
    el.style.transform = `translate3d(${x}px, -50%, 0) scale(${0.9 + 0.1 * eased})`;
    el.style.opacity = String(eased);
    el.dataset.armed = String(p >= 1);
  }, []);

  const onDrag = useCallback(
    (dx: number) => {
      if (dx !== 0) {
        setFrozenLabel(null);
        const s = dx > 0 ? "prev" : "next";
        if (s !== sideRef.current) {
          sideRef.current = s;
          setSide(s);
        }
      }
      paint(dx, dx === 0);
    },
    [paint],
  );
  const { target, pending } = useSwipeNavigation(prev, next, onDrag);
  const mounted = useMounted();
  if (target && frozenLabel === null) setFrozenLabel(target === "next" ? nextLabel : prevLabel);

  // Committed: settle fully in and hold while the page loads; slide out once it has.
  useEffect(() => {
    if (target) {
      sideRef.current = target;
      paint(target === "next" ? -SWIPE_DISTANCE : SWIPE_DISTANCE, true);
    } else {
      paint(0, true);
    }
  }, [target, paint]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={pill}
      aria-hidden
      data-armed="false"
      className={cn(
        "pointer-events-none fixed top-1/2 z-50 flex h-10 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium whitespace-nowrap text-foreground opacity-0 shadow-lg will-change-transform",
        "data-[armed=true]:border-primary data-[armed=true]:bg-primary data-[armed=true]:text-primary-foreground",
        side === "next" ? "right-4" : "left-4",
      )}
    >
      {side === "prev" ? pending ? <Loader2Icon className="size-4 animate-spin" /> : <ChevronLeftIcon className="size-4" /> : null}
      {frozenLabel ?? (side === "next" ? nextLabel : prevLabel)}
      {side === "next" ? pending ? <Loader2Icon className="size-4 animate-spin" /> : <ChevronRightIcon className="size-4" /> : null}
    </div>,
    document.body,
  );
}
