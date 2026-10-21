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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TransactionStatusBadge,
  PaymentStatusBadge,
  GuaranteeBadge,
} from "../status-badge";
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
  CheckmarkCircle02Icon,
  ShoppingBagIcon,
  Calendar01Icon,
  UserIcon,
  Invoice01Icon,
  AlertCircleIcon,
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
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0">
            <Link href="/admin/dashboard/transaksi">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-slate-900">
                {transaction.transactionCode}
              </h1>
              <TransactionStatusBadge status={transaction.transactionStatus} />
            </div>
            <p className="text-xs text-slate-500">
              Dipesan pada{" "}
              {format(new Date(transaction.createdAt), "dd MMMM yyyy HH:mm", {
                locale: localeId,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isReadyPickup && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700 h-9 text-xs">
              <Link href={`/admin/dashboard/transaksi/${transaction.id}/pickup`}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="mr-1.5" />
                Proses Handover (Pickup)
              </Link>
            </Button>
          )}

          {isReadyReturn && (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs">
              <Link href={`/admin/dashboard/transaksi/${transaction.id}/return`}>
                <HugeiconsIcon icon={ShoppingBagIcon} size={16} className="mr-1.5" />
                Pemeriksaan Pengembalian (Return)
              </Link>
            </Button>
          )}

          {canCancel && (
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                  Batalkan Pesanan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Konfirmasi Pembatalan Transaksi</DialogTitle>
                  <DialogDescription>
                    Membatalkan transaksi toko akan melepaskan seluruh jadwal reservasi unit inventaris. Jika DP telah dibayar, status pembayaran akan ditandai untuk refund penuh sesuai kebijakan toko.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Alasan Pembatalan (Wajib diisi):
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Contoh: Permintaan pembatalan dari customer karena kondisi darurat..."
                    className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-primary focus:outline-none"
                  />
                  {cancelError && (
                    <p className="text-xs text-rose-600">{cancelError}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelDialogOpen(false)}
                    disabled={isCancelling}
                  >
                    Tutup
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubmit}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Memproses..." : "Ya, Batalkan Transaksi"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ── Cancelled Banner if applicable ── */}
      {transaction.transactionStatus === TransactionStatus.Dibatalkan && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} />
            Transaksi Dibatalkan
          </div>
          <p className="mt-1 text-xs text-rose-700">
            {transaction.cancelledReason || "Tidak ada alasan pembatalan tercatat."}
          </p>
        </div>
      )}

      {/* ── Grid: Info Pelanggan & Jaminan ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer & Schedule Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HugeiconsIcon icon={UserIcon} size={18} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Data Penyewa & Jadwal
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Nama Pelanggan</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {transaction.user.profile?.fullName || "-"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Email</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {transaction.user.email}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Nomor Telepon</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {transaction.user.profile?.phoneNumber || "-"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Skema Durasi</span>
              <p className="font-medium text-slate-900 mt-0.5 capitalize">
                {transaction.pricingScheme} ({transaction.totalDurationDays} hari)
              </p>
            </div>
            <div className="col-span-2 rounded-lg bg-slate-50 p-2.5">
              <span className="text-slate-500 block mb-1">Periode Sewa</span>
              <p className="font-medium text-slate-900 flex items-center gap-2">
                <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-slate-400" />
                {format(new Date(transaction.startDate), "dd MMMM yyyy", { locale: localeId })}
                {" → "}
                {format(new Date(transaction.endDate), "dd MMMM yyyy", { locale: localeId })}
              </p>
            </div>
          </div>
        </div>

        {/* Guarantee Document Card (PRD 30 Privacy Compliant) */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Dokumen Jaminan Fisik (KTP / SIM / KTM)
              </h2>
            </div>
            <GuaranteeBadge
              status={transaction.guaranteeStatus}
              docType={transaction.guaranteeDocType}
            />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tipe Dokumen:</span>
              <span className="font-semibold text-slate-900">
                {transaction.guaranteeDocType || "Belum diserahkan"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nomor Identitas:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-800">
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
                    className="h-7 px-2 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <HugeiconsIcon
                      icon={isRevealed ? ViewOffIcon : ViewIcon}
                      size={14}
                      className="mr-1"
                    />
                    {isRevealed ? "Sembunyikan" : "Lihat NIK"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lokasi / Catatan Simpan:</span>
              <span className="font-medium text-slate-700">
                {transaction.guaranteeNotes || "-"}
              </span>
            </div>

            <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-2.5 text-[11px] text-blue-800">
              <strong>Privasi Dokumen:</strong> Nomor identitas disamarkan secara otomatis di layar kasir untuk perlindungan privasi. Klik &quot;Lihat NIK&quot; hanya untuk verifikasi fisik di meja kasir.
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Rincian Barang ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Daftar Barang yang Disewa ({transaction.items.length} jenis)
          </h2>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Nama Barang</TableHead>
              <TableHead className="font-semibold text-slate-700">Kode Unit Fisik</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">Qty</TableHead>
              <TableHead className="font-semibold text-slate-700">Harga Sewa</TableHead>
              <TableHead className="font-semibold text-slate-700">Subtotal</TableHead>
              <TableHead className="font-semibold text-slate-700">Status Kembali</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transaction.items.map((item) => {
              const totalReturned = item.returnItems.reduce(
                (sum, r) => sum + r.quantity,
                0
              );
              const isFullyReturned = totalReturned >= item.quantity;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-900">
                    {item.productNameSnap}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.unit ? (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                        {item.unit.inventoryCode}
                      </span>
                    ) : item.unitCodeSnap ? (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                        {item.unitCodeSnap}
                      </span>
                    ) : (
                      <span className="text-slate-400">Consumable</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-900">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    Rp {item.priceSnap.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    {isFullyReturned ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                        Dikembalikan ({totalReturned}/{item.quantity})
                      </span>
                    ) : totalReturned > 0 ? (
                      <span className="text-xs text-amber-600 font-medium">
                        Parsial ({totalReturned}/{item.quantity})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Belum kembali
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Section: Rincian Pembayaran & Denda (PRD 16.14) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Financial Breakdown */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Ringkasan Tagihan & Finansial
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Biaya Sewa:</span>
              <span className="font-semibold text-slate-900">
                Rp {transaction.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Down Payment (DP 50%):</span>
              <span className="font-semibold text-emerald-600">
                Rp {transaction.dpAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Sisa Pelunasan di Toko:</span>
              <span className="font-semibold text-slate-900">
                Rp {transaction.remainingAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Denda Manual (PRD 16.14):</span>
              <span className="font-semibold text-rose-600">
                Rp {totalPenalties.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-bold">
              <span className="text-slate-900">Total Akhir:</span>
              <span className="text-primary">
                Rp {(transaction.totalAmount + totalPenalties).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* List of Penalties */}
          {transaction.penalties.length > 0 && (
            <div className="mt-4 rounded-lg bg-rose-50/60 border border-rose-100 p-3 space-y-2">
              <span className="text-xs font-semibold text-rose-900 block">
                Rincian Denda Manual:
              </span>
              {transaction.penalties.map((pen) => (
                <div key={pen.id} className="text-xs text-rose-800 flex justify-between">
                  <span>
                    <strong>{pen.penaltyType}</strong>: {pen.reason}
                  </span>
                  <span className="font-mono font-semibold">
                    Rp {pen.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Riwayat Pembayaran
            </h2>
            <PaymentStatusBadge status={transaction.paymentStatus} />
          </div>

          <div className="space-y-3">
            {transaction.payments.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-100 p-3 text-xs space-y-1 hover:bg-slate-50/50"
              >
                <div className="flex justify-between font-medium">
                  <span className="text-slate-900">
                    {p.paymentType || "Pembayaran"} ({p.paymentMethod || "Midtrans"})
                  </span>
                  <span className="font-semibold text-emerald-600">
                    Rp {p.grossAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                  <span>{p.midtransOrderId}</span>
                  <span>
                    {p.paidAt
                      ? format(new Date(p.paidAt), "dd/MM/yyyy HH:mm")
                      : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section: Log Aktivitas Audit Trail ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Jejak Audit & Log Aktivitas (Audit Trail)
        </h2>
        <div className="space-y-4">
          {transaction.activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada riwayat aktivitas.</p>
          ) : (
            transaction.activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3 text-xs border-l-2 border-slate-200 pl-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{log.action}</span>
                    <span className="text-slate-400 text-[11px]">
                      {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss", { locale: localeId })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
