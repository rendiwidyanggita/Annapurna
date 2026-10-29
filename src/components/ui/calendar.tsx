"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { DayButton, DayPicker } from "react-day-picker";
import { id as localeId } from "date-fns/locale";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale = localeId,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      locale={locale}
      className={cn(
        "p-3.5 w-[280px] sm:w-[310px] select-none bg-white rounded-2xl",
        className
      )}
      classNames={{
        root: "w-full",
        months: "relative flex flex-col gap-4",
        month: "relative flex flex-col gap-3 w-full",
        month_caption:
          "relative flex items-center justify-center h-8 text-sm font-bold text-neutral-800 pointer-events-none",
        caption_label: "text-sm font-bold text-neutral-900 capitalize pointer-events-none",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-8 z-20 pointer-events-none",
        button_previous: cn(
          "z-20 pointer-events-auto absolute left-0 top-0 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16624B]"
        ),
        button_next: cn(
          "z-20 pointer-events-auto absolute right-0 top-0 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16624B]"
        ),
        month_grid: "w-full border-collapse table-fixed",
        weekdays: "border-b border-neutral-100",
        weekday:
          "text-neutral-400 font-semibold text-[11px] h-8 text-center uppercase tracking-wider align-middle select-none",
        weeks: "",
        week: "h-9",
        day: cn(
          "p-0 text-center align-middle relative",
          // Today styling
          "data-[today]:[&>button]:border data-[today]:[&>button]:border-[#16624B] data-[today]:[&>button]:text-[#16624B] data-[today]:[&>button]:font-bold",
          // Selected date styling
          "data-[selected]:[&>button]:!bg-[#16624B] data-[selected]:[&>button]:!text-white data-[selected]:[&>button]:!border-transparent data-[selected]:[&>button]:!font-bold data-[selected]:[&>button]:shadow-xs",
          // Outside days styling
          "data-[outside]:[&>button]:text-neutral-300 data-[outside]:[&>button]:opacity-40 data-[outside]:[&>button]:hover:bg-transparent",
          // Disabled days styling
          "data-[disabled]:[&>button]:!text-neutral-300 data-[disabled]:[&>button]:!opacity-30 data-[disabled]:[&>button]:!cursor-not-allowed data-[disabled]:[&>button]:hover:!bg-transparent data-[disabled]:[&>button]:pointer-events-none"
        ),
        day_button: cn(
          "size-9 min-h-[36px] min-w-[36px] mx-auto flex items-center justify-center rounded-xl text-xs font-medium tabular-nums text-neutral-700 hover:bg-[#E7F3EE] hover:text-[#16624B] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16624B]"
        ),
        selected:
          "[&>button]:!bg-[#16624B] [&>button]:!text-white [&>button]:!border-transparent [&>button]:!font-bold [&>button]:shadow-xs",
        today:
          "[&>button]:border [&>button]:border-[#16624B] [&>button]:text-[#16624B] [&>button]:font-bold",
        outside:
          "[&>button]:text-neutral-300 [&>button]:opacity-40 [&>button]:hover:bg-transparent",
        disabled:
          "[&>button]:!text-neutral-300 [&>button]:!opacity-30 [&>button]:!cursor-not-allowed [&>button]:hover:!bg-transparent [&>button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                aria-hidden="true"
                className={cn("size-4 text-neutral-700 pointer-events-none", className)}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                aria-hidden="true"
                className={cn("size-4 text-neutral-700 pointer-events-none", className)}
                {...props}
              />
            );
          }

          return (
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              aria-hidden="true"
              className={cn("size-4 text-neutral-700", className)}
              {...props}
            />
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar, DayButton as CalendarDayButton };
