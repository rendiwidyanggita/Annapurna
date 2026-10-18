"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Loading01Icon,
  AlertCircleIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { changeUnitStatus, getUnitStatusLogs } from "./actions";

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: {
    id: string;
    inventoryCode: string;
    productName: string;
    variantName: string;
    unitStatus: string;
  };
}

interface StatusLogItem {
  id: string;
  previousStatus: string;
  newStatus: string;
  notes: string;
  createdAt: Date | string;
  changedByUser?: {
    email: string;
    profile?: { fullName?: string | null } | null;
  } | null;
}

const STATUS_OPTIONS = [
  { value: "Available", label: "Available (Tersedia untuk disewa)", color: "text-emerald-700 bg-emerald-50" },
  { value: "Maintenance", label: "Maintenance (Pembersihan / Servis)", color: "text-orange-700 bg-orange-50" },
  { value: "Damaged", label: "Damaged (Rusak)", color: "text-red-700 bg-red-50" },
  { value: "Lost", label: "Lost (Hilang)", color: "text-red-950 bg-red-100" },
  { value: "Reserved", label: "Reserved (Dipesan)", color: "text-amber-700 bg-amber-50" },
  { value: "Rented", label: "Rented (Sedang Disewa)", color: "text-blue-700 bg-blue-50" },
  { value: "Returned", label: "Returned (Transit Pengembalian)", color: "text-gray-700 bg-gray-100" },
  { value: "Inactive", label: "Inactive (Non-aktif)", color: "text-neutral-600 bg-neutral-100" },
];

export function ChangeStatusModal({
  isOpen,
  onClose,
  unit,
}: ChangeStatusModalProps) {
  const [isPending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<string>(unit.unitStatus);
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<StatusLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(true);

  const [prevUnitId, setPrevUnitId] = useState<string>(unit.id);
  if (unit.id !== prevUnitId) {
    setPrevUnitId(unit.id);
    setNewStatus(unit.unitStatus);
    setNotes("");
    setErrorMessage(null);
    setWarningMessage(null);
    setIsLoadingLogs(true);
  }

  useEffect(() => {
    let ignore = false;
    if (isOpen && unit.id) {
      getUnitStatusLogs(unit.id).then((res) => {
        if (!ignore) {
          setIsLoadingLogs(false);
          if (res.success && res.data) {
            setLogs(res.data as StatusLogItem[]);
          }
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, unit.id]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setWarningMessage(null);

    if (!notes.trim()) {
      setErrorMessage("Catatan alasan perubahan status wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await changeUnitStatus(unit.id, newStatus, notes.trim());

      if (res.success) {
        if (res.warning) {
          setWarningMessage(res.warning);
        } else {
          onClose();
        }
      } else {
        setErrorMessage(res.error || "Gagal mengubah status unit.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[var(--color-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">
              Ubah Status Fisik Unit
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Unit: <span className="font-mono font-medium">{unit.inventoryCode}</span> — {unit.productName} ({unit.variantName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {warningMessage && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Peringatan Transaksi Aktif</span>
              </div>
              <p className="text-[11px] leading-relaxed">{warningMessage}</p>
              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={onClose}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-3"
                >
                  Selesai & Tutup
                </Button>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="statusSelect" className="text-xs font-semibold">
              Status Fisik Baru <span className="text-red-500">*</span>
            </Label>
            <select
              id="statusSelect"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={isPending || Boolean(warningMessage)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason notes (mandatory) */}
          <div className="space-y-1.5">
            <Label htmlFor="statusNotes" className="text-xs font-semibold">
              Alasan Perubahan Status (Wajib dicatat ke Audit Trail) <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="statusNotes"
              rows={3}
              placeholder="Contoh: Frame tenda bengkok sehabis disewa, dipindahkan ke maintenance untuk penggantian bagian..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending || Boolean(warningMessage)}
              required
              className="text-sm"
            />
            <p className="text-[11px] text-[var(--color-muted)]">
              Alasan ini akan disimpan secara permanen di riwayat audit unit.
            </p>
          </div>

          {/* Riwayat 3 Status Log Terakhir */}
          <div className="pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-foreground)] mb-2">
              <HugeiconsIcon icon={Clock01Icon} className="w-3.5 h-3.5 text-[var(--color-muted)]" />
              <span>3 Riwayat Terakhir Unit Ini</span>
            </div>

            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-4 text-xs text-[var(--color-muted)] gap-2">
                <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
                <span>Memuat riwayat log...</span>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] italic py-1">
                Belum ada catatan perubahan status sebelumnya.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-neutral-50 border border-[var(--color-border)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)]">
                      <span className="font-semibold text-[var(--color-foreground)]">
                        {log.previousStatus} → <span className="text-[var(--color-primary)] font-bold">{log.newStatus}</span>
                      </span>
                      <span>
                        {new Date(log.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-neutral-700 text-xs italic">&ldquo;{log.notes}&rdquo;</p>
                    {log.changedByUser && (
                      <p className="text-[10px] text-neutral-400">
                        Oleh: {log.changedByUser.profile?.fullName || log.changedByUser.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClose}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !notes.trim() || Boolean(warningMessage)}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs flex items-center gap-1.5"
            >
              {isPending && <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />}
              Perbarui Status
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
