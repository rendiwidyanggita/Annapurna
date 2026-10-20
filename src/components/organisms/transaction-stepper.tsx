import { TransactionStatus } from "@prisma/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  Cancel01Icon,
  Wallet01Icon,
  PackageIcon,
  Archive01Icon,
  CheckListIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Step Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface StepConfig {
  /** Match against TransactionStatus values */
  statuses: TransactionStatus[];
  label: string;
  description: string;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
}

/**
 * The 5 canonical customer-facing steps.
 * Maps one or more internal TransactionStatus values to a single UI step.
 */
const STEPPER_STEPS: StepConfig[] = [
  {
    statuses: [
      TransactionStatus.Pending,
      TransactionStatus.Menunggu_Pembayaran_DP,
    ],
    label: "Menunggu DP",
    description: "Bayar DP 50% secara online",
    icon: Wallet01Icon,
  },
  {
    statuses: [
      TransactionStatus.DP_Dibayar,
      TransactionStatus.Dikonfirmasi,
    ],
    label: "DP Dibayar",
    description: "Pembayaran dikonfirmasi",
    icon: CheckmarkCircle01Icon,
  },
  {
    statuses: [TransactionStatus.Siap_Diambil],
    label: "Siap Diambil",
    description: "Alat siap di toko",
    icon: PackageIcon,
  },
  {
    statuses: [
      TransactionStatus.Sedang_Disewa,
      TransactionStatus.Terlambat,
    ],
    label: "Sedang Disewa",
    description: "Alat sedang digunakan",
    icon: Archive01Icon,
  },
  {
    statuses: [
      TransactionStatus.Dikembalikan,
      TransactionStatus.Selesai,
    ],
    label: "Selesai",
    description: "Pesanan selesai",
    icon: CheckListIcon,
  },
];

/** Terminal failure statuses — rendered separately, not on the happy-path stepper */
const TERMINAL_FAILURE_STATUSES: TransactionStatus[] = [
  TransactionStatus.Dibatalkan,
  TransactionStatus.Ditolak,
  TransactionStatus.Expired,
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getActiveStepIndex(status: TransactionStatus): number {
  return STEPPER_STEPS.findIndex((step) =>
    step.statuses.includes(status),
  );
}

function isTerminalFailure(status: TransactionStatus): boolean {
  return TERMINAL_FAILURE_STATUSES.includes(status);
}

function getTerminalLabel(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.Expired:
      return "Reservasi Kadaluwarsa";
    case TransactionStatus.Dibatalkan:
      return "Pesanan Dibatalkan";
    case TransactionStatus.Ditolak:
      return "Pesanan Ditolak";
    default:
      return "Pesanan Tidak Aktif";
  }
}

function getTerminalDescription(status: TransactionStatus): string {
  switch (status) {
    case TransactionStatus.Expired:
      return "Pembayaran DP tidak diselesaikan dalam 60 menit. Unit sewa telah dilepas kembali.";
    case TransactionStatus.Dibatalkan:
      return "Pesanan ini telah dibatalkan.";
    case TransactionStatus.Ditolak:
      return "Pesanan ditolak oleh admin. Silakan hubungi kami untuk informasi lebih lanjut.";
    default:
      return "Pesanan ini tidak lagi aktif.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionStepperProps {
  currentStatus: TransactionStatus;
  className?: string;
}

/**
 * TransactionStepper — Organism component for 5-stage booking progress.
 *
 * Stages (AA-76):
 *   Menunggu DP → DP Dibayar → Siap Diambil → Sedang Disewa → Selesai
 *
 * Handles terminal failure states (Expired, Dibatalkan, Ditolak) separately.
 *
 * Responsive: horizontal on md+, vertical stacked on mobile.
 */
export function TransactionStepper({
  currentStatus,
  className,
}: TransactionStepperProps) {
  // ── Terminal failure state ──
  if (isTerminalFailure(currentStatus)) {
    return (
      <div
        className={cn(
          "bg-white rounded-2xl border border-[var(--color-border)] p-5",
          className,
        )}
      >
        <h3 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider mb-4">
          Status Pesanan
        </h3>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">
              {getTerminalLabel(currentStatus)}
            </p>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              {getTerminalDescription(currentStatus)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = getActiveStepIndex(currentStatus);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[var(--color-border)] p-5",
        className,
      )}
    >
      <h3 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider mb-5">
        Status Pesanan
      </h3>

      {/* ── Mobile: vertical layout ── */}
      <div className="flex flex-col gap-0 md:hidden">
        {STEPPER_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          const IconComponent = step.icon;

          return (
            <div key={step.label} className="flex items-start gap-3">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                    isCompleted &&
                      "bg-emerald-600 border-emerald-600 text-white",
                    isActive &&
                      "bg-emerald-50 border-emerald-600 text-emerald-700",
                    isPending && "bg-white border-neutral-300 text-neutral-400",
                  )}
                >
                  {isCompleted ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={16}
                      className="text-white"
                    />
                  ) : (
                    <HugeiconsIcon icon={IconComponent} size={16} />
                  )}
                </div>

                {/* Vertical line */}
                {idx < STEPPER_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[28px] mt-0.5",
                      isCompleted ? "bg-emerald-500" : "bg-neutral-200",
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pb-6 pt-1.5">
                <p
                  className={cn(
                    "text-xs font-bold leading-tight",
                    isCompleted && "text-emerald-700",
                    isActive && "text-emerald-800",
                    isPending && "text-neutral-400",
                  )}
                >
                  {step.label}
                  {isActive && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        size={10}
                      />
                      Saat ini
                    </span>
                  )}
                </p>
                <p
                  className={cn(
                    "text-[11px] mt-0.5",
                    isPending ? "text-neutral-400" : "text-neutral-500",
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop: horizontal layout ── */}
      <div className="hidden md:block relative">
        {/* Progress track */}
        <div className="absolute top-[18px] left-[18px] right-[18px] h-0.5 bg-neutral-200 -z-0">
          <div
            className="h-full bg-emerald-500 transition-all duration-700 ease-in-out"
            style={{
              width:
                currentIndex <= 0
                  ? "0%"
                  : `${(currentIndex / (STEPPER_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="flex items-start justify-between relative">
          {STEPPER_STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isPending = idx > currentIndex;

            const IconComponent = step.icon;

            return (
              <div
                key={step.label}
                className="flex flex-col items-center gap-2 flex-1 px-1"
              >
                {/* Circle icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300",
                    isCompleted &&
                      "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200",
                    isActive &&
                      "bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm shadow-emerald-200 ring-4 ring-emerald-100",
                    isPending &&
                      "bg-white border-neutral-300 text-neutral-400",
                  )}
                >
                  {isCompleted ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={16}
                      className="text-white"
                    />
                  ) : (
                    <HugeiconsIcon icon={IconComponent} size={16} />
                  )}
                </div>

                {/* Label block */}
                <div className="text-center max-w-[90px]">
                  <p
                    className={cn(
                      "text-[11px] font-bold leading-tight",
                      isCompleted && "text-emerald-700",
                      isActive && "text-emerald-800",
                      isPending && "text-neutral-400",
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-0.5 leading-tight",
                      isPending ? "text-neutral-400" : "text-neutral-500",
                    )}
                  >
                    {step.description}
                  </p>

                  {/* "Saat ini" badge */}
                  {isActive && (
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                      <HugeiconsIcon icon={Clock01Icon} size={8} />
                      Saat ini
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
