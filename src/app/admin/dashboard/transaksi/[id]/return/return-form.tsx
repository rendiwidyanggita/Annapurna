"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { returnTransactionAction } from "../../actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ShoppingBagIcon,
  AlertCircleIcon,
  SecurityCheckIcon,
  Invoice01Icon,
  PlusSignIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { format, differenceInCalendarDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  UnitStatus,
  PenaltyType,
} from "@prisma/client";

interface ReturnFormItem {
  id: string; // transactionItemId
  productNameSnap: string;
  quantity: number;
  unitId?: string | null;
  unitCode?: string | null;
  isReusable?: boolean;
  previouslyReturnedQty: number;
}

interface ReturnFormProps {
  transaction: {
    id: string;
    transactionCode: string;
    startDate: Date | string;
    endDate: Date | string;
    guaranteeDocType?: string | null;
    guaranteeNotes?: string | null;
    user: {
      email: string;
      profile?: { fullName?: string | null } | null;
    };
    items: ReturnFormItem[];
  };
}

type TargetCondition = "Available" | "Maintenance" | "Damaged" | "Lost";

interface ItemConditionState {
  transactionItemId: string;
  unitId?: string | null;
  quantity: number;
  condition: TargetCondition;
  notes: string;
}

interface PenaltyState {
  penaltyType: PenaltyType;
  amount: number;
  reason: string;
}

