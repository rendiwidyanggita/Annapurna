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
  CheckmarkCircle01Icon,
  SecurityCheckIcon,
  Invoice01Icon,
  PlusSignIcon,
  Delete01Icon,
  Loading01Icon,
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
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-20">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/dashboard/transaksi/${transaction.id}`}
          className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              Pemeriksaan Pengembalian Barang (Return)
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Kasir Toko
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Periksa kondisi fisik unit, verifikasi restock barang konsumsi, dan tetapkan denda manual untuk{" "}
            <span className="font-mono font-bold text-gray-800 tabular-nums">
              {transaction.transactionCode}
            </span>{" "}
            ({customerName})
          </p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Overdue Banner if Late ── */}
      {calculatedLateDays > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} className="text-amber-600 shrink-0" />
            <span>
              Pengembalian Terlambat <span className="tabular-nums font-bold">{calculatedLateDays}</span> Hari
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-800 leading-relaxed">
            Jadwal pengembalian berakhir pada{" "}
            <strong className="tabular-nums">{format(endDate, "dd MMMM yyyy", { locale: localeId })}</strong>.
            Sistem merekomendasikan estimasi denda keterlambatan sebesar{" "}
            <strong className="tabular-nums font-bold text-amber-950">
              Rp {suggestedLatePenalty.toLocaleString("id-ID")}
            </strong>{" "}
            (@ Rp {suggestedLateFeePerDay.toLocaleString("id-ID")}/hari).
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-600 shrink-0" />
          <span>
            Pengembalian tepat waktu (Batas sewa:{" "}
            <strong className="tabular-nums">{format(endDate, "dd MMMM yyyy", { locale: localeId })}</strong>).
          </span>
        </div>
      )}

      {/* ── Section 1: Item Inspection & Classification ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <HugeiconsIcon icon={ShoppingBagIcon} size={18} className="text-[#16624B]" />
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              1. Pemeriksaan Fisik & Klasifikasi Kondisi Unit ({transaction.items.length} Item)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tentukan status unit pasca-sewa. Unit dengan status Available langsung dapat disewakan kembali, sedangkan Maintenance/Damaged/Lost akan dialihkan ke inventaris.
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {transaction.items.map((item) => {
            const currentItemState = itemConditions.find(
              (ic) => ic.transactionItemId === item.id
            );
            if (!currentItemState) return null;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 p-4 space-y-3 bg-[#F9FAFB]/70"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">
                      {item.productNameSnap}
                    </span>
                    {item.unitCode && (
                      <span className="rounded-md bg-white border border-gray-200 px-2 py-0.5 font-mono text-xs font-bold text-gray-800 tabular-nums">
                        {item.unitCode}
                      </span>
                    )}
                  </div>
                  {item.isReusable && (
                    <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-[11px] font-semibold w-fit">
                      Reusable Consumable (Restock Otomatis)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Quantity if consumable or partial */}
                  {!item.unitId ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
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
                        className="text-xs sm:text-sm bg-white font-mono tabular-nums h-9"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
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
                        className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
                      >
                        <option value="Available">Available (Bagus / Siap Sewa)</option>
                        <option value="Maintenance">Maintenance (Perlu Cuci / Servis)</option>
                        <option value="Damaged">Damaged (Rusak Fisik)</option>
                        <option value="Lost">Lost (Hilang / Tidak Kembali)</option>
                      </select>
                    </div>
                  )}

                  {/* Condition Notes */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Catatan Fisik / Kerusakan (Opsional):
                    </Label>
                    <Input
                      type="text"
                      placeholder="Contoh: Ritsleting seret, perlu pelumasan atau pencucian..."
                      value={currentItemState.notes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      className="text-xs sm:text-sm bg-white h-9"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: PRD 16.14 Manual Penalty Calculator ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Invoice01Icon} size={18} className="text-[#16624B]" />
            <h2 className="text-sm font-bold text-gray-900">
              2. Penetapan Denda Manual (PRD 16.14)
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPenalty}
            className="h-8 text-xs gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            <span>Tambah Baris Denda</span>
          </Button>
        </div>

        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed">
          <strong>Kebijakan Sistem (PRD 16.14):</strong> Sistem Annapurna tidak pernah memotong atau mengenakan denda secara otomatis tanpa persetujuan kasir/admin. Admin bebas menyesuaikan nominal dan <strong>wajib mencantumkan alasan</strong> untuk setiap denda dengan nominal lebih dari Rp 0.
        </div>

        {penalties.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-3 text-center">
            Tidak ada denda yang dikenakan. Klik tombol &quot;Tambah Baris Denda&quot; jika terdapat keterlambatan atau kerusakan unit.
          </p>
        ) : (
          <div className="space-y-2.5">
            {penalties.map((pen, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2.5 rounded-xl border border-gray-200 p-3 sm:grid-cols-12 sm:items-center bg-white shadow-2xs"
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
                    className="w-full h-9 rounded-lg border border-gray-200 bg-[#F9FAFB] px-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#16624B]"
                  >
                    <option value="Late_Return">Keterlambatan</option>
                    <option value="Damage">Kerusakan Barang</option>
                    <option value="Lost_Item">Barang Hilang</option>
                    <option value="Incomplete_Item">Kelengkapan Kurang</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 font-mono">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={5000}
                      placeholder="0"
                      value={pen.amount}
                      onChange={(e) =>
                        handlePenaltyChange(
                          idx,
                          "amount",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="text-xs font-mono font-semibold pl-8 tabular-nums bg-[#F9FAFB] h-9"
                    />
                  </div>
                </div>

                <div className="sm:col-span-5">
                  <Input
                    type="text"
                    placeholder="Alasan denda (Wajib diisi)..."
                    value={pen.reason}
                    onChange={(e) =>
                      handlePenaltyChange(idx, "reason", e.target.value)
                    }
                    className="text-xs bg-[#F9FAFB] h-9 placeholder:text-gray-400"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePenalty(idx)}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total & Payment Method */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] p-4">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Denda yang Dikenakan:</span>
            <p className="text-2xl font-bold font-mono text-rose-600 tabular-nums mt-0.5">
              Rp {totalPenalties.toLocaleString("id-ID")}
            </p>
          </div>

          {totalPenalties > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-700">
                Metode Pembayaran:
              </span>
              <label
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                  penaltyPaymentMethod === "Cash"
                    ? "border-[#16624B] bg-[#16624B]/5 text-[#16624B]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="penaltyPaymentMethod"
                  value="Cash"
                  checked={penaltyPaymentMethod === "Cash"}
                  onChange={() => setPenaltyPaymentMethod("Cash")}
                  className="accent-[#16624B]"
                />
                Kas Tunai
              </label>
              <label
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                  penaltyPaymentMethod === "QRIS_Store"
                    ? "border-[#16624B] bg-[#16624B]/5 text-[#16624B]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="penaltyPaymentMethod"
                  value="QRIS_Store"
                  checked={penaltyPaymentMethod === "QRIS_Store"}
                  onChange={() => setPenaltyPaymentMethod("QRIS_Store")}
                  className="accent-[#16624B]"
                />
                QRIS Toko
              </label>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
              Bebas Denda (Rp 0)
            </span>
          )}
        </div>
      </div>

      {/* ── Section 3: Physical Guarantee Return Confirmation (PRD 30) ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
          <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-[#16624B]" />
          <h2 className="text-sm font-bold text-gray-900">
            3. Pengembalian Dokumen Jaminan Fisik
          </h2>
        </div>

        <div className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-3 text-xs text-gray-700">
          Dokumen jaminan yang tersimpan:{" "}
          <strong className="text-gray-900 font-semibold">{transaction.guaranteeDocType || "KTP"}</strong>{" "}
          {transaction.guaranteeNotes && (
            <span>
              (Lokasi simpan: <strong className="text-gray-800">{transaction.guaranteeNotes}</strong>)
            </span>
          )}
        </div>

        <label
          className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
            guaranteeReturned
              ? "border-[#16624B]/30 bg-[#16624B]/5"
              : "border-gray-200 bg-white hover:bg-gray-50"
          }`}
        >
          <input
            type="checkbox"
            checked={guaranteeReturned}
            onChange={(e) => setGuaranteeReturned(e.target.checked)}
            className="h-4 w-4 rounded accent-[#16624B] shrink-0"
          />
          <span className="text-xs font-semibold text-gray-900 leading-relaxed">
            Saya menyatakan bahwa fisik dokumen jaminan ({transaction.guaranteeDocType || "KTP/SIM/KTM"}) telah diperiksa dan diserahkan kembali kepada pelanggan.
          </span>
        </label>
      </div>

      {/* ── Section 4: General Return Notes ── */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-2xs space-y-2">
        <Label htmlFor="returnNotes" className="text-xs font-semibold text-gray-700">
          Catatan Tambahan Pengembalian (Opsional):
        </Label>
        <Input
          id="returnNotes"
          type="text"
          placeholder="Contoh: Barang dikembalikan lengkap dan bersih, tidak ada keluhan..."
          value={returnNotes}
          onChange={(e) => setReturnNotes(e.target.value)}
          className="text-xs sm:text-sm bg-white h-9"
        />
      </div>

      {/* ── Submit Button ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={`/admin/dashboard/transaksi/${transaction.id}`}>
          <Button variant="outline" type="button" disabled={isPending} className="text-xs h-9">
            Batal & Kembali
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#16624B] hover:bg-[#0F4F3C] text-white min-w-48 text-xs font-semibold h-10 px-6 gap-2 shadow-2xs"
        >
          {isPending ? (
            <HugeiconsIcon icon={Loading01Icon} size={15} className="animate-spin" />
          ) : (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
          )}
          <span>{isPending ? "Memproses Pengembalian..." : "Konfirmasi Pengembalian Barang (Return)"}</span>
        </Button>
      </div>
    </form>
  );
}

