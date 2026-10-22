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
      <div className="flex border-b border-[#E5E7EB] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("units")}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "units"
              ? "border-[#16624B] text-[#16624B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <HugeiconsIcon icon={ListViewIcon} size={16} />
          <span>Unit Fisik (Rental)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
              activeTab === "units"
                ? "bg-[#16624B]/10 text-[#16624B]"
                : "bg-gray-100 text-gray-500"
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
              ? "border-[#16624B] text-[#16624B]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <HugeiconsIcon icon={Package01Icon} size={16} />
          <span>Stok Habis Pakai (Consumable)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
              activeTab === "consumable"
                ? "bg-[#16624B]/10 text-[#16624B]"
                : "bg-gray-100 text-gray-500"
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

