"use client";

import { PlusIcon, WalletIcon } from "lucide-react";
import type { Transaction } from "@/db/schema";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { useTransactionEditor } from "./transaction-editor";

export function IncomeList({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  const { openEdit, openNew } = useTransactionEditor();
  const income = transactions.filter((t) => t.type === "income").sort((a, b) => b.amount - a.amount);
  const total = income.reduce((a, t) => a + t.amount, 0);
  const hours = income.reduce((a, t) => a + (t.rate && t.hours ? Number(t.hours) : 0), 0);
  const addButton = (
    <Button onClick={() => openNew("income")}>
      <PlusIcon /> Add income
    </Button>
  );

  if (income.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletIcon />
          </EmptyMedia>
          <EmptyTitle>No income yet</EmptyTitle>
          <EmptyDescription>Add hourly pay (hours × rate) or a flat amount for this month.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{addButton}</EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {income.length} {income.length === 1 ? "source" : "sources"}
          {hours ? ` · ${formatHours(hours)} h worked` : ""}
        </p>
        {addButton}
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Source</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Details</TableHead>
              <TableHead className="w-36 pr-4 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {income.map((t) => (
              <TableRow
                key={t.id}
                className="h-12 cursor-pointer"
                tabIndex={0}
                onClick={() => openEdit(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(t);
                  }
                }}
              >
                <TableCell className="max-w-0 pl-4">
                  <div className="truncate font-medium">{t.description}</div>
                  {/* Phones: details as a second line instead of a column */}
                  <div className="tabular truncate text-xs text-muted-foreground sm:hidden">{incomeDetails(t, currency)}</div>
                </TableCell>
                <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">
                  {incomeDetails(t, currency)}
                </TableCell>
                <TableCell className="pr-4 text-right font-medium">
                  <Money value={t.amount} type="income" currency={currency} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4">Total income</TableCell>
              <TableCell className="tabular hidden text-right sm:table-cell">
                {hours ? `${formatHours(hours)} h` : ""}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Money value={total} currency={currency} />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}

function incomeDetails(t: Transaction, currency: string) {
  return t.rate && t.hours
    ? `${formatHours(Number(t.hours))} h × ${formatMoney(t.rate, { currency })}/h`
    : "Flat amount";
}

function formatHours(h: number) {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(h);
}
