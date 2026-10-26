import { cn } from "cn";
import { CategoryLabel } from "@/components/category-dot";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney, formatPercent } from "@/lib/money";

export type BreakdownRow = {
  id: string;
  name: string;
  color: string;
  spent: number;
  planned?: number;
};

/** Doubles as the donut's legend and its accessible table view. */
export function CategoryBreakdown({ rows, currency }: { rows: BreakdownRow[]; currency: string }) {
  const showPlan = rows.some((r) => r.planned !== undefined);
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);
  const totalPlanned = rows.reduce((a, r) => a + (r.planned ?? 0), 0);

  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Spent</TableHead>
          {showPlan ? (
            <>
              <TableHead className="hidden text-right sm:table-cell">Planned</TableHead>
              <TableHead className="w-28 text-right sm:w-36">Of plan</TableHead>
            </>
          ) : (
            <TableHead className="w-20 text-right">Share</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const ratio = r.planned ? r.spent / r.planned : r.spent > 0 ? Infinity : 0;
          const over = ratio > 1;
          return (
            <TableRow key={r.id}>
              <TableCell className="max-w-0">
                <CategoryLabel name={r.name} color={r.color} />
              </TableCell>
              <TableCell className="tabular text-right font-medium">{formatMoney(r.spent, { currency })}</TableCell>
              {showPlan ? (
                <>
                  <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">
                    {formatMoney(r.planned ?? 0, { currency })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("tabular text-xs", over ? "font-medium text-destructive" : "text-muted-foreground")}>
                        {r.planned ? formatPercent(ratio) : r.spent ? "unplanned" : "—"}
                        {over && r.planned ? " ▲" : ""}
                      </span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div
                          className={cn("h-full rounded-full", over ? "bg-destructive" : "bg-foreground/70")}
                          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </>
              ) : (
                <TableCell className="tabular text-right text-muted-foreground">
                  {totalSpent ? formatPercent(r.spent / totalSpent) : "—"}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="tabular text-right">{formatMoney(totalSpent, { currency })}</TableCell>
          {showPlan ? (
            <>
              <TableCell className="tabular hidden text-right sm:table-cell">{formatMoney(totalPlanned, { currency })}</TableCell>
              <TableCell className="tabular text-right text-xs">
                {totalPlanned ? formatPercent(totalSpent / totalPlanned) : "—"}
              </TableCell>
            </>
          ) : (
            <TableCell />
          )}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
