import type { ReactNode } from "react";
import {
  CalendarRangeIcon,
  ChartColumnIcon,
  ClockIcon,
  HomeIcon,
  LockKeyholeIcon,
  MoonIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TargetIcon,
  UndoDotIcon,
  UserRoundIcon,
} from "lucide-react";
import { cn } from "cn";
import { CategoryDot } from "@/components/category-dot";
import { HourlyDemo, LivingDemo, PlanDemo, RefundDemo, YearDemo } from "./feature-demos";

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <span className="text-xs font-semibold tracking-wider text-[#1baf7a] uppercase dark:text-[#3ddc9c]">{eyebrow}</span>
      <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tighter text-balance sm:text-5xl">{title}</h2>
      {children ? <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">{children}</p> : null}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-2xl border bg-background/70 p-5 text-left shadow-sm backdrop-blur sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg border bg-card text-[#1baf7a] dark:text-[#3ddc9c] [&_svg]:size-4.5">
          {icon}
        </span>
        <h3 className="mt-1 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      {children ? <div className="mt-auto rounded-xl bg-muted/50 p-3 ring-1 ring-foreground/5 sm:p-4">{children}</div> : null}
    </article>
  );
}

/** Bento grid of interactive feature demos. */
export function FeatureSection() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-8">
      <SectionHeading eyebrow="Try it" title={<span id="features-title">Everything a month needs. Nothing it doesn&apos;t.</span>}>
        These are live — tap, toggle and type to see how Spendly works with sample numbers.
      </SectionHeading>

      <div className="mt-12 grid gap-4 sm:mt-14 lg:grid-cols-6">
        <FeatureCard
          className="lg:col-span-3"
          icon={<TargetIcon />}
          title="Plan every category"
          description="Set a default plan once and adjust any month that's different. Overspending turns red, and the predicted balance shows where the month will land."
        >
          <PlanDemo />
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-3"
          icon={<ClockIcon />}
          title="Hourly income, done for you"
          description="Paid by the hour? Enter hours and rate — the amount is calculated. The hours field does arithmetic and defaults to the month's working time."
        >
          <HourlyDemo />
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-2"
          icon={<UndoDotIcon />}
          title="Refunds that make sense"
          description="Got money back? Mark it as a refund and it lowers that category's spend instead of counting as income."
        >
          <RefundDemo />
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-4"
          icon={<HomeIcon />}
          title="Your real cost of living"
          description="Savings transfers or one-off splurges can hide what life actually costs. Leave any category out of the cost of living and see the honest number."
        >
          <LivingDemo />
        </FeatureCard>
        <FeatureCard
          className="lg:col-span-6"
          icon={<ChartColumnIcon />}
          title="The whole year at a glance"
          description="Income against expenses for every month, what you kept, and your running balance since the day you started. Hover or tap a month."
        >
          <YearDemo />
        </FeatureCard>
      </div>
    </section>
  );
}

const QUICK_CATEGORIES = [
  { name: "Groceries", color: "aqua", selected: true },
  { name: "Eating out", color: "orange" },
  { name: "Transport", color: "blue" },
  { name: "Shopping", color: "magenta" },
  { name: "Housing & bills", color: "gray" },
  { name: "Entertainment", color: "violet" },
];

const MOBILE_POINTS = [
  { icon: ReceiptTextIcon, title: "Three taps to log", text: "Expense, amount, category. Today's date is already filled in." },
  { icon: SmartphoneIcon, title: "Install it like an app", text: "Add Spendly to your home screen and it opens full-screen." },
  { icon: CalendarRangeIcon, title: "Grouped by day", text: "Every month reads like a short diary of where the money went." },
  { icon: MoonIcon, title: "Light and dark", text: "Follows your system theme, easy on the eyes at night." },
];

