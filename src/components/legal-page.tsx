import type { ReactNode } from "react";
import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";

// Public contact address for privacy and terms questions; set CONTACT_EMAIL in the deployment environment.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

/** Shared layout for the public legal pages (/privacy, /terms). */
export function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-linear-135 from-[#1baf7a] to-[#0f7a55] text-white shadow-sm shadow-[#1baf7a]/30">
            <WalletIcon className="size-4" />
          </span>
          Spendly
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-16 sm:px-6 sm:pt-14">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="mt-8 flex max-w-[68ch] flex-col gap-8 text-[15px] leading-relaxed text-foreground/90">{children}</div>
      </main>

      <footer className="flex flex-col items-center gap-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <LegalLinks />
        <BuildInfo className="text-center" />
      </footer>
    </div>
  );
}

export function LegalLinks() {
  return (
    <nav className="flex gap-4 text-sm text-muted-foreground">
      <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
        Privacy Policy
      </Link>
      <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
        Terms of Service
      </Link>
    </nav>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="ml-5 flex list-disc flex-col gap-1.5 marker:text-muted-foreground">{children}</ul>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{children}</code>;
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-medium text-foreground underline underline-offset-4" target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** "contact Daniel Skowron[ at <email>]." — the address only shows when CONTACT_EMAIL is set. */
export function ContactLine({ lead }: { lead: string }) {
  return (
    <p>
      {lead} Daniel Skowron
      {CONTACT_EMAIL ? (
        <>
          {" "}
          at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
        </>
      ) : null}
      .
    </p>
  );
}
