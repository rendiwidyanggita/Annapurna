import { z } from "zod";

export const adjustConsumableStockSchema = z.object({
  productId: z.string().uuid({ message: "ID produk tidak valid" }),
  delta: z
    .number({ invalid_type_error: "Jumlah penyesuaian harus berupa angka" })
    .int("Jumlah penyesuaian harus bilangan bulat")
    .refine((val) => val !== 0, "Jumlah penyesuaian tidak boleh nol"),
  notes: z
    .string()
    .trim()
    .min(1, "Catatan alasan penyesuaian wajib diisi")
    .max(500, "Catatan maksimal 500 karakter"),
});

export type AdjustConsumableStockInput = z.infer<typeof adjustConsumableStockSchema>;
