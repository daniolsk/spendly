"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ChartColumnIcon,
  CircleCheckIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  ScaleIcon,
  SettingsIcon,
  TargetIcon,
  WalletIcon,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import "./preview-loop.css";

// Sample data only: the landing page is public, so it never shows real records.
const PLAN = [
  { name: "Codzienne wydatki", color: "aqua", spent: 31240, plan: 40000, daily: true },
  { name: "Koszty stałe", color: "gray", spent: 161299, plan: 161299 },
  { name: "Samochód", color: "blue", spent: 24750, plan: 41500 },
  { name: "Konto wspólne", color: "violet", spent: 100000, plan: 150000 },
  { name: "Inne", color: "orange", spent: 52300, plan: 45000 },
];
const ROWS = [
  { day: "Tue 14 Oct", total: null, items: [["Biedronka", "Codzienne wydatki", "aqua", -8640], ["Paliwo", "Samochód", "blue", -24750]] },
  {
    day: "Mon 13 Oct",
    total: -42801,
    items: [["Konto wspólne", "Konto wspólne", "violet", -50000], ["Kino", "Inne", "orange", -5800], ["Zwrot · Zalando", "Inne · Refund", "orange", 12999]],
  },
  { day: "Fri 10 Oct", total: -11900, items: [["Internet + telefon", "Koszty stałe", "gray", -11900]] },
] as const;
const CHIPS = [
  ["Codzienne wydatki", "aqua"],
  ["Inne", "orange"],
  ["Konto wspólne", "violet"],
  ["Koszty stałe", "gray"],
  ["Samochód", "blue"],
  ["Oszczędności", "red"],
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const INCOME = [9200, 9200, 9650, 9800, 9800, 10150, 9800, 9800, 10300, 9800];
const EXPENSE = [7120, 6480, 7810, 6950, 8390, 7240, 8120, 6890, 7460, 6167];
const CHART = { x0: 46, x1: 512, y0: 340, y1: 14, max: 12000 };
const chartY = (v: number) => CHART.y0 - (v / CHART.max) * (CHART.y0 - CHART.y1);
const SLOT = (CHART.x1 - CHART.x0) / MONTHS.length;

const CATS = [
  { name: "Inne", color: "orange", v: 18200 },
  { name: "Koszty stałe", color: "gray", v: 16130 },
  { name: "Konto wspólne", color: "violet", v: 15000 },
  { name: "Codzienne wydatki", color: "aqua", v: 9870 },
  { name: "Oszczędności", color: "red", v: 7000 },
  { name: "Samochód", color: "blue", v: 6427 },
];
const CAT_TOTAL = CATS.reduce((s, c) => s + c.v, 0);
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Month figures before and after the animated expense (minor units).
const START = { exp: 612389, bal: 367611, since: 2415579, day: 33390, daily: 31240 };
const ADDED = 4290;
const DAILY_PLAN = 40000;

const cat = (color: string) => `var(--cat-${color})`;
const zl = (minor: number) => formatMoney(minor);
const pct = (spent: number, plan: number) => Math.round((spent / plan) * 100);

/** Looping walkthrough of the app (add an expense → month updates → year view) shown under the landing hero. */
export function PreviewLoop() {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current!;
    const q = (name: string) => viewport.querySelector<HTMLElement>(`[data-pl="${name}"]`)!;
    const stage = q("stage");
    const frame = q("frame");

    let scale = 1;
    const fit = () => {
      scale = viewport.clientWidth / 1120;
      stage.style.transform = `scale(${scale})`;
    };
    const resize = new ResizeObserver(fit);
    resize.observe(viewport);
    fit();
    stage.classList.add("pl-ready");

    // Pausable clock: time only advances while the preview is on screen and the tab is visible.
    let onScreen = true;
    let cancelled = false;
    const playing = () => onScreen && document.visibilityState === "visible";
    const setPausedClass = () => stage.classList.toggle("pl-paused", !playing());
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      setPausedClass();
    });
    intersection.observe(viewport);
    document.addEventListener("visibilitychange", setPausedClass);

    const CANCEL = Symbol("cancel");
    const frames = (onTick: (elapsed: number) => boolean) =>
      new Promise<void>((resolve, reject) => {
        let last = performance.now();
        let elapsed = 0;
        const tick = (t: number) => {
          if (cancelled) return reject(CANCEL);
          if (playing()) elapsed += t - last;
          last = t;
          if (onTick(elapsed)) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    const wait = (ms: number) => frames((e) => e >= ms);
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tween = (ms: number, fn: (t: number) => void) =>
      frames((e) => {
        const t = Math.min(e / ms, 1);
        fn(ease(t));
        return t >= 1;
      });

    // Cursor
    const cursor = q("cursor");
    const ripple = q("ripple");
    let cx = 940;
    let cy = 600;
    const placeCursor = (x: number, y: number) => {
      cx = x;
      cy = y;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    };
    const center = (el: Element, dx = 0, dy = 0): [number, number] => {
      const r = el.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      return [(r.left - f.left + r.width / 2) / scale + dx, (r.top - f.top + r.height / 2) / scale + dy];
    };
    const moveTo = async (el: Element, ms: number, dx = 0, dy = 0) => {
      const [tx, ty] = center(el, dx, dy);
      const sx = cx;
      const sy = cy;
      // A slight arc reads as a hand movement rather than a straight slide.
      const bend = Math.min(60, Math.hypot(tx - sx, ty - sy) * 0.15);
      await tween(ms, (t) => placeCursor(sx + (tx - sx) * t, sy + (ty - sy) * t - Math.sin(Math.PI * t) * bend));
    };
    const click = async (el?: HTMLElement) => {
      cursor.classList.add("pl-down");
      el?.classList.add("pl-press");
      ripple.classList.remove("pl-go");
      void ripple.offsetWidth;
      ripple.classList.add("pl-go");
      await wait(140);
      cursor.classList.remove("pl-down");
      el?.classList.remove("pl-press");
      await wait(120);
    };
    const type = async (target: HTMLElement, text: string, placeholder: HTMLElement) => {
      placeholder.hidden = true;
      for (let i = 1; i <= text.length; i++) {
        target.textContent = text.slice(0, i);
        await wait(95 + Math.random() * 70);
      }
    };

    // Scene state
    const render = (v: { exp: number; bal: number; since: number; day: number }) => {
      q("tExp").textContent = zl(v.exp);
      q("tBal").textContent = zl(v.bal);
      q("tSince").textContent = zl(v.since);
      q("dayTotal").textContent = zl(-v.day);
    };
    const setDaily = (spent: number) => {
      q("pctDaily").textContent = `${pct(spent, DAILY_PLAN)}%`;
    };
    const showView = (name: "month" | "year") => {
      q("viewMonth").classList.toggle("pl-hidden", name !== "month");
      q("viewYear").classList.toggle("pl-hidden", name !== "year");
      q("viewYear").classList.toggle("pl-shown", name === "year");
      q("navMonth").classList.toggle("pl-on", name === "month");
      q("navYear").classList.toggle("pl-on", name === "year");
      q("pill").style.transform = `translateY(${name === "year" ? 36 : 0}px)`;
      for (const seg of viewport.querySelectorAll<SVGCircleElement>("[data-pl-seg]")) {
        seg.style.strokeDashoffset = name === "year" ? "0" : seg.dataset.plSeg!;
      }
    };
    const pop = (name: string, text: string) => {
      const card = q(name);
      q(`${name}v`).textContent = text;
      card.classList.remove("pl-pop");
      void card.offsetWidth;
      card.classList.add("pl-pop");
    };
    const reset = () => {
      stage.classList.add("pl-no-anim");
      render(START);
      showView("month");
      q("newwrap").classList.remove("pl-open");
      q("newrow").classList.remove("pl-fresh");
      q("fillDaily").style.width = `${pct(START.daily, DAILY_PLAN)}%`;
      setDaily(START.daily);
      for (const name of ["scrim", "dialog", "toast", "tip"]) q(name).classList.remove("pl-on");
      q("chipDaily").classList.remove("pl-on");
      q("inAmount").classList.remove("pl-focus");
      q("inDesc").classList.remove("pl-focus");
      q("amountText").textContent = "";
      q("descText").textContent = "";
      q("amountPh").hidden = false;
      q("descPh").hidden = false;
      q("chartCard").classList.remove("pl-dim");
      q("f1v").textContent = "Biedronka · 86,40 zł";
      q("f2v").textContent = `${zl(DAILY_PLAN - START.daily)} left this month`;
      q("f3v").textContent = `+${zl(START.since)}`;
      placeCursor(940, 600);
      void stage.offsetWidth;
      stage.classList.remove("pl-no-anim");
    };

    async function loop() {
      for (;;) {
        reset();
        frame.style.opacity = "1";
        cursor.classList.add("pl-on");
        await wait(1100);

        // 1. Add an expense
        await moveTo(q("btnExpense"), 900);
        await click(q("btnExpense"));
        q("scrim").classList.add("pl-on");
        q("dialog").classList.add("pl-on");
        await wait(500);
        await moveTo(q("inAmount"), 550, -60);
        await click();
        q("inAmount").classList.add("pl-focus");
        await type(q("amountText"), "42,90", q("amountPh"));
        await wait(250);
        await moveTo(q("chipDaily"), 600);
        await click(q("chipDaily"));
        q("chipDaily").classList.add("pl-on");
        q("inAmount").classList.remove("pl-focus");
        await wait(250);
        await moveTo(q("inDesc"), 450, -80);
        await click();
        q("inDesc").classList.add("pl-focus");
        await type(q("descText"), "Żabka", q("descPh"));
        await wait(300);
        await moveTo(q("submit"), 550);
        await click(q("submit"));
        q("inDesc").classList.remove("pl-focus");
        q("scrim").classList.remove("pl-on");
        q("dialog").classList.remove("pl-on");

        // 2. The month updates
        await wait(200);
        q("toast").classList.add("pl-on");
        q("newwrap").classList.add("pl-open");
        q("newrow").classList.add("pl-fresh");
        pop("f1", "Żabka · 42,90 zł");
        q("fillDaily").style.width = `${pct(START.daily + ADDED, DAILY_PLAN)}%`;
        await tween(1100, (t) => {
          const d = Math.round(ADDED * t);
          render({ exp: START.exp + d, bal: START.bal - d, since: START.since - d, day: START.day + d });
          setDaily(START.daily + d);
        });
        pop("f2", `${zl(DAILY_PLAN - START.daily - ADDED)} left this month`);
        await wait(250);
        pop("f3", `+${zl(START.since - ADDED)}`);
        q("newrow").classList.remove("pl-fresh");
        await wait(1700);
        q("toast").classList.remove("pl-on");
        await wait(400);

        // 3. The year at a glance
        await moveTo(q("navYear"), 1000);
        await click();
        showView("year");
        await wait(1500);
        const [incomeBar, expenseBar] = viewport.querySelectorAll(".pl-bar.pl-hl");
        await moveTo(expenseBar, 800, 0, -10);
        const chartCard = q("chartCard");
        chartCard.classList.add("pl-dim");
        const card = chartCard.getBoundingClientRect();
        const bar = incomeBar.getBoundingClientRect();
        const tip = q("tip");
        tip.style.left = `${(bar.left - card.left + bar.width / 2) / scale - 170}px`;
        tip.style.top = `${(bar.top - card.top + bar.height / 2) / scale - 80}px`;
        tip.classList.add("pl-on");
        await wait(2200);
        tip.classList.remove("pl-on");
        chartCard.classList.remove("pl-dim");
        await wait(300);
        await moveTo(q("navMonth"), 900);
        await click();
        showView("month");
        await wait(1800);

        cursor.classList.remove("pl-on");
        frame.style.opacity = "0";
        await wait(650);
      }
    }

    reset();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      loop().catch((e) => {
        if (e !== CANCEL) console.error(e);
      });
    }

    return () => {
      cancelled = true;
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", setPausedClass);
    };
  }, []);

  let acc = 0;
  return (
    <div ref={viewportRef} className="pl-viewport" aria-hidden>
      <div className="pl-stage" data-pl="stage">
        <div className="pl-float pl-f1" data-pl="f1">
          <div className="pl-float-ic" style={{ background: `color-mix(in srgb, ${cat("aqua")} 16%, transparent)`, color: cat("aqua") }}>
            <ReceiptTextIcon />
          </div>
          <div className="pl-float-t">
            <span>Expense added</span>
            <b data-pl="f1v" />
          </div>
        </div>
        <div className="pl-float pl-f2" data-pl="f2">
          <div className="pl-float-ic" style={{ background: `color-mix(in srgb, ${cat("blue")} 16%, transparent)`, color: cat("blue") }}>
            <TargetIcon />
          </div>
          <div className="pl-float-t">
            <span>Codzienne wydatki</span>
            <b data-pl="f2v" />
          </div>
        </div>
        <div className="pl-float pl-f3" data-pl="f3">
          <div className="pl-float-ic" style={{ background: `color-mix(in srgb, ${cat("violet")} 16%, transparent)`, color: cat("violet") }}>
            <PiggyBankIcon />
          </div>
          <div className="pl-float-t">
            <span>Since start</span>
            <b data-pl="f3v" />
          </div>
        </div>

        <div className="pl-frame" data-pl="frame">
          <div className="pl-titlebar">
            <i style={{ background: "#ff5f57" }} />
            <i style={{ background: "#febc2e" }} />
            <i style={{ background: "#28c840" }} />
            <span className="pl-url">spendly · October 2026</span>
          </div>
          <div className="pl-app">
            <aside className="pl-side">
              <div className="pl-logo">
                <span>
                  <WalletIcon size={13} />
                </span>
                Spendly
              </div>
              <div className="pl-nav">
                <div className="pl-pill" data-pl="pill" />
                <span className="pl-nav-item pl-on" data-pl="navMonth">
                  <CalendarIcon />
                  Month
                </span>
                <span className="pl-nav-item" data-pl="navYear">
                  <ChartColumnIcon />
                  Year
                </span>
                <span className="pl-nav-item">
                  <SettingsIcon />
                  Settings
                </span>
              </div>
            </aside>

            <div className="pl-main">
              <section className="pl-view" data-pl="viewMonth">
                <div className="pl-head">
                  <h2>October 2026</h2>
                  <div className="pl-btns">
                    <span className="pl-btn">+ Income</span>
                    <span className="pl-btn pl-primary" data-pl="btnExpense">
                      − Expense
                    </span>
                  </div>
                </div>
                <div className="pl-tiles">
                  <Tile icon={<ArrowDownLeftIcon />} label="Income" value={<span className="pl-income">{zl(980000)}</span>} />
                  <Tile icon={<ArrowUpRightIcon />} label="Expenses" value={<span data-pl="tExp" />} hint="of 6 427,99 zł planned" />
                  <Tile icon={<ScaleIcon />} label="Balance" value={<span data-pl="tBal" />} />
                  <Tile icon={<PiggyBankIcon />} label="Since start" value={<span data-pl="tSince" />} />
                </div>
                <div className="pl-cols">
                  <div className="pl-card pl-list">
                    {ROWS.map((group, gi) => (
                      <div key={group.day}>
                        <div className="pl-dayhead">
                          <span>{group.day}</span>
                          {group.total === null ? <span data-pl="dayTotal" /> : <span>{zl(group.total)}</span>}
                        </div>
                        {gi === 0 ? (
                          <div className="pl-newwrap" data-pl="newwrap">
                            <div>
                              <Row name="Żabka" category="Codzienne wydatki" color="aqua" amount={-ADDED} dataPl="newrow" />
                            </div>
                          </div>
                        ) : null}
                        {group.items.map(([name, category, color, amount]) => (
                          <Row key={name} name={name} category={category} color={color} amount={amount} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="pl-card pl-plan">
                    <h3>Plan vs. spent</h3>
                    {PLAN.map((c) => {
                      const p = pct(c.spent, c.plan);
                      return (
                        <div key={c.name} className="pl-pitem">
                          <div className="pl-ptop">
                            <span>
                              <i className="pl-dot" style={{ background: cat(c.color) }} />
                              {c.name}
                            </span>
                            <span className={p > 100 ? "pl-over" : undefined} data-pl={c.daily ? "pctDaily" : undefined}>
                              {p}%
                            </span>
                          </div>
                          <div className="pl-track">
                            <div
                              className="pl-fill"
                              data-pl={c.daily ? "fillDaily" : undefined}
                              style={{ width: `${Math.min(p, 100)}%`, background: cat(c.color) }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="pl-view pl-hidden" data-pl="viewYear">
                <div className="pl-head">
                  <h2>
                    2026 <small>January – October</small>
                  </h2>
                </div>
                <div className="pl-tiles">
                  <Tile label="Income" value={<span className="pl-income">{zl(9750000)}</span>} />
                  <Tile label="Expenses" value={zl(7262679)} />
                  <Tile label="Balance" value={zl(2487321)} />
                  <Tile label="Avg. monthly spend" value={zl(726268)} />
                </div>
                <div className="pl-ygrid">
                  <div className="pl-ycard" data-pl="chartCard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3>Income vs. expenses</h3>
                      <div className="pl-legend">
                        <span>
                          <i style={{ background: "var(--chart-income)" }} />
                          Income
                        </span>
                        <span>
                          <i style={{ background: "var(--chart-expense)" }} />
                          Expenses
                        </span>
                      </div>
                    </div>
                    <svg className="pl-chart" viewBox="0 0 520 372">
                      {[0, 4000, 8000, 12000].map((t) => (
                        <g key={t}>
                          <line x1={CHART.x0} x2={CHART.x1} y1={chartY(t)} y2={chartY(t)} />
                          <text x={CHART.x0 - 8} y={chartY(t) + 3} textAnchor="end">
                            {t === 0 ? "0" : t.toLocaleString("pl-PL", { useGrouping: "always" } as Intl.NumberFormatOptions)}
                          </text>
                        </g>
                      ))}
                      {MONTHS.map((m, i) => {
                        const x = CHART.x0 + SLOT * i + SLOT / 2;
                        const hl = i === MONTHS.length - 1 ? " pl-hl" : "";
                        return (
                          <g key={m}>
                            <rect
                              className={`pl-bar${hl}`}
                              style={{ transitionDelay: `${i * 60}ms` }}
                              x={x - 16.5}
                              y={chartY(INCOME[i])}
                              width={15}
                              height={CHART.y0 - chartY(INCOME[i])}
                              rx={3}
                              fill="var(--chart-income)"
                            />
                            <rect
                              className={`pl-bar${hl}`}
                              style={{ transitionDelay: `${i * 60 + 30}ms` }}
                              x={x + 1.5}
                              y={chartY(EXPENSE[i])}
                              width={15}
                              height={CHART.y0 - chartY(EXPENSE[i])}
                              rx={3}
                              fill="var(--chart-expense)"
                            />
                            <text x={x} y={CHART.y0 + 18} textAnchor="middle">
                              {m}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div className="pl-tip" data-pl="tip">
                      <b>October 2026</b>
                      <div>
                        <span>
                          <i style={{ background: "var(--chart-income)" }} />
                          Income
                        </span>
                        <span>{zl(980000)}</span>
                      </div>
                      <div>
                        <span>
                          <i style={{ background: "var(--chart-expense)" }} />
                          Expenses
                        </span>
                        <span>{zl(616679)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pl-ycard">
                    <h3>Spending by category</h3>
                    <div className="pl-donutwrap">
                      <svg className="pl-donut" width="150" height="150" viewBox="0 0 132 132">
                        <circle className="pl-ring" cx="66" cy="66" r={RADIUS} />
                        {CATS.map((c, i) => {
                          const len = Math.max((c.v / CAT_TOTAL) * CIRCUMFERENCE - 2.5, 0);
                          const rotate = (acc / CAT_TOTAL) * 360 - 90;
                          acc += c.v;
                          return (
                            <circle
                              key={c.name}
                              data-pl-seg={len}
                              cx="66"
                              cy="66"
                              r={RADIUS}
                              stroke={cat(c.color)}
                              strokeDasharray={`${len} ${CIRCUMFERENCE}`}
                              strokeDashoffset={len}
                              transform={`rotate(${rotate} 66 66)`}
                              style={{ transitionDelay: `${i * 90}ms` }}
                            />
                          );
                        })}
                        <text x="66" y="66" textAnchor="middle">
                          72 627 zł
                        </text>
                        <text className="pl-sub" x="66" y="80" textAnchor="middle">
                          this year
                        </text>
                      </svg>
                      <div className="pl-dlist">
                        {CATS.map((c) => (
                          <div key={c.name}>
                            <i className="pl-dot" style={{ background: cat(c.color) }} />
                            <span>{c.name}</span>
                            <span>{Math.round((c.v / CAT_TOTAL) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pl-scrim" data-pl="scrim" />
              <div className="pl-dialog" data-pl="dialog">
                <h4>New transaction</h4>
                <div className="pl-seg">
                  <span className="pl-on">Expense</span>
                  <span>Income</span>
                </div>
                <div className="pl-fld">
                  <span>Amount</span>
                  <div className="pl-input pl-big" data-pl="inAmount">
                    <span data-pl="amountText" />
                    <span className="pl-caret" />
                    <span className="pl-ph" data-pl="amountPh">
                      0,00
                    </span>
                    <span className="pl-unit">zł</span>
                  </div>
                </div>
                <div className="pl-fld">
                  <span>Category</span>
                  <div className="pl-chips">
                    {CHIPS.map(([name, color], i) => (
                      <div key={name} className="pl-chip" data-pl={i === 0 ? "chipDaily" : undefined}>
                        <i className="pl-dot" style={{ background: cat(color) }} />
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pl-fld">
                  <span>Description</span>
                  <div className="pl-input" data-pl="inDesc">
                    <span data-pl="descText" />
                    <span className="pl-caret" />
                    <span className="pl-ph" data-pl="descPh">
                      Optional
                    </span>
                  </div>
                </div>
                <div className="pl-submit" data-pl="submit">
                  Add expense
                </div>
              </div>
              <div className="pl-toast" data-pl="toast">
                <CircleCheckIcon />
                Expense added
              </div>
            </div>
          </div>

          <div className="pl-cursor" data-pl="cursor">
            <span className="pl-ripple" data-pl="ripple" />
            <svg viewBox="0 0 24 24">
              <path d="M4 3l15 7.5-6.2 1.6L10 18.5Z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, hint }: { icon?: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="pl-tile">
      <div className="pl-lbl">
        {icon}
        {label}
      </div>
      <div className="pl-val">{value}</div>
      {hint ? <div className="pl-hint">{hint}</div> : null}
    </div>
  );
}

function Row({ name, category, color, amount, dataPl }: { name: string; category: string; color: string; amount: number; dataPl?: string }) {
  return (
    <div className="pl-row" data-pl={dataPl}>
      <i className="pl-dot" style={{ background: cat(color) }} />
      <div className="pl-txt">
        <b>{name}</b>
        <span>{category}</span>
      </div>
      <span className={amount > 0 ? "pl-amt pl-income" : "pl-amt"}>{formatMoney(amount, { signed: true })}</span>
    </div>
  );
}
