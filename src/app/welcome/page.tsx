import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WalletIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/dal";
import { getSettings } from "@/server/queries";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

/** First-run step for new accounts: pick the currency everything is shown in. */
export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-[calc(env(safe-area-inset-top)+2rem)] sm:px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <WalletIcon className="size-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Spendly</h1>
          <p className="text-sm text-pretty text-muted-foreground">
            Pick the currency you track your money in. All amounts in your account will be shown in it.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
          <WelcomeContent />
        </Suspense>
      </div>
    </main>
  );
}

async function WelcomeContent() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  if (settings.currencyConfirmedAt) redirect("/m");
  return <WelcomeForm />;
}
