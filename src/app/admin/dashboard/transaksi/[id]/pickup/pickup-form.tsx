"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pickupTransactionAction } from "../../actions";
import { maskIdentityNumber } from "@/lib/services/transaction-privacy";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  SecurityCheckIcon,
  Invoice01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { TransactionStatus, PaymentStatus } from "@prisma/client";

interface PickupFormProps {
  transaction: {
    id: string;
    transactionCode: string;
    remainingAmount: number;
    dpAmount: number;
    transactionStatus: TransactionStatus;
    paymentStatus: PaymentStatus;
    user: {
      email: string;
      profile?: {
        fullName?: string | null;
        phoneNumber?: string | null;
      } | null;
    };
    items: Array<{
      id: string;
      productNameSnap: string;
      quantity: number;
      unit?: {
        id: string;
        inventoryCode: string;
        unitStatus: string;
      } | null;
    }>;
  };
}

export function PickupForm({ transaction }: PickupFormProps) {
  const router = useRouter();
  const [docType, setDocType] = useState<"KTP" | "SIM" | "KTM">("KTP");
  const [idNumber, setIdNumber] = useState("");
  const [storageNotes, setStorageNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "QRIS_Store">("Cash");

  // Collect initial unit IDs
  const physicalUnits = transaction.items
    .filter((item) => Boolean(item.unit?.id))
    .map((item) => item.unit!);

  const [verifiedUnitIds, setVerifiedUnitIds] = useState<string[]>(
    physicalUnits.map((u) => u.id)
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isPending, startTransition] = useTransition();

  const handleUnitToggle = (unitId: string) => {
    setVerifiedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!idNumber.trim()) {
      setErrorMsg("Nomor identitas dokumen jaminan wajib diisi.");
      return;
    }

    if (physicalUnits.length > 0 && verifiedUnitIds.length < physicalUnits.length) {
      setErrorMsg("Seluruh unit fisik wajib diverifikasi sebelum serah terima dilakukan.");
      return;
    }

    startTransition(async () => {
      const res = await pickupTransactionAction({
        transactionId: transaction.id,
        guaranteeDocType: docType,
        guaranteeIdNumber: idNumber.trim(),
        guaranteeNotes: storageNotes.trim() || undefined,
        paymentMethod,
        verifiedUnitIds,
      });

      if (res.success) {
        router.push(`/admin/dashboard/transaksi/${transaction.id}`);
      } else {
        setErrorMsg(res.error || "Gagal memproses serah terima barang.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  const customerName = transaction.user.profile?.fullName || transaction.user.email;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0">
          <Link href={`/admin/dashboard/transaksi/${transaction.id}`}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Formulir Serah Terima Barang (Pickup)
          </h1>
          <p className="text-xs text-slate-500">
            Verifikasi jaminan, pelunasan di tempat, dan serah terima unit untuk transaksi{" "}
            <span className="font-mono font-semibold text-slate-800">
              {transaction.transactionCode}
            </span>{" "}
            ({customerName})
          </p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Section 1: DP Status Banner ── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="text-blue-600" />
          Pembayaran Uang Muka (DP) Terverifikasi
        </div>
        <p className="mt-1 text-xs text-blue-800">
          Pelanggan telah melunasi DP sebesar{" "}
          <strong>Rp {transaction.dpAmount.toLocaleString("id-ID")}</strong> melalui transfer online Midtrans.
        </p>
      </div>

      {/* ── Section 2: Guarantee Identity Capture (PRD 30) ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            1. Pencatatan Dokumen Jaminan Fisik (Wajib)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Doc Type */}
          <div className="space-y-1.5">
            <Label htmlFor="docType" className="text-xs font-semibold text-slate-700">
              Jenis Dokumen Jaminan:
            </Label>
            <select
              id="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value as "KTP" | "SIM" | "KTM")}
              className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
              <option value="SIM">SIM (Surat Izin Mengemudi)</option>
              <option value="KTM">KTM (Kartu Tanda Mahasiswa)</option>
            </select>
          </div>

          {/* ID Number */}
          <div className="space-y-1.5">
            <Label htmlFor="idNumber" className="text-xs font-semibold text-slate-700">
              Nomor Identitas Dokumen (NIK / No. SIM):
            </Label>
            <Input
              id="idNumber"
              type="text"
              placeholder="Contoh: 3273123456780001"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="text-sm font-mono"
            />
            {idNumber && (
              <p className="text-[11px] text-slate-500 font-mono">
                Preview masking di sistem: {maskIdentityNumber(idNumber)}
              </p>
            )}
            {fieldErrors.guaranteeIdNumber && (
              <p className="text-xs text-rose-600">{fieldErrors.guaranteeIdNumber[0]}</p>
            )}
          </div>

          {/* Storage notes */}
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="storageNotes" className="text-xs font-semibold text-slate-700">
              Catatan Lokasi Penyimpanan Fisik di Toko:
            </Label>
            <Input
              id="storageNotes"
              type="text"
              placeholder="Contoh: Kotak Jaminan Rak B-02 / Map Biru"
              value={storageNotes}
              onChange={(e) => setStorageNotes(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: In-Store Remaining Payment ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            2. Pelunasan Sisa Biaya Sewa di Toko
          </h2>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-slate-50 p-4">
          <div>
            <span className="text-xs text-slate-500">Sisa Tagihan yang Harus Dilunasi:</span>
            <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              Rp {transaction.remainingAmount.toLocaleString("id-ID")}
            </p>
          </div>

          {transaction.remainingAmount > 0 ? (
            <div className="flex items-center gap-3">
              <label
                className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium cursor-pointer transition-colors ${
                  paymentMethod === "Cash"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === "Cash"}
                  onChange={() => setPaymentMethod("Cash")}
                  className="accent-primary"
                />
                Kas Tunai (Cash)
              </label>

              <label
                className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium cursor-pointer transition-colors ${
                  paymentMethod === "QRIS_Store"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QRIS_Store"
                  checked={paymentMethod === "QRIS_Store"}
                  onChange={() => setPaymentMethod("QRIS_Store")}
                  className="accent-primary"
                />
                QRIS Kasir Toko
              </label>
            </div>
          ) : (
            <span className="text-xs font-semibold text-emerald-600">
              Lunas Penuh (Tidak ada sisa tagihan)
            </span>
          )}
        </div>
      </div>

      {/* ── Section 4: Unit Handover Checklist ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            3. Verifikasi & Serah Terima Fisik Unit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan setiap unit fisik telah diperiksa kelengkapannya dan diserahkan ke pelanggan.
          </p>
        </div>

        <div className="space-y-2">
          {physicalUnits.map((u) => {
            const isChecked = verifiedUnitIds.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                  isChecked
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleUnitToggle(u.id)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {u.inventoryCode}
                    </span>
                    <span className="ml-2 text-xs text-slate-600">
                      (Status awal: {u.unitStatus})
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {isChecked ? "Terverifikasi" : "Belum Dicek"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Submit Button ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href={`/admin/dashboard/transaksi/${transaction.id}`}>
            Batal
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 min-w-48 text-xs font-semibold"
        >
          {isPending ? "Memproses Serah Terima..." : "Konfirmasi Serah Terima (Pickup)"}
        </Button>
      </div>
    </form>
  );
}
