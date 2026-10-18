import { z } from "zod";

export const packageItemSchema = z.object({
  productId: z.string().uuid({ message: "Produk tidak valid" }),
  quantity: z
    .number({ invalid_type_error: "Kuantitas harus berupa angka" })
    .int("Kuantitas harus bilangan bulat")
    .min(1, "Kuantitas minimal 1"),
});

const basePackageFields = {
  name: z
    .string()
    .trim()
    .min(1, "Nama paket wajib diisi")
    .max(150, "Nama paket maksimal 150 karakter"),
  description: z.string().trim().max(1000).optional(),
  pricePermalam: z
    .number({ invalid_type_error: "Harga Permalam harus berupa angka" })
    .int("Harga Permalam harus bilangan bulat")
    .min(0, "Harga Permalam tidak boleh negatif"),
  pricePerkegiatan1: z
    .number({ invalid_type_error: "Harga Perkegiatan I harus berupa angka" })
    .int("Harga Perkegiatan I harus bilangan bulat")
    .min(0, "Harga Perkegiatan I tidak boleh negatif"),
  pricePerkegiatan2: z
    .number({ invalid_type_error: "Harga Perkegiatan II harus berupa angka" })
    .int("Harga Perkegiatan II harus bilangan bulat")
    .min(0, "Harga Perkegiatan II tidak boleh negatif"),
  isActive: z.boolean().default(true),
};

export const createPackageSchema = z.object({
  ...basePackageFields,
  items: z
    .array(packageItemSchema)
    .min(1, "Paket wajib memiliki minimal 1 item produk"),
});

export const updatePackageSchema = z.object({
  id: z.string().uuid(),
  ...basePackageFields,
  items: z
    .array(packageItemSchema)
    .min(1, "Paket wajib memiliki minimal 1 item produk"),
});

export const deletePackageSchema = z.object({
  id: z.string().uuid(),
});

export const togglePackageStatusSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export type PackageItemInput = z.infer<typeof packageItemSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type DeletePackageInput = z.infer<typeof deletePackageSchema>;
export type TogglePackageStatusInput = z.infer<typeof togglePackageStatusSchema>;
