import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

/** Type for passing a Hugeicons icon data as prop */
type IconSvgElement = HugeiconsIconProps["icon"];

export interface StepCardProps {
  /** Step number (1–4) displayed as a badge */
  step: number;
  /** Hugeicons icon data from @hugeicons/core-free-icons */
  icon: IconSvgElement;
  /** Step title */
  title: string;
  /** Short description of the step */
  description: string;
  /** Whether this is the last step (hides the connector line) */
  isLast?: boolean;
  /** Optional className override */
  className?: string;
}

/**
 * StepCard — Molecule for displaying a single step in the "Cara Sewa" section.
 *
 * Used in: Homepage HowItWorksSection (4 steps).
 *
 * Layout:
 * - Desktop (md+): horizontal flow with connector line between steps
 * - Mobile: vertical stack
 *
 * @example
 * import { Search01Icon } from "@hugeicons/core-free-icons";
 *
 * <StepCard
 *   step={1}
 *   icon={Search01Icon}
 *   title="Pilih Produk"
 *   description="Temukan perlengkapan yang sesuai di katalog kami"
 * />
 */
export function StepCard({
  step,
  icon,
  title,
  description,
  isLast = false,
  className,
}: StepCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center gap-3",
        className,
      )}
    >
      {/* Connector line — desktop only, between steps */}
      {!isLast && (
        <div
          className="hidden md:block absolute top-[22px] left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-[var(--color-border)] z-0"
          aria-hidden="true"
        />
      )}

      {/* Icon container with step number badge */}
      <div className="relative z-10">
        <div
          className={cn(
            "flex items-center justify-center rounded-full",
            "w-14 h-14",
            "bg-[var(--color-primary)] shadow-[var(--shadow-card-hover)]",
          )}
        >
          <HugeiconsIcon
            icon={icon}
            size={24}
            strokeWidth={1.5}
            color="white"
          />
        </div>

        {/* Step number badge — top-left of icon */}
        <span
          className={cn(
            "absolute -top-1.5 -left-1.5 z-10",
            "flex items-center justify-center",
            "w-5 h-5 rounded-full",
            "bg-white border-2 border-[var(--color-primary)]",
            "text-[9px] font-bold text-[var(--color-primary)] leading-none",
          )}
          aria-label={`Langkah ${step}`}
        >
          {step}
        </span>
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1 max-w-[160px]">
        <h3 className="text-sm font-bold text-[var(--color-foreground)] leading-snug">
          {title}
        </h3>
        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
