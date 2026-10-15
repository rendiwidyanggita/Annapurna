"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function CatalogPagination({
  currentPage,
  totalPages,
}: CatalogPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Generate page numbers array
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pageNumbers.push(i);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1 || isPending}
        className="h-8 px-2.5 text-xs gap-1 border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
        Sebelumnya
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((num, idx) => {
          const prev = pageNumbers[idx - 1];
          const showEllipsis = prev && num - prev > 1;

          return (
            <div key={num} className="flex items-center">
              {showEllipsis && (
                <span className="px-1 text-xs text-[var(--color-muted)]">...</span>
              )}
              <button
                type="button"
                onClick={() => goToPage(num)}
                disabled={isPending}
                className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors ${
                  currentPage === num
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-foreground)]"
                }`}
              >
                {num}
              </button>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages || isPending}
        className="h-8 px-2.5 text-xs gap-1 border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        Selanjutnya
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Button>
    </div>
  );
}
