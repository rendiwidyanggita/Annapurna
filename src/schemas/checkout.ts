import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("ID produk tidak valid"),
  variantId: z.string().uuid("ID varian tidak valid").optional().nullable(),
  productName: z.string().min(1),
  itemType: z.enum(["rental_unit", "consumable"]),
  durationScheme: z.enum(["permalam", "perkegiatan1", "perkegiatan2"]),
  startDate: z.string().datetime("Tanggal mulai tidak valid"),
  endDate: z.string().datetime("Tanggal selesai tidak valid"),
  unitPrice: z.number().int().min(0),
  quantity: z.number().int().min(1, "Kuantitas minimal 1"),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Keranjang sewa tidak boleh kosong"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Anda wajib menyetujui Syarat & Ketentuan sewa sebelum melanjutkan." }),
  }),
  notes: z.string().max(500).optional(),
});

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
