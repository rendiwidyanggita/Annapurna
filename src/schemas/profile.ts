import { z } from "zod";

export const completeProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nama lengkap minimal 3 karakter (sesuai KTP/identitas)")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  phoneNumber: z
    .string()
    .regex(
      /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/,
      "Format nomor WhatsApp tidak valid (contoh: 081234567890)"
    ),
  address: z
    .string()
    .min(10, "Alamat domisili minimal 10 karakter untuk verifikasi penyewaan")
    .max(500, "Alamat maksimal 500 karakter"),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
