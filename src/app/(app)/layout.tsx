import { Suspense } from "react";
import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";
import { InactivityLock } from "@/components/shell/inactivity-lock";
import { MobileTabBar, SidebarNav } from "@/components/shell/nav";
import { UserMenu } from "@/components/shell/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/dal";

async function SidebarUser() {
  const user = await requireUser();
  return <UserMenu user={{ name: user.name, email: user.email, image: user.image }} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
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
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-1">
          <Suspense fallback={<Skeleton className="h-12 w-full" />}>
            <SidebarUser />
          </Suspense>
          <BuildInfo className="px-2 text-center" />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-32 sm:px-6 md:pt-10 md:pb-12">
        {children}
      </main>
      <MobileTabBar />
      <InactivityLock />
    </div>
  );
}
