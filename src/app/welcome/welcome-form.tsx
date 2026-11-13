"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PlusIcon, WalletIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { CategoryDot } from "@/components/category-dot";
import { CurrencyAddon } from "@/components/money";
import { CurrencyExample, CurrencySelect } from "@/components/settings/currency-select";
import { LanguageSelect } from "@/components/settings/language-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_COLOR_KEYS } from "@/lib/colors";
import { DEFAULT_CURRENCY, guessCurrency, type CurrencyCode } from "@/lib/currency";
import { defaultCategoryKey } from "@/lib/default-categories";
import { getTranslator, type Language, type MessageKey } from "@/lib/i18n";
import { I18nProvider, useT } from "@/lib/i18n/client";
import { formatMoney, parseMoney, toInputValue } from "@/lib/money";
import { completeOnboarding } from "@/server/actions";

const subscribeNever = () => () => {};

type StarterCategory = { id: string; name: string; color: string };
/**
 * A category in the setup list: a seeded one (with id) or one added here. Untouched default
 * categories carry their message key, so they show (and are saved) in the picked language.
 */
type Draft = { key: string; id?: string; name: string; nameKey?: MessageKey; color: string; selected: boolean };

const STEPS = [
  { title: "welcome.step0Title", description: "welcome.step0Description" },
  { title: "welcome.step1Title", description: "welcome.step1Description" },
  { title: "welcome.step2Title", description: "welcome.step2Description" },
  { title: "welcome.step3Title", description: "welcome.step3Description" },
] as const satisfies readonly { title: MessageKey; description: MessageKey }[];

const initialDrafts = (categories: StarterCategory[]): Draft[] =>
  categories.map((c) => ({
    key: c.id,
    id: c.id,
    name: c.name,
    nameKey: defaultCategoryKey(c.name),
    color: c.color,
    selected: true,
  }));

export function WelcomeForm({
  name,
  categories,
  initialLanguage,
}: {
  name: string;
  categories: StarterCategory[];
  initialLanguage: Language;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const t = getTranslator(language);
  const draftName = (d: Draft) => (d.nameKey ? t(d.nameKey) : d.name);

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
      if (value === null) next[`plan:${d.key}`] = t("common.invalidAmount");
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
        setErrors({ balance: t("common.invalidAmount") });
        return;
      }
      openingBalance = opening.trim().startsWith("-") ? -parsed : parsed;
    }
    startTransition(async () => {
      const res = await completeOnboarding({
        currency,
        language,
        keep: selected
          .filter((d) => d.id)
          .map((d) => ({
            id: d.id!,
            defaultPlan: planMap.get(d.key) ?? 0,
            // Default categories are stored in English; rename them to the picked language.
            ...(d.nameKey && language !== "en" && { name: draftName(d) }),
          })),
        add: selected
          .filter((d) => !d.id)
          .map((d) => ({ name: d.name, color: d.color, defaultPlan: planMap.get(d.key) ?? 0 })),
        openingBalance,
      });
      if (res.ok) {
        toast.success(t("welcome.done"));
        router.replace("/m");
      } else toast.error(res.error);
    });
  }

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    if (step === 1 && selected.length === 0) {
      setErrors({ categories: t("errors.keepOneCategory") });
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
    <I18nProvider language={language}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <WalletIcon className="size-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 0 && name ? t("welcome.hello", { name }) : t(STEPS[step].title)}
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">{t(STEPS[step].description)}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("welcome.step", { step: step + 1, total: STEPS.length })}</span>
          {step > 0 ? <span>{t("common.optional")}</span> : null}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label={t("welcome.progress")} />
      </div>

      <Card>
        <CardContent>
          <form onSubmit={next} noValidate className="flex flex-col gap-5">
            {step === 0 ? (
              <>
                <Field>
                  <FieldLabel htmlFor="welcome-language">{t("settings.language")}</FieldLabel>
                  <LanguageSelect id="welcome-language" value={language} onChange={setLanguage} className="h-11!" />
                </Field>
                <CurrencyStep currency={currency} onChange={setCurrency} />
              </>
            ) : null}
            {step === 1 ? (
              <CategoriesStep
                drafts={drafts}
                draftName={draftName}
                onChange={(d) => {
                  setDrafts(d);
                  setErrors({});
                }}
                error={errors.categories}
              />
            ) : null}
            {step === 2 ? (
              <PlansStep drafts={selected} draftName={draftName} plans={plans} onChange={setPlans} currency={currency} errors={errors} />
            ) : null}
            {step === 3 ? (
              <Field data-invalid={!!errors.balance}>
                <FieldLabel htmlFor="welcome-balance">{t("welcome.balance")}</FieldLabel>
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
                <FieldDescription>{t("welcome.balanceHint")}</FieldDescription>
                <FieldError>{errors.balance}</FieldError>
              </Field>
            ) : null}

            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" className="h-11 w-full gap-2" disabled={pending}>
                {last ? (pending ? t("common.saving") : t("welcome.finish")) : t("welcome.continue")}
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
                    {t("welcome.back")}
                  </Button>
                  <Button type="button" variant="ghost" size="lg" className="h-11" disabled={pending} onClick={skip}>
                    {last ? t("welcome.skipFinish") : t("welcome.skip")}
                  </Button>
                </div>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-pretty text-muted-foreground">
        {step === 0 ? t("welcome.footerFirst") : t("welcome.footer")}
      </p>
    </I18nProvider>
  );
}

