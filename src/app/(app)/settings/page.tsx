import type { Metadata } from "next";
import { Suspense } from "react";
import { BuildInfo } from "@/components/build-info";
import { PageHeader } from "@/components/page-header";
import { AccountCard } from "@/components/settings/account-card";
import { CategoryManager } from "@/components/settings/category-manager";
import { InstallApp } from "@/components/settings/install-app";
import { DeleteAccount } from "@/components/settings/delete-account";
import { CurrencyForm } from "@/components/settings/currency-form";
import { LanguageForm } from "@/components/settings/language-form";
import { OpeningBalanceForm } from "@/components/settings/opening-balance-form";
import { UsageLimits } from "@/components/settings/usage-limits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toLanguage } from "@/lib/i18n";
import { T } from "@/lib/i18n/client";
import { currentMonthKey, zonedToday } from "@/lib/month";
import { requireUser } from "@/server/dal";
import { getT } from "@/server/i18n";
import { getCategories, getSettings, getUsage } from "@/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.settings") };
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={<T k="nav.settings" />} />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-xl" />}>
        <SettingsContent />
      </Suspense>
      <BuildInfo className="text-center md:hidden" />
    </div>
  );
}

async function SettingsContent() {
  const user = await requireUser();
  const month = currentMonthKey(zonedToday());
  const [categories, settings, usage, t] = await Promise.all([
    getCategories(user.id, { includeArchived: true }),
    getSettings(user.id),
    getUsage(user.id, month),
    getT(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.categories")}</CardTitle>
          <CardDescription>{t("settings.categoriesHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} currency={settings.currency} />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.language")}</CardTitle>
            <CardDescription>{t("settings.languageHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageForm language={toLanguage(settings.language)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.currency")}</CardTitle>
            <CardDescription>{t("settings.currencyHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyForm currency={settings.currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.openingBalance")}</CardTitle>
            <CardDescription>{t("settings.openingBalanceHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <OpeningBalanceForm openingBalance={settings.openingBalance} currency={settings.currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.account")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountCard user={{ name: user.name, email: user.email, image: user.image }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.homeScreen")}</CardTitle>
            <CardDescription>{t("settings.homeScreenHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <InstallApp />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.limits")}</CardTitle>
            <CardDescription>{t("settings.limitsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <UsageLimits usage={usage} month={month} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.deleteAccount")}</CardTitle>
            <CardDescription>{t("settings.deleteAccountHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccount email={user.email} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
