"use client";

import * as React from "react";
import { addDays, format, startOfToday, isBefore } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DurationScheme = "permalam" | "perkegiatan1" | "perkegiatan2";

interface RentalDateGroupProps {
  durationScheme: DurationScheme;
  startDate?: Date;
  onDateChange: (startDate: Date, endDate: Date, durationDays: number) => void;
  className?: string;
  disabled?: boolean;
}

export function getDurationDays(scheme: DurationScheme): number {
  switch (scheme) {
    case "permalam":
      return 1;
    case "perkegiatan1":
      return 3;
    case "perkegiatan2":
      return 5;
    default:
      return 1;
  }
}

export function getDurationLabel(scheme: DurationScheme): string {
  switch (scheme) {
    case "permalam":
      return "1 Malam";
    case "perkegiatan1":
      return "3H 3M (Kegiatan I)";
    case "perkegiatan2":
      return "5H 5M (Kegiatan II)";
    default:
      return "1 Malam";
  }
}

export function RentalDateGroup({
  durationScheme,
  startDate,
  onDateChange,
  className,
  disabled = false,
}: RentalDateGroupProps) {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    startDate || today
  );
  const [isCalendarOpen, setIsCalendarOpen] = React.useState<boolean>(false);

  const durationDays = getDurationDays(durationScheme);
  const calculatedEndDate = selectedDate
    ? addDays(selectedDate, durationDays)
    : undefined;

  // Sync state if controlled prop changes
  const [prevStartDate, setPrevStartDate] = React.useState(startDate);
  if (startDate !== prevStartDate) {
    setPrevStartDate(startDate);
    setSelectedDate(startDate);
  }

  // Trigger parent callback when durationScheme or selectedDate changes
  React.useEffect(() => {
    if (selectedDate) {
      const end = addDays(selectedDate, durationDays);
      onDateChange(selectedDate, end, durationDays);
    }
  }, [durationScheme, selectedDate, durationDays, onDateChange]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider flex items-center gap-1.5">
          <HugeiconsIcon icon={Calendar03Icon} size={15} />
          Jadwal Pengambilan & Durasi Sewa
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          {getDurationLabel(durationScheme)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* 1. Tanggal Ambil (Popover Calendar Picker) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-600 block">
            Tanggal Ambil (Mulai)
          </label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-medium text-xs h-10 px-3 bg-white border-neutral-300 hover:bg-neutral-50 hover:border-emerald-500 transition-all",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={15}
                  className="mr-2 text-emerald-700 shrink-0"
                />
                {selectedDate ? (
                  format(selectedDate, "dd MMMM yyyy", { locale: localeId })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white border border-neutral-200 shadow-xl rounded-2xl z-50"
              align="start"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabled={(date) => isBefore(date, today)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 2. Durasi Sewa (Readonly Indicator) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-600 block">
            Durasi Sewa
          </label>
          <div className="h-10 px-3 bg-white/70 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-medium text-neutral-700">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Clock01Icon}
                size={14}
                className="text-neutral-500"
              />
              {durationDays} Hari ({durationDays} Malam)
            </span>
            <span className="text-[10px] text-neutral-500">Auto</span>
          </div>
        </div>

        {/* 3. Maks. Pengembalian (Auto-Calculated Readonly) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-neutral-600 block">
            Maks. Pengembalian
          </label>
          <div className="h-10 px-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                className="text-emerald-700"
              />
              {calculatedEndDate
                ? format(calculatedEndDate, "dd MMMM yyyy", {
                    locale: localeId,
                  })
                : "-"}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
              21:00 WIB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
