import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  CancelCircleIcon,
  Time02Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import {
  TransactionStatus,
  PaymentStatus,
  UnitStatus,
  GuaranteeStatus,
} from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * StatusBadge — Atom component for displaying status indicators.
 * Strictly implements Design.md & admin-design-system.md Section 5:
 * Every status must combine color + label + icon/dot indicator (not color alone).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold leading-none select-none border transition-colors",
  {
    variants: {
      variant: {
        // Success / Available / Selesai / Fully Paid
        available: "bg-emerald-50 text-[#16A34A] border-emerald-200/80",
        active: "bg-emerald-50 text-[#16A34A] border-emerald-200/80",
        completed: "bg-emerald-50 text-[#16A34A] border-emerald-200/80",

        // Warning / Maintenance / Menunggu DP / Reserved
        reserved: "bg-amber-50 text-[#D97706] border-amber-200/80",
        maintenance: "bg-orange-50 text-[#EA580C] border-orange-200/80",
        warning: "bg-amber-50 text-[#D97706] border-amber-200/80",

        // Info / Rented / Sedang Disewa / Siap Diambil
        rented: "bg-blue-50 text-[#2563EB] border-blue-200/80",
        info: "bg-blue-50 text-[#2563EB] border-blue-200/80",

        // Danger / Damaged / Lost / Terlambat / Ditolak / Failed
        damaged: "bg-red-50 text-[#DC2626] border-red-200/80",
        lost: "bg-rose-50 text-[#BE123C] border-rose-200/80",
        late: "bg-rose-50 text-[#DC2626] border-rose-200 animate-pulse",
        danger: "bg-red-50 text-[#DC2626] border-red-200/80",

        // Neutral / Returned / Inactive / Expired / Dibatalkan
        returned: "bg-gray-100 text-[#4B5563] border-gray-200",
        inactive: "bg-gray-100 text-[#6B7280] border-gray-200",
        cancelled: "bg-gray-100 text-[#6B7280] border-gray-200",
        "sold-out": "bg-gray-100 text-[#6B7280] border-gray-200",
        neutral: "bg-gray-100 text-[#4B5563] border-gray-200",
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
  }
);

const dotColorMap: Record<string, string> = {
  available: "bg-[#16A34A]",
  active: "bg-[#16A34A]",
  completed: "bg-[#16A34A]",
  reserved: "bg-[#D97706]",
  maintenance: "bg-[#EA580C]",
  warning: "bg-[#D97706]",
  rented: "bg-[#2563EB]",
  info: "bg-[#2563EB]",
  damaged: "bg-[#DC2626]",
  lost: "bg-[#BE123C]",
  late: "bg-[#DC2626]",
  danger: "bg-[#DC2626]",
  returned: "bg-[#6B7280]",
  inactive: "bg-[#9CA3AF]",
  cancelled: "bg-[#9CA3AF]",
  "sold-out": "bg-[#9CA3AF]",
  neutral: "bg-[#6B7280]",
};

const defaultLabelMap: Record<string, string> = {
  available: "Tersedia",
  active: "Aktif",
  completed: "Selesai",
  reserved: "Dipesan",
  maintenance: "Perawatan",
  warning: "Perhatian",
  rented: "Disewa",
  info: "Informasi",
  damaged: "Rusak",
  lost: "Hilang",
  late: "Terlambat",
  danger: "Bahaya",
  returned: "Dikembalikan",
  inactive: "Nonaktif",
  cancelled: "Dibatalkan",
  "sold-out": "Habis",
  neutral: "Netral",
};

export type StatusBadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: Parameters<typeof HugeiconsIcon>[0]["icon"];
  children?: React.ReactNode;
}

