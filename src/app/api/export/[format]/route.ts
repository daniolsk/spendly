import { buildCsv, buildPdf } from "@/server/export";
import { requireUser } from "@/server/dal";
import { getT } from "@/server/i18n";
import { getAllTransactions, getSettings } from "@/server/queries";
import { todayKey, zonedToday } from "@/lib/month";

// Download of every transaction of the signed-in user: /api/export/csv or /api/export/pdf.
export async function GET(_req: Request, ctx: RouteContext<"/api/export/[format]">) {
  const { format } = await ctx.params;
  if (format !== "csv" && format !== "pdf") return new Response("Not found", { status: 404 });

  const user = await requireUser();
  const [rows, settings, t] = await Promise.all([getAllTransactions(user.id), getSettings(user.id), getT()]);
  const today = todayKey(zonedToday());
  const filename = `spendly-transactions-${today}.${format}`;
  const headers = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };

  if (format === "csv") {
    return new Response(buildCsv(rows, settings.currency, t), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    });
  }
  const pdf = await buildPdf(rows, { currency: settings.currency, t, account: user.email, today });
  return new Response(Buffer.from(pdf), { headers: { ...headers, "Content-Type": "application/pdf" } });
}
