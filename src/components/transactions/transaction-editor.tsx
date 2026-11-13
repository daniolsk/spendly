"use client";

import { createContext, use, useId, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Trash2Icon } from "lucide-react";
import type { Category, Transaction } from "@/db/schema";
import { CategoryDot } from "@/components/category-dot";
import { DatePicker } from "@/components/date-picker";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CurrencyAddon } from "@/components/money";
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
import { formatMoney, formatNumber, parseMoney, parseMoneyInput, toInputValue } from "@/lib/money";
import { evaluate, isExpression } from "@/lib/calc";
import { currentMonthKey, todayKey } from "@/lib/month";
import { useT } from "@/lib/i18n/client";
import { workingDays } from "@/lib/working-days";
import { deleteTransaction, saveTransaction } from "@/server/actions";
import type { IncomeSource } from "@/server/queries";

type TxType = Transaction["type"];
type IncomeKind = "flat" | "hourly";
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
  incomeSources,
  children,
}: {
  month: string;
  categories: Category[];
  currency: string;
  incomeSources: IncomeSource[];
  children: ReactNode;
}) {
  const [state, setState] = useState<EditorState>({ open: false });
  // Bumped on every open so the form remounts with fresh defaults.
  const [formKey, setFormKey] = useState(0);
  const t = useT();

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
        title={editing ? t("tx.editTitle") : t("tx.newTitle")}
      >
        {state.open ? (
          <TransactionForm
            key={formKey}
            month={month}
            categories={categories}
            currency={currency}
            incomeSources={incomeSources}
            tx={state.tx}
            initialType={state.type}
            onDone={close}
          />
        ) : null}
      </ResponsiveDialog>
    </EditorContext>
  );
}

function defaultDate(month: string, type: TxType) {
  if (type === "income") return `${month}-01`;
  return month === currentMonthKey() ? todayKey() : `${month}-01`;
}

/** Accepts arithmetic like "20*8"; rounded to the 0.01 h the DB stores. */
function parseHours(input: string) {
  const v = evaluate(input);
  return v === null ? null : Math.round(v * 100) / 100;
}

/** Full-time hours for the date's month: Polish working days × 8. */
function defaultHours(date: string) {
  return `${workingDays(date.slice(0, 7))}*8`;
}