export function StatusBadge({
  variant = "available",
  size = "md",
  dot = false,
  icon,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const currentVariant = variant ?? "available";
  const label = children ?? defaultLabelMap[currentVariant];
  const dotColor = dotColorMap[currentVariant] || "bg-gray-400";

  return (
    <span
      className={cn(badgeVariants({ variant: currentVariant, size, dot }), className)}
      {...props}
    >
      {icon && (
        <HugeiconsIcon
          icon={icon}
          size={size === "sm" ? 11 : size === "lg" ? 15 : 13}
          className="shrink-0"
        />
      )}
      {!icon && dot && (
        <span
          className={cn(
            "rounded-full shrink-0",
            dotColor,
            size === "sm" && "w-1.5 h-1.5",
            size === "md" && "w-2 h-2",
            size === "lg" && "w-2.5 h-2.5"
          )}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

/**
 * Domain Badge: UnitStatus (Physical Inventory Unit Condition)
 */
export function UnitStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: UnitStatus | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  switch (status) {
    case UnitStatus.Available:
    case "Available":
      return (
        <StatusBadge
          variant="available"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Tersedia
        </StatusBadge>
      );
    case UnitStatus.Reserved:
    case "Reserved":
      return (
        <StatusBadge
          variant="reserved"
          size={size}
          icon={Time02Icon}
          className={className}
        >
          Dipesan (Reserved)
        </StatusBadge>
      );
    case UnitStatus.Rented:
    case "Rented":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={InformationCircleIcon}
          className={className}
        >
          Sedang Disewa
        </StatusBadge>
      );
    case UnitStatus.Returned:
    case "Returned":
      return (
        <StatusBadge
          variant="returned"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Dikembalikan
        </StatusBadge>
      );
    case UnitStatus.Maintenance:
    case "Maintenance":
      return (
        <StatusBadge
          variant="maintenance"
          size={size}
          icon={AlertCircleIcon}
          className={className}
        >
          Perawatan
        </StatusBadge>
      );
    case UnitStatus.Damaged:
    case "Damaged":
      return (
        <StatusBadge
          variant="damaged"
          size={size}
          icon={AlertCircleIcon}
          className={className}
        >
          Rusak
        </StatusBadge>
      );
    case UnitStatus.Lost:
    case "Lost":
      return (
        <StatusBadge
          variant="lost"
          size={size}
          icon={CancelCircleIcon}
          className={className}
        >
          Hilang
        </StatusBadge>
      );
    default:
      return (
        <StatusBadge
          variant="inactive"
          size={size}
          dot
          className={className}
        >
          {String(status)}
        </StatusBadge>
      );
  }
}

/**
 * Domain Badge: TransactionStatus (Rental Booking Lifecycle)
 * Enforces OQ-04: No 'Pending' in UI flow.
 */
export function TransactionStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: TransactionStatus | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  switch (status) {
    case TransactionStatus.Pending:
    case TransactionStatus.Menunggu_Pembayaran_DP:
    case "Menunggu_Pembayaran_DP":
    case "Pending":
      return (
        <StatusBadge
          variant="reserved"
          size={size}
          icon={Time02Icon}
          className={className}
        >
          Menunggu DP
        </StatusBadge>
      );
    case TransactionStatus.DP_Dibayar:
    case "DP_Dibayar":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          DP Dibayar
        </StatusBadge>
      );
    case TransactionStatus.Dikonfirmasi:
    case "Dikonfirmasi":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Dikonfirmasi
        </StatusBadge>
      );
    case TransactionStatus.Siap_Diambil:
    case "Siap_Diambil":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={InformationCircleIcon}
          className={className}
        >
          Siap Pickup
        </StatusBadge>
      );
    case TransactionStatus.Sedang_Disewa:
    case "Sedang_Disewa":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={InformationCircleIcon}
          className={className}
        >
          Sedang Disewa
        </StatusBadge>
      );
    case TransactionStatus.Terlambat:
    case "Terlambat":
      return (
        <StatusBadge
          variant="late"
          size={size}
          icon={AlertCircleIcon}
          className={className}
        >
          Terlambat
        </StatusBadge>
      );
    case TransactionStatus.Dikembalikan:
    case "Dikembalikan":
      return (
        <StatusBadge
          variant="returned"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Dikembalikan
        </StatusBadge>
      );
    case TransactionStatus.Selesai:
    case "Selesai":
      return (
        <StatusBadge
          variant="available"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Selesai
        </StatusBadge>
      );
    case TransactionStatus.Ditolak:
    case "Ditolak":
      return (
        <StatusBadge
          variant="damaged"
          size={size}
          icon={CancelCircleIcon}
          className={className}
        >
          Ditolak
        </StatusBadge>
      );
    case TransactionStatus.Expired:
    case "Expired":
      return (
        <StatusBadge
          variant="cancelled"
          size={size}
          icon={Time02Icon}
          className={className}
        >
          Kedaluwarsa
        </StatusBadge>
      );
    case TransactionStatus.Dibatalkan:
    case "Dibatalkan":
      return (
        <StatusBadge
          variant="cancelled"
          size={size}
          icon={CancelCircleIcon}
          className={className}
        >
          Dibatalkan
        </StatusBadge>
      );
    default:
      return (
        <StatusBadge variant="neutral" size={size} dot className={className}>
          {String(status)}
        </StatusBadge>
      );
  }
}

/**
 * Domain Badge: PaymentStatus
 */
export function PaymentStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: PaymentStatus | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  switch (status) {
    case PaymentStatus.Unpaid:
    case PaymentStatus.Pending:
    case "Unpaid":
    case "Pending":
      return (
        <StatusBadge
          variant="reserved"
          size={size}
          icon={Time02Icon}
          className={className}
        >
          Belum Lunas
        </StatusBadge>
      );
    case PaymentStatus.DP_Paid:
    case "DP_Paid":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          DP Lunas (Sisa Toko)
        </StatusBadge>
      );
    case PaymentStatus.Remaining_Paid:
    case PaymentStatus.Fully_Paid:
    case "Remaining_Paid":
    case "Fully_Paid":
      return (
        <StatusBadge
          variant="available"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Lunas Penuh
        </StatusBadge>
      );
    case PaymentStatus.Refunded:
    case "Refunded":
      return (
        <StatusBadge
          variant="neutral"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Di-refund
        </StatusBadge>
      );
    case PaymentStatus.Failed:
    case PaymentStatus.Expired:
    case "Failed":
    case "Expired":
      return (
        <StatusBadge
          variant="damaged"
          size={size}
          icon={CancelCircleIcon}
          className={className}
        >
          Gagal / Expired
        </StatusBadge>
      );
    default:
      return (
        <StatusBadge variant="neutral" size={size} dot className={className}>
          {String(status)}
        </StatusBadge>
      );
  }
}

/**
 * Domain Badge: GuaranteeStatus
 */
export function GuaranteeStatusBadge({
  status,
  docType,
  size = "md",
  className,
}: {
  status: GuaranteeStatus | string;
  docType?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  switch (status) {
    case GuaranteeStatus.Received:
    case "Received":
      return (
        <StatusBadge
          variant="rented"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Jaminan: {docType || "Tersimpan"}
        </StatusBadge>
      );
    case GuaranteeStatus.Returned:
    case "Returned":
      return (
        <StatusBadge
          variant="returned"
          size={size}
          icon={CheckmarkCircle01Icon}
          className={className}
        >
          Jaminan Dikembalikan
        </StatusBadge>
      );
    default:
      return (
        <StatusBadge
          variant="reserved"
          size={size}
          icon={AlertCircleIcon}
          className={className}
        >
          Belum Diterima
        </StatusBadge>
      );
  }
}

export const GuaranteeBadge = GuaranteeStatusBadge;
