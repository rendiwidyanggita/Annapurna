"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  Delete01Icon,
  StarIcon,
  Video01Icon,
  Loading01Icon,
  AlertCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { uploadMediaAction, deleteMediaAction } from "@/app/admin/dashboard/media-actions";

export interface MediaItem {
  id?: string;
  mediaUrl: string;
  storagePath: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string | null;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface MediaUploaderProps {
  initialMedia?: MediaItem[];
  onChange?: (media: MediaItem[]) => void;
  folder?: "products" | "packages";
  maxFiles?: number;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg", "video/mp4", "video/webm"];

/**
 * Capture video first frame via canvas as thumbnail
 */
async function captureVideoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, (video.duration || 2) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(url);
                if (blob) {
                  const thumbFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
                  resolve(thumbFile);
                } else {
                  resolve(null);
                }
              },
              "image/jpeg",
              0.85
            );
          } else {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export function MediaUploader({
  initialMedia = [],
  onChange,
  folder = "products",
  maxFiles = 6,
  disabled = false,
}: MediaUploaderProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMediaList = useCallback(
    (newList: MediaItem[]) => {
      // Re-normalize sortOrder and primary flag: first item is always primary
      const normalized = newList.map((item, idx) => ({
        ...item,
        sortOrder: idx,
        isPrimary: idx === 0,
      }));
      setMediaList(normalized);
      onChange?.(normalized);
    },
    [onChange]
  );

  async function handleFiles(files: FileList | File[]) {
    setErrorMessage(null);
    const fileArray = Array.from(files);

    if (mediaList.length + fileArray.length > maxFiles) {
      setErrorMessage(`Maksimal hanya dapat mengunggah ${maxFiles} file media.`);
      return;
    }

    setIsUploading(true);
    const uploadedItems: MediaItem[] = [];

    for (const file of fileArray) {
      const mime = file.type.toLowerCase();
      if (!ALLOWED_MIME.includes(mime)) {
        setErrorMessage(`Format file "${file.name}" tidak didukung. Hanya JPG, PNG, WEBP, MP4, WEBM.`);
        continue;
      }

      const isVideo = mime.startsWith("video/");
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        setErrorMessage(
          `Ukuran file "${file.name}" melebihi batas maksimal (${isVideo ? "25 MB" : "2 MB"}).`
        );
        continue;
      }

      // Generate video thumbnail if video
      let thumbnailFile: File | null = null;
      if (isVideo) {
        thumbnailFile = await captureVideoThumbnail(file);
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      const res = await uploadMediaAction(formData);

      if (!res.success || !res.data) {
        setErrorMessage(res.error || `Gagal mengunggah file ${file.name}`);
        continue;
      }

      uploadedItems.push({
        mediaUrl: res.data.url,
        storagePath: res.data.storagePath,
        mediaType: res.data.mediaType,
        thumbnailUrl: res.data.thumbnailUrl,
        sortOrder: mediaList.length + uploadedItems.length,
        isPrimary: mediaList.length === 0 && uploadedItems.length === 0,
      });
    }

    setIsUploading(false);

    if (uploadedItems.length > 0) {
      updateMediaList([...mediaList, ...uploadedItems]);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  async function handleDelete(index: number) {
    const itemToDelete = mediaList[index];
    if (!itemToDelete) return;

    // Primary deletion rule (PRD 15.3 & Plan v2)
    if (itemToDelete.isPrimary && mediaList.length > 1) {
      // Prompt or shift primary to next item
      const nextList = mediaList.filter((_, i) => i !== index);
      updateMediaList(nextList);
      // Asynchronously clean up storage
      deleteMediaAction(itemToDelete.storagePath).catch(console.warn);
      return;
    }

    const nextList = mediaList.filter((_, i) => i !== index);
    updateMediaList(nextList);
    deleteMediaAction(itemToDelete.storagePath).catch(console.warn);
  }

  function moveItem(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const copy = [...mediaList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    updateMediaList(copy);
  }

  function setAsPrimary(index: number) {
    if (index === 0) return;
    const copy = [...mediaList];
    const [primary] = copy.splice(index, 1);
    copy.unshift(primary);
    updateMediaList(copy);
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.01]"
            : "border-[var(--color-border)] hover:border-[var(--color-primary)]/60 bg-white"
        } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm"
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <div className="flex flex-col items-center py-2 text-[var(--color-primary)]">
              <HugeiconsIcon icon={Loading01Icon} className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm font-medium">Sedang memvalidasi byte & mengunggah media...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-1">
                <HugeiconsIcon icon={Upload01Icon} className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  Tarik & lepas foto/video di sini, atau{" "}
                  <span className="text-[var(--color-primary)] underline">pilih file</span>
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Mendukung JPG, PNG, WEBP (maks. 2MB) dan MP4, WEBM (maks. 25MB). Maks {maxFiles} file.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preview Grid */}
      {mediaList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span>
              {mediaList.length} dari {maxFiles} media diunggah. Foto pertama adalah foto utama katalog.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaList.map((item, index) => (
              <div
                key={item.storagePath || index}
                className={`relative group rounded-lg overflow-hidden border bg-neutral-50 flex flex-col ${
                  item.isPrimary ? "ring-2 ring-[var(--color-primary)] border-transparent" : "border-[var(--color-border)]"
                }`}
              >
                {/* Image/Video View */}
                <div className="relative aspect-square w-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {item.mediaType === "video" ? (
                    item.thumbnailUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.altText || "Video thumbnail"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <HugeiconsIcon icon={Video01Icon} className="w-8 h-8 text-white drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-neutral-500">
                        <HugeiconsIcon icon={Video01Icon} className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Video MP4</span>
                      </div>
                    )
                  ) : (
                    <Image
                      src={item.mediaUrl}
                      alt={item.altText || `Media ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}

                  {/* Primary Badge */}
                  {item.isPrimary && (
                    <div className="absolute top-1.5 left-1.5 bg-[var(--color-primary)] text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1 z-10">
                      <HugeiconsIcon icon={StarIcon} className="w-3 h-3 fill-white" />
                      Utama
                    </div>
                  )}

                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    {!item.isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsPrimary(index);
                        }}
                        className="p-1.5 bg-white/90 hover:bg-white text-neutral-800 rounded text-xs flex items-center gap-1 shadow"
                        title="Jadikan Foto Utama"
                      >
                        <HugeiconsIcon icon={StarIcon} className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(index);
                      }}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded shadow"
                      title="Hapus media"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Controls: Reorder buttons */}
                <div className="p-1.5 bg-white border-t border-[var(--color-border)] flex items-center justify-between text-xs text-neutral-600">
                  <span className="text-[10px] font-medium text-neutral-400">#{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveItem(index, "up")}
                      className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Pindah ke kiri"
                    >
                      <HugeiconsIcon icon={ArrowUp01Icon} className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={index === mediaList.length - 1}
                      onClick={() => moveItem(index, "down")}
                      className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Pindah ke kanan"
                    >
                      <HugeiconsIcon icon={ArrowDown01Icon} className="w-3 h-3 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
