"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PlusIcon, WalletIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { CategoryDot } from "@/components/category-dot";
import { CurrencyAddon } from "@/components/money";
import { CurrencyExample, CurrencySelect } from "@/components/settings/currency-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_COLOR_KEYS } from "@/lib/colors";
import { DEFAULT_CURRENCY, guessCurrency, type CurrencyCode } from "@/lib/currency";
import { formatMoney, parseMoney, toInputValue } from "@/lib/money";
import { completeOnboarding } from "@/server/actions";

const subscribeNever = () => () => {};

type StarterCategory = { id: string; name: string; color: string };
/** A category in the setup list: a seeded one (with id) or one added here. */
type Draft = { key: string; id?: string; name: string; color: string; selected: boolean };

const STEPS = [
  { title: "Welcome to Spendly", description: "Pick the currency you track your money in." },
  { title: "Your categories", description: "Expenses are grouped into categories. Keep the ones you need and add your own." },
  { title: "Monthly plan", description: "How much do you want to spend per category each month? Leave blank for no limit." },
  { title: "Opening balance", description: "How much money do you have right now? It’s the starting point for “Balance since start”." },
] as const;

const initialDrafts = (categories: StarterCategory[]): Draft[] =>
  categories.map((c) => ({ key: c.id, id: c.id, name: c.name, color: c.color, selected: true }));

export function WelcomeForm({ name, categories }: { name: string; categories: StarterCategory[] }) {
  // Pre-selected from the browser language (server render and hydration use the default).
  const guessed = useSyncExternalStore(subscribeNever, () => guessCurrency(navigator.languages), () => DEFAULT_CURRENCY);
  const [picked, setCurrency] = useState<CurrencyCode | null>(null);
  const currency = picked ?? guessed;

  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState(() => initialDrafts(categories));
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selected = drafts.filter((d) => d.selected);
  const last = step === STEPS.length - 1;

  /** Parses the plan inputs; null (with errors set) if any is invalid. */
  function parsePlans(source: Record<string, string>) {
    const result = new Map<string, number>();
    const next: Record<string, string> = {};
    for (const d of selected) {
      const raw = source[d.key]?.trim();
      const value = raw ? parseMoney(raw, currency) : 0;
      if (value === null) next[`plan:${d.key}`] = "Invalid amount";
      else result.set(d.key, value);
    }
    setErrors(next);
    return Object.keys(next).length ? null : result;
  }

  function finish(opening: string, planInputs: Record<string, string>) {
    const planMap = parsePlans(planInputs);
    if (!planMap) {
      setStep(2);
      return;
    }
    let openingBalance: number | null = null;
    if (opening.trim()) {
      const parsed = parseMoney(opening, currency);
      if (parsed === null) {
        setErrors({ balance: "Invalid amount" });
        return;
      }
      openingBalance = opening.trim().startsWith("-") ? -parsed : parsed;
    }
    startTransition(async () => {
      const res = await completeOnboarding({
        currency,
        keep: selected.filter((d) => d.id).map((d) => ({ id: d.id!, defaultPlan: planMap.get(d.key) ?? 0 })),
        add: selected
          .filter((d) => !d.id)
          .map((d) => ({ name: d.name, color: d.color, defaultPlan: planMap.get(d.key) ?? 0 })),
        openingBalance,
      });
      if (res.ok) {
        toast.success("You’re all set");
        router.replace("/m");
      } else toast.error(res.error);
    });
  }

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (step === 1 && selected.length === 0) {
      setErrors({ categories: "Keep at least one category." });
      return;
    }
    if (step === 2 && !parsePlans(plans)) return;
    if (last) return finish(balance, plans);
    setErrors({});
    setStep(step + 1);
  }

  /** Skips the current (optional) step, discarding what was entered in it. */
  function skip() {
    setErrors({});
    if (step === 1) {
      setDrafts(initialDrafts(categories));
      setPlans({});
    }
    if (step === 2) setPlans({});
    if (last) {
      setBalance("");
      return finish("", step === 2 ? {} : plans);
    }
    setStep(step + 1);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <WalletIcon className="size-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 0 && name ? `Welcome, ${name}` : STEPS[step].title}
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">{STEPS[step].description}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          {step > 0 ? <span>Optional</span> : null}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label="Setup progress" />
      </div>

      <Card>
        <CardContent>
          <form onSubmit={next} noValidate className="flex flex-col gap-5">
            {step === 0 ? <CurrencyStep currency={currency} onChange={setCurrency} /> : null}
            {step === 1 ? (
              <CategoriesStep
                drafts={drafts}
                onChange={(d) => {
                  setDrafts(d);
                  setErrors({});
                }}
                error={errors.categories}
              />
            ) : null}
            {step === 2 ? (
              <PlansStep drafts={selected} plans={plans} onChange={setPlans} currency={currency} errors={errors} />
            ) : null}
            {step === 3 ? (
              <Field data-invalid={!!errors.balance}>
                <FieldLabel htmlFor="welcome-balance">Current balance</FieldLabel>
                <InputGroup className="h-11">
                  <InputGroupInput
                    id="welcome-balance"
                    inputMode="decimal"
                    placeholder={toInputValue(0, currency)}
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="tabular"
                    autoFocus
                  />
                  <CurrencyAddon currency={currency} />
                </InputGroup>
                <FieldDescription>Use a minus sign if you’re in debt. You can change it later in Settings.</FieldDescription>
                <FieldError>{errors.balance}</FieldError>
              </Field>
            ) : null}

            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" className="h-11 w-full gap-2" disabled={pending}>
                {last ? (pending ? "Saving…" : "Finish") : "Continue"}
                {last ? <CheckIcon /> : <ArrowRightIcon />}
              </Button>
              {step > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-11 gap-2"
                    disabled={pending}
                    onClick={() => {
                      setErrors({});
                      setStep(step - 1);
                    }}
                  >
                    <ArrowLeftIcon />
                    Back
                  </Button>
                  <Button type="button" variant="ghost" size="lg" className="h-11" disabled={pending} onClick={skip}>
                    {last ? "Skip & finish" : "Skip"}
                  </Button>
                </div>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-pretty text-muted-foreground">
        {step === 0
          ? "Next you can set up categories, a monthly plan and your balance — or skip them."
          : "Everything here can be changed later in Settings."}
      </p>
    </>
  );
}

