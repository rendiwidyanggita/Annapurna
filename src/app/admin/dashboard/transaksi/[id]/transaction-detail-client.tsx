"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TransactionStatusBadge,
  PaymentStatusBadge,
  GuaranteeStatusBadge,
} from "@/components/atoms/status-badge";
import {
  revealGuaranteeIdAction,
  cancelTransactionAction,
} from "../actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ViewIcon,
  ViewOffIcon,
  SecurityCheckIcon,
  CheckmarkCircle01Icon,
  Package01Icon,
  Calendar01Icon,
  UserIcon,
  Invoice01Icon,
  AlertCircleIcon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  TransactionStatus,
  PaymentStatus,
  GuaranteeStatus,
  UnitStatus,
  PenaltyType,
} from "@prisma/client";

interface TransactionDetailClientProps {
  transaction: {
    id: string;
    transactionCode: string;
    startDate: Date | string;
    endDate: Date | string;
    totalDurationDays: number;
    pricingScheme: string;
    totalAmount: number;
    dpAmount: number;
    remainingAmount: number;
    transactionStatus: TransactionStatus;
    paymentStatus: PaymentStatus;
    guaranteeStatus: GuaranteeStatus;
    guaranteeDocType?: string | null;
    guaranteeNotes?: string | null;
    maskedGuaranteeId: string;
    notes?: string | null;
    cancelledReason?: string | null;
    createdAt: Date | string;
    user: {
      id: string;
      email: string;
      profile?: {
        fullName?: string | null;
        phoneNumber?: string | null;
      } | null;
    };
    items: Array<{
      id: string;
      productId: string;
      productNameSnap: string;
      unitCodeSnap?: string | null;
      priceSnap: number;
      quantity: number;
      subtotal: number;
      unit?: {
        id: string;
        inventoryCode: string;
        unitStatus: UnitStatus;
      } | null;
      returnItems: Array<{
        id: string;
        quantity: number;
        returnedCondition: UnitStatus;
        notes?: string | null;
        createdAt: Date | string;
      }>;
    }>;
    payments: Array<{
      id: string;
      midtransOrderId: string;
      paymentType?: string | null;
      paymentMethod?: string | null;
      grossAmount: number;
      paymentStatus: PaymentStatus;
      paidAt?: Date | string | null;
      createdAt: Date | string;
    }>;
    returns: Array<{
      id: string;
      returnDate: Date | string;
      lateDays: number;
      guaranteeReturnStatus: GuaranteeStatus;
      notes?: string | null;
      items: Array<{
        id: string;
        quantity: number;
        returnedCondition: UnitStatus;
        unit?: { inventoryCode: string } | null;
      }>;
    }>;
    penalties: Array<{
      id: string;
      penaltyType: PenaltyType;
      amount: number;
      reason: string;
      createdAt: Date | string;
    }>;
    activityLogs: Array<{
      id: string;
      action: string;
      description?: string | null;
      createdAt: Date | string;
      user?: {
        email: string;
        profile?: { fullName?: string | null } | null;
      } | null;
    }>;
  };
}

