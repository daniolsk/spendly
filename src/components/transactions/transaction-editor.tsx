"use client";

import { createContext, use, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Trash2Icon } from "lucide-react";
import type { Category, Transaction } from "@/db/schema";
import { CategoryDot } from "@/components/category-dot";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { parseMoney, toInputValue } from "@/lib/money";
import { currentMonthKey, todayKey } from "@/lib/month";
import { deleteTransaction, saveTransaction } from "@/server/actions";

type TxType = Transaction["type"];
type EditorState = { open: false } | { open: true; tx?: Transaction; type: TxType };

type EditorContextValue = {
  openNew: (type: TxType) => void;
  openEdit: (tx: Transaction) => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function useTransactionEditor() {
  const ctx = use(EditorContext);
  if (!ctx) throw new Error("useTransactionEditor must be used within TransactionEditorProvider");
  return ctx;
}

export function TransactionEditorProvider({
  month,
  categories,
  currency,
  children,
}: {
  month: string;
  categories: Category[];
  currency: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<EditorState>({ open: false });
  // Bumped on every open so the form remounts with fresh defaults.
  const [formKey, setFormKey] = useState(0);

  const value: EditorContextValue = {
    openNew: (type) => {
      setFormKey((k) => k + 1);
      setState({ open: true, type });
    },
    openEdit: (tx) => {
      setFormKey((k) => k + 1);
      setState({ open: true, tx, type: tx.type });
    },
  };

  const close = () => setState({ open: false });
  const editing = state.open && state.tx;

  return (
    <EditorContext value={value}>
      {children}
      <ResponsiveDialog
        open={state.open}
        onOpenChange={(open) => !open && close()}
        title={editing ? "Edit transaction" : "New transaction"}
      >
        {state.open ? (
          <TransactionForm
            key={formKey}
            month={month}
            categories={categories}
            currency={currency}
            tx={state.tx}
            initialType={state.type}
            onDone={close}
          />
        ) : null}
      </ResponsiveDialog>
    </EditorContext>
  );
}

function defaultDate(month: string) {
  return month === currentMonthKey() ? todayKey() : `${month}-01`;
}

function TransactionForm({
  month,
  categories,
  currency,
  tx,
  initialType,
  onDone,
}: {
  month: string;
  categories: Category[];
  currency: string;
  tx?: Transaction;
  initialType: TxType;
  onDone: () => void;
}) {
  const [type, setType] = useState<TxType>(initialType);
  const [amount, setAmount] = useState(tx ? toInputValue(Math.abs(tx.amount)) : "");
  const [refund, setRefund] = useState(tx ? tx.type === "expense" && tx.amount < 0 : false);
  const [date, setDate] = useState(tx?.date ?? defaultDate(month));
  const [description, setDescription] = useState(tx?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(tx?.categoryId ?? null);
  const [hours, setHours] = useState(tx?.hours ? String(Number(tx.hours)).replace(".", ",") : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  // Archived categories stay selectable only for the transaction that already uses them.
  const options = categories.filter((c) => !c.archived || c.id === tx?.categoryId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const parsedAmount = parseMoney(amount);
    if (!parsedAmount) nextErrors.amount = "Enter an amount greater than 0";
    if (type === "expense" && !categoryId) nextErrors.categoryId = "Pick a category";
    if (type === "income" && !description.trim()) nextErrors.description = "Enter the income source";
    const parsedHours = hours.trim() ? Number(hours.replace(",", ".")) : null;
    if (parsedHours != null && (!Number.isFinite(parsedHours) || parsedHours < 0)) nextErrors.hours = "Invalid hours";
    if (!date) nextErrors.date = "Pick a date";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    startTransition(async () => {
      const res = await saveTransaction({
        id: tx?.id,
        type,
        date,
        description,
        categoryId: type === "expense" ? categoryId : null,
        amount: type === "expense" && refund ? -parsedAmount! : parsedAmount!,
        hours: type === "income" ? parsedHours : null,
      });
      if (res.ok) {
        toast.success(tx ? "Transaction updated" : type === "income" ? "Income added" : refund ? "Refund added" : "Expense added");
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove() {
    if (!tx) return;
    startTransition(async () => {
      const res = await deleteTransaction(tx.id);
      if (res.ok) {
        toast.success("Transaction deleted");
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="gap-5">
        <ToggleGroup
          type="single"
          variant="outline"
          value={type}
          onValueChange={(v) => v && setType(v as TxType)}
          className="w-full"
        >
          <ToggleGroupItem value="expense" className="flex-1">
            Expense
          </ToggleGroupItem>
          <ToggleGroupItem value="income" className="flex-1">
            Income
          </ToggleGroupItem>
        </ToggleGroup>

        <Field data-invalid={!!errors.amount}>
          <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
          <InputGroup className="h-12">
            <InputGroupInput
              id="tx-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!!errors.amount}
              className="tabular text-xl! font-semibold"
              autoFocus={!tx}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{currency === "PLN" ? "zł" : currency}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <FieldError>{errors.amount}</FieldError>
        </Field>

        {type === "expense" ? (
          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel>Category</FieldLabel>
            <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2">
              {options.map((c) => {
                const selected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-foreground bg-muted font-medium"
                        : "border-border hover:bg-muted/60",
                    )}
                  >
                    <CategoryDot color={c.color} />
                    <span className="line-clamp-2">{c.name}</span>
                  </button>
                );
              })}
            </div>
            <FieldError>{errors.categoryId}</FieldError>
          </Field>
        ) : null}

        {type === "expense" ? (
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="tx-refund">Refund / money back</FieldLabel>
              <FieldDescription>Reduces this category&apos;s spending instead of counting as income.</FieldDescription>
            </FieldContent>
            <Switch id="tx-refund" checked={refund} onCheckedChange={setRefund} />
          </Field>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.date} className={type === "expense" ? "col-span-2" : undefined}>
            <FieldLabel htmlFor="tx-date">Date</FieldLabel>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10"
              required
            />
            <FieldError>{errors.date}</FieldError>
          </Field>
          {type === "income" ? (
            <Field data-invalid={!!errors.hours}>
              <FieldLabel htmlFor="tx-hours">Hours</FieldLabel>
              <Input
                id="tx-hours"
                inputMode="decimal"
                placeholder="Optional"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-10"
              />
              <FieldError>{errors.hours}</FieldError>
            </Field>
          ) : null}
        </div>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="tx-desc">{type === "income" ? "Source" : "Description"}</FieldLabel>
          <Input
            id="tx-desc"
            placeholder={type === "income" ? "e.g. Salary" : "Optional"}
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
            className="h-10"
          />
          <FieldError>{errors.description}</FieldError>
        </Field>

        <div className="flex gap-2 pt-1">
          {tx ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="lg" className="h-11" disabled={pending}>
                  <Trash2Icon />
                  <span className="sr-only sm:not-sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={remove}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Button type="submit" size="lg" className="h-11 flex-1" disabled={pending}>
            {pending ? "Saving…" : tx ? "Save changes" : type === "income" ? "Add income" : refund ? "Add refund" : "Add expense"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
