"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  /** Value as YYYY-MM-DD string */
  value?: string;
  /** Callback returning YYYY-MM-DD string (or empty string if cleared) */
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  /** Whether to show a quick clear button when a date is selected */
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  className,
  buttonClassName,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
    } else {
      onChange(format(date, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full h-8 px-2.5 py-1.5 justify-start text-left font-normal text-xs rounded-lg border border-gray-300 bg-white hover:bg-neutral-50 shadow-2xs focus-visible:ring-1 focus-visible:ring-[#16624B]",
              !parsedDate && "text-gray-400",
              buttonClassName
            )}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={14}
              className="mr-2 text-gray-500 shrink-0"
            />
            <span className="truncate flex-1 tabular-nums">
              {parsedDate
                ? format(parsedDate, "d MMM yyyy", { locale: localeId })
                : placeholder}
            </span>
            {clearable && parsedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Hapus tanggal"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange("");
                  }
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50 bg-white shadow-xl rounded-2xl border border-neutral-100" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
