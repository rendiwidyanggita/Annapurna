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
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Package01Icon,
  Loading01Icon,
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

  // Collect physical unit items
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
      setErrorMsg("Nomor identitas dokumen jaminan fisik wajib diisi.");
      return;
    }

    if (physicalUnits.length > 0 && verifiedUnitIds.length < physicalUnits.length) {
      setErrorMsg("Seluruh unit fisik wajib dicentang terverifikasi sebelum serah terima dilakukan.");
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
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-20">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/dashboard/transaksi/${transaction.id}`}
          className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              Formulir Serah Terima Barang (Pickup)
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Kasir Toko
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Verifikasi jaminan, pelunasan di tempat, dan serah terima unit untuk transaksi{" "}
            <span className="font-mono font-bold text-gray-800 tabular-nums">
              {transaction.transactionCode}
            </span>{" "}
            ({customerName})
          </p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Section 1: DP Status Banner ── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-blue-600" />
          Pembayaran Uang Muka (DP 50%) Terverifikasi
        </div>
        <p className="mt-1 text-xs text-blue-800 leading-relaxed">
          Pelanggan telah melunasi DP sebesar{" "}
          <strong className="tabular-nums">Rp {transaction.dpAmount.toLocaleString("id-ID")}</strong> melalui transfer online Midtrans payment gateway.
        </p>
      </div>

      {/* ── Section 2: Guarantee Identity Capture (PRD 30) ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-[#16624B]" />
          <h2 className="text-sm font-bold text-gray-900">
            1. Pencatatan Dokumen Jaminan Fisik (Wajib)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Doc Type */}
          <div className="space-y-1.5">
            <Label htmlFor="docType" className="text-xs font-semibold text-gray-700">
              Jenis Dokumen Jaminan Fisik:
            </Label>
            <select
              id="docType"
              value={docType}
              onChange={(e) => setDocType(e.target.value as "KTP" | "SIM" | "KTM")}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
            >
              <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
              <option value="SIM">SIM (Surat Izin Mengemudi)</option>
              <option value="KTM">KTM (Kartu Tanda Mahasiswa)</option>
            </select>
          </div>

          {/* ID Number */}
          <div className="space-y-1.5">
            <Label htmlFor="idNumber" className="text-xs font-semibold text-gray-700">
              Nomor Identitas Dokumen (NIK / No. SIM / NIM) <span className="text-red-500">*</span>:
            </Label>
            <Input
              id="idNumber"
              type="text"
              placeholder="Contoh: 3273123456780001"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="text-xs sm:text-sm font-mono font-medium tabular-nums"
            />
            {idNumber && (
              <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                Preview masking di sistem: <strong className="text-gray-800">{maskIdentityNumber(idNumber)}</strong>
              </p>
            )}
            {fieldErrors.guaranteeIdNumber && (
              <p className="text-xs text-red-600 font-medium">{fieldErrors.guaranteeIdNumber[0]}</p>
            )}
          </div>

          {/* Storage notes */}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="storageNotes" className="text-xs font-semibold text-gray-700">
              Catatan Lokasi Penyimpanan Fisik Dokumen di Toko:
            </Label>
            <Input
              id="storageNotes"
              type="text"
              placeholder="Contoh: Kotak Jaminan Kasir Rak B-02 / Map Plastik Biru"
              value={storageNotes}
              onChange={(e) => setStorageNotes(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: In-Store Remaining Payment ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-[#16624B]" />
          <h2 className="text-sm font-bold text-gray-900">
            2. Pelunasan Sisa Biaya Sewa di Kasir Toko
          </h2>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4">
          <div>
            <span className="text-xs text-gray-500">Sisa Tagihan yang Wajib Dilunasi:</span>
            <p className="text-2xl font-bold font-mono text-gray-900 mt-0.5 tabular-nums">
              Rp {transaction.remainingAmount.toLocaleString("id-ID")}
            </p>
          </div>

          {transaction.remainingAmount > 0 ? (
            <div className="flex items-center gap-3">
              <label
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                  paymentMethod === "Cash"
                    ? "border-[#16624B] bg-[#16624B]/5 text-[#16624B]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === "Cash"}
                  onChange={() => setPaymentMethod("Cash")}
                  className="accent-[#16624B]"
                />
                Kas Tunai (Cash)
              </label>

              <label
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                  paymentMethod === "QRIS_Store"
                    ? "border-[#16624B] bg-[#16624B]/5 text-[#16624B]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QRIS_Store"
                  checked={paymentMethod === "QRIS_Store"}
                  onChange={() => setPaymentMethod("QRIS_Store")}
                  className="accent-[#16624B]"
                />
                QRIS Dinamis Toko
              </label>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
              Lunas Penuh (Tidak ada sisa tagihan)
            </span>
          )}
        </div>
      </div>

      {/* ── Section 4: Unit Handover Checklist ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <HugeiconsIcon icon={Package01Icon} size={18} className="text-[#16624B]" />
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              3. Verifikasi & Serah Terima Fisik Unit ({physicalUnits.length} unit)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pastikan setiap unit fisik telah diperiksa kelengkapannya dan diserahkan kepada pelanggan.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {physicalUnits.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              Seluruh item dalam transaksi ini adalah barang consumable (habis pakai / jual putus).
            </p>
          ) : (
            physicalUnits.map((u) => {
              const isChecked = verifiedUnitIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-colors ${
                    isChecked
                      ? "border-[#16624B]/30 bg-[#16624B]/5"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleUnitToggle(u.id)}
                      className="h-4 w-4 rounded accent-[#16624B]"
                    />
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-900 tabular-nums">
                        {u.inventoryCode}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (Status awal: {u.unitStatus})
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isChecked ? "text-[#16624B]" : "text-gray-400"
                    }`}
                  >
                    {isChecked ? "Terverifikasi ✓" : "Belum Dicek"}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* ── Submit Action ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={`/admin/dashboard/transaksi/${transaction.id}`}>
          <Button variant="outline" type="button" disabled={isPending} className="text-xs h-9">
            Batal & Kembali
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#16624B] hover:bg-[#0F4F3C] text-white text-xs font-semibold h-10 px-6 gap-2 shadow-2xs"
        >
          {isPending ? (
            <HugeiconsIcon icon={Loading01Icon} size={15} className="animate-spin" />
          ) : (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
          )}
          <span>{isPending ? "Memproses Serah Terima..." : "Konfirmasi Serah Terima (Pickup)"}</span>
        </Button>
      </div>
    </form>
  );
}

