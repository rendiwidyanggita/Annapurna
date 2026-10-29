"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";

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
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLightboxOpen]);
  const total = media.length;

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setSelectedIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setSelectedIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Keyboard navigation for Lightbox modal
  useEffect(() => {
    if (!isLightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    }

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  if (total === 0) {
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
      {/* ── Main Showcase Image (Clickable for Shopee Lightbox) ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
        aria-label="Klik untuk memperbesar foto produk"
        className="group relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-[var(--color-border)] shadow-sm cursor-zoom-in transition-all hover:shadow-md"
      >
        <Image
          src={currentMedia.mediaUrl}
          alt={currentMedia.altText || productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {/* Hover zoom overlay badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <HugeiconsIcon icon={ViewIcon} size={15} />
          <span>Perbesar Foto</span>
        </div>
      </div>

      {/* ── Thumbnail Selector Strip (Below Main Image) ── */}
      {total > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {media.map((item, index) => {
            const isActive = selectedIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Pilih foto ${index + 1}`}
                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  isActive
                    ? "border-red-500 ring-2 ring-red-100 shadow-sm"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
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
            );
          })}
        </div>
      )}

      {/* ── Shopee-Style Lightbox Modal Popup (Portaled to body to escape sticky stacking) ── */}
      {mounted && isLightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galeri foto ${productName}`}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-all animate-fade-in"
          onClick={(e) => {
            // Close when clicking directly on the backdrop outside the card
            if (e.target === e.currentTarget) {
              setIsLightboxOpen(false);
            }
          }}
        >
          {/* Modal Container Card */}
          <div className="relative w-full max-w-5xl h-[88vh] max-h-[700px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10">
            {/* ── LEFT STAGE: Big Active Image Preview with Left & Right Arrows ── */}
            <div className="flex-1 relative bg-[#091510] flex items-center justify-center p-4 overflow-hidden select-none">
              {/* Main Expanded Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={currentMedia.mediaUrl}
                  alt={currentMedia.altText || productName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  className="object-contain"
                />
              </div>

              {/* Left Arrow Button */}
              {total > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Foto sebelumnya"
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={22} strokeWidth={2.5} />
                </button>
              )}

              {/* Right Arrow Button */}
              {total > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Foto berikutnya"
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={22} strokeWidth={2.5} />
                </button>
              )}

              {/* Counter Pill at bottom */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-md z-10">
                {selectedIndex + 1} / {total}
              </div>
            </div>

            {/* ── RIGHT STAGE: Product Title & Thumbnail Grid (Like Shopee) ── */}
            <div className="w-full md:w-80 lg:w-96 bg-white p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 shrink-0">
              {/* Header with Title and Close (X) Button */}
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                    {productName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    aria-label="Tutup galeri"
                    className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={20} />
                  </button>
                </div>

                {/* Thumbnails Section */}
                <div className="pt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
                    Pilihan Foto ({total})
                  </span>

                  <div className="grid grid-cols-3 gap-2.5 overflow-y-auto max-h-[380px] pr-1 py-1">
                    {media.map((item, index) => {
                      const isActive = selectedIndex === index;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          aria-label={`Tampilkan foto ${index + 1}`}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            isActive
                              ? "border-red-500 ring-2 ring-red-100 shadow-md scale-102"
                              : "border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={item.mediaUrl}
                            alt={`${productName} thumbnail ${index + 1}`}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Instructions Footer */}
              <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 leading-tight">
                💡 Gunakan tombol panah ◀ ▶ pada keyboard untuk navigasi foto atau Esc untuk menutup.
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

