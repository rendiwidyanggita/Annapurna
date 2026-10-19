"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, MinusSignIcon } from "@hugeicons/core-free-icons";

export interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
  label?: string;
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  disabled = false,
  onChange,
  className = "",
  label = "Jumlah Unit Sewa",
}: QuantityStepperProps) {
  const isMinDisabled = disabled || value <= min;
  const isMaxDisabled = disabled || value >= max || max <= 0;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMinDisabled) return;
    onChange(Math.max(min, value - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMaxDisabled) return;
    onChange(Math.min(max, value + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) return;
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700">{label}</span>
          <span className="text-[11px] text-[var(--color-muted)]">
            {max <= 0 ? (
              <span className="text-red-500 font-medium">Stok habis</span>
            ) : (
              <span>Maks. {max} unit</span>
            )}
          </span>
        </div>
      )}

      <div className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-xs transition-colors focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isMinDisabled}
          aria-label="Kurangi kuantitas"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
        >
          <HugeiconsIcon icon={MinusSignIcon} size={15} />
        </button>

        {/* Numeric Input */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={max <= 0 ? 0 : value}
          onChange={handleInputChange}
          disabled={disabled || max <= 0}
          aria-label="Kuantitas unit"
          className="w-12 text-center text-sm font-semibold font-mono tabular-nums text-gray-900 bg-transparent focus:outline-none disabled:text-gray-400"
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isMaxDisabled}
          aria-label="Tambah kuantitas"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={15} />
        </button>
      </div>
    </div>
  );
}
