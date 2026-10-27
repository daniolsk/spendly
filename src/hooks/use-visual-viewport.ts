"use client";

import { useEffect, useState } from "react";

type Inset = { bottom: number; height: number } | null;

/**
 * The visible area of the page while `active`: its height and how far its
 * bottom edge sits above the layout viewport's bottom (on iOS: the keyboard,
 * plus any amount Safari panned the page). Null when inactive or unsupported.
 */
export function useVisualViewport(active: boolean): Inset {
  const [inset, setInset] = useState<Inset>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => {
      const bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset((prev) => (prev?.bottom === bottom && prev.height === vv.height ? prev : { bottom, height: vv.height }));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setInset(null);
    };
  }, [active]);

  return inset;
}
