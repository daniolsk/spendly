import { Suspense } from "react";
import Link from "next/link";
import { CheckIcon, WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";
import { GoogleLogo, GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { AppPreview } from "@/components/landing/app-preview";
import { PreviewLoop } from "@/components/landing/preview-loop";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { zonedToday } from "@/lib/month";
import { getSession } from "@/server/dal";
import { DashboardLink, OpenDashboardButton } from "./open-dashboard-button";

const HIGHLIGHTS = ["Monthly plans per category", "Refunds & hourly income", "Year at a glance"];

export default function LandingPage({ searchParams }: PageProps<"/">) {
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
            <PrimaryAction searchParams={searchParams} />
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

        <div className="relative mt-16 w-full max-w-5xl sm:mt-20 md:max-w-[70rem]">
          {/* Phones get the static preview; the animated walkthrough needs desktop width to stay legible. */}
          <AppPreview className="md:hidden" />
          <div className="hidden md:block">
            <PreviewLoop />
          </div>
          <p className="sr-only">Preview of Spendly with sample data: adding an expense, the month view and the year view.</p>
        </div>
      </main>

      <footer className="relative flex flex-col items-center gap-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <Link href="/privacy" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
        <BuildInfo className="text-center" />
      </footer>
    </div>
  );
}

async function HeaderAction() {
  const session = await getSession();
  const className = "h-9 rounded-lg bg-background/70 px-3.5 backdrop-blur";
  if (!session) {
    return (
      <GoogleSignInButton variant="outline" size="sm" className={className}>
        Sign in
      </GoogleSignInButton>
    );
  }
  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <DashboardLink>Dashboard</DashboardLink>
    </Button>
  );
}

/** Signed in: open the dashboard (and clear the inactivity lock). Signed out: Google sign-in. */
async function PrimaryAction({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const [session, query] = await Promise.all([getSession(), searchParams]);
  if (!session) {
    const error = typeof query.error === "string" ? query.error.toLowerCase() : null;
    return (
      <>
        <GoogleSignInButton size="lg" className="h-12 w-full gap-3 rounded-xl text-base shadow-sm">
          <GoogleLogo className="size-5" />
          Continue with Google
        </GoogleSignInButton>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error.includes("forbidden") || error.includes("not_allowed") || error === "access_denied"
              ? "This Google account is not allowed to use this app."
              : "Sign-in failed. Please try again."}
          </p>
        ) : null}
      </>
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
