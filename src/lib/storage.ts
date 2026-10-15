import { createClient, SupabaseClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs/promises";

// Server-only runtime assertion
if (typeof window !== "undefined") {
  throw new Error("storage.ts hanya dapat digunakan pada lingkungan server.");
}

export interface UploadResult {
  url: string;
  storagePath: string;
  mediaType: "image" | "video";
}

const BUCKET_NAME = "products";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// Max file sizes (PRD 15.3)
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB

let adminClient: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && serviceKey) {
      adminClient = createClient(url, serviceKey);
    }
  }
  return adminClient;
}

/**
 * Upload a media file (image/video) adhering to PRD 15 Storage Abstraction.
 * Supports Supabase Storage as primary provider with guarded local storage fallback for offline dev.
 */
export async function uploadProductMedia(file: File): Promise<UploadResult> {
  const mimeType = file.type.toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

  if (!isImage && !isVideo) {
    throw new Error(
      "Format file tidak didukung. Format yang diperbolehkan: JPG, PNG, WEBP, MP4, WEBM."
    );
  }

  const mediaType: "image" | "video" = isImage ? "image" : "video";
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

  if (file.size > maxSize) {
    throw new Error(
      `Ukuran file melebihi batas maksimal (${isImage ? "2 MB untuk gambar" : "25 MB untuk video"}).`
    );
  }

  // Randomize filename (PRD 15.3)
  const extension = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
  const randomName = `${crypto.randomUUID()}.${extension}`;
  const storagePath = `products/${randomName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasBucket = buckets?.some((b) => b.name === BUCKET_NAME);
      if (!hasBucket) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_VIDEO_SIZE,
        });
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(randomName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(randomName);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            storagePath,
            mediaType,
          };
        }
      } else {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            `Gagal mengunggah media ke Supabase Storage di production: ${uploadError.message}`
          );
        }
        console.warn(
          "[STORAGE WARNING] Upload Supabase Storage gagal di dev, beralih ke fallback lokal:",
          uploadError
        );
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Supabase storage tidak dapat dijangkau di production: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      console.warn(
        "[STORAGE WARNING] Supabase storage unreachable di dev, beralih ke fallback lokal:",
        err
      );
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Kredensial Supabase Storage tidak terkonfigurasi di environment production — upload dibatalkan."
      );
    }
    console.warn(
      "[STORAGE WARNING] Supabase Storage client tidak tersedia di dev. Menggunakan fallback penyimpanan lokal."
    );
  }

  // Fallback to public/uploads/products exclusively for offline local development
  const localDir = path.join(process.cwd(), "public", "uploads", "products");
  await fs.mkdir(localDir, { recursive: true });
  const localFilePath = path.join(localDir, randomName);
  await fs.writeFile(localFilePath, buffer);

  return {
    url: `/uploads/products/${randomName}`,
    storagePath: `local://uploads/products/${randomName}`,
    mediaType,
  };
}

/**
 * Delete one or multiple media files from storage (Supabase or local fallback).
 * Logs warnings on failure so non-critical file cleanup does not break database operations.
 */
export async function deleteProductMedia(
  storagePaths: string | (string | null | undefined)[]
): Promise<void> {
  const rawList = Array.isArray(storagePaths) ? storagePaths : [storagePaths];
  const pathsToDelete = rawList.filter((p): p is string => Boolean(p && typeof p === "string"));

  if (pathsToDelete.length === 0) return;

  const supabase = getSupabaseAdmin();
  const supabaseFiles: string[] = [];
  const localFiles: string[] = [];

  for (const sPath of pathsToDelete) {
    if (sPath.startsWith("local://") || sPath.startsWith("/uploads/")) {
      const cleanName = path.basename(sPath);
      localFiles.push(cleanName);
    } else {
      // In Supabase, the file was stored under randomName in bucket 'products'
      const cleanName = path.basename(sPath);
      supabaseFiles.push(cleanName);
    }
  }

  // 1. Delete from Supabase Storage
  if (supabase && supabaseFiles.length > 0) {
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(supabaseFiles);
      if (error) {
        console.warn(
          `[STORAGE WARNING] Gagal menghapus media dari Supabase Storage (${supabaseFiles.join(", ")}):`,
          error
        );
      }
    } catch (err) {
      console.warn(
        `[STORAGE WARNING] Error saat menghubungi Supabase Storage untuk penghapusan:`,
        err
      );
    }
  }

  // 2. Delete from local storage fallback
  if (localFiles.length > 0) {
    for (const fileName of localFiles) {
      const localFilePath = path.join(process.cwd(), "public", "uploads", "products", fileName);
      try {
        await fs.unlink(localFilePath);
      } catch (err: unknown) {
        // If file already deleted or not found, ignore error
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(`[STORAGE WARNING] Gagal menghapus file lokal (${localFilePath}):`, err);
        }
      }
    }
  }
}

/**
 * Replace existing media: uploads new file first, then deletes old media.
 * If upload fails, old media is preserved.
 */
export async function replaceProductMedia(
  oldStoragePath: string | null | undefined,
  newFile: File
): Promise<UploadResult> {
  // 1. Upload new file first
  const uploadResult = await uploadProductMedia(newFile);

  // 2. Delete old file only after successful upload
  if (oldStoragePath) {
    await deleteProductMedia(oldStoragePath);
  }

  return uploadResult;
}
