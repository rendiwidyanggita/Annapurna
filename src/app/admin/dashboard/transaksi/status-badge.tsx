import { Badge } from "@/components/ui/badge";
import { TransactionStatus, PaymentStatus, GuaranteeStatus } from "@prisma/client";

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  switch (status) {
    case TransactionStatus.Pending:
    case TransactionStatus.Menunggu_Pembayaran_DP:
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-50 text-amber-700 font-medium">
          Menunggu DP
        </Badge>
      );
    case TransactionStatus.DP_Dibayar:
    case TransactionStatus.Siap_Diambil:
    case TransactionStatus.Dikonfirmasi:
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-50 text-blue-700 font-medium">
          Siap Pickup
        </Badge>
      );
    case TransactionStatus.Sedang_Disewa:
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-emerald-700 font-medium">
          Sedang Disewa
        </Badge>
      );
    case TransactionStatus.Terlambat:
      return (
        <Badge variant="outline" className="border-rose-500/30 bg-rose-50 text-rose-700 font-medium animate-pulse">
          Terlambat
        </Badge>
      );
    case TransactionStatus.Selesai:
    case TransactionStatus.Dikembalikan:
      return (
        <Badge variant="outline" className="border-emerald-600/30 bg-emerald-100 text-emerald-800 font-medium">
          Selesai
        </Badge>
      );
    case TransactionStatus.Dibatalkan:
    case TransactionStatus.Ditolak:
    case TransactionStatus.Expired:
      return (
        <Badge variant="outline" className="border-slate-400/30 bg-slate-100 text-slate-600 font-medium">
          {status === TransactionStatus.Expired ? "Kedaluwarsa" : "Dibatalkan"}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case PaymentStatus.Unpaid:
    case PaymentStatus.Pending:
      return (
        <span className="inline-flex items-center text-xs font-medium text-amber-600">
          Belum Lunas
        </span>
      );
    case PaymentStatus.DP_Paid:
      return (
        <span className="inline-flex items-center text-xs font-medium text-blue-600">
          DP Lunas (Sisa Pelunasan)
        </span>
      );
    case PaymentStatus.Fully_Paid:
    case PaymentStatus.Remaining_Paid:
      return (
        <span className="inline-flex items-center text-xs font-medium text-emerald-600">
          Lunas Penuh
        </span>
      );
    case PaymentStatus.Refunded:
      return (
        <span className="inline-flex items-center text-xs font-medium text-purple-600">
          Di-refund
        </span>
      );
    case PaymentStatus.Failed:
    case PaymentStatus.Expired:
      return (
        <span className="inline-flex items-center text-xs font-medium text-rose-600">
          Gagal / Expired
        </span>
      );
    default:
      return <span className="text-xs text-slate-500">{status}</span>;
  }
}

export function GuaranteeBadge({
  status,
  docType,
}: {
  status: GuaranteeStatus;
  docType?: string | null;
}) {
  switch (status) {
    case GuaranteeStatus.Received:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
          Jaminan: {docType || "Tersimpan"}
        </span>
      );
    case GuaranteeStatus.Returned:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          Jaminan Dikembalikan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
          Belum Diterima
        </span>
      );
  }
}
