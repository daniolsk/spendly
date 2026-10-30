"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { currentMonthKey, monthLabel, monthName, parseMonthKey, shiftMonth } from "@/lib/month";

export function MonthSwitcher({ month }: { month: string }) {
  const { year } = parseMonthKey(month);
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const today = currentMonthKey();
  // Keep the open tab (Transactions / Income / Statistics) when moving between months.
  const tab = useSearchParams().get("tab");
  const monthHref = (key: string) => `/m/${key}${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`;
  // Name the current month (with its year when it differs) and point the arrow the way it lies.
  const todayName =
    parseMonthKey(today).year === year ? monthName(parseMonthKey(today).month, "long") : monthLabel(today, "short");
  const todayIsBehind = today < month;

  return (
    <div className="flex items-center gap-1 max-md:w-full">
      <Button variant="ghost" size="icon-lg" asChild>
        <Link href={monthHref(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronLeftIcon />
        </Link>
      </Button>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setPickerYear(year);
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-10 px-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {monthLabel(month)}
            <ChevronDownIcon className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setPickerYear((y) => y - 1)} aria-label="Previous year">
              <ChevronLeftIcon />
            </Button>
            <Link
              href={`/y/${pickerYear}`}
              className="text-sm font-semibold hover:underline"
              onClick={() => setOpen(false)}
            >
              {pickerYear}
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setPickerYear((y) => y + 1)} aria-label="Next year">
              <ChevronRightIcon />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => {
              const key = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
              return (
                <Button
                  key={key}
                  asChild
                  size="sm"
                  variant={key === month ? "default" : "ghost"}
                  className={cn("h-9", key === today && key !== month && "ring-1 ring-ring")}
                >
                  <Link href={monthHref(key)} onClick={() => setOpen(false)}>
                    {monthName(i + 1)}
                  </Link>
                </Button>
              );
            })}
          </div>
          <Button asChild variant="outline" size="sm" className="mt-3 h-9 w-full">
            <Link href={monthHref(today)} onClick={() => setOpen(false)}>
              This month
            </Link>
          </Button>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon-lg" asChild>
        <Link href={monthHref(shiftMonth(month, 1))} aria-label="Next month">
          <ChevronRightIcon />
        </Link>
      </Button>
      {/* Quiet shortcut back to the current month. Phones skip it: there is no room, and the Month tab does the same. */}
      {month !== today ? (
        <Button
          variant="ghost"
          size="lg"
          className="ml-1 text-muted-foreground hover:text-foreground max-sm:hidden"
          asChild
        >
          <Link href={monthHref(today)} aria-label={`Back to ${monthLabel(today)}`}>
            {todayIsBehind ? <ArrowLeftIcon data-icon="inline-start" /> : null}
            {todayName}
            {todayIsBehind ? null : <ArrowRightIcon data-icon="inline-end" />}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
