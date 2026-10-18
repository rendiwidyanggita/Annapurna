import { z } from "zod";

export const UnitStatusEnum = z.enum([
  "Available",
  "Reserved",
  "Rented",
  "Returned",
  "Maintenance",
  "Damaged",
  "Lost",
  "Inactive",
]);

export const createUnitSchema = z.object({
  productId: z.string().uuid({ message: "Produk wajib dipilih" }),
  variantId: z.string().uuid({ message: "Varian wajib dipilih" }),
  unitCode: z
    .string()
    .trim()
    .min(1, "Kode unit wajib diisi")
    .max(50, "Kode unit maksimal 50 karakter")
    .regex(/^[A-Z0-9-]+$/i, "Kode unit hanya boleh huruf, angka, dan tanda hubung"),
  notes: z.string().trim().max(500).optional(),
});

export const updateUnitSchema = createUnitSchema.partial().extend({
  id: z.string().uuid(),
});

export const changeUnitStatusSchema = z.object({
  id: z.string().uuid(),
  newStatus: UnitStatusEnum,
  notes: z
    .string()
    .trim()
    .min(1, "Catatan alasan perubahan status wajib diisi")
    .max(500, "Catatan maksimal 500 karakter"),
});

export const deleteUnitSchema = z.object({
  id: z.string().uuid(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type ChangeUnitStatusInput = z.infer<typeof changeUnitStatusSchema>;
export type DeleteUnitInput = z.infer<typeof deleteUnitSchema>;
