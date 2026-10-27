"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unlockApp } from "@/lib/app-lock";

/** Link into the app that also clears the inactivity lock. */
export function DashboardLink(props: Omit<ComponentProps<typeof Link>, "href" | "onClick">) {
  return <Link href="/m" onClick={unlockApp} {...props} />;
}

export function OpenDashboardButton() {
  return (
    <Button asChild size="lg" className="group h-12 w-full gap-2 rounded-xl text-base shadow-sm">
      <DashboardLink>
        Open dashboard
        <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
      </DashboardLink>
    </Button>
  );
}
