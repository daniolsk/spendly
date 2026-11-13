import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";
import { InactivityLock } from "@/components/shell/inactivity-lock";
import { MobileTabBar, MobileTabBarSkeleton, NavSkeleton, SidebarNav } from "@/components/shell/nav";
import { UserMenu } from "@/components/shell/user-menu";
import { PeriodSwipe } from "@/components/swipe-navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { toLanguage } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import { requireUser } from "@/server/dal";
import { getSettings } from "@/server/queries";

// The whole shell waits for the user's settings: they hold the UI language, so the nav and
// page labels render in it from the first paint. New accounts pick it (and their currency)
// first, in src/app/welcome.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <Shell nav={<NavSkeleton />} user={<Skeleton className="h-12 w-full" />} tabBar={<MobileTabBarSkeleton />}>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </Shell>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  if (!settings.currencyConfirmedAt) redirect("/welcome");

  return (
    <I18nProvider language={toLanguage(settings.language)}>
      <Shell
        nav={<SidebarNav />}
        user={<UserMenu user={{ name: user.name, email: user.email, image: user.image }} />}
        tabBar={<MobileTabBar />}
      >
        {children}
      </Shell>
      <InactivityLock />
      <Suspense fallback={null}>
        <PeriodSwipe />
      </Suspense>
    </I18nProvider>
  );
}

function Shell({
  nav,
  user,
  tabBar,
  children,
}: {
  nav: React.ReactNode;
  user: React.ReactNode;
  tabBar?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-sidebar p-3 md:flex">
        <Link
          href="/"
          className="flex items-center gap-2 self-start rounded-lg px-2 pt-2 font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <WalletIcon className="size-4" />
          </span>
          Spendly
        </Link>
        {nav}
        <div className="mt-auto flex flex-col gap-1">
          {user}
          <BuildInfo className="px-2 text-center" />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-32 sm:px-6 md:pt-10 md:pb-12">
        {children}
      </main>
      {tabBar}
    </div>
  );
}
