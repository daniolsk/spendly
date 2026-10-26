"use client";

import { WalletIcon } from "lucide-react";
import type { Transaction } from "@/db/schema";
import { Money } from "@/components/money";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { useTransactionEditor } from "./transaction-editor";

export function IncomeList({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  const { openEdit } = useTransactionEditor();
  const income = transactions.filter((t) => t.type === "income").sort((a, b) => b.amount - a.amount);
  const total = income.reduce((a, t) => a + t.amount, 0);
  const hours = income.reduce((a, t) => a + (t.hours ? Number(t.hours) : 0), 0);
  const paidForHours = income.filter((t) => t.hours && Number(t.hours) > 0).reduce((a, t) => a + t.amount, 0);

  if (income.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletIcon />
          </EmptyMedia>
          <EmptyTitle>No income yet</EmptyTitle>
          <EmptyDescription>Add your salary or any other earnings for this month.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Source</TableHead>
            <TableHead className="w-20 text-right">Hours</TableHead>
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
              <TableCell className="max-w-0 truncate pl-4 font-medium">{t.description}</TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {t.hours ? Number(t.hours) : "—"}
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
            <TableCell className="tabular text-right">{hours || ""}</TableCell>
            <TableCell className="pr-4 text-right">
              <Money value={total} currency={currency} />
            </TableCell>
          </TableRow>
          {hours > 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="pl-4 text-xs font-normal text-muted-foreground">
                Effective hourly rate: {formatMoney(Math.round(paidForHours / hours), { currency })} / h
              </TableCell>
            </TableRow>
          ) : null}
        </TableFooter>
      </Table>
    </Card>
  );
}
