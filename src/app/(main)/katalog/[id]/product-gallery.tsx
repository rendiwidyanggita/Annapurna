"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";

interface ProductGalleryProps {
  media: {
    id: string;
    mediaUrl: string;
    altText?: string | null;
    isPrimary: boolean;
  }[];
  productName: string;
}

export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (media.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl bg-[var(--color-primary-soft)] border border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-primary)] opacity-70">
        <HugeiconsIcon icon={ShoppingBag01Icon} size={48} />
        <span className="text-xs font-medium mt-2">Foto produk belum tersedia</span>
      </div>
    );
  }

  const currentMedia = media[selectedIndex] || media[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-[var(--color-border)] shadow-sm">
        <Image
          src={currentMedia.mediaUrl}
          alt={currentMedia.altText || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-all duration-300"
        />
      </div>

      {/* Thumbnail Selector Strip (if > 1 media) */}
      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                selectedIndex === index
                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={item.mediaUrl}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
