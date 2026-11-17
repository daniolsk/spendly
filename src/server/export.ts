import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Translator } from "@/lib/i18n";
import { formatMoney, formatNumber } from "@/lib/money";
import { monthLabel } from "@/lib/month";
import type { ExportRow } from "./queries";

// Exports of all of a user's transactions. Amounts stay integer minor units until formatted.

function decimal(minor: number) {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Signed effect on the balance: income +, expense −, refund (negative expense) +. */
function signedAmount(row: ExportRow) {
  return row.type === "income" ? row.amount : -row.amount;
}

function csvCell(value: string) {
  // Spreadsheets run cells starting with these as formulas.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * RFC 4180 CSV with a UTF-8 BOM (so Excel reads non-ASCII text). Amounts are plain decimals with
 * a dot; expenses are positive and refunds negative, as stored. Rate is per hour, like hours.
 */
export function buildCsv(rows: ExportRow[], currency: string, t: Translator) {
  const header = [
    t("export.date"),
    t("export.type"),
    t("common.category"),
    t("export.description"),
    t("common.amount"),
    t("export.currency"),
    t("export.hours"),
    t("export.rate"),
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        csvCell(row.type === "income" ? t("common.incomeItem") : t("common.expense")),
        csvCell(row.category ?? ""),
        csvCell(row.description),
        decimal(row.amount),
        currency,
        row.hours ?? "",
        row.rate === null ? "" : decimal(row.rate),
      ].join(","),
    );
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

const FONT_DIR = path.join(process.cwd(), "src/server/fonts");

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 40;
const RIGHT = A4.width - MARGIN;
const SIZE = 9;
const ROW = 15;
const INK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.45, 0.45, 0.5);
const RULE = rgb(0.86, 0.86, 0.88);
const BAND = rgb(0.955, 0.955, 0.965);
const INCOME = rgb(0.05, 0.5, 0.3);
const COLS = { date: MARGIN, category: MARGIN + 66, description: MARGIN + 190, amountRight: RIGHT };
const DESCRIPTION_WIDTH = RIGHT - 96 - COLS.description;

type Glyph = { id: number; advanceWidth: number };
type Font = { glyphForCodePoint(cp: number): Glyph; layout(text: string): { glyphs: Glyph[] } };

/**
 * fontkit with plain one-glyph-per-character layout, memoized per string. pdf-lib only reads the
 * glyph ids and advances, and full OpenType shaping made an export at the 50,000-transaction cap take ~45 s instead of ~9 s.
 */
const fastFontkit: typeof fontkit = {
  ...fontkit,
  create(buffer, postscriptName) {
    const font = fontkit.create(buffer, postscriptName) as unknown as Font;
    const glyphs = new Map<number, Glyph>();
    const glyph = (cp: number) => {
      let g = glyphs.get(cp);
      if (!g) glyphs.set(cp, (g = font.glyphForCodePoint(cp)));
      return g;
    };
    const cache = new Map<string, { glyphs: Glyph[] }>();
    font.layout = (text: string) => {
      let run = cache.get(text);
      if (!run) {
        run = { glyphs: Array.from(text, (ch) => glyph(ch.codePointAt(0)!)) };
        if (cache.size > 20_000) cache.clear();
        cache.set(text, run);
      }
      return run;
    };
    return font as unknown as ReturnType<typeof fontkit.create>;
  },
};

export async function buildPdf(
  rows: ExportRow[],
  opts: { currency: string; t: Translator; account: string; today: string },
) {
  const { currency, t, account, today } = opts;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fastFontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(FONT_DIR, "Geist-Regular.ttf")),
    readFile(path.join(FONT_DIR, "Geist-SemiBold.ttf")),
  ]);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  pdf.setTitle(`Spendly · ${t("export.title")}`);
  pdf.setCreator("Spendly");
  pdf.setProducer("Spendly");
  pdf.setLanguage(t.locale);

  const glyphs = new Set(regular.getCharacterSet());
  /** Drops characters the font can't draw (emoji…), which would otherwise show as boxes. */
  const clean = (text: string) =>
    Array.from(text, (ch) => {
      const cp = ch.codePointAt(0)!;
      if (glyphs.has(cp)) return ch;
      return /\s/.test(ch) ? " " : "";
    }).join("");

  const money = (minor: number, signed = false) => clean(formatMoney(minor, { currency, signed }));
  const dateFormat = new Intl.DateTimeFormat(t.locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatDate = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return dateFormat.format(new Date(y, m - 1, d));
  };

  let page: PDFPage = pdf.addPage([A4.width, A4.height]);
  let y = A4.height - MARGIN;

  function text(value: string, x: number, at: number, o: { font?: PDFFont; size?: number; color?: typeof INK } = {}) {
    page.drawText(clean(value), { x, y: at, font: o.font ?? regular, size: o.size ?? SIZE, color: o.color ?? INK });
  }
  function textRight(value: string, right: number, at: number, o: { font?: PDFFont; size?: number; color?: typeof INK } = {}) {
    const v = clean(value);
    const width = (o.font ?? regular).widthOfTextAtSize(v, o.size ?? SIZE);
    text(v, right - width, at, o);
  }
  function fit(value: string, width: number, font = regular, size = SIZE) {
    const v = clean(value).replace(/\s+/g, " ").trim();
    if (font.widthOfTextAtSize(v, size) <= width) return v;
    // Cut by summed character widths (no kerning), leaving room for the ellipsis.
    const chars = Array.from(v);
    let used = font.widthOfTextAtSize("…", size);
    let n = 0;
    while (n < chars.length && used + font.widthOfTextAtSize(chars[n], size) <= width) used += font.widthOfTextAtSize(chars[n++], size);
    return `${chars.slice(0, n).join("").trimEnd()}…`;
  }
  function rule(at: number) {
    page.drawLine({ start: { x: MARGIN, y: at }, end: { x: RIGHT, y: at }, thickness: 0.5, color: RULE });
  }
  function tableHeader() {
    text(t("export.date"), COLS.date, y, { color: MUTED, size: 8 });
    text(t("common.category"), COLS.category, y, { color: MUTED, size: 8 });
    text(t("export.description"), COLS.description, y, { color: MUTED, size: 8 });
    textRight(t("common.amount"), COLS.amountRight, y, { color: MUTED, size: 8 });
    y -= 6;
    rule(y);
    y -= ROW - 2;
  }
  /** Starts a new page when fewer than `needed` points are left above the footer. */
  function ensure(needed: number) {
    if (y - needed >= MARGIN + 20) return false;
    page = pdf.addPage([A4.width, A4.height]);
    y = A4.height - MARGIN;
    tableHeader();
    return true;
  }

  // Title & summary
  text(`Spendly · ${t("export.title")}`, MARGIN, y - 14, { font: bold, size: 18 });
  y -= 32;
  const meta = [account, t("export.generated", { date: formatDate(today) }), t("export.count", { count: rows.length })];
  if (rows.length) meta.splice(1, 0, `${formatDate(rows[0].date)} – ${formatDate(rows.at(-1)!.date)}`);
  text(meta.filter(Boolean).join("  ·  "), MARGIN, y, { color: MUTED });
  y -= 26;

  const income = rows.reduce((s, r) => (r.type === "income" ? s + r.amount : s), 0);
  const expenses = rows.reduce((s, r) => (r.type === "expense" ? s + r.amount : s), 0);
  const tiles: [string, string][] = [
    [t("common.income"), money(income)],
    [t("common.expenses"), money(expenses)],
    [t("common.balance"), money(income - expenses, true)],
  ];
  const tileWidth = (RIGHT - MARGIN - 16) / 3;
  tiles.forEach(([label, value], i) => {
    const x = MARGIN + i * (tileWidth + 8);
    page.drawRectangle({ x, y: y - 34, width: tileWidth, height: 44, color: BAND });
    text(label, x + 10, y - 4, { color: MUTED, size: 8 });
    text(value, x + 10, y - 22, { font: bold, size: 13, color: i === 0 ? INCOME : INK });
  });
  y -= 62;

  if (!rows.length) {
    text(t("export.empty"), MARGIN, y, { color: MUTED });
  } else {
    tableHeader();
    // Months, newest last, each with its own totals.
    const months = new Map<string, ExportRow[]>();
    for (const row of rows) {
      const key = row.date.slice(0, 7);
      const list = months.get(key);
      if (list) list.push(row);
      else months.set(key, [row]);
    }
    for (const [month, list] of months) {
      if (!ensure(ROW * 3)) y -= 4;
      const monthIncome = list.reduce((s, r) => (r.type === "income" ? s + r.amount : s), 0);
      const monthExpenses = list.reduce((s, r) => (r.type === "expense" ? s + r.amount : s), 0);
      page.drawRectangle({ x: MARGIN, y: y - 5, width: RIGHT - MARGIN, height: ROW + 1, color: BAND });
      text(monthLabel(month, "long", t.locale), COLS.date + 4, y, { font: bold });
      textRight(
        t("export.monthTotals", { income: money(monthIncome), expenses: money(monthExpenses) }),
        RIGHT - 4,
        y,
        { color: MUTED, size: 8 },
      );
      y -= ROW + 2;

      for (const row of list) {
        ensure(ROW);
        const isIncome = row.type === "income";
        let description = row.description;
        if (row.hours !== null && row.rate !== null) {
          const hours = t("common.hours", { hours: formatNumber(Number(row.hours), currency) });
          description = `${description} (${hours} × ${money(row.rate)})`.trim();
        }
        text(formatDate(row.date), COLS.date, y, { color: MUTED });
        text(fit(isIncome ? t("common.incomeItem") : (row.category ?? ""), COLS.description - COLS.category - 8), COLS.category, y);
        text(fit(description, DESCRIPTION_WIDTH), COLS.description, y);
        const signed = signedAmount(row);
        textRight(money(signed, true), COLS.amountRight, y, { color: signed > 0 ? INCOME : INK });
        y -= ROW;
      }
    }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const label = clean(t("export.page", { page: i + 1, pages: pages.length }));
    const width = regular.widthOfTextAtSize(label, 8);
    p.drawText(label, { x: RIGHT - width, y: MARGIN - 14, font: regular, size: 8, color: MUTED });
    p.drawText("Spendly", { x: MARGIN, y: MARGIN - 14, font: regular, size: 8, color: MUTED });
  });

  return pdf.save();
}
