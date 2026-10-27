import type { Metadata } from "next";
import { Code, ContactLine, ExternalLink, LegalPage, List, Section } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Spendly collects, uses, stores and protects your data.",
};

/** Public privacy policy, linked from the landing page and the Google OAuth consent screen. */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="27 October 2026">
      <p>
        Spendly (<span className="whitespace-nowrap">spendly.danielskowron.com</span>) is a personal expense tracker operated
        by Daniel Skowron. This policy explains what data Spendly collects, how it is used and stored, and the choices you
        have. Anyone with a Google account can sign up, and each account only ever sees its own data.
      </p>

      <Section title="Data we receive from Google">
        <p>
          You sign in with Google. When you do, Google shares the following with Spendly, based on the standard{" "}
          <Code>openid</Code>, <Code>email</Code> and <Code>profile</Code> permissions:
        </p>
        <List>
          <li>your name,</li>
          <li>your email address and whether it is verified,</li>
          <li>your profile picture,</li>
          <li>your Google account ID.</li>
        </List>
        <p>
          Spendly uses this only to create your account, sign you in, and show your name and picture in the app. Google also returns sign-in tokens, which are stored with your account record.
          Spendly does not use them to access any other Google service, and it does not read your Gmail, contacts, files or
          calendar.
        </p>
      </Section>

      <Section title="Data you enter">
        <p>
          Spendly stores what you add to the app: expenses and income (amount, date, description, category, and hours and
          hourly rate for hourly income), your categories and monthly plans, and your opening balance. This data is used only
          to show you your own budget, statistics and history.
        </p>
      </Section>

      <Section title="Cookies and browser storage">
        <List>
          <li>
            <strong className="font-medium">Session cookie</strong>: keeps you signed in. It expires after 30 days or when you
            sign out.
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
          <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </ExternalLink>
          , including the Limited Use requirements.
        </p>
      </Section>

      <Section title="Storage and security">
        <p>
          Data is stored in a managed PostgreSQL database and is always transferred over encrypted HTTPS connections. Every
          request is checked against your signed-in account, so you only ever see and change your own data.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          Your data is kept for as long as you use Spendly. You can delete individual transactions and unused categories in
          the app at any time. To delete your account and all of its data, or to get a copy of your data, contact us using
          the details below; requests are handled within 30 days. You can also revoke Spendly&apos;s access to your Google
          account at any time at{" "}
          <ExternalLink href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</ExternalLink>.
        </p>
      </Section>

      <Section title="Children">
        <p>Spendly is not intended for children under 16 and does not knowingly collect their data.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>If this policy changes, the new version will be published on this page with an updated date at the top.</p>
      </Section>

      <Section title="Contact">
        <ContactLine lead="For questions about this policy or your data, contact" />
      </Section>
    </LegalPage>
  );
}
