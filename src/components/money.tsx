import { cn } from "cn";
import { formatMoney } from "@/lib/money";

/** Signed amount: income and refunds (negative expenses) show "+" in the income color, expenses show "−". */
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
  const moneyIn = type !== undefined && signedValue > 0;
  return (
    <span
      className={cn("tabular whitespace-nowrap", moneyIn && "text-income", className)}
    >
      {formatMoney(signedValue, { currency, signed: type !== undefined })}
    </span>
  );
}
