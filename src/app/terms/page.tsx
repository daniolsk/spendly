import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, List, Section } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using Spendly.",
};

/** Public terms of service, linked from the landing page and the Google OAuth consent screen. */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="27 October 2026">
      <p>
        These terms apply to Spendly (<span className="whitespace-nowrap">spendly.danielskowron.com</span>), a personal
        expense tracker operated by Daniel Skowron. By signing in and using Spendly you agree to them.
      </p>

      <Section title="Accounts">
        <p>
          You sign up and sign in with your Google account. Each account is separate: your data is visible only to you. An
          account that breaks these terms may be suspended or removed.
        </p>
      </Section>

      <Section title="Your account and data">
        <List>
          <li>You are responsible for keeping your Google account secure and for the activity in your Spendly account.</li>
          <li>
            The data you enter stays yours. You can delete it or ask for a copy at any time, as described in the{" "}
            <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </li>
        </List>
      </Section>

      <Section title="Acceptable use">
        <p>
          Use Spendly only to track your own finances. Do not try to access other people&apos;s data, disrupt the service, or
          probe it for vulnerabilities without permission.
        </p>
      </Section>

      <Section title="Not financial advice">
        <p>
          Spendly is a tool for recording and summarising your own income and expenses. The figures it shows are only as
          accurate as the data you enter, and nothing in the app is financial, tax or legal advice.
        </p>
      </Section>

      <Section title="Availability and changes">
        <p>
          Spendly is provided free of charge, &ldquo;as is&rdquo;, without guarantees of availability or uptime. Features may
          change or be removed, and the service may be discontinued; in that case you will be able to request a copy of your
          data first.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent permitted by law, the operator is not liable for indirect losses or for decisions you make based on
          figures shown in the app. Nothing in these terms limits rights you have under mandatory consumer law.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>If these terms change, the new version will be published on this page with an updated date at the top.</p>
      </Section>

      <Section title="Contact">
        <ContactLine lead="For questions about these terms, contact" />
      </Section>
    </LegalPage>
  );
}
