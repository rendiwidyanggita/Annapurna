import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * StatusBadge — Atom component for displaying status labels.
 *
 * Variants:
 * - available     : Unit tersedia untuk disewa (green)
 * - reserved      : Unit sudah di-hold / booking pending (yellow)
 * - rented        : Sedang disewa (blue)
 * - returned      : Baru dikembalikan, dalam transit (gray)
 * - maintenance   : Dalam perawatan (orange)
 * - damaged       : Rusak (red)
 * - lost          : Hilang (dark red)
 * - sold-out      : Produk tidak tersedia stok (neutral dark)
 * - active        : Status aktif umum (green, alias available)
 * - inactive      : Status nonaktif umum (gray)
 */
const badgeVariants = cva(
  // Base styles — pill shape, semibold, tight padding
  "inline-flex items-center gap-1 rounded-full font-semibold leading-none select-none",
  {
    variants: {
      variant: {
        available: [
          "bg-[#dcfce7] text-[#15803d]",
          "dark:bg-[#14532d]/30 dark:text-[#4ade80]",
        ],
        reserved: [
          "bg-[#fef3c7] text-[#b45309]",
          "dark:bg-[#713f12]/30 dark:text-[#fbbf24]",
        ],
        rented: [
          "bg-[#dbeafe] text-[#1d4ed8]",
          "dark:bg-[#1e3a8a]/30 dark:text-[#60a5fa]",
        ],
        returned: [
          "bg-[#f3f4f6] text-[#4b5563]",
          "dark:bg-[#374151]/50 dark:text-[#9ca3af]",
        ],
        maintenance: [
          "bg-[#ffedd5] text-[#c2410c]",
          "dark:bg-[#7c2d12]/30 dark:text-[#fb923c]",
        ],
        damaged: [
          "bg-[#fee2e2] text-[#b91c1c]",
          "dark:bg-[#7f1d1d]/30 dark:text-[#f87171]",
        ],
        lost: [
          "bg-[#fce7f3] text-[#9f1239]",
          "dark:bg-[#4c0519]/30 dark:text-[#fb7185]",
        ],
        "sold-out": [
          "bg-[#f3f4f6] text-[#6b7280]",
          "dark:bg-[#374151]/50 dark:text-[#9ca3af]",
        ],
        active: [
          "bg-[#dcfce7] text-[#15803d]",
          "dark:bg-[#14532d]/30 dark:text-[#4ade80]",
        ],
        inactive: [
          "bg-[#f3f4f6] text-[#6b7280]",
          "dark:bg-[#374151]/50 dark:text-[#9ca3af]",
        ],
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-1",
        lg: "text-sm px-3 py-1.5",
      },
      dot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "available",
      size: "md",
      dot: false,
    },
  },
);

/** Dot color follows the badge variant */
const dotColorMap: Record<string, string> = {
  available: "bg-[#16a34a]",
  reserved: "bg-[#f59e0b]",
  rented: "bg-[#2563eb]",
  returned: "bg-[#6b7280]",
  maintenance: "bg-[#ea580c]",
  damaged: "bg-[#dc2626]",
  lost: "bg-[#9f1239]",
  "sold-out": "bg-[#9ca3af]",
  active: "bg-[#16a34a]",
  inactive: "bg-[#9ca3af]",
};

/** Human-readable label defaults per variant (can be overridden via children) */
const defaultLabelMap: Record<string, string> = {
  available: "Tersedia",
  reserved: "Dipesan",
  rented: "Disewa",
  returned: "Dikembalikan",
  maintenance: "Perawatan",
  damaged: "Rusak",
  lost: "Hilang",
  "sold-out": "Habis",
  active: "Aktif",
  inactive: "Nonaktif",
};

export type StatusBadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Show a colored dot indicator before the label.
   * @default false
   */
  dot?: boolean;
  /**
   * Custom label. Defaults to the human-readable variant name in Indonesian.
   */
  children?: React.ReactNode;
}

/**
 * StatusBadge component.
 *
 * @example
 * // Auto-label from variant
 * <StatusBadge variant="available" />
 *
 * @example
 * // Custom label
 * <StatusBadge variant="maintenance" dot>Dalam Perbaikan</StatusBadge>
 *
 * @example
 * // Large size
 * <StatusBadge variant="rented" size="lg" />
 */
export function StatusBadge({
  variant = "available",
  size = "md",
  dot = false,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const label = children ?? defaultLabelMap[variant ?? "available"];
  const dotColor = dotColorMap[variant ?? "available"];

  return (
    <span
      className={cn(badgeVariants({ variant, size, dot }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            dotColor,
            size === "sm" && "w-1.5 h-1.5",
            size === "md" && "w-2 h-2",
            size === "lg" && "w-2.5 h-2.5",
          )}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
