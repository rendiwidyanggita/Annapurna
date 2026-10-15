"use client";

import { useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { deleteProduct, type ProductActionState } from "./actions";

interface DeleteProductDialogProps {
  product: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: ProductActionState = {};

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: DeleteProductDialogProps) {
  const [state, formAction, isPending] = useActionState(deleteProduct, initialState);

  // Close modal when deletion is successful
  useEffect(() => {
    if (state.success && open) {
      onOpenChange(false);
    }
  }, [state.success, open, onOpenChange]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
              <HugeiconsIcon icon={AlertCircleIcon} size={22} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--color-primary)]">
                Hapus Produk
              </DialogTitle>
              <DialogDescription className="text-sm text-[var(--color-muted)] mt-1">
                Tindakan ini akan menonaktifkan dan menyembunyikan produk dari katalog.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3">
          <p className="text-sm text-[var(--color-foreground)]">
            Apakah Anda yakin ingin menghapus produk{" "}
            <span className="font-semibold text-[var(--color-primary)]">
              &ldquo;{product.name}&rdquo;
            </span>
            ?
          </p>

          <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200">
            Catatan: Produk yang memiliki unit aktif dalam transaksi sewa tidak dapat dihapus.
          </p>

          {state.error && (
            <div className="mt-3 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {state.error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>

          <form action={formAction} className="w-full sm:w-auto">
            <input type="hidden" name="id" value={product.id} />
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus Produk"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
