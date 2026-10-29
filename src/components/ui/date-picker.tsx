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
    e.preventDefault();
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
              "w-full h-8 px-2.5 py-1.5 justify-start text-left font-normal text-xs rounded-lg border border-gray-300 bg-white transition-all duration-150 shadow-2xs",
              "hover:border-[#16624B] hover:bg-gray-50/60",
              open && "border-[#16624B] ring-1 ring-[#16624B]/20 bg-gray-50/40",
              "focus-visible:ring-1 focus-visible:ring-[#16624B] focus-visible:border-[#16624B]",
              !parsedDate && "text-gray-400",
              buttonClassName
            )}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={14}
              className={cn(
                "mr-2 shrink-0 transition-colors",
                parsedDate || open ? "text-[#16624B]" : "text-gray-400"
              )}
            />
            <span
              className={cn(
                "truncate flex-1 tabular-nums",
                parsedDate ? "font-medium text-gray-900" : "text-gray-400"
              )}
            >
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
                    e.stopPropagation();
                    onChange("");
                  }
                }}
                className="ml-1 p-0.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 active:scale-[0.92] transition-colors shrink-0"
                title="Hapus tanggal"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 z-50 bg-white shadow-xl rounded-2xl border border-slate-200/80 overflow-hidden"
          align="start"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            defaultMonth={parsedDate || new Date()}
          />
          <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/70 text-xs">
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="text-xs font-semibold text-[#16624B] hover:text-[#0F4F3C] hover:underline transition-colors active:scale-[0.96]"
            >
              Hari Ini
            </button>
            {parsedDate && (
              <button
                type="button"
                onClick={() => handleSelect(undefined)}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 hover:underline transition-colors active:scale-[0.96]"
              >
                Hapus Pilihan
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
