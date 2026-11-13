"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CalendarIcon, ChartColumnIcon, SettingsIcon } from "lucide-react";
import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";

const NAV = [
  { href: "/m", label: "nav.month", icon: CalendarIcon, match: (p: string) => p === "/m" || p.startsWith("/m/") },
  { href: "/y", label: "nav.year", icon: ChartColumnIcon, match: (p: string) => p.startsWith("/y") },
  { href: "/settings", label: "nav.settings", icon: SettingsIcon, match: (p: string) => p.startsWith("/settings") },
] as const;

type ListProps = { pathname: string; label: (key: (typeof NAV)[number]["label"]) => React.ReactNode };

// usePathname() is request data under Cache Components, so it streams in behind
// Suspense; the fallback is the same nav without the active highlight.
function withPathname(Component: (props: ListProps) => React.ReactNode) {
  function Active() {
    const t = useT();
    return <Component pathname={usePathname()} label={t} />;
  }
  function Inactive() {
    const t = useT();
    return <Component pathname="" label={t} />;
  }
  return function Nav() {
    return (
      <Suspense fallback={<Inactive />}>
        <Active />
      </Suspense>
    );
  };
}

function SidebarNavList({ pathname, label }: ListProps) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label: key, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label(key)}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileTabBarList({ pathname, label }: ListProps) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-3">
        {NAV.map(({ href, label: key, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              {label(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const SidebarNav = withPathname(SidebarNavList);
export const MobileTabBar = withPathname(MobileTabBarList);

// Shown while the shell loads the user's language: same layout, placeholder labels.
const labelSkeleton = () => <Skeleton className="h-3 w-12" />;

export function NavSkeleton() {
  return <SidebarNavList pathname="" label={labelSkeleton} />;
}

export function MobileTabBarSkeleton() {
  return <MobileTabBarList pathname="" label={labelSkeleton} />;
}
