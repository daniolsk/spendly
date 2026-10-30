"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionEditor } from "@/components/transactions/transaction-editor";

export function DesktopAddButtons() {
  const { openNew } = useTransactionEditor();
  return (
    <div className="hidden grid-cols-2 gap-2 md:grid">
      <Button variant="outline" size="lg" onClick={() => openNew("income")}>
        <PlusIcon /> Income
      </Button>
      <Button size="lg" onClick={() => openNew("expense")}>
        <MinusIcon /> Expense
      </Button>
    </div>
  );
}

export function MobileAddButton() {
  const { openNew } = useTransactionEditor();
  return (
    <Button
      size="icon-lg"
      onClick={() => openNew("expense")}
      aria-label="Add transaction"
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-40 size-14 rounded-full shadow-lg md:hidden [&_svg:not([class*='size-'])]:size-6"
    >
      <PlusIcon />
    </Button>
  );
}
