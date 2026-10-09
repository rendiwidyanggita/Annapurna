"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  /** Unique key for this tab */
  key: string;
  /** Label to display */
  label: string;
  /** Optional count badge (e.g. "12") */
  count?: number;
  /** Disable this individual tab */
  disabled?: boolean;
}

export interface TabSwitcherProps {
  /** Array of tab definitions */
  tabs: TabItem[];
  /** Currently active tab key */
  activeTab: string;
  /** Callback when a tab is selected */
  onChange: (key: string) => void;
  /** Visual style — underline (default) matches Design.md */
  variant?: "underline" | "pill";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className for the tab list wrapper */
  className?: string;
  /** aria-label for the tablist (for accessibility) */
  "aria-label"?: string;
}

/**
 * TabSwitcher — Atom component for switching between named tabs.
 *
 * Design.md decision: underline style (not pill) for homepage Terlaris/Terbaru.
 * Active state uses an underline indicator — no bold weight to prevent layout shift.
 *
 * Keyboard navigation: ArrowLeft / ArrowRight to move between tabs, Enter/Space to select.
 *
 * @example
 * const [active, setActive] = useState("terlaris");
 *
 * <TabSwitcher
 *   tabs={[
 *     { key: "terlaris", label: "Terlaris" },
 *     { key: "terbaru", label: "Terbaru" },
 *   ]}
 *   activeTab={active}
 *   onChange={setActive}
 * />
 */
export function TabSwitcher({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  size = "md",
  className,
  "aria-label": ariaLabel = "Tab navigation",
}: TabSwitcherProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const enabledTabs = tabs
        .map((tab, i) => ({ tab, i }))
        .filter(({ tab }) => !tab.disabled);

      const currentEnabledIndex = enabledTabs.findIndex(
        ({ i }) => i === index,
      );

      let nextEnabledIndex: number | null = null;

      if (e.key === "ArrowRight") {
        nextEnabledIndex =
          currentEnabledIndex < enabledTabs.length - 1
            ? currentEnabledIndex + 1
            : 0;
      } else if (e.key === "ArrowLeft") {
        nextEnabledIndex =
          currentEnabledIndex > 0
            ? currentEnabledIndex - 1
            : enabledTabs.length - 1;
      } else if (e.key === "Home") {
        nextEnabledIndex = 0;
      } else if (e.key === "End") {
        nextEnabledIndex = enabledTabs.length - 1;
      }

      if (nextEnabledIndex !== null) {
        e.preventDefault();
        const nextTab = enabledTabs[nextEnabledIndex];
        tabRefs.current[nextTab.i]?.focus();
        onChange(nextTab.tab.key);
      }
    },
    [tabs, onChange],
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex",
        variant === "underline" && "border-b border-[var(--color-border)]",
        variant === "pill" && "gap-1 p-1 bg-[var(--color-border-soft)] rounded-[var(--radius-lg)]",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeTab;
        const isDisabled = tab.disabled ?? false;

        return (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              // Base
              "relative inline-flex items-center gap-2 font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-40",

              // Size
              size === "sm" && "text-xs px-3 py-2",
              size === "md" && "text-sm px-4 py-2.5",
              size === "lg" && "text-base px-5 py-3",

              // Underline variant
              variant === "underline" && [
                "border-b-2 -mb-px",
                isActive
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border)]",
              ],

              // Pill variant
              variant === "pill" && [
                "rounded-[var(--radius-md)]",
                isActive
                  ? "bg-white text-[var(--color-foreground)] shadow-[var(--shadow-card)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/60",
              ],
            )}
          >
            <span>{tab.label}</span>

            {/* Optional count badge */}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full font-semibold leading-none",
                  size === "sm" && "text-[9px] px-1.5 py-0.5 min-w-[16px]",
                  size === "md" && "text-[10px] px-1.5 py-0.5 min-w-[18px]",
                  size === "lg" && "text-xs px-2 py-0.5 min-w-[20px]",
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "bg-[var(--color-border-soft)] text-[var(--color-muted)]",
                )}
                aria-label={`${tab.count} item`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
