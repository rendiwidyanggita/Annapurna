"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  FilterResetIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface AdminFilterToolbarProps {
  /** Search query state */
  searchValue?: string;
  /** Search query change handler */
  onSearchChange?: (val: string) => void;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Segmented switcher on the left (e.g. Tab buttons for Rental vs Consumable) */
  segmentedSwitcher?: React.ReactNode;
  /** Reset filters action */
  onReset?: () => void;
  /** Whether any non-default filter is currently active (enables reset button) */
  isFiltered?: boolean;
  /** Primary CTA button (e.g. Tambah Baru) */
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: Parameters<typeof HugeiconsIcon>[0]["icon"];
  };
  /** Optional custom action node rendered in the right group (e.g. Modal Trigger) */
  customAction?: React.ReactNode;
  /** Secondary filter elements (rendered in bottom grid) */
  children?: React.ReactNode;
  className?: string;
}

/**
 * AdminFilterToolbar — Reusable Molecule component implementing Archetype A Toolbar.
 * Combines top action bar (search, reset, CTA) and bottom domain filter grid.
 */
export function AdminFilterToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Cari data...",
  segmentedSwitcher,
  onReset,
  isFiltered = false,
  primaryAction,
  customAction,
  children,
  className,
}: AdminFilterToolbarProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E5E7EB] shadow-2xs p-4 sm:p-5 space-y-4",
        className
      )}
    >
      {/* ── Top Row: Switcher, Search, Reset, and Primary CTA ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left Segment / Switcher */}
        {segmentedSwitcher ? (
          <div className="shrink-0">{segmentedSwitcher}</div>
        ) : (
          <div className="hidden lg:block" />
        )}

        {/* Right Action Group: Search + Reset + CTA */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
          {/* Search Box */}
          {onSearchChange && (
            <div className="relative flex-1 sm:w-72 sm:flex-initial">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <HugeiconsIcon icon={Search01Icon} size={16} />
              </div>
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-[#F9FAFB] border-gray-200 focus-visible:ring-[#16624B]/30 focus-visible:border-[#16624B]"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Bersihkan pencarian"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>
          )}

          {/* Reset Filter Button */}
          {onReset && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!isFiltered}
              className={cn(
                "h-9 text-xs font-semibold gap-1.5 transition-colors",
                isFiltered
                  ? "border-[#16624B] text-[#16624B] hover:bg-[#E7F3EE]"
                  : "border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
              )}
            >
              <HugeiconsIcon icon={FilterResetIcon} size={15} />
              <span>Reset</span>
            </Button>
          )}

          {/* Primary Action Button */}
          {primaryAction &&
            (primaryAction.href ? (
              <Link href={primaryAction.href}>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  <HugeiconsIcon
                    icon={primaryAction.icon || PlusSignIcon}
                    size={15}
                  />
                  <span>{primaryAction.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={primaryAction.onClick}
                className="h-9 bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold gap-1.5 shadow-2xs"
              >
                <HugeiconsIcon
                  icon={primaryAction.icon || PlusSignIcon}
                  size={15}
                />
                <span>{primaryAction.label}</span>
              </Button>
            ))}

          {/* Optional Custom Action (e.g. Modal Trigger) */}
          {customAction && <div className="shrink-0">{customAction}</div>}
        </div>
      </div>

      {/* ── Bottom Row: Multi-Filter Dropdowns Grid ── */}
      {children && (
        <div className="pt-3.5 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
