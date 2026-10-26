"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  FilterIcon,
  EyeIcon,
  Invoice01Icon,
  Package01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

export interface ActivityLogItem {
  id: string;
  action: string;
  entityName: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  createdAt: Date | string;
  user?: {
    id: string;
    email: string;
    profile?: { fullName: string | null } | null;
  } | null;
}

interface ActivityLogClientProps {
  logs: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  currentEntityName: string;
  currentAction: string;
  currentStartDate: string;
  currentEndDate: string;
  availableEntities: string[];
}

function formatJsonPretty(raw: string | null): string {
  if (!raw) return "-";
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export function ActivityLogClient({
  logs,
  total,
  page,
  totalPages,
  currentEntityName,
  currentAction,
  currentStartDate,
  currentEndDate,
  availableEntities,
}: ActivityLogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [entityInput, setEntityInput] = useState(currentEntityName);
  const [actionInput, setActionInput] = useState(currentAction);
  const [startInput, setStartInput] = useState(currentStartDate);
  const [endInput, setEndInput] = useState(currentEndDate);

  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (entityInput && entityInput !== "ALL") params.set("entityName", entityInput);
    else params.delete("entityName");
    if (actionInput.trim()) params.set("action", actionInput.trim());
    else params.delete("action");
    if (startInput) params.set("startDate", startInput);
    else params.delete("startDate");
    if (endInput) params.set("endDate", endInput);
    else params.delete("endDate");
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/dashboard/activity-log?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setEntityInput("");
    setActionInput("");
    setStartInput("");
    setEndInput("");
    const params = new URLSearchParams();
    startTransition(() => {
      router.push(`/admin/dashboard/activity-log?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/admin/dashboard/activity-log?${params.toString()}`);
    });
  };

  const isFiltered = Boolean(
    currentEntityName || currentAction || currentStartDate || currentEndDate
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Activity Log & Audit Trail (AA-98)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Jejak aktivitas atomik dan perubahan data master transaksi, inventaris, dan akun sistem.
          </p>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminKpiCard
          label="Total Log Aktivitas"
          value={total}
          icon={Clock01Icon}
          iconColorVariant="neutral"
          subtext="Seluruh event terekam"
        />
        <AdminKpiCard
          label="Modul / Entitas Terpantau"
          value={availableEntities.length}
          icon={Package01Icon}
          iconColorVariant="emerald"
          subtext="Entitas relasional aktif"
        />
        <AdminKpiCard
          label="Halaman Log"
          value={`${page} dari ${totalPages}`}
          icon={Invoice01Icon}
          iconColorVariant="blue"
          subtext="20 log per halaman"
        />
      </div>

      {/* ── Filter Toolbar ── */}
      <form
        onSubmit={handleApplyFilter}
        className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Modul / Entitas
          </label>
          <select
            value={entityInput}
            onChange={(e) => setEntityInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] bg-white"
          >
            <option value="">Semua Entitas</option>
            {availableEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Nama Action
          </label>
          <input
            type="text"
            placeholder="Misal: CREATE, CANCEL..."
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B]"
          >
          </input>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Tanggal Dari
          </label>
          <input
            type="date"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] tabular-nums"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Tanggal Sampai
          </label>
          <input
            type="date"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] tabular-nums"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 h-8 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-medium flex items-center justify-center gap-1.5"
          >
            <HugeiconsIcon icon={FilterIcon} size={14} />
            <span>{isPending ? "Menyaring..." : "Saring"}</span>
          </Button>
          {isFiltered && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-8 text-xs border-gray-300 text-gray-600"
            >
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pelaksana (User)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4 text-right">Detail Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Belum ada catatan aktivitas</p>
                    <p className="text-[11px]">Sesuaikan filter atau periksa kembali database Anda.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 tabular-nums text-gray-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div>
                          <p className="font-semibold text-gray-900">{log.user.profile?.fullName || log.user.email}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sistem Otomatis / Cron</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {log.entityName}
                      {log.entityId && (
                        <span className="block text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[280px] truncate">
                      {log.description || "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(log.oldValue || log.newValue) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 text-[11px] px-2.5 font-semibold text-[#16624B] border-emerald-200 hover:bg-[#E7F3EE]"
                        >
                          <HugeiconsIcon icon={EyeIcon} size={13} className="mr-1" />
                          <span>Lihat Diff</span>
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-500">
            <span>
              Menampilkan halaman <strong className="text-gray-900">{page}</strong> dari{" "}
              <strong className="text-gray-900">{totalPages}</strong> (Total {total} log)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                onClick={() => handlePageChange(page - 1)}
                className="h-7 text-xs"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isPending}
                onClick={() => handlePageChange(page + 1)}
                className="h-7 text-xs"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Diff Modal Dialog ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>Audit Diff Viewer</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-100 text-[#16624B]">
                    {selectedLog.action}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedLog.entityName} — ID: {selectedLog.entityId || "N/A"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {selectedLog.description && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                  {selectedLog.description}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Value */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-rose-700">
                    Nilai Sebelumnya (Old Value)
                  </span>
                  <pre className="p-3 rounded-lg bg-rose-50/50 border border-rose-200 text-[11px] font-mono text-gray-800 overflow-x-auto max-h-80 whitespace-pre-wrap">
                    {formatJsonPretty(selectedLog.oldValue)}
                  </pre>
                </div>

                {/* New Value */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Nilai Baru (New Value)
                  </span>
                  <pre className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[11px] font-mono text-gray-800 overflow-x-auto max-h-80 whitespace-pre-wrap">
                    {formatJsonPretty(selectedLog.newValue)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="h-8 text-xs font-semibold"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
