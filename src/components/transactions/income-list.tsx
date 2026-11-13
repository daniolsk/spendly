"use client";

import { PlusIcon, WalletIcon } from "lucide-react";
import type { Transaction } from "@/db/schema";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Translator } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import { formatMoney, formatNumber } from "@/lib/money";
import { useTransactionEditor } from "./transaction-editor";

export function IncomeList({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  const { openEdit, openNew } = useTransactionEditor();
  const t = useT();
  const income = transactions.filter((tx) => tx.type === "income").sort((a, b) => b.amount - a.amount);
  const total = income.reduce((a, tx) => a + tx.amount, 0);
  const hours = income.reduce((a, tx) => a + (tx.rate && tx.hours ? Number(tx.hours) : 0), 0);
  const addButton = (
    <Button onClick={() => openNew("income")}>
      <PlusIcon /> {t("tx.addIncome")}
    </Button>
  );

  if (income.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletIcon />
          </EmptyMedia>
          <EmptyTitle>{t("income.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("income.emptyHint")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>{addButton}</EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("income.sources", { count: income.length })}
          {hours ? ` · ${t("income.hoursWorked", { hours: formatNumber(hours, currency) })}` : ""}
        </p>
        {addButton}
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("tx.source")}</TableHead>
              <TableHead className="hidden text-right sm:table-cell">{t("income.details")}</TableHead>
              <TableHead className="w-36 pr-4 text-right">{t("common.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {income.map((tx) => (
              <TableRow
                key={tx.id}
                className="h-12 cursor-pointer"
                tabIndex={0}
                onClick={() => openEdit(tx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEdit(tx);
                  }
                }}
              >
                <TableCell className="max-w-0 pl-4">
                  <div className="truncate font-medium">{tx.description}</div>
                  {/* Phones: details as a second line instead of a column */}
                  <div className="tabular truncate text-xs text-muted-foreground sm:hidden">{incomeDetails(tx, currency, t)}</div>
                </TableCell>
                <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">
                  {incomeDetails(tx, currency, t)}
                </TableCell>
                <TableCell className="pr-4 text-right font-medium">
                  <Money value={tx.amount} type="income" currency={currency} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4">{t("income.total")}</TableCell>
              <TableCell className="tabular hidden text-right sm:table-cell">
                {hours ? `${formatNumber(hours, currency)} h` : ""}
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

function incomeDetails(tx: Transaction, currency: string, t: Translator) {
  return tx.rate && tx.hours
    ? `${formatNumber(Number(tx.hours), currency)} h × ${formatMoney(tx.rate, { currency })}/h`
    : t("tx.flat");
}
