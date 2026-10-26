"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import type { Category } from "@/db/schema";
import { CategoryDot } from "@/components/category-dot";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_COLOR_KEYS, CATEGORY_COLORS, colorVar } from "@/lib/colors";
import { formatMoney, parseMoney, toInputValue } from "@/lib/money";
import {
  deleteCategory,
  moveCategory,
  saveCategory,
  setCategoryArchived,
  type ActionResult,
} from "@/server/actions";

export function CategoryManager({ categories, currency }: { categories: Category[]; currency: string }) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const active = categories.filter((c) => !c.archived);
  const archived = categories.filter((c) => c.archived);

  function run(action: () => Promise<ActionResult>, success?: string) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) toast.error(res.error);
      else if (success) toast.success(success);
    });
  }

  function open(target: Category | "new") {
    setFormKey((k) => k + 1);
    setEditing(target);
  }

  function row(c: Category, index: number, list: Category[]) {
    return (
      <li key={c.id} className={cn("flex min-h-14 items-center gap-3 py-2", c.archived && "opacity-60")}>
        <CategoryDot color={c.color} className="size-3" />
        <button type="button" className="flex min-w-0 flex-1 flex-col text-left" onClick={() => open(c)}>
          <span className="truncate font-medium">{c.name}</span>
          <span className="text-xs text-muted-foreground">
            Plan {formatMoney(c.defaultPlan, { currency })} / month
          </span>
        </button>
        {c.excludeFromLiving ? (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Not living cost
          </Badge>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg" aria-label={`Actions for ${c.name}`} disabled={pending}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => open(c)}>
              <PencilIcon /> Edit
            </DropdownMenuItem>
            {!c.archived ? (
              <>
                <DropdownMenuItem disabled={index === 0} onClick={() => run(() => moveCategory(c.id, "up"))}>
                  <ArrowUpIcon /> Move up
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === list.length - 1}
                  onClick={() => run(() => moveCategory(c.id, "down"))}
                >
                  <ArrowDownIcon /> Move down
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            {c.archived ? (
              <DropdownMenuItem onClick={() => run(() => setCategoryArchived(c.id, false), "Category restored")}>
                <ArchiveRestoreIcon /> Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => run(() => setCategoryArchived(c.id, true), "Category archived")}>
                <ArchiveIcon /> Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={() => run(() => deleteCategory(c.id), "Category deleted")}>
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y">{active.map((c, i, list) => row(c, i, list))}</ul>
      <Button variant="outline" className="mt-1 h-10 self-start" onClick={() => open("new")}>
        <PlusIcon /> Add category
      </Button>

      {archived.length ? (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm text-muted-foreground">Archived ({archived.length})</summary>
          <ul className="mt-1 divide-y">{archived.map((c, i, list) => row(c, i, list))}</ul>
        </details>
      ) : null}

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "New category" : "Edit category"}
      >
        {editing !== null ? (
          <CategoryForm
            key={formKey}
            category={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </ResponsiveDialog>
    </div>
  );
}

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? "blue");
  const [plan, setPlan] = useState(category ? toInputValue(category.defaultPlan) : "");
  const [excludeFromLiving, setExclude] = useState(category?.excludeFromLiving ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const defaultPlan = plan.trim() ? parseMoney(plan) : 0;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (defaultPlan === null) next.plan = "Invalid amount";
    setErrors(next);
    if (Object.keys(next).length) return;

    startTransition(async () => {
      const res = await saveCategory({ id: category?.id, name, color, excludeFromLiving, defaultPlan: defaultPlan! });
      if (res.ok) {
        toast.success(category ? "Category updated" : "Category added");
        onDone();
      } else toast.error(res.error);
    });
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="gap-5">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="cat-name">Name</FieldLabel>
          <Input id="cat-name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} className="h-10" />
          <FieldError>{errors.name}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Color</FieldLabel>
          <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2.5">
            {CATEGORY_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={color === key}
                aria-label={CATEGORY_COLORS[key].label}
                onClick={() => setColor(key)}
                className={cn(
                  "size-9 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                  color === key ? "ring-2 ring-foreground" : "hover:ring-2 hover:ring-border",
                )}
                style={{ backgroundColor: colorVar(key) }}
              />
            ))}
          </div>
        </Field>

        <Field data-invalid={!!errors.plan}>
          <FieldLabel htmlFor="cat-plan">Planned per month</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupInput
              id="cat-plan"
              inputMode="decimal"
              placeholder="0,00"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="tabular"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>zł</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>Default for every month. You can override it per month in Statistics.</FieldDescription>
          <FieldError>{errors.plan}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="cat-exclude">Exclude from cost of living</FieldLabel>
            <FieldDescription>For savings or one-off spending (like &quot;Inne&quot;).</FieldDescription>
          </FieldContent>
          <Switch id="cat-exclude" checked={excludeFromLiving} onCheckedChange={setExclude} />
        </Field>

        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </FieldGroup>
    </form>
  );
}
