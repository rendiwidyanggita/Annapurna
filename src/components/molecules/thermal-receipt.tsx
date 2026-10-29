"use client";

import React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon } from "@hugeicons/core-free-icons";

export interface ThermalReceiptItem {
  id?: string;
  productNameSnap: string;
  unitCodeSnap?: string | null;
  priceSnap: number;
  quantity: number;
  subtotal: number;
}

export interface ThermalReceiptProps {
  transaction: {
    transactionCode: string;
    startDate: Date | string;
    endDate: Date | string;
    totalDurationDays: number;
    pricingScheme: string;
    totalAmount: number;
    dpAmount: number;
    remainingAmount: number;
    transactionStatus: string;
    paymentStatus: string;
    guaranteeDocType?: string | null;
    maskedGuaranteeId?: string | null;
    createdAt: Date | string;
    notes?: string | null;
    user?: {
      email?: string;
      profile?: {
        fullName?: string | null;
        phoneNumber?: string | null;
      } | null;
    } | null;
    items: ThermalReceiptItem[];
    penalties?: Array<{
      penaltyType: string;
      amount: number;
      reason: string;
    }>;
  };
  adminName?: string;
  showPrintButton?: boolean;
}

export function getSchemeLabel(scheme: string): string {
  switch (scheme) {
    case "permalam":
      return "Permalam (1 Malam)";
    case "perkegiatan1":
    case "perkegiatan_1":
      return "Perkegiatan I (3H3M)";
    case "perkegiatan2":
    case "perkegiatan_2":
      return "Perkegiatan II (5H5M)";
    default:
      return scheme;
  }
}

