import { cn } from "cn";
import { colorVar } from "@/lib/colors";

export function CategoryDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: colorVar(color) }}
    />
  );
}

export function CategoryLabel({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <CategoryDot color={color} />
      <span className="truncate">{name}</span>
    </span>
  );
}
