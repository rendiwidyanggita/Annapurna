import { z } from "zod";

export const createTermsSchema = z.object({
  version: z
    .string()
    .min(2, "Label versi minimal 2 karakter (misal: v1.1)")
    .max(30, "Label versi maksimal 30 karakter")
    .trim(),
  content: z
    .string()
    .min(20, "Isi syarat & ketentuan minimal 20 karakter")
    .max(10000, "Isi syarat & ketentuan maksimal 10.000 karakter")
    .trim(),
  isActive: z.boolean().default(true),
});

export const updateTermsSchema = z.object({
  id: z.string().uuid("ID Syarat & Ketentuan tidak valid"),
  version: z
    .string()
    .min(2, "Label versi minimal 2 karakter (misal: v1.1)")
    .max(30, "Label versi maksimal 30 karakter")
    .trim(),
  content: z
    .string()
    .min(20, "Isi syarat & ketentuan minimal 20 karakter")
    .max(10000, "Isi syarat & ketentuan maksimal 10.000 karakter")
    .trim(),
  isActive: z.boolean().default(true),
});

export const toggleTermsActiveSchema = z.object({
  id: z.string().uuid("ID Syarat & Ketentuan tidak valid"),
});

export type CreateTermsInput = z.infer<typeof createTermsSchema>;
export type UpdateTermsInput = z.infer<typeof updateTermsSchema>;
export type ToggleTermsActiveInput = z.infer<typeof toggleTermsActiveSchema>;
