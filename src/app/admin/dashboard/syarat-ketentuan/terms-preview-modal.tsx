"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, File01Icon } from "@hugeicons/core-free-icons";

export interface TermsPreviewModalProps {
  terms: {
    id: string;
    version: string;
    content: string;
    isActive: boolean;
    createdAt: string;
    transactionCount: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsPreviewModal({
  terms,
  open,
  onOpenChange,
}: TermsPreviewModalProps) {
  if (!terms) return null;

  const paragraphs = terms.content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
              <HugeiconsIcon icon={File01Icon} size={18} />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>Pratinjau S&K {terms.version}</span>
                {terms.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-[11px]">
                    Sedang Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">
                    Arsip
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Tampilan aturan yang disetujui pelanggan saat checkout ({terms.transactionCount} transaksi terikat).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-5 space-y-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          {paragraphs.map((line, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
              </span>
              <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {line}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Tutup Pratinjau
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
