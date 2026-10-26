import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WalletIcon } from "lucide-react";
import { getSession } from "@/server/dal";
import { GoogleSignInButton } from "./google-button";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <WalletIcon className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Spendly</h1>
          <p className="text-sm text-muted-foreground">Track monthly expenses, income and plans.</p>
        </div>
        <Suspense fallback={<GoogleSignInButton />}>
          <LoginGate {...props} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginGate({ searchParams }: PageProps<"/login">) {
  const [session, query] = await Promise.all([getSession(), searchParams]);
  if (session) redirect("/");
  const error = typeof query.error === "string" ? query.error : null;

  return (
    <div className="flex w-full flex-col gap-3">
      <GoogleSignInButton />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.toLowerCase().includes("forbidden") || error.toLowerCase().includes("not_allowed") || error === "access_denied"
            ? "This Google account is not allowed to use this app."
            : "Sign-in failed. Please try again."}
        </p>
      ) : null}
    </div>
  );
}