function TransactionForm({
  month,
  categories,
  currency,
  incomeSources,
  tx,
  initialType,
  onDone,
}: {
  month: string;
  categories: Category[];
  currency: string;
  incomeSources: IncomeSource[];
  tx?: Transaction;
  initialType: TxType;
  onDone: () => void;
}) {
  const sourcesId = useId();
  const t = useT();
  const [type, setType] = useState<TxType>(initialType);
  const [incomeKind, setIncomeKind] = useState<IncomeKind>(tx?.rate ? "hourly" : "flat");
  const [amount, setAmount] = useState(tx && !tx.rate ? toInputValue(Math.abs(tx.amount), currency) : "");
  const [refund, setRefund] = useState(tx ? tx.type === "expense" && tx.amount < 0 : false);
  const [date, setDate] = useState(tx?.date ?? defaultDate(month, initialType));
  const [description, setDescription] = useState(tx?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(tx?.categoryId ?? null);
  const [hours, setHours] = useState(tx?.hours ? formatNumber(Number(tx.hours), currency) : tx ? "" : defaultHours(date));
  const [rate, setRate] = useState(tx?.rate ? toInputValue(tx.rate, currency) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const hourly = type === "income" && incomeKind === "hourly";
  const parsedHours = parseHours(hours);
  const parsedRate = rate.trim() ? parseMoney(rate, currency) : null;
  const hourlyTotal = parsedHours && parsedRate ? Math.round(parsedHours * parsedRate) : null;
  const hoursIsDefault = !tx && hours === defaultHours(date);
  const parsedAmount = parseMoneyInput(amount, currency);

  // Archived categories stay selectable only for the transaction that already uses them.
  const options = categories.filter((c) => !c.archived || c.id === tx?.categoryId);

  function changeDate(next: string) {
    // Untouched default hours follow the month of the picked date.
    if (hoursIsDefault && next) setHours(defaultHours(next));
    setDate(next);
  }

  function changeType(next: TxType) {
    setType(next);
    // Income usually lands on the 1st; keep a user-picked date otherwise.
    if (!tx && date === defaultDate(month, type)) changeDate(defaultDate(month, next));
  }

  /** Picking a known source restores how it was paid last time. */
  function changeSource(value: string) {
    setDescription(value);
    if (tx) return;
    const known = incomeSources.find((s) => s.source.toLowerCase() === value.trim().toLowerCase());
    if (!known) return;
    if (known.rate) {
      setIncomeKind("hourly");
      setRate(toInputValue(known.rate, currency));
    } else {
      setIncomeKind("flat");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (hourly) {
      if (!parsedHours || parsedHours <= 0) next.hours = t("errors.enterHours");
      if (!parsedRate) next.rate = t("errors.enterRate");
    } else if (!parsedAmount) {
      next.amount = t("errors.enterAmount");
    }
    if (type === "expense" && !categoryId) next.categoryId = t("errors.pickCategory");
    if (type === "income" && !description.trim()) next.description = t("errors.enterSource");
    if (!date) next.date = t("errors.pickDate");
    setErrors(next);
    if (Object.keys(next).length) return;

    startTransition(async () => {
      const res = await saveTransaction({
        id: tx?.id,
        type,
        date,
        description,
        categoryId: type === "expense" ? categoryId : null,
        amount: hourly ? hourlyTotal! : type === "expense" && refund ? -parsedAmount! : parsedAmount!,
        hours: hourly ? parsedHours : null,
        rate: hourly ? parsedRate : null,
      });
      if (res.ok) {
        toast.success(
          t(tx ? "tx.updated" : type === "income" ? "tx.incomeAdded" : refund ? "tx.refundAdded" : "tx.expenseAdded"),
        );
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
        toast.success(t("tx.deleted"));
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  const amountField = (
    <Field data-invalid={!!errors.amount}>
      <FieldLabel htmlFor="tx-amount">{t("common.amount")}</FieldLabel>
      <InputGroup className="h-12">
        <InputGroupInput
          id="tx-amount"
          inputMode="text"
          autoComplete="off"
          placeholder={toInputValue(0, currency)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => {
            if (isExpression(amount) && parsedAmount !== null) setAmount(toInputValue(parsedAmount, currency));
          }}
          aria-invalid={!!errors.amount}
          className="tabular text-xl! font-semibold"
          autoFocus={!tx && type === "expense"}
        />
        <CurrencyAddon currency={currency} />
      </InputGroup>
      {isExpression(amount) && parsedAmount !== null && !errors.amount ? (
        <FieldDescription className="tabular">= {formatMoney(parsedAmount, { currency })}</FieldDescription>
      ) : null}
      <FieldError>{errors.amount}</FieldError>
    </Field>
  );

  const dateField = (
    <Field data-invalid={!!errors.date}>
      <FieldLabel htmlFor="tx-date">{t("tx.date")}</FieldLabel>
      <DatePicker id="tx-date" value={date} onChange={changeDate} invalid={!!errors.date} />
      <FieldError>{errors.date}</FieldError>
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="gap-5">
        <ToggleGroup
          type="single"
          variant="outline"
          value={type}
          onValueChange={(v) => v && changeType(v as TxType)}
          className="w-full"
        >
          <ToggleGroupItem value="expense" className="flex-1">
            {t("common.expense")}
          </ToggleGroupItem>
          <ToggleGroupItem value="income" className="flex-1">
            {t("common.incomeItem")}
          </ToggleGroupItem>
        </ToggleGroup>

        {type === "expense" ? (
          <>
            {amountField}
            <Field data-invalid={!!errors.categoryId}>
              <FieldLabel>{t("common.category")}</FieldLabel>
              <div role="radiogroup" aria-label={t("common.category")} className="grid grid-cols-2 gap-2">
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
                        selected ? "border-foreground bg-muted font-medium" : "border-border hover:bg-muted/60",
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
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="tx-refund">{t("tx.refundLabel")}</FieldLabel>
                <FieldDescription>{t("tx.refundHint")}</FieldDescription>
              </FieldContent>
              <Switch id="tx-refund" checked={refund} onCheckedChange={setRefund} />
            </Field>
            {dateField}
            <Field>
              <FieldLabel htmlFor="tx-desc">{t("tx.description")}</FieldLabel>
              <Input
                id="tx-desc"
                placeholder={t("common.optional")}
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10"
              />
            </Field>
          </>
        ) : (
          <>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="tx-source">{t("tx.source")}</FieldLabel>
              <Input
                id="tx-source"
                list={sourcesId}
                placeholder={t("tx.sourcePlaceholder")}
                autoComplete="off"
                value={description}
                maxLength={200}
                onChange={(e) => changeSource(e.target.value)}
                className="h-10"
                autoFocus={!tx}
              />
              <datalist id={sourcesId}>
                {incomeSources.map((s) => (
                  <option key={s.source} value={s.source} />
                ))}
              </datalist>
              <FieldError>{errors.description}</FieldError>
            </Field>

            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={incomeKind}
              onValueChange={(v) => v && setIncomeKind(v as IncomeKind)}
              className="w-full"
              aria-label={t("tx.incomeType")}
            >
              <ToggleGroupItem value="flat" className="flex-1">
                {t("tx.flat")}
              </ToggleGroupItem>
              <ToggleGroupItem value="hourly" className="flex-1">
                {t("tx.hourly")}
              </ToggleGroupItem>
            </ToggleGroup>

            {hourly ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3">
                  <Field data-invalid={!!errors.hours}>
                    <FieldLabel htmlFor="tx-hours">{t("tx.hoursLabel")}</FieldLabel>
                    <InputGroup className="h-11">
                      <InputGroupInput
                        id="tx-hours"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="0"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        onBlur={() => {
                          if (!hoursIsDefault && isExpression(hours) && parsedHours !== null) setHours(formatNumber(parsedHours, currency));
                        }}
                        aria-invalid={!!errors.hours}
                        className="tabular text-lg! font-semibold"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>h</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {isExpression(hours) && parsedHours !== null && !errors.hours ? (
                      <FieldDescription className="tabular">
                        = {formatNumber(parsedHours, currency)} h
                        {hoursIsDefault ? ` (${t("tx.workingDays", { count: workingDays(date.slice(0, 7)) })})` : ""}
                      </FieldDescription>
                    ) : null}
                    <FieldError>{errors.hours}</FieldError>
                  </Field>
                  <Field data-invalid={!!errors.rate}>
                    <FieldLabel htmlFor="tx-rate">{t("tx.rate")}</FieldLabel>
                    <InputGroup className="h-11">
                      <InputGroupInput
                        id="tx-rate"
                        inputMode="decimal"
                        placeholder={toInputValue(0, currency)}
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        aria-invalid={!!errors.rate}
                        className="tabular text-lg! font-semibold"
                      />
                      <CurrencyAddon currency={currency} suffix="/h" />
                    </InputGroup>
                    <FieldError>{errors.rate}</FieldError>
                  </Field>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">{t("common.total")}</span>
                  <span className="tabular font-semibold text-income">
                    {hourlyTotal ? formatMoney(hourlyTotal, { currency }) : "—"}
                  </span>
                </div>
              </div>
            ) : (
              amountField
            )}

            {dateField}
          </>
        )}

        <div className="flex gap-2 pt-1">
          {tx ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="lg" className="h-11" disabled={pending}>
                  <Trash2Icon />
                  <span className="sr-only sm:not-sr-only">{t("common.delete")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("tx.deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("common.cannotUndo")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={remove}>
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Button type="submit" size="lg" className="h-11 flex-1" disabled={pending}>
            {pending
              ? t("common.saving")
              : t(tx ? "tx.saveChanges" : type === "income" ? "tx.addIncome" : refund ? "tx.addRefund" : "tx.addExpense")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
