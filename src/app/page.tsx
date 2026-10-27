import { Suspense } from "react";
import { WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";
import { Skeleton } from "@/components/ui/skeleton";
import { zonedToday } from "@/lib/month";
import { requireUser } from "@/server/dal";
import { OpenDashboardButton } from "./open-dashboard-button";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgba(27,175,122,0.18),transparent),radial-gradient(40rem_25rem_at_100%_110%,rgba(15,122,85,0.12),transparent)]"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-linear-135 from-[#1baf7a] to-[#0f7a55] text-white shadow-lg shadow-[#1baf7a]/25">
            <WalletIcon className="size-8" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-semibold tracking-tight">Spendly</h1>
            <Suspense fallback={<Skeleton className="mx-auto h-5 w-48" />}>
              <Greeting />
            </Suspense>
          </div>
        </div>
        <OpenDashboardButton />
      </div>
      <BuildInfo className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] text-center" />
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0];
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(zonedToday());

  return (
    <p className="text-sm text-muted-foreground">
      Welcome back{firstName ? `, ${firstName}` : ""} · {today}
    </p>
  );
}
