"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useVisualViewport } from "@/hooks/use-visual-viewport";

/** Centered dialog on desktop, bottom sheet on phones. */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const isDesktop = useIsDesktop();
  // iOS overlays the keyboard and pans the page instead of resizing it, so keep
  // the sheet inside the visible area above the keyboard ourselves.
  const viewport = useVisualViewport(open && !isDesktop);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Once the keyboard settles, bring the focused field back into view.
  useEffect(() => {
    const focused = document.activeElement;
    if (viewport?.bottom && focused instanceof HTMLElement && bodyRef.current?.contains(focused)) {
      focused.scrollIntoView({ block: "nearest" });
    }
  }, [viewport?.bottom]);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className={description ? undefined : "sr-only"}>{description ?? title}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent
        className="max-h-[92dvh]"
        style={viewport ? { bottom: viewport.bottom, maxHeight: viewport.height * 0.92 } : undefined}
      >
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className={description ? undefined : "sr-only"}>{description ?? title}</DrawerDescription>
        </DrawerHeader>
        <div
          ref={bodyRef}
          className="min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
