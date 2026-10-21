import { z } from "zod";

/**
 * Zod Schemas for Store Operations: Pickup, Return, Penalty & Cancellation
 * (Sprint 2 Phase 3: AA-77 through AA-84, PRD 16.13, 16.14 & 30)
 */

export const pickupSchema = z.object({
  transactionId: z.string().uuid("ID transaksi tidak valid"),
  guaranteeDocType: z.enum(["KTP", "SIM", "KTM"], {
    required_error: "Tipe dokumen jaminan wajib dipilih (KTP, SIM, atau KTM)",
  }),
  guaranteeIdNumber: z
    .string()
    .trim()
    .min(5, "Nomor identitas dokumen minimal 5 digit")
    .max(50, "Nomor identitas dokumen maksimal 50 karakter"),
  guaranteeNotes: z
    .string()
    .trim()
    .max(255, "Catatan penyimpanan maksimal 255 karakter")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["Cash", "QRIS_Store"], {
    required_error: "Metode pembayaran pelunasan wajib dipilih",
  }),
  verifiedUnitIds: z.array(z.string().uuid()).default([]),
});

export const returnItemSchema = z.object({
  transactionItemId: z.string().uuid("ID item transaksi tidak valid"),
  unitId: z.string().uuid("ID unit fisik tidak valid").nullable().optional(),
  quantity: z.number().int().min(1, "Jumlah unit minimal 1"),
  condition: z.enum(["Available", "Maintenance", "Damaged", "Lost"], {
    required_error: "Kondisi fisik unit wajib dipilih",
  }),
  notes: z
    .string()
    .trim()
    .max(255, "Catatan kondisi maksimal 255 karakter")
    .optional()
    .or(z.literal("")),
});

export const penaltyItemSchema = z.object({
  penaltyType: z.enum([
    "Late_Return",
    "Damage",
    "Lost_Item",
    "Incomplete_Item",
    "Other",
  ]),
  amount: z.number().int().min(0, "Nominal denda tidak boleh negatif"),
  reason: z
    .string()
    .trim()
    .min(3, "Alasan denda wajib diisi secara eksplisit (minimal 3 karakter)"),
});

export const returnSchema = z.object({
  transactionId: z.string().uuid("ID transaksi tidak valid"),
  returnedItems: z
    .array(returnItemSchema)
    .min(1, "Minimal 1 barang harus diperiksa untuk pengembalian"),
  penalties: z.array(penaltyItemSchema).default([]),
  penaltyPaymentMethod: z.enum(["Cash", "QRIS_Store"]).optional(),
  guaranteeReturned: z.boolean().refine((val) => val === true, {
    message: "Fisik dokumen jaminan wajib dikonfirmasi telah dikembalikan",
  }),
  notes: z
    .string()
    .trim()
    .max(500, "Catatan pengembalian maksimal 500 karakter")
    .optional()
    .or(z.literal("")),
});

export const cancellationSchema = z.object({
  transactionId: z.string().uuid("ID transaksi tidak valid"),
  reason: z
    .string()
    .trim()
    .min(5, "Alasan pembatalan wajib diisi (minimal 5 karakter)"),
  cancelledBy: z.enum(["customer", "admin"]),
});

export type PickupInput = z.infer<typeof pickupSchema>;
export type ReturnItemInput = z.infer<typeof returnItemSchema>;
export type PenaltyItemInput = z.infer<typeof penaltyItemSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;
