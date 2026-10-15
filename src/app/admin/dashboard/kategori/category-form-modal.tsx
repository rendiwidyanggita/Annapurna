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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  createCategory,
  updateCategory,
  type CategoryActionState,
} from "./actions";

export interface CategoryFormModalProps {
  children?: React.ReactNode;
  category?: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CategoryFormModal({
  children,
  category,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CategoryFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px]">
        {isOpen && (
          <CategoryFormContent
            category={category}
            onClose={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormContent({
  category,
  onClose,
}: {
  category?: CategoryFormModalProps["category"];
  onClose: () => void;
}) {
  const isEdit = !!category?.id;
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(isEdit ? updateCategory : createCategory, {});

  const [isActive, setIsActive] = useState(
    category ? category.isActive : true
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Edit Kategori" : "Tambah Kategori Baru"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Perbarui detail dan status kategori produk di bawah ini."
            : "Tambahkan kategori baru untuk mengelompokkan produk sewa."}
        </DialogDescription>
      </DialogHeader>

      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {isEdit && <input type="hidden" name="id" value={category.id} />}
      <input
        type="hidden"
        name="isActive"
        value={isActive ? "true" : "false"}
      />

      <div className="space-y-2">
        <Label htmlFor="category-name">
          Nama Kategori <span className="text-destructive">*</span>
        </Label>
        <Input
          id="category-name"
          name="name"
          placeholder="Contoh: Tenda, Carrier, Sleeping Bag"
          defaultValue={category?.name || ""}
          required
          minLength={2}
          maxLength={50}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-description">Deskripsi (Opsional)</Label>
        <Textarea
          id="category-description"
          name="description"
          placeholder="Deskripsi singkat seputar kategori..."
          defaultValue={category?.description || ""}
          maxLength={200}
          rows={3}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">Maksimal 200 karakter.</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 shadow-xs">
        <div className="space-y-0.5">
          <Label htmlFor="category-active" className="text-sm font-medium">
            Status Aktif
          </Label>
          <p className="text-xs text-muted-foreground">
            Kategori yang aktif dapat dipilih saat menambah atau menyewa produk.
          </p>
        </div>
        <Switch
          id="category-active"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={pending}
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
        >
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending
            ? "Menyimpan..."
            : isEdit
            ? "Simpan Perubahan"
            : "Buat Kategori"}
        </Button>
      </DialogFooter>
    </form>
  );
}
