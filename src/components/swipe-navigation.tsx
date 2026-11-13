"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { cn } from "cn";
import { useMounted } from "@/hooks/use-media-query";
import { SWIPE_DISTANCE, useSwipeNavigation } from "@/hooks/use-swipe-navigation";

/**
 * Swipe left/right on touch screens to go to the next/previous period. While dragging, a pill naming
 * the destination slides in from that side and fills in once letting go would navigate; it stays,
 * with a spinner, until the new page has loaded.
 */
export function SwipeNavigation({
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
  const { dx, target, pending } = useSwipeNavigation(prev, next);
  const mounted = useMounted();
  // Finger moving right reveals "previous" on the left, and vice versa.
  const active = target ?? (dx > 0 ? "prev" : dx < 0 ? "next" : null);
  // Remember the last side so a cancelled swipe fades out where it was, label included.
  const [side, setSide] = useState<"prev" | "next">("next");
  if (active && active !== side) setSide(active);
  if (!mounted) return null;

  const progress = target ? 1 : Math.min(Math.abs(dx) / SWIPE_DISTANCE, 1);
  const armed = progress >= 1;
  const dragging = dx !== 0 && !target;

  return createPortal(
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed top-1/2 z-50 flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap shadow-lg",
        side === "next" ? "right-4" : "left-4",
        armed ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground",
        // Follow the finger without lag; ease only when snapping in/out.
        dragging ? "transition-colors duration-150" : "transition-[opacity,transform,background-color,color] duration-200",
        "motion-reduce:transition-none",
      )}
      style={{
        opacity: active ? 0.35 + progress * 0.65 : 0,
        transform: `translate(${(side === "next" ? 1 : -1) * (1 - progress) * 48}px, -50%) scale(${armed ? 1 : 0.92})`,
      }}
    >
      {side === "prev" ? pending ? <Loader2Icon className="size-4 animate-spin" /> : <ChevronLeftIcon className="size-4" /> : null}
      {side === "next" ? nextLabel : prevLabel}
      {side === "next" ? pending ? <Loader2Icon className="size-4 animate-spin" /> : <ChevronRightIcon className="size-4" /> : null}
    </div>,
    document.body,
  );
}