export function ThermalReceipt({
  transaction,
  adminName = "Kasir Annapurna",
  showPrintButton = true,
}: ThermalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const customerName =
    transaction.user?.profile?.fullName ||
    transaction.user?.email?.split("@")[0] ||
    "Pelanggan";
  const customerPhone = transaction.user?.profile?.phoneNumber || "-";

  const totalPenalties =
    transaction.penalties?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── Action Toolbar (Hidden in Print) ── */}
      {showPrintButton && (
        <div className="no-print w-full max-w-sm mb-4 flex items-center justify-between gap-2">
          <p className="text-xs text-neutral-500">
            Format: Struk Kasir POS (58mm / 80mm)
          </p>
          <Button
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs font-semibold bg-[#16624B] hover:bg-[#0F4F3C] text-white flex items-center gap-1.5 shadow-sm"
          >
            <HugeiconsIcon icon={PrinterIcon} size={14} />
            <span>Cetak Struk Sekarang</span>
          </Button>
        </div>
      )}

      {/* ── Printable Paper Receipt ── */}
      <div
        id="pos-thermal-receipt"
        className="thermal-receipt bg-white text-black font-mono text-[11px] leading-tight w-[300px] sm:w-[320px] p-4 border border-dashed border-neutral-300 shadow-sm rounded-none select-text"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          color: "#000",
        }}
      >
        {/* ── Store Header ── */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h2 className="text-sm font-black uppercase tracking-wider">
            ANNAPURNA ADVENTURE
          </h2>
          <p className="text-[10px] mt-0.5 leading-tight">
            Rental Alat Outdoor & Camping
          </p>
          <p className="text-[9px] mt-0.5 leading-tight text-neutral-800">
            Jl. Kampus No.8-9 Grendeng, Purwokerto Utara
          </p>
          <p className="text-[9px] leading-tight text-neutral-800">
            WhatsApp: 0812-3456-7890
          </p>
        </div>

        {/* ── Transaction Meta ── */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>NO. ORDER</span>
            <span className="font-bold">{transaction.transactionCode}</span>
          </div>
          <div className="flex justify-between">
            <span>TANGGAL</span>
            <span>
              {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>OPERATOR</span>
            <span className="truncate max-w-[150px]">{adminName}</span>
          </div>
          <div className="flex justify-between">
            <span>PENYEWA</span>
            <span className="font-semibold truncate max-w-[150px]">
              {customerName}
            </span>
          </div>
          <div className="flex justify-between">
            <span>KONTAK</span>
            <span>{customerPhone}</span>
          </div>
          {transaction.guaranteeDocType && (
            <div className="flex justify-between">
              <span>JAMINAN</span>
              <span>
                {transaction.guaranteeDocType}{" "}
                {transaction.maskedGuaranteeId
                  ? `(${transaction.maskedGuaranteeId})`
                  : ""}
              </span>
            </div>
          )}
        </div>

        {/* ── Rental Schedule ── */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>SKEMA SEWA</span>
            <span className="font-semibold">
              {getSchemeLabel(transaction.pricingScheme)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>AMBIL</span>
            <span>
              {format(new Date(transaction.startDate), "dd/MM/yyyy (10:00)")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>BATAS KEMBALI</span>
            <span className="font-bold">
              {format(new Date(transaction.endDate), "dd/MM/yyyy (21:00)")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>DURASI</span>
            <span>{transaction.totalDurationDays} Hari</span>
          </div>
        </div>

        {/* ── Itemized List ── */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between text-[9px] font-bold pb-1 uppercase border-b border-dotted border-neutral-400">
            <span>ITEM / UNIT</span>
            <span>TOTAL</span>
          </div>
          <div className="pt-1.5 space-y-1.5">
            {transaction.items.map((item, idx) => (
              <div key={item.id || idx} className="space-y-0.5">
                <div className="font-bold text-[10px] break-words">
                  {item.productNameSnap}
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>
                    {item.quantity}x @{formatRupiah(item.priceSnap)}
                    {item.unitCodeSnap ? ` [${item.unitCodeSnap}]` : ""}
                  </span>
                  <span className="font-medium">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Financial Summary ── */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>TOTAL BIAYA SEWA</span>
            <span className="font-bold">
              {formatRupiah(transaction.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>DP 50% (ONLINE)</span>
            <span className="font-semibold text-neutral-900">
              {formatRupiah(transaction.dpAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>SISA TAGIHAN TOKO</span>
            <span className="font-bold">
              {formatRupiah(transaction.remainingAmount)}
            </span>
          </div>

          {totalPenalties > 0 && (
            <div className="flex justify-between text-neutral-900 font-bold pt-0.5">
              <span>DENDA / KERUSAKAN</span>
              <span>+{formatRupiah(totalPenalties)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-black pt-1 border-t border-dotted border-black">
            <span>STATUS BAYAR</span>
            <span className="uppercase">{transaction.paymentStatus}</span>
          </div>
        </div>

        {/* ── Terms & Notes ── */}
        <div className="py-2 text-[9px] leading-tight space-y-1 text-neutral-900">
          <p className="font-bold uppercase text-center">KETENTUAN SEWA:</p>
          <ol className="list-decimal pl-3 space-y-0.5">
            <li>Alat telah dicek bersama & diterima lengkap dalam kondisi baik.</li>
            <li>Batas pengembalian pkl 21.00 WIB sesuai tanggal tertera.</li>
            <li>Keterlambatan/kerusakan/kehilangan dikenakan denda sesuai SOP toko.</li>
            <li>Identitas asli dapat diambil saat pengembalian barang selesai.</li>
          </ol>
        </div>

        {/* ── Signatures ── */}
        <div className="pt-3 pb-1 border-t border-dashed border-black grid grid-cols-2 text-center text-[9px]">
          <div>
            <p>Penyewa,</p>
            <div className="h-10"></div>
            <p className="font-bold underline truncate px-1">
              ( {customerName} )
            </p>
          </div>
          <div>
            <p>Staff Toko,</p>
            <div className="h-10"></div>
            <p className="font-bold underline truncate px-1">
              ( {adminName} )
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pt-2 text-[8px] text-neutral-700">
          <p>*** TERIMA KASIH TELAH MENYEWA ***</p>
          <p>Salam Lestari! Jagalah Kebersihan Alam.</p>
        </div>
      </div>
    </div>
  );
}
