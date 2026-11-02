import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/dal";
import { getCategories, getSettings } from "@/server/queries";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Welcome" };

/** First-run setup for new accounts: currency (required), then optional categories, plans and opening balance. */
export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-[calc(env(safe-area-inset-top)+2rem)] sm:px-6">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
          <WelcomeContent />
        </Suspense>
      </div>
    </main>
  );
}

async function WelcomeContent() {
  const user = await requireUser();
  const [settings, categories] = await Promise.all([getSettings(user.id), getCategories(user.id)]);
  if (settings.currencyConfirmedAt) redirect("/m");
  return (
    <WelcomeForm
      name={user.name.split(" ")[0] ?? ""}
      categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
    />
  );
}