export function ReturnForm({ transaction }: ReturnFormProps) {
  const router = useRouter();

  // Calculate late days as suggestion (PRD 16.14)
  const now = new Date();
  const endDate = new Date(transaction.endDate);
  const calculatedLateDays = Math.max(0, differenceInCalendarDays(now, endDate));
  const suggestedLateFeePerDay = 50000;
  const suggestedLatePenalty = calculatedLateDays * suggestedLateFeePerDay;

  // Initialize return items state
  const [itemConditions, setItemConditions] = useState<ItemConditionState[]>(
    transaction.items.map((item) => ({
      transactionItemId: item.id,
      unitId: item.unitId || null,
      quantity: Math.max(1, item.quantity - item.previouslyReturnedQty),
      condition: UnitStatus.Available,
      notes: "",
    }))
  );

  // Initialize penalties state with suggested late fee if overdue
  const [penalties, setPenalties] = useState<PenaltyState[]>(
    calculatedLateDays > 0
      ? [
          {
            penaltyType: PenaltyType.Late_Return,
            amount: suggestedLatePenalty,
            reason: `Terlambat ${calculatedLateDays} hari dari batas sewa (${format(
              endDate,
              "dd/MM/yyyy"
            )})`,
          },
        ]
      : []
  );

  const [penaltyPaymentMethod, setPenaltyPaymentMethod] = useState<
    "Cash" | "QRIS_Store"
  >("Cash");
  const [guaranteeReturned, setGuaranteeReturned] = useState(true);
  const [returnNotes, setReturnNotes] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Handlers for items
  const handleConditionChange = (
    transactionItemId: string,
    condition: TargetCondition
  ) => {
    setItemConditions((prev) =>
      prev.map((item) =>
        item.transactionItemId === transactionItemId
          ? { ...item, condition }
          : item
      )
    );
  };

  const handleNotesChange = (transactionItemId: string, notes: string) => {
    setItemConditions((prev) =>
      prev.map((item) =>
        item.transactionItemId === transactionItemId
          ? { ...item, notes }
          : item
      )
    );
  };

  const handleQuantityChange = (
    transactionItemId: string,
    quantity: number
  ) => {
    setItemConditions((prev) =>
      prev.map((item) =>
        item.transactionItemId === transactionItemId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  // Handlers for penalties (PRD 16.14)
  const handleAddPenalty = () => {
    setPenalties((prev) => [
      ...prev,
      {
        penaltyType: PenaltyType.Damage,
        amount: 0,
        reason: "",
      },
    ]);
  };

  const handleRemovePenalty = (index: number) => {
    setPenalties((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePenaltyChange = (
    index: number,
    field: keyof PenaltyState,
    value: unknown
  ) => {
    setPenalties((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const totalPenalties = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guaranteeReturned) {
      setErrorMsg("Fisik dokumen jaminan wajib dikonfirmasi telah dikembalikan.");
      return;
    }

    // PRD 16.14: Check penalty reasons
    for (const p of penalties) {
      if (p.amount > 0 && !p.reason.trim()) {
        setErrorMsg("Setiap denda dengan nominal > 0 wajib memiliki alasan yang jelas.");
        return;
      }
    }

    startTransition(async () => {
      const res = await returnTransactionAction({
        transactionId: transaction.id,
        returnedItems: itemConditions.map((ic) => ({
          transactionItemId: ic.transactionItemId,
          unitId: ic.unitId || null,
          quantity: ic.quantity,
          condition: ic.condition,
          notes: ic.notes || undefined,
        })),
        penalties: penalties
          .filter((p) => p.amount > 0)
          .map((p) => ({
            penaltyType: p.penaltyType,
            amount: p.amount,
            reason: p.reason.trim(),
          })),
        penaltyPaymentMethod: totalPenalties > 0 ? penaltyPaymentMethod : undefined,
        guaranteeReturned,
        notes: returnNotes.trim() || undefined,
      });

      if (res.success) {
        router.push(`/admin/dashboard/transaksi/${transaction.id}`);
      } else {
        setErrorMsg(res.error || "Gagal memproses pengembalian.");
      }
    });
  };

  const customerName =
    transaction.user.profile?.fullName || transaction.user.email;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="h-9 w-9 p-0">
          <Link href={`/admin/dashboard/transaksi/${transaction.id}`}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Pemeriksaan Pengembalian Barang (Return)
          </h1>
          <p className="text-xs text-slate-500">
            Periksa kondisi fisik unit, verifikasi restock barang konsumsi, dan tetapkan denda manual untuk{" "}
            <span className="font-mono font-semibold text-slate-800">
              {transaction.transactionCode}
            </span>{" "}
            ({customerName})
          </p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Overdue Banner if Late ── */}
      {calculatedLateDays > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-amber-600" />
            Pengembalian Terlambat {calculatedLateDays} Hari
          </div>
          <p className="mt-1 text-xs text-amber-800">
            Jadwal pengembalian berakhir pada{" "}
            <strong>{format(endDate, "dd MMMM yyyy", { locale: localeId })}</strong>.
            Sistem merekomendasikan estimasi denda keterlambatan sebesar{" "}
            <strong>Rp {suggestedLatePenalty.toLocaleString("id-ID")}</strong>{" "}
            (@ Rp {suggestedLateFeePerDay.toLocaleString("id-ID")}/hari).
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800 font-medium">
          Pengembalian tepat waktu (Batas sewa:{" "}
          {format(endDate, "dd MMMM yyyy", { locale: localeId })}).
        </div>
      )}

      {/* ── Section 1: Item Inspection ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HugeiconsIcon icon={ShoppingBagIcon} size={18} className="text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            1. Pemeriksaan Fisik & Klasifikasi Kondisi Unit
          </h2>
        </div>

        <div className="space-y-4">
          {transaction.items.map((item) => {
            const currentItemState = itemConditions.find(
              (ic) => ic.transactionItemId === item.id
            );
            if (!currentItemState) return null;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      {item.productNameSnap}
                    </span>
                    {item.unitCode && (
                      <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 font-mono text-xs text-slate-800">
                        {item.unitCode}
                      </span>
                    )}
                  </div>
                  {item.isReusable && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                      Reusable Consumable (Restock Otomatis)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Quantity if consumable or partial */}
                  {!item.unitId ? (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Jumlah Dikembalikan:
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={currentItemState.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value, 10))
                        }
                        className="text-sm bg-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Klasifikasi Pasca Sewa:
                      </Label>
                      <select
                        value={currentItemState.condition}
                        onChange={(e) =>
                          handleConditionChange(
                            item.id,
                            e.target.value as TargetCondition
                          )
                        }
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="Available">Available (Bagus / Siap Sewa)</option>
                        <option value="Maintenance">Maintenance (Perlu Cuci / Servis)</option>
                        <option value="Damaged">Damaged (Rusak Fisik)</option>
                        <option value="Lost">Lost (Hilang)</option>
                      </select>
                    </div>
                  )}

                  {/* Condition Notes */}
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      Catatan Fisik / Kerusakan (Opsional):
                    </Label>
                    <Input
                      type="text"
                      placeholder="Contoh: Ritsleting tenda seret, perlu pelumasan..."
                      value={currentItemState.notes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      className="text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: PRD 16.14 Manual Penalty Calculator ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              2. Penetapan Denda Manual (PRD 16.14)
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPenalty}
            className="h-8 text-xs gap-1 text-slate-700"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            Tambah Baris Denda
          </Button>
        </div>

        <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 text-xs text-amber-900">
          <strong>Kebijakan Sistem (PRD 16.14):</strong> Sistem Annapurna tidak pernah mengenakan denda secara otomatis tanpa persetujuan admin. Admin bebas menyesuaikan nominal dan <strong>wajib mengisi alasan denda</strong> jika nominal lebih dari Rp 0.
        </div>

        {penalties.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            Tidak ada denda yang dikenakan. Klik &quot;Tambah Baris Denda&quot; jika ada keterlambatan atau kerusakan.
          </p>
        ) : (
          <div className="space-y-3">
            {penalties.map((pen, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 sm:items-center bg-slate-50/30"
              >
                <div className="sm:col-span-3">
                  <select
                    value={pen.penaltyType}
                    onChange={(e) =>
                      handlePenaltyChange(
                        idx,
                        "penaltyType",
                        e.target.value as PenaltyType
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                  >
                    <option value="Late_Return">Keterlambatan</option>
                    <option value="Damage">Kerusakan Barang</option>
                    <option value="Lost_Item">Barang Hilang</option>
                    <option value="Incomplete_Item">Kelengkapan Kurang</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    min={0}
                    step={5000}
                    placeholder="Nominal (Rp)"
                    value={pen.amount}
                    onChange={(e) =>
                      handlePenaltyChange(
                        idx,
                        "amount",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="text-xs font-mono bg-white"
                  />
                </div>

                <div className="sm:col-span-5">
                  <Input
                    type="text"
                    placeholder="Alasan denda (Wajib diisi)..."
                    value={pen.reason}
                    onChange={(e) =>
                      handlePenaltyChange(idx, "reason", e.target.value)
                    }
                    className="text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePenalty(idx)}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total & Payment Method if penalty exists */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-slate-100 p-4">
          <div>
            <span className="text-xs text-slate-500">Total Denda yang Dikenakan:</span>
            <p className="text-xl font-bold font-mono text-rose-600">
              Rp {totalPenalties.toLocaleString("id-ID")}
            </p>
          </div>

          {totalPenalties > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-700">
                Metode Pembayaran Denda:
              </span>
              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="penaltyPaymentMethod"
                  value="Cash"
                  checked={penaltyPaymentMethod === "Cash"}
                  onChange={() => setPenaltyPaymentMethod("Cash")}
                  className="accent-primary"
                />
                Kas Tunai
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="penaltyPaymentMethod"
                  value="QRIS_Store"
                  checked={penaltyPaymentMethod === "QRIS_Store"}
                  onChange={() => setPenaltyPaymentMethod("QRIS_Store")}
                  className="accent-primary"
                />
                QRIS Toko
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Physical Guarantee Return Confirmation ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            3. Pengembalian Dokumen Jaminan Fisik
          </h2>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p>
            Dokumen yang tersimpan:{" "}
            <strong>{transaction.guaranteeDocType || "KTP"}</strong> (Catatan:{" "}
            {transaction.guaranteeNotes || "Kotak Jaminan"})
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={guaranteeReturned}
            onChange={(e) => setGuaranteeReturned(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-xs font-semibold text-blue-900">
            Saya menyatakan bahwa fisik dokumen jaminan (KTP/SIM/KTM) telah diserahkan kembali kepada pelanggan.
          </span>
        </label>
      </div>

      {/* ── Section 4: General Return Notes ── */}
      <div className="space-y-1.5">
        <Label htmlFor="returnNotes" className="text-xs font-semibold text-slate-700">
          Catatan Tambahan Pengembalian (Opsional):
        </Label>
        <Input
          id="returnNotes"
          type="text"
          placeholder="Contoh: Barang dikembalikan lengkap dan bersih..."
          value={returnNotes}
          onChange={(e) => setReturnNotes(e.target.value)}
          className="text-sm bg-white"
        />
      </div>

      {/* ── Submit Button ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href={`/admin/dashboard/transaksi/${transaction.id}`}>
            Batal
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700 min-w-48 text-xs font-semibold"
        >
          {isPending ? "Memproses Pengembalian..." : "Konfirmasi Pengembalian Barang (Return)"}
        </Button>
      </div>
    </form>
  );
}