export function TransactionDetailClient({
  transaction,
}: TransactionDetailClientProps) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const [rawGuaranteeId, setRawGuaranteeId] = useState<string | null>(null);
  const [isRevealing, startRevealTransition] = useTransition();

  // Cancel dialog state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, startCancelTransition] = useTransition();

  const handleRevealId = () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    startRevealTransition(async () => {
      const res = await revealGuaranteeIdAction(transaction.id);
      if (res.success && res.data) {
        setRawGuaranteeId(res.data.rawGuaranteeId);
        setIsRevealed(true);
      }
    });
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      setCancelError("Alasan pembatalan wajib diisi.");
      return;
    }

    startCancelTransition(async () => {
      setCancelError(null);
      const res = await cancelTransactionAction({
        transactionId: transaction.id,
        reason: cancelReason.trim(),
        cancelledBy: "admin",
      });

      if (res.success) {
        setIsCancelDialogOpen(false);
        router.refresh();
      } else {
        setCancelError(res.error || "Gagal membatalkan transaksi.");
      }
    });
  };

  const isReadyPickup =
    transaction.transactionStatus === TransactionStatus.DP_Dibayar ||
    transaction.transactionStatus === TransactionStatus.Siap_Diambil ||
    transaction.transactionStatus === TransactionStatus.Dikonfirmasi;

  const isReadyReturn =
    transaction.transactionStatus === TransactionStatus.Sedang_Disewa ||
    transaction.transactionStatus === TransactionStatus.Terlambat;

  const canCancel =
    transaction.transactionStatus === TransactionStatus.Menunggu_Pembayaran_DP ||
    transaction.transactionStatus === TransactionStatus.DP_Dibayar ||
    transaction.transactionStatus === TransactionStatus.Dikonfirmasi ||
    transaction.transactionStatus === TransactionStatus.Siap_Diambil;

  const totalPenalties = transaction.penalties.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/transaksi"
            className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-mono text-gray-900 tabular-nums">
                {transaction.transactionCode}
              </h1>
              <TransactionStatusBadge status={transaction.transactionStatus} size="sm" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
              Dipesan pada{" "}
              {format(new Date(transaction.createdAt), "dd MMMM yyyy HH:mm", {
                locale: localeId,
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isReadyPickup && (
            <Link href={`/admin/dashboard/transaksi/${transaction.id}/pickup`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 text-xs font-semibold gap-1.5 shadow-2xs text-white">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
                <span>Proses Serah Terima (Pickup)</span>
              </Button>
            </Link>
          )}

          {isReadyReturn && (
            <Link href={`/admin/dashboard/transaksi/${transaction.id}/return`}>
              <Button size="sm" className="bg-[#16624B] hover:bg-[#0F4F3C] h-9 text-xs font-semibold gap-1.5 shadow-2xs text-white">
                <HugeiconsIcon icon={Package01Icon} size={15} />
                <span>Pemeriksaan Return & Denda</span>
              </Button>
            </Link>
          )}

          {canCancel && (
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50">
                  Batalkan Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-gray-900">
                    Konfirmasi Pembatalan Transaksi
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Membatalkan transaksi akan melepaskan jadwal reservasi unit inventaris. Jika DP telah dibayar, tandai status untuk kebijakan pengembalian dana.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Alasan Pembatalan <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Contoh: Permintaan pembatalan dari customer karena kendala cuaca buruk..."
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#16624B] focus:outline-none"
                  />
                  {cancelError && (
                    <p className="text-xs text-red-600 font-medium">{cancelError}</p>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCancelDialogOpen(false)}
                    disabled={isCancelling}
                    className="text-xs"
                  >
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelSubmit}
                    disabled={isCancelling}
                    className="text-xs"
                  >
                    {isCancelling ? "Memproses..." : "Ya, Batalkan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ── Cancelled Banner if applicable ── */}
      {transaction.transactionStatus === TransactionStatus.Dibatalkan && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-xs flex items-start gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">Transaksi Dibatalkan</p>
            <p className="mt-0.5 text-red-700">
              {transaction.cancelledReason || "Tidak ada rincian alasan pembatalan tercatat."}
            </p>
          </div>
        </div>
      )}

      {/* ── Grid: Info Pelanggan & Jaminan ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer & Schedule Card */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <HugeiconsIcon icon={UserIcon} size={18} className="text-[#16624B]" />
            <h2 className="text-sm font-bold text-gray-900">
              Data Penyewa & Jadwal Sewa
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 text-[11px]">Nama Lengkap</span>
              <p className="font-semibold text-gray-900 mt-0.5">
                {transaction.user.profile?.fullName || "-"}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Email Terdaftar</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {transaction.user.email}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Nomor Telepon / WhatsApp</span>
              <p className="font-medium text-gray-800 mt-0.5 tabular-nums">
                {transaction.user.profile?.phoneNumber || "-"}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-[11px]">Skema Durasi</span>
              <p className="font-medium text-gray-800 mt-0.5 capitalize tabular-nums">
                {transaction.pricingScheme} ({transaction.totalDurationDays} hari)
              </p>
            </div>
            <div className="col-span-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-3">
              <span className="text-gray-500 text-[11px] block mb-1">Periode Tanggal Sewa</span>
              <p className="font-semibold text-gray-900 flex items-center gap-2 tabular-nums">
                <HugeiconsIcon icon={Calendar01Icon} size={15} className="text-[#16624B]" />
                {format(new Date(transaction.startDate), "dd MMMM yyyy", { locale: localeId })}
                <span className="text-gray-400">→</span>
                {format(new Date(transaction.endDate), "dd MMMM yyyy", { locale: localeId })}
              </p>
            </div>
          </div>
        </div>

        {/* Guarantee Document Card (PRD 30 Privacy Compliant) */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">
                Dokumen Jaminan Fisik Pelanggan
              </h2>
            </div>
            <GuaranteeStatusBadge
              status={transaction.guaranteeStatus}
              docType={transaction.guaranteeDocType}
              size="sm"
            />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tipe Dokumen Fisik:</span>
              <span className="font-semibold text-gray-900">
                {transaction.guaranteeDocType || "Belum diserahkan ke kasir"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nomor Identitas (NIK/SIM):</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 tabular-nums">
                  {isRevealed
                    ? rawGuaranteeId || "Tidak ada data"
                    : transaction.maskedGuaranteeId}
                </span>
                {transaction.maskedGuaranteeId !== "-" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRevealId}
                    disabled={isRevealing}
                    className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold"
                  >
                    {isRevealing ? (
                      <HugeiconsIcon icon={Loading01Icon} size={13} className="mr-1 animate-spin" />
                    ) : (
                      <HugeiconsIcon
                        icon={isRevealed ? ViewOffIcon : ViewIcon}
                        size={13}
                        className="mr-1"
                      />
                    )}
                    {isRevealed ? "Sembunyikan" : "Lihat NIK"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Lokasi / Catatan Simpan:</span>
              <span className="font-medium text-gray-800">
                {transaction.guaranteeNotes || <span className="text-gray-400">-</span>}
              </span>
            </div>

            <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-2.5 text-[11px] text-blue-800 leading-relaxed">
              <strong>Privasi Dokumen (PRD Section 30):</strong> Nomor identitas pelanggan disamarkan otomatis di layar kasir untuk perlindungan privasi. Klik tombol &ldquo;Lihat NIK&rdquo; hanya untuk verifikasi fisik saat serah terima barang.
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Rincian Barang yang Disewa ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Daftar Barang yang Disewa ({transaction.items.length} jenis produk)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kode Unit Fisik</th>
                <th className="py-3 px-4 text-center">Kuantitas</th>
                <th className="py-3 px-4">Harga Sewa Satuan</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Status Pengembalian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {transaction.items.map((item) => {
                const totalReturned = item.returnItems.reduce(
                  (sum, r) => sum + r.quantity,
                  0
                );
                const isFullyReturned = totalReturned >= item.quantity;

                return (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {item.productNameSnap}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums">
                      {item.unit ? (
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {item.unit.inventoryCode}
                        </span>
                      ) : item.unitCodeSnap ? (
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {item.unitCodeSnap}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-sans">Consumable</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-gray-700 tabular-nums">
                      Rp {item.priceSnap.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900 tabular-nums">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      {isFullyReturned ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                          Dikembalikan ({totalReturned}/{item.quantity})
                        </span>
                      ) : totalReturned > 0 ? (
                        <span className="inline-flex items-center text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Parsial ({totalReturned}/{item.quantity})
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          Belum kembali
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section: Rincian Pembayaran & Denda (PRD 16.14) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Financial Breakdown */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-[#16624B]" />
            <h2 className="text-sm font-bold text-gray-900">
              Ringkasan Tagihan & Finansial
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB]">
              <span className="text-gray-600">Total Biaya Sewa:</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                Rp {transaction.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB]">
              <span className="text-gray-600">Down Payment (DP 50% via Midtrans):</span>
              <span className="font-semibold text-[#16624B] tabular-nums">
                Rp {transaction.dpAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB]">
              <span className="text-gray-600">Sisa Pelunasan di Toko:</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                Rp {transaction.remainingAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB]">
              <span className="text-gray-600">Total Denda Manual (PRD 16.14):</span>
              <span className={`font-semibold tabular-nums ${totalPenalties > 0 ? "text-red-600" : "text-gray-400"}`}>
                Rp {totalPenalties.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between pt-2.5 text-sm font-bold">
              <span className="text-gray-900">Total Tagihan Akhir:</span>
              <span className="text-[#16624B] tabular-nums text-base">
                Rp {(transaction.totalAmount + totalPenalties).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* List of Penalties */}
          {transaction.penalties.length > 0 && (
            <div className="mt-4 rounded-xl bg-red-50/70 border border-red-200 p-3.5 space-y-2">
              <span className="text-xs font-bold text-red-900 block">
                Rincian Denda Tercatat:
              </span>
              {transaction.penalties.map((pen) => (
                <div key={pen.id} className="text-xs text-red-800 flex justify-between">
                  <span>
                    <strong>{pen.penaltyType}</strong>: {pen.reason}
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    Rp {pen.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="text-sm font-bold text-gray-900">
              Riwayat Pembayaran Transaksi
            </h2>
            <PaymentStatusBadge status={transaction.paymentStatus} size="sm" />
          </div>

          <div className="space-y-3">
            {transaction.payments.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada riwayat pembayaran terkonfirmasi.</p>
            ) : (
              transaction.payments.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[#E5E7EB] p-3 text-xs space-y-1.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">
                      {p.paymentType || "Pembayaran"} ({p.paymentMethod || "Midtrans"})
                    </span>
                    <span className="text-[#16624B] tabular-nums">
                      Rp {p.grossAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-mono text-[11px] tabular-nums">
                    <span>Order: {p.midtransOrderId}</span>
                    <span>
                      {p.paidAt
                        ? format(new Date(p.paidAt), "dd/MM/yyyy HH:mm")
                        : "Pending"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Section: Log Aktivitas Audit Trail ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 border-b border-[#E5E7EB] pb-3">
          Jejak Audit & Log Aktivitas (Audit Trail)
        </h2>
        <div className="space-y-3">
          {transaction.activityLogs.length === 0 ? (
            <p className="text-xs text-gray-400">Belum ada riwayat aktivitas.</p>
          ) : (
            transaction.activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs border-l-2 border-[#16624B]/40 pl-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{log.action}</span>
                    <span className="text-gray-400 text-[11px] tabular-nums">
                      {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss", { locale: localeId })}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-0.5">{log.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

