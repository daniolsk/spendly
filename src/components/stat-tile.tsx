import type { ReactNode } from "react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("gap-1", className)}>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="tabular text-lg font-semibold tracking-tight sm:text-xl">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
