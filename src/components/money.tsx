import { cn } from "cn";
import { InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import { currencySymbol, formatMoney } from "@/lib/money";

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

/** Currency symbol inside an InputGroup, on the side the currency's locale writes it ("zł" after, "$" before). */
export function CurrencyAddon({ currency, suffix }: { currency: string; suffix?: string }) {
  const { symbol, prefix } = currencySymbol(currency);
  return (
    <InputGroupAddon align={prefix && !suffix ? "inline-start" : "inline-end"}>
      <InputGroupText>
        {symbol}
        {suffix}
      </InputGroupText>
    </InputGroupAddon>
  );
}
