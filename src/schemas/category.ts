import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(50, "Nama kategori maksimal 50 karakter")
    .trim(),
  description: z
    .string()
    .max(200, "Deskripsi maksimal 200 karakter")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().uuid("ID kategori tidak valid"),
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid("ID kategori tidak valid"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;