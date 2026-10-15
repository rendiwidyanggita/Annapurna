"use client";

import { useState, useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteCategory, type CategoryActionState } from "./actions";

export interface DeleteCategoryDialogProps {
  categoryId: string;
  categoryName: string;
  productCount: number;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteCategoryDialog({
  categoryId,
  categoryName,
  productCount,
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: DeleteCategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[420px]">
        {isOpen && (
          <DeleteCategoryContent
            categoryId={categoryId}
            categoryName={categoryName}
            productCount={productCount}
            onClose={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryContent({
  categoryId,
  categoryName,
  productCount,
  onClose,
}: {
  categoryId: string;
  categoryName: string;
  productCount: number;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(deleteCategory, {});

  const hasProducts = productCount > 0;

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={categoryId} />

      <DialogHeader>
        <DialogTitle className="text-destructive">Hapus Kategori</DialogTitle>
        <DialogDescription>
          Konfirmasi penghapusan kategori produk berikut:
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Nama Kategori
        </p>
        <p className="text-sm font-bold text-gray-900">{categoryName}</p>
        <p className="text-xs text-gray-600">
          Jumlah Produk Terkait:{" "}
          <span className="font-semibold">{productCount}</span>
        </p>
      </div>

      {hasProducts ? (
        <div
          role="alert"
          className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1"
        >
          <p className="font-semibold">⚠️ Kategori tidak dapat dihapus</p>
          <p>
            Masih terdapat {productCount} produk aktif yang terhubung dengan
            kategori ini. Silakan hapus atau pindahkan produk tersebut terlebih
            dahulu.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tindakan ini tidak dapat dibatalkan. Kategori ini akan dihapus secara
          permanen dari sistem.
        </p>
      )}

      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={hasProducts || pending}
        >
          {pending ? "Menghapus..." : "Hapus Kategori"}
        </Button>
      </DialogFooter>
    </form>
  );
}
