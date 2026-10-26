import { z } from "zod";

export const dateRangePresetEnum = z.enum([
  "today",
  "7d",
  "30d",
  "this_month",
  "last_month",
  "custom",
]);

export const reportFilterSchema = z
  .object({
    preset: dateRangePresetEnum.default("30d"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional(),
    status: z.string().optional(),
    productId: z.string().uuid("Product ID harus berupa UUID").optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(50),
  })
  .refine(
    (data) => {
      if (data.preset === "custom") {
        return Boolean(data.startDate && data.endDate);
      }
      return true;
    },
    {
      message: "Tanggal mulai dan akhir wajib diisi jika preset 'custom'",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start > end) return false;
        // Maximum 366 days
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 366;
      }
      return true;
    },
    {
      message: "Rentang tanggal tidak boleh melebihi 366 hari dan tanggal mulai harus <= tanggal akhir",
      path: ["endDate"],
    }
  );

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
