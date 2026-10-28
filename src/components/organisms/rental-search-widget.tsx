"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addDays, format, startOfToday, isBefore } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Clock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

export interface RentalSearchWidgetProps {
  className?: string;
}

export function RentalSearchWidget({ className }: RentalSearchWidgetProps) {
  const router = useRouter();
  const today = React.useMemo(() => startOfToday(), []);
  const defaultDate = React.useMemo(() => addDays(today, 1), [today]);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(defaultDate);
  const [durationScheme, setDurationScheme] = React.useState<string>("permalam");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState<boolean>(false);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDate = selectedDate || defaultDate;
    const dateStr = format(targetDate, "yyyy-MM-dd");
    const params = new URLSearchParams({
      startDate: dateStr,
      scheme: durationScheme,
    });
    router.push(`${ROUTES.CATALOG}?${params.toString()}`);
  };

  return (
    <div className={cn("relative z-20 container-page -mt-10 sm:-mt-12 md:-mt-14", className)}>
      <form
        onSubmit={handleSearch}
        aria-label="Cek Ketersediaan Alat Outdoor"
        className={cn(
          "rounded-2xl md:rounded-3xl",
          "bg-white/95 backdrop-blur-md",
          "p-3.5 sm:p-4 md:p-5",
          "border border-black/[0.06]",
          "shadow-[0_20px_40px_-6px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06)]"
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
          {/* ── Field 1: Tanggal Mulai Sewa ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Tanggal Mulai Sewa
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full h-12 px-3.5 justify-start text-left font-medium rounded-xl",
                    "border-slate-200 hover:border-brand-600 hover:bg-slate-50/50",
                    "focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600",
                    "transition-colors duration-150"
                  )}
                >
                  <HugeiconsIcon
                    icon={Calendar01Icon}
                    size={18}
                    className="mr-2.5 text-brand-600 shrink-0"
                  />
                  <span className="text-sm text-slate-800 tabular-nums">
                    {selectedDate
                      ? format(selectedDate, "EEEE, dd MMMM yyyy", { locale: localeId })
                      : "Pilih tanggal mulai"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-white border border-slate-200/80 shadow-xl rounded-2xl z-50 overflow-hidden"
                align="start"
                sideOffset={8}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  disabled={(date) => isBefore(date, today)}
                  locale={localeId}
                  defaultMonth={selectedDate || defaultDate}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Field 2: Skema Durasi Sewa ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Durasi Sewa
            </label>
            <Select value={durationScheme} onValueChange={setDurationScheme}>
              <SelectTrigger
                className={cn(
                  "w-full h-12 px-3.5 rounded-xl border-slate-200 hover:border-brand-600",
                  "focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
                  "bg-white transition-colors duration-150"
                )}
              >
                <div className="flex items-center gap-2.5 text-sm text-slate-800 font-medium">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    size={18}
                    className="text-brand-600 shrink-0"
                  />
                  <SelectValue placeholder="Pilih durasi sewa" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                <SelectItem value="permalam" className="py-2.5 rounded-lg text-sm">
                  Permalam — 1 Hari (1 Malam)
                </SelectItem>
                <SelectItem value="perkegiatan_1" className="py-2.5 rounded-lg text-sm">
                  Perkegiatan I — 2 Hari (Weekend Ringkas)
                </SelectItem>
                <SelectItem value="perkegiatan_2" className="py-2.5 rounded-lg text-sm">
                  Perkegiatan II — 3 Hari (Pendakian Penuh)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Field 3: CTA Button ── */}
          <div className="md:self-end pt-1 md:pt-0">
            <button
              type="submit"
              className={cn(
                "w-full md:w-auto h-12 px-7 rounded-xl",
                "bg-brand-600 hover:bg-brand-700 text-white",
                "font-semibold text-sm tracking-wide",
                "flex items-center justify-center gap-2",
                "shadow-sm hover:shadow-md",
                "active:scale-[0.96] transition-transform duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              )}
            >
              <HugeiconsIcon icon={Search01Icon} size={18} />
              <span>Cek Ketersediaan</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
