"use server";

import { requireRole } from "@/lib/auth/require-role";
import { uploadMedia, deleteMedia } from "@/lib/storage";

export interface MediaUploadActionResult {
  success: boolean;
  data?: {
    url: string;
    storagePath: string;
    mediaType: "image" | "video";
    thumbnailUrl?: string | null;
  };
  error?: string;
}

/**
 * Server Action for uploading media with byte-level verification (AA-52 & AA-53).
 * Requires admin or owner role as first line of defense.
 */
export async function uploadMediaAction(
  formData: FormData
): Promise<MediaUploadActionResult> {
  try {
    await requireRole(["admin", "owner"]);

    const file = formData.get("file") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const folder = (formData.get("folder") as "products" | "packages") || "products";

    if (!file || !(file instanceof File)) {
      return { success: false, error: "File tidak ditemukan atau format tidak valid." };
    }

    // 1. Upload main media file with magic bytes validation
    const result = await uploadMedia(file, folder);

    // 2. If video and thumbnail provided, upload thumbnail image
    let thumbnailUrl: string | null = null;
    if (result.mediaType === "video" && thumbnailFile && thumbnailFile instanceof File) {
      try {
        const thumbResult = await uploadMedia(thumbnailFile, folder);
        thumbnailUrl = thumbResult.url;
      } catch (thumbErr) {
        console.warn("[MEDIA WARNING] Gagal mengunggah thumbnail video otomatis:", thumbErr);
      }
    }

    return {
      success: true,
      data: {
        ...result,
        thumbnailUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengunggah media.",
    };
  }
}

/**
 * Server Action for deleting media from storage.
 * Requires admin or owner role.
 */
export async function deleteMediaAction(
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["admin", "owner"]);
    if (!storagePath) {
      return { success: false, error: "Path media tidak valid." };
    }
    await deleteMedia(storagePath);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus media.",
    };
  }
}
