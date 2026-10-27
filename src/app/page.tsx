import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, PiggyBankIcon, ReceiptTextIcon, TargetIcon, WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";
import { AppPreview } from "@/components/landing/app-preview";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { zonedToday } from "@/lib/month";
import { getSession } from "@/server/dal";
import { DashboardLink, OpenDashboardButton } from "./open-dashboard-button";

const HIGHLIGHTS = ["Monthly plans per category", "Refunds & hourly income", "Year at a glance"];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      {/* Soft brand glow + dot grid, faded out towards the bottom */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[56rem]">
        <div className="absolute inset-0 bg-[radial-gradient(56rem_28rem_at_50%_-8%,rgba(27,175,122,0.22),transparent_70%),radial-gradient(30rem_20rem_at_95%_30%,rgba(42,120,214,0.10),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1.2px)] bg-size-[22px_22px] mask-[linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-linear-135 from-[#1baf7a] to-[#0f7a55] text-white shadow-sm shadow-[#1baf7a]/30">
            <WalletIcon className="size-4" />
          </span>
          Spendly
        </Link>
        <Suspense fallback={<Skeleton className="h-9 w-28 rounded-lg" />}>
          <HeaderAction />
        </Suspense>
      </header>

      <main className="relative flex flex-1 flex-col items-center px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-[#1baf7a]" />
          Personal spend tracker
        </span>

        <h1 className="mt-6 max-w-4xl text-5xl leading-[0.95] font-semibold tracking-tighter text-balance sm:text-7xl lg:text-8xl">
          Every złoty.
          <span className="block bg-linear-135 from-[#1baf7a] to-[#0f7a55] bg-clip-text pb-2 text-transparent dark:from-[#3ddc9c] dark:to-[#1baf7a]">
            One clear month.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Log expenses in seconds on your phone, plan each category for the month, and see where the money went — month by
          month, year by year.
        </p>

        <div className="mt-9 flex w-full max-w-xs flex-col items-center gap-3">
          <Suspense fallback={<Skeleton className="h-12 w-full rounded-xl" />}>
            <PrimaryAction />
          </Suspense>
        </div>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {HIGHLIGHTS.map((h) => (
            <li key={h} className="flex items-center gap-1.5">
              <CheckIcon className="size-3.5 text-income" />
              {h}
            </li>
          ))}
        </ul>

        <div className="relative mt-16 w-full max-w-5xl sm:mt-20">
          <FloatingCard className="-top-8 -left-10 -rotate-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1baf7a]/15 text-[#1baf7a]">
              <ReceiptTextIcon className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground">Expense added</span>
              <span className="text-sm font-semibold">Biedronka · 86,40 zł</span>
            </span>
          </FloatingCard>
          <FloatingCard className="bottom-24 -right-10 rotate-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#2a78d6]/15 text-[#2a78d6]">
              <TargetIcon className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground">Codzienne wydatki</span>
              <span className="text-sm font-semibold">88 zł left this month</span>
            </span>
          </FloatingCard>
          <FloatingCard className="-bottom-6 left-1/4 -rotate-1">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#6250d6]/15 text-[#6250d6] dark:text-[#9085e9]">
              <PiggyBankIcon className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground">Since start</span>
              <span className="text-sm font-semibold">+24 155,79 zł</span>
            </span>
          </FloatingCard>

          <AppPreview />
          <p className="sr-only">Preview of the month view with sample data.</p>
        </div>
      </main>

      <footer className="relative pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <BuildInfo className="text-center" />
      </footer>
    </div>
  );
}

function FloatingCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className={`absolute z-10 hidden items-center gap-3 rounded-xl border bg-background/90 px-3.5 py-2.5 text-left shadow-xl shadow-black/10 backdrop-blur lg:flex dark:shadow-black/40 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

async function HeaderAction() {
  const session = await getSession();
  return (
    <Button asChild variant="outline" size="sm" className="h-9 rounded-lg bg-background/70 px-3.5 backdrop-blur">
      {session ? <DashboardLink>Dashboard</DashboardLink> : <Link href="/login">Sign in</Link>}
    </Button>
  );
}

/** Signed in: open the dashboard (and clear the inactivity lock). Signed out: go to sign-in. */
async function PrimaryAction() {
  const session = await getSession();
  if (!session) {
    return (
      <Button asChild size="lg" className="group h-12 w-full gap-2 rounded-xl text-base shadow-sm">
        <Link href="/login">
          Sign in to continue
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>
    );
  }

  const firstName = session.user.name.split(/\s+/)[0];
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(zonedToday());
  return (
    <>
      <OpenDashboardButton />
      <p className="text-sm text-muted-foreground">
        Welcome back{firstName ? `, ${firstName}` : ""} · {today}
      </p>
    </>
  );
}
