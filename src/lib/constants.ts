import { TransactionStatus } from "@prisma/client";

/**
 * Transaction statuses that bind inventory units and reserve schedule slots.
 * Any transaction in these statuses prevents units from being booked during overlapping dates.
 * (PRD 29.5 & Sprint 2 Decision OQ-02)
 */
export const ACTIVE_STATUSES: TransactionStatus[] = [
  TransactionStatus.Menunggu_Pembayaran_DP,
  TransactionStatus.DP_Dibayar,
  TransactionStatus.Dikonfirmasi,
  TransactionStatus.Siap_Diambil,
  TransactionStatus.Sedang_Disewa,
  TransactionStatus.Terlambat,
];
