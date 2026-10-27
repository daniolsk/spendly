"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unlockApp } from "@/lib/app-lock";

export function OpenDashboardButton() {
  return (
    <Button asChild size="lg" className="group h-12 w-full gap-2 rounded-xl text-base shadow-sm">
      <Link href="/m" onClick={unlockApp}>
        Open dashboard
        <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}
