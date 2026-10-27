import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { BuildInfo } from "@/components/build-info";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Spendly collects, uses, stores and protects your data.",
};

const LAST_UPDATED = "27 October 2026";
// Public contact address for privacy requests; set CONTACT_EMAIL in the deployment environment.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

/** Public privacy policy, linked from the landing page and the Google OAuth consent screen. */
export default function PrivacyPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 flex max-w-[68ch] flex-col gap-8 text-[15px] leading-relaxed text-foreground/90">
          <p>
            Spendly (<span className="whitespace-nowrap">spendly.danielskowron.com</span>) is a personal expense tracker
            operated by Daniel Skowron. This policy explains what data Spendly collects, how it is used and stored, and the
            choices you have. Spendly is a private app: only Google accounts that have been explicitly invited can sign in.
          </p>

          <Section title="Data we receive from Google">
            <p>
              You sign in with Google. When you do, Google shares the following with Spendly, based on the standard
              {" "}
              <Code>openid</Code>, <Code>email</Code> and <Code>profile</Code> permissions:
            </p>
            <List>
              <li>your name,</li>
              <li>your email address and whether it is verified,</li>
              <li>your profile picture,</li>
              <li>your Google account ID.</li>
            </List>
            <p>
              Spendly uses this only to sign you in, to check that your email is on the list of invited accounts, and to show
              your name and picture in the app. Google also returns sign-in tokens, which are stored with your account record.
              Spendly does not use them to access any other Google service, and it does not read your Gmail, contacts, files
              or calendar.
            </p>
          </Section>

          <Section title="Data you enter">
            <p>
              Spendly stores what you add to the app: expenses and income (amount, date, description, category, and hours and
              hourly rate for hourly income), your categories and monthly plans, and your opening balance. This data is used
              only to show you your own budget, statistics and history.
            </p>
          </Section>

          <Section title="Cookies and browser storage">
            <List>
              <li>
                <strong className="font-medium">Session cookie</strong>: keeps you signed in. It expires after 30 days or when
                you sign out.
              </li>
              <li>
                <strong className="font-medium">Theme preference</strong>: your light or dark mode choice, kept in your
                browser&apos;s local storage.
              </li>
              <li>
                <strong className="font-medium">Inactivity lock</strong>: a flag in your browser&apos;s session storage that
                hides the dashboard after a period of inactivity.
              </li>
            </List>
            <p>Spendly uses no analytics, advertising or tracking cookies.</p>
          </Section>

          <Section title="How data is shared">
            <p>
              Spendly does not sell, rent or share your data, and does not use it for advertising or to train AI models. Your
              data is processed only by the services that run the app:
            </p>
            <List>
              <li>Vercel, which hosts the application,</li>
              <li>Neon, which hosts the database,</li>
              <li>Google, for sign-in.</li>
            </List>
            <p>Data may be disclosed if required by law.</p>
          </Section>

          <Section title="Google API Services User Data Policy">
            <p>
              Spendly&apos;s use and transfer of information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="font-medium text-foreground underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </Section>

          <Section title="Storage and security">
            <p>
              Data is stored in a managed PostgreSQL database and is always transferred over encrypted HTTPS connections.
              Access to the app is limited to invited Google accounts, and every request is checked so that you only ever see
              your own data.
            </p>
          </Section>

          <Section title="Retention and deletion">
            <p>
              Your data is kept for as long as you use Spendly. You can delete individual transactions and unused categories
              in the app at any time. To delete your account and all of its data, or to get a copy of your data, contact us
              using the details below; requests are handled within 30 days. You can also revoke Spendly&apos;s access to your
              Google account at any time at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                className="font-medium text-foreground underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                myaccount.google.com/permissions
              </a>
              .
            </p>
          </Section>

          <Section title="Children">
            <p>Spendly is not intended for children under 16 and does not knowingly collect their data.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If this policy changes, the new version will be published on this page with an updated date at the top.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions about this policy or your data, contact Daniel Skowron
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
          </Section>
        </div>
      </main>

      <footer className="pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <BuildInfo className="text-center" />
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="ml-5 flex list-disc flex-col gap-1.5 marker:text-muted-foreground">{children}</ul>;
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">{children}</code>;
}
