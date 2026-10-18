import { z } from "zod";
import { ItemType } from "@prisma/client";

// Product variant schema for inline form
export const productVariantSchema = z.object({
  variantName: z
    .string()
    .min(1, "Nama variasi wajib diisi")
    .max(50, "Nama variasi maksimal 50 karakter"),
  size: z
    .string()
    .max(20, "Ukuran maksimal 20 karakter")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .max(30, "Warna maksimal 30 karakter")
    .optional()
    .or(z.literal("")),
  brand: z
    .string()
    .max(50, "Merek maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .min(3, "Nama produk minimal 3 karakter")
    .max(100, "Nama produk maksimal 100 karakter")
    .trim(),
  description: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .or(z.literal("")),
  categoryId: z
    .string()
    .uuid("Kategori wajib dipilih"),
  itemType: z.nativeEnum(ItemType, {
    errorMap: () => ({ message: "Tipe item wajib dipilih" })
  }),
  pricePermalam: z
    .number()
    .int()
    .min(1000, "Harga permalam minimal Rp 1.000")
    .max(10000000, "Harga permalam maksimal Rp 10.000.000"),
  pricePerkegiatan1: z
    .number()
    .int()
    .min(1000, "Harga perkegiatan I minimal Rp 1.000")
    .max(50000000, "Harga perkegiatan I maksimal Rp 50.000.000"),
  pricePerkegiatan2: z
    .number()
    .int()
    .min(1000, "Harga perkegiatan II minimal Rp 1.000")
    .max(100000000, "Harga perkegiatan II maksimal Rp 100.000.000"),
  consumableStock: z
    .number()
    .int()
    .min(0, "Stok tidak boleh negatif")
    .max(9999, "Stok maksimal 9999")
    .optional()
    .default(0),
  isReusable: z.boolean().default(true),
  isActive: z.boolean().default(true),
  imageUrl: z
    .string()
    .optional()
    .or(z.literal("")),
  // Inline variants - array of variant objects
  variants: z
    .array(productVariantSchema)
    .optional()
    .default([]),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid("ID produk tidak valid"),
});

export const deleteProductSchema = z.object({
  id: z.string().uuid("ID produk tidak valid"),
});

// Helper schema for converting form data
export const productFormSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.string(),
  itemType: z.string(),
  pricePermalam: z.string(),
  pricePerkegiatan1: z.string(),
  pricePerkegiatan2: z.string(),
  consumableStock: z.string().optional(),
  isActive: z.string().optional(),
  imageUrl: z.string().optional(),
  // Variants as JSON string from form
  variants: z.string().optional(),
});

// Transform form data to proper types
export function transformProductFormData(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    categoryId: formData.get("categoryId") as string,
    itemType: formData.get("itemType") as string,
    pricePermalam: formData.get("pricePermalam") as string,
    pricePerkegiatan1: formData.get("pricePerkegiatan1") as string,
    pricePerkegiatan2: formData.get("pricePerkegiatan2") as string,
    consumableStock: formData.get("consumableStock") as string,
    isActive: formData.get("isActive") as string,
    imageUrl: formData.get("imageUrl") as string,
    variants: formData.get("variants") as string,
  };

  // Parse variants JSON
  let variants: z.infer<typeof productVariantSchema>[] = [];
  if (raw.variants) {
    try {
      variants = JSON.parse(raw.variants);
    } catch {
      variants = [];
    }
  }

  return {
    name: raw.name?.trim() || "",
    description: raw.description?.trim() || undefined,
    categoryId: raw.categoryId || "",
    itemType: raw.itemType as ItemType,
    pricePermalam: parseInt(raw.pricePermalam) || 0,
    pricePerkegiatan1: parseInt(raw.pricePerkegiatan1) || 0,
    pricePerkegiatan2: parseInt(raw.pricePerkegiatan2) || 0,
    consumableStock: parseInt(raw.consumableStock) || 0,
    isActive: raw.isActive === "on" || raw.isActive === "true",
    imageUrl: raw.imageUrl?.trim() || undefined,
    isReusable: formData.get("isReusable") !== "false",
    variants,
  };
}

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;