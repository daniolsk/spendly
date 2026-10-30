"use client";

import { useState } from "react";
import { ArrowDownLeftIcon, ReceiptIcon } from "lucide-react";
import { cn } from "cn";
import type { Category, Transaction } from "@/db/schema";
import { CategoryDot, CategoryLabel } from "@/components/category-dot";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDay, todayKey } from "@/lib/month";
import { useTransactionEditor } from "./transaction-editor";

type Filter = "all" | "expense" | "income";

/** Accent bar down the left edge of today's rows; overlaps the row border above so it reads as one line. */
const TODAY_BAR =
  "relative before:absolute before:-top-px before:bottom-0 before:left-0 before:w-[3px] before:bg-primary";

/** Net amount: income adds, expenses (refunds are negative) subtract. */
function signedSum(items: Transaction[]) {
  return items.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
}

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
  const total = signedSum(visible);

  const groups = new Map<string, Transaction[]>();
  for (const t of visible) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);

  const today = todayKey();

  const usedCategories = categories.filter((c) => transactions.some((t) => t.categoryId === c.id));

  return (
    <div className="flex flex-col gap-3">
      {/* When one row doesn't fit, the filters and the category picker each get a full-width line and the summary sits right above the list. */}
      <div className="@container/filters">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="@max-xl/filters:w-full"
            value={filter}
            onValueChange={(v) => {
              if (!v) return;
              setFilter(v as Filter);
              if (v === "income") setCategoryFilter("all");
            }}
          >
            <ToggleGroupItem value="all" className="@max-xl/filters:flex-1">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="expense" className="@max-xl/filters:flex-1">
              Expenses
            </ToggleGroupItem>
            <ToggleGroupItem value="income" className="@max-xl/filters:flex-1">
              Income
            </ToggleGroupItem>
          </ToggleGroup>
          {filter !== "income" && usedCategories.length > 0 ? (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger size="sm" className="min-w-40 @max-xl/filters:w-full" aria-label="Filter by category">
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
          <div className="ml-auto text-sm text-muted-foreground @max-xl/filters:w-full @max-xl/filters:text-right">
            {visible.length} {visible.length === 1 ? "item" : "items"} ·{" "}
            <Money value={total} currency={currency} className="font-medium text-foreground" />
          </div>
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
                <h3
                  className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground data-[today=true]:text-foreground"
                  data-today={date === today}
                >
                  {formatDay(date)}
                  {date === today ? <TodayBadge /> : null}
                </h3>
                <Card className="gap-0 py-0 data-[today=true]:ring-primary/40" data-today={date === today}>
                  {items.map((t, i) => {
                    const cat = t.categoryId ? categoryById.get(t.categoryId) : undefined;
                    const subtitle =
                      t.type === "income"
                        ? `Income${t.rate && t.hours ? ` · ${Number(t.hours)} h` : ""}`
                        : [t.description ? cat?.name : null, t.amount < 0 ? "Refund" : null].filter(Boolean).join(" · ");
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openEdit(t)}
                        className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted data-[divider=true]:border-t"
                        data-divider={i > 0}
                      >
                        {/* Leading dot so the category color is visible even without a description */}
                        {t.type === "income" ? (
                          <ArrowDownLeftIcon aria-hidden className="-mx-0.5 size-3.5 shrink-0 text-income" />
                        ) : (
                          <CategoryDot color={cat?.color ?? "gray"} />
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {t.description || cat?.name || (t.type === "income" ? "Income" : "Expense")}
                          </span>
                          {subtitle ? <span className="truncate text-xs text-muted-foreground">{subtitle}</span> : null}
                        </div>
                        <Money value={t.amount} type={t.type} currency={currency} className="font-medium" />
                      </button>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>

          {/* Desktop: table, one section per day */}
          <Card className="hidden py-0 md:flex">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-56 pl-4">Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-36 pr-4 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              {[...groups.entries()].map(([date, items]) => (
                <TableBody
                  key={date}
                  className="border-t first-of-type:border-t-0">
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableCell colSpan={2} className={cn("pl-4 font-medium", date === today && TODAY_BAR)}>
                      <span className="flex items-center gap-2">
                        {formatDay(date)}
                        {date === today ? <TodayBadge /> : null}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground">
                      <Money value={signedSum(items)} currency={currency} />
                    </TableCell>
                  </TableRow>
                  {items.map((t) => {
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
                        <TableCell className={cn("pl-4", date === today && TODAY_BAR)}>
                          {t.type === "expense" && cat ? (
                            <CategoryLabel name={t.amount < 0 ? `${cat.name} · Refund` : cat.name} color={cat.color} />
                          ) : (
                            <span className="text-muted-foreground">Income{t.rate && t.hours ? ` · ${Number(t.hours)} h` : ""}</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-0 truncate">
                          {t.description || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="pr-4 text-right font-medium">
                          <Money value={t.amount} type={t.type} currency={currency} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              ))}
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="pl-4">
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

function TodayBadge() {
  return <Badge className="h-4.5 px-1.5 text-[0.7rem]">Today</Badge>;
}
