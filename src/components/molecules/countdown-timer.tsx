"use client";

import { useState, useEffect, useCallback } from "react";
import { differenceInSeconds } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /**
   * The exact datetime when the booking expires.
   * Typically: transaction.createdAt + 60 minutes
   */
  expiryDate: Date;
  /**
   * Called once when the timer reaches 0.
   * Ideal for triggering a page refresh or showing expiry UI.
   */
  onExpire?: () => void;
  className?: string;
}

/**
 * CountdownTimer — Molecule component for booking expiry countdown.
 *
 * Displays a live MM:SS countdown for soft-hold booking windows (60 minutes).
 * Source of truth is the server-side `expiryDate` — this is purely a UX aid.
 *
 * AA-71: Expired Booking Rule (UI portion)
 */
export function CountdownTimer({
  expiryDate,
  onExpire,
  className,
}: CountdownTimerProps) {
  const calculateTimeLeft = useCallback(() => {
    const diff = differenceInSeconds(expiryDate, new Date());
    return Math.max(0, diff);
  }, [expiryDate]);

  const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft);
  const [hasExpired, setHasExpired] = useState<boolean>(false);
  const [hasTriggered, setHasTriggered] = useState<boolean>(false);

  useEffect(() => {
    // Immediately recalculate on mount (handles hydration mismatch)
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    if (initial === 0) {
      setHasExpired(true);
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0 && !hasTriggered) {
        setHasExpired(true);
        setHasTriggered(true);
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, onExpire, hasTriggered]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Colour intensity based on urgency
  const isUrgent = timeLeft > 0 && timeLeft <= 300; // last 5 minutes
  const isCritical = timeLeft > 0 && timeLeft <= 60; // last 60 seconds

  if (hasExpired) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-2xl",
          "bg-red-50 border border-red-200",
          className,
        )}
      >
        <HugeiconsIcon
          icon={AlertCircleIcon}
          size={18}
          className="text-red-600 shrink-0 mt-0.5"
        />
        <div>
          <p className="text-xs font-bold text-red-800">Waktu Pembayaran Habis</p>
          <p className="text-[11px] text-red-700 mt-0.5">
            Batas waktu pembayaran DP telah berakhir. Reservasi Anda sedang diproses
            untuk dibatalkan secara otomatis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-colors",
        isCritical
          ? "bg-red-50 border-red-300"
          : isUrgent
            ? "bg-amber-50 border-amber-300"
            : "bg-amber-50 border-amber-200",
        className,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
          isCritical
            ? "bg-red-100"
            : isUrgent
              ? "bg-amber-100"
              : "bg-amber-100",
        )}
      >
        <HugeiconsIcon
          icon={Clock01Icon}
          size={20}
          className={cn(
            isCritical
              ? "text-red-600 animate-pulse"
              : isUrgent
                ? "text-amber-600"
                : "text-amber-600",
          )}
        />
      </div>

      {/* Timer display */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[11px] font-medium mb-1",
            isCritical ? "text-red-700" : "text-amber-700",
          )}
        >
          Selesaikan pembayaran sebelum waktu habis
        </p>

        <div className="flex items-baseline gap-1" suppressHydrationWarning>
          {/* MM */}
          <span
            suppressHydrationWarning
            className={cn(
              "font-mono font-bold tabular-nums",
              isCritical
                ? "text-red-800 text-2xl"
                : isUrgent
                  ? "text-amber-900 text-2xl"
                  : "text-amber-900 text-2xl",
            )}
          >
            {String(minutes).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "font-bold text-xl",
              isCritical ? "text-red-600" : "text-amber-600",
            )}
          >
            :
          </span>
          {/* SS */}
          <span
            suppressHydrationWarning
            className={cn(
              "font-mono font-bold tabular-nums",
              isCritical
                ? "text-red-800 text-2xl"
                : "text-amber-900 text-2xl",
            )}
          >
            {String(seconds).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium ml-1",
              isCritical ? "text-red-600" : "text-amber-600",
            )}
          >
            menit tersisa
          </span>
        </div>
      </div>

      {/* Pulse dot */}
      <div className="shrink-0">
        <span
          className={cn(
            "inline-block w-2.5 h-2.5 rounded-full",
            isCritical
              ? "bg-red-500 animate-ping"
              : "bg-amber-400 animate-pulse",
          )}
        />
      </div>
    </div>
  );
}

/**
 * Static success variant — shown once payment is confirmed.
 */
export function PaymentSuccessBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200",
        className,
      )}
    >
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        size={18}
        className="text-emerald-600 shrink-0 mt-0.5"
      />
      <div>
        <p className="text-xs font-bold text-emerald-800">Pembayaran DP Berhasil!</p>
        <p className="text-[11px] text-emerald-700 mt-0.5">
          Pembayaran DP 50% telah dikonfirmasi. Unit sewa Anda sudah disiapkan.
        </p>
      </div>
    </div>
  );
}
