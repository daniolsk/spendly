"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CalendarIcon, ChartColumnIcon, SettingsIcon } from "lucide-react";
import { cn } from "cn";

const NAV = [
  { href: "/m", label: "Month", icon: CalendarIcon, match: (p: string) => p === "/m" || p.startsWith("/m/") },
  { href: "/y", label: "Year", icon: ChartColumnIcon, match: (p: string) => p.startsWith("/y") },
  { href: "/settings", label: "Settings", icon: SettingsIcon, match: (p: string) => p.startsWith("/settings") },
];

// usePathname() is request data under Cache Components, so it streams in behind
// Suspense; the fallback is the same nav without the active highlight.
function withPathname(Component: (props: { pathname: string }) => React.ReactNode) {
  function Active() {
    return <Component pathname={usePathname()} />;
  }
  return function Nav() {
    return (
      <Suspense fallback={<Component pathname="" />}>
        <Active />
      </Suspense>
    );
  };
}

export const SidebarNav = withPathname(function SidebarNavList({ pathname }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, match }) => {
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
});

export const MobileTabBar = withPathname(function MobileTabBarList({ pathname }) {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-3">
        {NAV.map(({ href, label, icon: Icon, match }) => {
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
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