function CurrencyStep({ currency, onChange }: { currency: CurrencyCode; onChange: (c: CurrencyCode) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor="welcome-currency">Currency</FieldLabel>
      <CurrencySelect id="welcome-currency" value={currency} onChange={onChange} className="h-11!" />
      <FieldDescription>
        Amounts will look like <CurrencyExample currency={currency} className="font-medium text-foreground" />. You can
        change it later in Settings.
      </FieldDescription>
    </Field>
  );
}

function CategoriesStep({
  drafts,
  onChange,
  error,
}: {
  drafts: Draft[];
  onChange: (drafts: Draft[]) => void;
  error?: string;
}) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (drafts.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError("You already have this category.");
      return;
    }
    if (drafts.filter((d) => !d.id).length >= 30) {
      setNameError("Add more later in Settings.");
      return;
    }
    const color = CATEGORY_COLOR_KEYS[drafts.length % CATEGORY_COLOR_KEYS.length];
    onChange([...drafts, { key: crypto.randomUUID(), name: trimmed.slice(0, 50), color, selected: true }]);
    setName("");
    setNameError("");
  }

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!error}>
        <FieldLabel>Categories</FieldLabel>
        <ul className="-my-1 divide-y">
          {drafts.map((d) => (
            <li key={d.key} className="flex min-h-12 items-center gap-3 py-1">
              <CategoryDot color={d.color} className="size-3" />
              <label
                htmlFor={`welcome-cat-${d.key}`}
                className="min-w-0 flex-1 truncate text-sm font-medium data-[off=true]:text-muted-foreground"
                data-off={!d.selected}
              >
                {d.name}
              </label>
              {d.id ? (
                <Switch
                  id={`welcome-cat-${d.key}`}
                  checked={d.selected}
                  onCheckedChange={(selected) =>
                    onChange(drafts.map((x) => (x.key === d.key ? { ...x, selected } : x)))
                  }
                />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Remove ${d.name}`}
                  onClick={() => onChange(drafts.filter((x) => x.key !== d.key))}
                  className="-mr-2"
                >
                  <XIcon />
                </Button>
              )}
            </li>
          ))}
        </ul>
        <FieldError>{error}</FieldError>
      </Field>

      <Field data-invalid={!!nameError}>
        <FieldLabel htmlFor="welcome-new-cat">Add your own</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="welcome-new-cat"
            value={name}
            maxLength={50}
            placeholder="e.g. Kids, Pets, Travel"
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="h-10"
          />
          <Button type="button" variant="outline" className="h-10" onClick={add} disabled={!name.trim()}>
            <PlusIcon /> Add
          </Button>
        </div>
        <FieldError>{nameError}</FieldError>
      </Field>
    </div>
  );
}

function PlansStep({
  drafts,
  plans,
  onChange,
  currency,
  errors,
}: {
  drafts: Draft[];
  plans: Record<string, string>;
  onChange: (plans: Record<string, string>) => void;
  currency: string;
  errors: Record<string, string>;
}) {
  const total = drafts.reduce((sum, d) => sum + (parseMoney(plans[d.key] ?? "", currency) ?? 0), 0);
  return (
    <div className="flex flex-col gap-3">
      <ul className="-my-1 divide-y">
        {drafts.map((d) => {
          const error = errors[`plan:${d.key}`];
          return (
            <li key={d.key} className="flex flex-col gap-1 py-2">
              <div className="flex items-center gap-3">
                <CategoryDot color={d.color} className="size-3" />
                <label htmlFor={`welcome-plan-${d.key}`} className="min-w-0 flex-1 truncate text-sm font-medium">
                  {d.name}
                </label>
                <InputGroup className="h-10 w-32 shrink-0 sm:w-36" data-invalid={!!error || undefined}>
                  <InputGroupInput
                    id={`welcome-plan-${d.key}`}
                    inputMode="decimal"
                    placeholder="—"
                    value={plans[d.key] ?? ""}
                    onChange={(e) => onChange({ ...plans, [d.key]: e.target.value })}
                    aria-invalid={!!error || undefined}
                    className="tabular text-right"
                  />
                  <CurrencyAddon currency={currency} />
                </InputGroup>
              </div>
              {error ? <p className="text-right text-sm text-destructive">{error}</p> : null}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">Planned per month</span>
        <span className="tabular font-medium">{formatMoney(total, { currency })}</span>
      </div>
      <FieldDescription>Applies to every month. You can adjust a single month later in Statistics.</FieldDescription>
    </div>
  );
}
