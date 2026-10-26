"use client";

import { useState } from "react";
import { ReceiptIcon } from "lucide-react";
import type { Category, Transaction } from "@/db/schema";
import { CategoryLabel } from "@/components/category-dot";
import { Money } from "@/components/money";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDay } from "@/lib/month";
import { useTransactionEditor } from "./transaction-editor";

type Filter = "all" | "expense" | "income";

export function TransactionList({
  transactions,
  categories,
  currency,
}: {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}) {
  const { openEdit } = useTransactionEditor();
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const visible = transactions.filter(
    (t) =>
      (filter === "all" || t.type === filter) &&
      (categoryFilter === "all" || t.categoryId === categoryFilter),
  );
  const total = visible.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

  const groups = new Map<string, Transaction[]>();
  for (const t of visible) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);

  const usedCategories = categories.filter((c) => transactions.some((t) => t.categoryId === c.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={(v) => {
            if (!v) return;
            setFilter(v as Filter);
            if (v === "income") setCategoryFilter("all");
          }}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="expense">Expenses</ToggleGroupItem>
          <ToggleGroupItem value="income">Income</ToggleGroupItem>
        </ToggleGroup>
        {filter !== "income" && usedCategories.length > 0 ? (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger size="sm" className="min-w-40" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {usedCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <CategoryLabel name={c.name} color={c.color} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="ml-auto text-sm text-muted-foreground">
          {visible.length} {visible.length === 1 ? "item" : "items"} ·{" "}
          <Money value={total} currency={currency} className="font-medium text-foreground" />
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptIcon />
            </EmptyMedia>
            <EmptyTitle>No transactions</EmptyTitle>
            <EmptyDescription>
              {transactions.length ? "Nothing matches these filters." : "Add your first expense or income for this month."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Phone: grouped by day */}
          <div className="flex flex-col gap-4 md:hidden">
            {[...groups.entries()].map(([date, items]) => (
              <section key={date} className="flex flex-col gap-1.5">
                <h3 className="px-1 text-xs font-medium text-muted-foreground">{formatDay(date)}</h3>
                <Card className="gap-0 py-0">
                  {items.map((t, i) => {
                    const cat = t.categoryId ? categoryById.get(t.categoryId) : undefined;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openEdit(t)}
                        className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted data-[divider=true]:border-t"
                        data-divider={i > 0}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {t.description || cat?.name || (t.type === "income" ? "Income" : "Expense")}
                          </span>
                          {t.type === "expense" && cat && !t.description ? null : t.type === "expense" && cat ? (
                            <CategoryLabel
                              name={cat.name}
                              color={cat.color}
                              className="text-xs text-muted-foreground"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Income{t.hours ? ` · ${Number(t.hours)} h` : ""}
                            </span>
                          )}
                        </div>
                        <Money value={t.amount} type={t.type} currency={currency} className="font-medium" />
                      </button>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden py-0 md:flex">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36 pl-4">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-56">Category</TableHead>
                  <TableHead className="w-36 pr-4 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((t) => {
                  const cat = t.categoryId ? categoryById.get(t.categoryId) : undefined;
                  return (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer"
                      tabIndex={0}
                      onClick={() => openEdit(t)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openEdit(t);
                        }
                      }}
                    >
                      <TableCell className="pl-4 text-muted-foreground tabular">{formatDay(t.date)}</TableCell>
                      <TableCell className="max-w-0 truncate">
                        {t.description || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {t.type === "expense" && cat ? (
                          <CategoryLabel name={cat.name} color={cat.color} />
                        ) : (
                          <span className="text-muted-foreground">Income{t.hours ? ` · ${Number(t.hours)} h` : ""}</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right font-medium">
                        <Money value={t.amount} type={t.type} currency={currency} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="pl-4">
                    Total
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Money value={total} currency={currency} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
