import { cn } from "cn";
import { formatMoney } from "@/lib/money";

/** Signed amount: income shows "+" in the income color, expenses show "−". */
export function Money({
  value,
  type,
  currency,
  className,
}: {
  value: number;
  type?: "income" | "expense";
  currency?: string;
  className?: string;
}) {
  const signedValue = type === "expense" ? -value : value;
  return (
    <span
      className={cn("tabular whitespace-nowrap", type === "income" && "text-income", className)}
    >
      {formatMoney(signedValue, { currency, signed: type !== undefined })}
    </span>
  );
}
