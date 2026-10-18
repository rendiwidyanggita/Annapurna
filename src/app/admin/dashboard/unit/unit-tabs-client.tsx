"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ListViewIcon, Package01Icon } from "@hugeicons/core-free-icons";

interface UnitTabsClientProps {
  unitCount: number;
  consumableCount: number;
  unitsContent: React.ReactNode;
  consumableContent: React.ReactNode;
}

export function UnitTabsClient({
  unitCount,
  consumableCount,
  unitsContent,
  consumableContent,
}: UnitTabsClientProps) {
  const [activeTab, setActiveTab] = useState<"units" | "consumable">("units");

  return (
    <div className="space-y-4">
      {/* Tab Navigation Buttons */}
      <div className="flex border-b border-[var(--color-border)] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("units")}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "units"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-muted)] hover:text-neutral-800"
          }`}
        >
          <HugeiconsIcon icon={ListViewIcon} className="w-4 h-4" />
          <span>Unit Fisik (Rental)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "units"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {unitCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("consumable")}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "consumable"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-muted)] hover:text-neutral-800"
          }`}
        >
          <HugeiconsIcon icon={Package01Icon} className="w-4 h-4" />
          <span>Stok Habis Pakai (Consumable)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "consumable"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {consumableCount}
          </span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div>{activeTab === "units" ? unitsContent : consumableContent}</div>
    </div>
  );
}