/** A phone mockup of the quick-add sheet next to the mobile selling points. */
export function MobileSection() {
  return (
    <section aria-labelledby="mobile-title" className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <span className="text-xs font-semibold tracking-wider text-[#1baf7a] uppercase dark:text-[#3ddc9c]">On the go</span>
        <h2 id="mobile-title" className="mt-3 text-3xl leading-tight font-semibold tracking-tighter text-balance sm:text-5xl">
          Log it before you leave the till.
        </h2>
        <p className="mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Spendly is built phone-first. Adding an expense takes a few seconds, so the month stays complete without any
          end-of-week catch-up.
        </p>
        <ul className="mt-8 grid w-full max-w-xl gap-x-6 gap-y-5 text-left sm:grid-cols-2">
          {MOBILE_POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-[#1baf7a] dark:text-[#3ddc9c]">
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{title}</span>
                <span className="text-sm text-pretty text-muted-foreground">{text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex justify-center" aria-hidden>
        <div className="absolute top-1/2 left-1/2 size-[22rem] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgba(27,175,122,0.22),transparent_65%)] blur-2xl" />
        <PhoneMock />
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="relative w-[17rem] rounded-[2.75rem] border-[7px] border-foreground/90 bg-background p-0 shadow-2xl shadow-black/20 dark:border-neutral-700 dark:shadow-black/60">
      <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-foreground/90 dark:bg-neutral-700" />
      <div className="relative h-[33rem] overflow-hidden rounded-[2.25rem] text-left">
        {/* Month view behind the sheet */}
        <div className="flex flex-col gap-3 px-4 pt-10">
          <span className="text-base font-semibold tracking-tight">October 2026</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Income", "9 800,00 zł"],
              ["Expenses", "6 123,89 zł"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border bg-card p-2">
                <div className="text-[9px] text-muted-foreground">{l}</div>
                <div className="tabular text-xs font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-card">
            {[
              ["Fuel", "blue", "−247,50 zł"],
              ["Concert tickets", "violet", "−500,00 zł"],
              ["Dinner out", "orange", "−58,00 zł"],
            ].map(([n, c, v]) => (
              <div key={n} className="flex items-center gap-2 border-b px-2.5 py-2 text-[10px] last:border-b-0">
                <CategoryDot color={c} className="size-1.5" />
                <span className="flex-1 truncate">{n}</span>
                <span className="tabular">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-black/25 dark:bg-black/50" />

        {/* Quick-add sheet */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-2xl border-t bg-background px-4 pt-2 pb-5">
          <span className="mx-auto h-1 w-10 rounded-full bg-muted" />
          <span className="text-sm font-semibold">New transaction</span>
          <div className="grid grid-cols-2 rounded-lg bg-muted p-0.5 text-[11px] font-medium">
            <span className="rounded-md bg-background py-1 text-center shadow-sm">Expense</span>
            <span className="py-1 text-center text-muted-foreground">Income</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium">Amount</span>
            <div className="flex h-9 items-center justify-between rounded-lg border px-2.5 text-sm">
              <span className="tabular font-medium">
                42,90<span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-foreground" />
              </span>
              <span className="text-xs text-muted-foreground">zł</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_CATEGORIES.map((c) => (
              <span
                key={c.name}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border px-2 text-[10px]",
                  c.selected && "border-foreground bg-muted font-medium",
                )}
              >
                <CategoryDot color={c.color} className="size-2" />
                <span className="truncate">{c.name}</span>
              </span>
            ))}
          </div>
          <span className="flex h-9 items-center justify-center rounded-lg bg-primary text-xs font-medium text-primary-foreground">
            Add expense
          </span>
        </div>
      </div>
    </div>
  );
}

const TRUST = [
  {
    icon: UserRoundIcon,
    title: "Only you see your data",
    text: "Sign in with Google. Every account is isolated, and every request is checked against it.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Locks itself",
    text: "Walk away or switch apps and the dashboard hides behind the start page until you open it again.",
  },
  {
    icon: ShieldCheckIcon,
    title: "No bank access, no ads",
    text: "Nothing is connected to your bank. No analytics, no tracking cookies, and your data is never sold.",
  },
];

export function TrustSection() {
  return (
    <section aria-labelledby="trust-title">
      <SectionHeading eyebrow="Private by design" title={<span id="trust-title">Your money history stays yours.</span>} />
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {TRUST.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-2 rounded-2xl border bg-background/70 p-5 text-left shadow-sm backdrop-blur sm:p-6">
            <span className="flex size-9 items-center justify-center rounded-lg border bg-card text-[#1baf7a] dark:text-[#3ddc9c]">
              <Icon className="size-4.5" />
            </span>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-pretty text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
