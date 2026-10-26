"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["transactions", "income", "stats"] as const;
type Tab = (typeof TABS)[number];

export function MonthTabs({
  transactions,
  income,
  stats,
}: {
  transactions: ReactNode;
  income: ReactNode;
  stats: ReactNode;
}) {
  // The URL is the source of truth, so a month restored from the router cache
  // still shows the tab you navigated with.
  const param = useSearchParams().get("tab");
  const tab: Tab = TABS.includes(param as Tab) ? (param as Tab) : "transactions";

  function change(value: string) {
    // Next syncs replaceState with useSearchParams, so no server round-trip.
    const url = new URL(window.location.href);
    if (value === "transactions") url.searchParams.delete("tab");
    else url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
  }

  return (
    <Tabs value={tab} onValueChange={change} className="gap-4">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="stats">Statistics</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions">{transactions}</TabsContent>
      <TabsContent value="income">{income}</TabsContent>
      <TabsContent value="stats">{stats}</TabsContent>
    </Tabs>
  );
}