function CurrencyStep({ currency, onChange }: { currency: CurrencyCode; onChange: (c: CurrencyCode) => void }) {
  const t = useT();
  return (
    <Field>
      <FieldLabel htmlFor="welcome-currency">{t("settings.currency")}</FieldLabel>
      <CurrencySelect id="welcome-currency" value={currency} onChange={onChange} className="h-11!" />
      <FieldDescription>
        {t.rich("welcome.currencyHint", {
          example: <CurrencyExample currency={currency} className="font-medium text-foreground" />,
        })}
      </FieldDescription>
    </Field>
  );
}

function CategoriesStep({
  drafts,
  draftName,
  onChange,
  error,
}: {
  drafts: Draft[];
  draftName: (d: Draft) => string;
  onChange: (drafts: Draft[]) => void;
  error?: string;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (drafts.some((d) => draftName(d).toLowerCase() === trimmed.toLowerCase())) {
      setNameError(t("welcome.duplicate"));
      return;
    }
    if (drafts.filter((d) => !d.id).length >= 30) {
      setNameError(t("welcome.addLater"));
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
        <FieldLabel>{t("welcome.categories")}</FieldLabel>
        <ul className="-my-1 divide-y">
          {drafts.map((d) => (
            <li key={d.key} className="flex min-h-12 items-center gap-3 py-1">
              <CategoryDot color={d.color} className="size-3" />
              <label
                htmlFor={`welcome-cat-${d.key}`}
                className="min-w-0 flex-1 truncate text-sm font-medium data-[off=true]:text-muted-foreground"
                data-off={!d.selected}
              >
                {draftName(d)}
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
                  aria-label={t("welcome.remove", { name: d.name })}
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
        <FieldLabel htmlFor="welcome-new-cat">{t("welcome.addOwn")}</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="welcome-new-cat"
            value={name}
            maxLength={50}
            placeholder={t("welcome.addPlaceholder")}
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
            <PlusIcon /> {t("welcome.add")}
          </Button>
        </div>
        <FieldError>{nameError}</FieldError>
      </Field>
    </div>
  );
}

function PlansStep({
  drafts,
  draftName,
  plans,
  onChange,
  currency,
  errors,
}: {
  drafts: Draft[];
  draftName: (d: Draft) => string;
  plans: Record<string, string>;
  onChange: (plans: Record<string, string>) => void;
  currency: string;
  errors: Record<string, string>;
}) {
  const t = useT();
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
                  {draftName(d)}
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
        <span className="text-muted-foreground">{t("welcome.plannedPerMonth")}</span>
        <span className="tabular font-medium">{formatMoney(total, { currency })}</span>
      </div>
      <FieldDescription>{t("welcome.plansHint")}</FieldDescription>
    </div>
  );
}
