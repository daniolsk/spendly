"use client";

import { useState } from "react";
import { pl as plLocale } from "react-day-picker/locale/pl";
import { CalendarIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/lib/i18n/client";
import { todayKey } from "@/lib/month";

function toDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date, locale: string) {
  const text = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date);
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

/** Button + calendar popover for a "YYYY-MM-DD" value. */
export function DatePicker({
  id,
  value,
  onChange,
  invalid,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const selected = value ? toDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid}
          className={cn(
            "h-10 w-full justify-start px-2.5 text-base font-normal md:text-sm",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="text-muted-foreground" />
          {selected ? formatDate(selected, t.locale) : t("tx.pickDate")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          required
          selected={selected}
          defaultMonth={selected}
          weekStartsOn={1}
          locale={t.lang === "pl" ? plLocale : undefined}
          onSelect={(d) => {
            onChange(todayKey(d));
            setOpen(false);
          }}
          className="[--cell-size:--spacing(9)]"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
