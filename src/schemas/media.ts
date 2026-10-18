import { z } from "zod";

export const MediaTypeEnum = z.enum(["image", "video", "IMAGE", "VIDEO"]);

/**
 * Dipakai di server action sebelum simpan metadata ke DB,
 * SETELAH file lolos magic-bytes check di storage.ts (AA-53)
 */
export const packageMediaMetaSchema = z
  .object({
    packageId: z.string().uuid(),
    mediaType: MediaTypeEnum.transform((val) => val.toLowerCase() as "image" | "video"),
    mediaUrl: z.string().url("URL media tidak valid"),
    storagePath: z.string().min(1, "Storage path wajib ada"),
    thumbnailUrl: z.string().url("URL thumbnail tidak valid").optional().nullable(),
    altText: z.string().trim().max(200, "Alt text maksimal 200 karakter").optional().nullable(),
    sortOrder: z.number().int().min(0).default(0),
    isPrimary: z.boolean().default(false),
  })
  .refine(
    (data) => data.mediaType !== "video" || Boolean(data.thumbnailUrl),
    { message: "Video wajib memiliki thumbnail", path: ["thumbnailUrl"] }
  );

export const deleteMediaSchema = z.object({
  mediaId: z.string().uuid(),
});

export type PackageMediaMetaInput = z.infer<typeof packageMediaMetaSchema>;
export type DeleteMediaInput = z.infer<typeof deleteMediaSchema>;
