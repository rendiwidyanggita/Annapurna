/**
 * Magic Bytes Sniffer (AA-53: Server-side Media Upload Hardening)
 *
 * Enforces byte-level MIME sniffing on binary buffers to prevent file extension spoofing,
 * disguised executables, or corrupt media uploads.
 */

export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export const ALLOWED_MIME_TYPES = Object.keys(MIME_TO_EXTENSION);

/**
 * Detect real MIME type by inspecting leading byte signatures.
 * Returns the MIME type string if recognized and allowed, or null otherwise.
 */
export function detectRealMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return "image/webp";
  }

  // 4. WebM: 1A 45 DF A3 (EBML header)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  // 5. MP4: Bytes 4-7 'ftyp' (66 74 79 70)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return "video/mp4";
  }

  return null;
}

/**
 * Validates file buffer against allowed types and derives a safe file extension.
 * Never trusts original client-provided filename extension.
 */
export function validateMediaBuffer(buffer: Buffer): {
  mimeType: string;
  extension: string;
  mediaType: "image" | "video";
} {
  const mimeType = detectRealMimeType(buffer);

  if (!mimeType) {
    throw new Error(
      "Format file tidak valid atau signature biner tidak dikenali (hanya JPG, PNG, WEBP, MP4, WEBM yang diizinkan)."
    );
  }

  const extension = MIME_TO_EXTENSION[mimeType];
  const mediaType: "image" | "video" = mimeType.startsWith("video/") ? "video" : "image";

  return {
    mimeType,
    extension,
    mediaType,
  };
}
