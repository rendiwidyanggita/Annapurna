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
  createTermsVersion,
  updateTermsVersion,
  type TermsActionState,
} from "./actions";

export interface TermsFormModalProps {
  children?: React.ReactNode;
  terms?: {
    id: string;
    version: string;
    content: string;
    isActive: boolean;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TermsFormModal({
  children,
  terms,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TermsFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        {isOpen && (
          <TermsFormContent terms={terms} onClose={() => setIsOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TermsFormContent({
  terms,
  onClose,
}: {
  terms?: TermsFormModalProps["terms"];
  onClose: () => void;
}) {
  const isEdit = !!terms?.id;
  const [state, formAction, pending] = useActionState<
    TermsActionState,
    FormData
  >(isEdit ? updateTermsVersion : createTermsVersion, {});

  const [isActive, setIsActive] = useState(terms ? terms.isActive : true);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state?.success, onClose]);

  return (
    <form action={formAction} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? `Edit Syarat & Ketentuan (${terms.version})` : "Buat Versi S&K Baru"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Perbarui isi teks atau label versi Syarat & Ketentuan di bawah ini."
            : "Tambahkan versi aturan peminjaman, jaminan identitas, dan denda baru untuk pelanggan."}
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

      {isEdit && <input type="hidden" name="id" value={terms.id} />}
      <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />

      <div className="space-y-2">
        <Label htmlFor="terms-version">
          Kode / Label Versi <span className="text-destructive">*</span>
        </Label>
        <Input
          id="terms-version"
          name="version"
          placeholder="Contoh: v1.1 atau 2025.1"
          defaultValue={terms?.version || ""}
          required
          minLength={2}
          maxLength={30}
          disabled={pending}
        />
        <p className="text-[11px] text-muted-foreground">
          Gunakan format penomoran versi yang rapi untuk membedakan arsip aturan.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms-content">
          Isi Aturan Syarat & Ketentuan <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="terms-content"
          name="content"
          placeholder={`1. Penyewa wajib menyerahkan identitas asli (KTP/SIM/Paspor) sebagai jaminan...\n2. Pembayaran DP 50% wajib lunas saat booking online...\n3. Denda keterlambatan berlaku Rp X per hari...`}
          defaultValue={terms?.content || ""}
          required
          rows={9}
          disabled={pending}
          className="font-mono text-xs leading-relaxed"
        />
        <p className="text-[11px] text-muted-foreground">
          Tulis setiap poin aturan di baris terpisah. Poin akan otomatis diformat di halaman publik.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3.5 bg-neutral-50/50">
        <div className="space-y-0.5">
          <Label htmlFor="terms-active" className="text-sm font-semibold cursor-pointer">
            Jadikan Versi Aktif
          </Label>
          <p className="text-xs text-muted-foreground">
            Jika aktif, versi ini akan langsung ditampilkan kepada pelanggan di halaman checkout & S&K publik.
          </p>
        </div>
        <Switch
          id="terms-active"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={pending}
        />
      </div>

      <DialogFooter className="gap-2 pt-2">
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
          className="bg-brand-600 text-white hover:bg-brand-700"
          disabled={pending}
        >
          {pending
            ? "Menyimpan..."
            : isEdit
            ? "Simpan Perubahan"
            : "Buat & Simpan Versi"}
        </Button>
      </DialogFooter>
    </form>
  );
}
