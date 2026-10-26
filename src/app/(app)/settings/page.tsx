import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { AccountCard } from "@/components/settings/account-card";
import { CategoryManager } from "@/components/settings/category-manager";
import { OpeningBalanceForm } from "@/components/settings/opening-balance-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/dal";
import { getCategories, getSettings } from "@/server/queries";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-xl" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const user = await requireUser();
  const [categories, settings] = await Promise.all([
    getCategories(user.id, { includeArchived: true }),
    getSettings(user.id),
  ]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Expense categories</CardTitle>
          <CardDescription>Tap a category to edit it. Archived categories keep their history.</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} currency={settings.currency} />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Opening balance</CardTitle>
            <CardDescription>Money you had before the first tracked month. Used for “Balance since start”.</CardDescription>
          </CardHeader>
          <CardContent>
            <OpeningBalanceForm openingBalance={settings.openingBalance} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountCard user={{ name: user.name, email: user.email, image: user.image }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
