"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["transactions", "income", "stats"] as const;
type Tab = (typeof TABS)[number];

export function MonthTabs({
  initialTab,
  transactions,
  income,
  stats,
}: {
  initialTab?: string;
  transactions: ReactNode;
  income: ReactNode;
  stats: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "transactions");

  function change(value: string) {
    setTab(value as Tab);
    // Keep the tab in the URL without a server round-trip.
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
