import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export interface AdminKpiCardProps {
  label: string;
  value: string | number;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  iconColorVariant?: "emerald" | "blue" | "amber" | "rose" | "purple" | "neutral";
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

const COLOR_VARIANTS = {
  emerald: {
    bg: "bg-[#E7F3EE]",
    text: "text-[#16624B]",
    border: "border-emerald-200/60",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-[#2563EB]",
    border: "border-blue-200/60",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-[#D97706]",
    border: "border-amber-200/60",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-[#DC2626]",
    border: "border-rose-200/60",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200/60",
  },
  neutral: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

/**
 * AdminKpiCard — Molecule component representing KPI metrics in Archetype A and Dashboard.
 * Adheres to 70/20/10 rule (white surface, thin border) and mandates tabular-nums.
 */
export function AdminKpiCard({
  label,
  value,
  icon,
  iconColorVariant = "emerald",
  subtext,
  trend,
  className,
}: AdminKpiCardProps) {
  const colors = COLOR_VARIANTS[iconColorVariant];

  return (
    <div
      className={cn(
        "bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between gap-4",
        className
      )}
    >
      {/* Left Data Column */}
      <div className="min-w-0">
        <span className="text-xs font-medium text-[#6B7280] block truncate">
          {label}
        </span>
        <div className="text-2xl font-bold tabular-nums text-[#111827] mt-1.5 leading-tight tracking-tight">
          {value}
        </div>
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6B7280]">
            {trend && (
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  trend.isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
                )}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span className="truncate">{subtext}</span>}
          </div>
        )}
      </div>

      {/* Right Soft Icon Box */}
      <div
        className={cn(
          "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border",
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <HugeiconsIcon icon={icon} size={22} strokeWidth={1.75} />
      </div>
    </div>
  );
}
