import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/services/audit-log";
import {
  getRevenueSummary,
  getRentalTransactionReport,
  getDpReport,
  getRemainingPaymentReport,
  getPenaltyReport,
  getProblematicUnitsReport,
  getConsumableUsageReport,
  getTopProductsReport,
} from "@/lib/services/report-service";
import type { DateRangePreset } from "@/lib/date-range";
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const PdfPrinter = require("pdfmake") as any;

export const dynamic = "force-dynamic";

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

export async function GET(request: NextRequest) {
  try {
    const { user, role } = await requireRole(["admin", "owner"]);
    const isOwner = role.toUpperCase() === "OWNER";

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "transactions"; // transactions, dp, remaining, penalties, units, consumables, top_products
    const preset = (searchParams.get("preset") as DateRangePreset) || "30d";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Financial reports are OWNER only
    const financialTypes = ["revenue", "dp", "remaining", "penalties"];
    if (financialTypes.includes(type) && !isOwner) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya OWNER yang dapat mengunduh laporan finansial." },
        { status: 403 }
      );
    }

    const filter = { preset, startDate, endDate, limit: 200 };
    let docTitle = "LAPORAN ANNAPURNA ADVENTURE";
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let summaryText = "";

    if (type === "revenue") {
      docTitle = "LAPORAN RINGKASAN FINANSIAL & PENDAPATAN";
      const data = await getRevenueSummary(filter);
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Net Revenue: Rp ${data.netRevenue.toLocaleString("id-ID")}`;
      tableHeaders = ["Komponen Finansial", "Keterangan", "Total Transaksi / Item", "Nominal (Rp)"];
      tableRows = [
        [
          "Down Payment (DP Online)",
          "Pembayaran DP 50% terverifikasi Midtrans",
          `${data.paymentCount} pembayaran`,
          data.grossInflows.toLocaleString("id-ID"),
        ],
        [
          "Pelunasan Kasir Toko",
          "Sisa tagihan sewa diterima di toko (Cash/QRIS)",
          `${data.remainingCount} transaksi`,
          data.cashierRemaining.toLocaleString("id-ID"),
        ],
        [
          "Denda & Klaim Kerusakan",
          "Penerimaan denda telat/rusak/hilang",
          `${data.penaltyCount} klaim`,
          data.totalPenalties.toLocaleString("id-ID"),
        ],
        [
          "Pengembalian Dana (Refund)",
          "Pengembalian dana pembatalan sewa",
          `${data.refundCount} transaksi`,
          `(${data.totalRefunded.toLocaleString("id-ID")})`,
        ],
        [
          "TOTAL PENDAPATAN BERSIH",
          "Net revenue operasional rental",
          "-",
          `Rp ${data.netRevenue.toLocaleString("id-ID")}`,
        ],
      ];
    } else if (type === "transactions") {
      docTitle = "LAPORAN TRANSAKSI PENYEWAAN";
      const data = await getRentalTransactionReport(filter);
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Total: ${data.summary.totalTransactions} Transaksi | Gross: Rp ${data.summary.totalGrossAmount.toLocaleString("id-ID")}`;
      tableHeaders = ["Kode Transaksi", "Penyewa", "Jadwal", "Durasi", "Status Sewa", "Status Bayar", "Total (Rp)"];
      tableRows = data.transactions.map((tx) => [
        tx.transactionCode,
        tx.user.profile?.fullName || tx.user.email,
        `${new Date(tx.startDate).toLocaleDateString("id-ID")} - ${new Date(tx.endDate).toLocaleDateString("id-ID")}`,
        `${tx.totalDurationDays} hari`,
        tx.transactionStatus,
        tx.paymentStatus,
        tx.totalAmount.toLocaleString("id-ID"),
      ]);
    } else if (type === "dp") {
      docTitle = "LAPORAN PEMBAYARAN DOWN PAYMENT (MIDTRANS)";
      const data = await getDpReport(filter);
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Total DP: Rp ${data.summary.totalDpAmount.toLocaleString("id-ID")}`;
      tableHeaders = ["Order ID Midtrans", "Kode Transaksi", "Metode", "Status", "Nominal DP (Rp)"];
      tableRows = data.payments.map((p) => [
        p.midtransOrderId,
        p.transaction?.transactionCode || "-",
        p.paymentType || "-",
        p.paymentStatus,
        p.grossAmount.toLocaleString("id-ID"),
      ]);
    } else if (type === "remaining") {
      docTitle = "LAPORAN PELUNASAN KASIR TOKO";
      const data = await getRemainingPaymentReport(filter);
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Total Sisa Tagihan Lunas: Rp ${data.summary.totalRemainingAmount.toLocaleString("id-ID")}`;
      tableHeaders = ["Kode Transaksi", "Penyewa", "No. Telepon", "Sisa Dibayar (Rp)"];
      tableRows = data.transactions.map((tx) => [
        tx.transactionCode,
        tx.user.profile?.fullName || tx.user.email,
        tx.user.profile?.phoneNumber || "-",
        tx.remainingAmount.toLocaleString("id-ID"),
      ]);
    } else if (type === "penalties") {
      docTitle = "LAPORAN DENDA KETERLAMBATAN & KERUSAKAN";
      const data = await getPenaltyReport(filter);
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Total Denda: Rp ${data.summary.totalPenaltyAmount.toLocaleString("id-ID")}`;
      tableHeaders = ["Kode Transaksi", "Tipe Denda", "Alasan", "Nominal Denda (Rp)"];
      tableRows = data.penalties.map((pen) => [
        pen.transaction?.transactionCode || "-",
        pen.penaltyType,
        pen.reason,
        pen.amount.toLocaleString("id-ID"),
      ]);
    } else if (type === "units") {
      docTitle = "LAPORAN UNIT BERMASALAH (MAINTENANCE/RUSAK/HILANG)";
      const data = await getProblematicUnitsReport(filter);
      summaryText = `Maintenance: ${data.summary.maintenanceCount} | Rusak: ${data.summary.damagedCount} | Hilang: ${data.summary.lostCount}`;
      tableHeaders = ["Kode Unit", "Produk / Variasi", "Status", "Catatan Kondisi Terakhir"];
      tableRows = data.units.map((u) => [
        u.inventoryCode,
        `${u.variant.product.name} (${u.variant.variantName})`,
        u.unitStatus,
        u.conditionNotes || "-",
      ]);
    } else if (type === "consumables") {
      docTitle = "LAPORAN PENGGUNAAN BARANG KONSUMSI";
      const data = await getConsumableUsageReport(filter);
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Total Tipe: ${data.summary.totalConsumableTypes}`;
      tableHeaders = ["Nama Barang", "Kategori", "Tipe", "Stok Saat Ini", "Total Dipakai/Disewa"];
      const allConsumables = [...data.nonReusable, ...data.reusable];
      tableRows = allConsumables.map((c) => [
        c.name,
        c.category,
        c.isReusable ? "Reusable (Pakai Ulang)" : "Habis Pakai",
        c.currentStock.toString(),
        c.rentedQty.toString(),
      ]);
    } else if (type === "top_products") {
      docTitle = "LAPORAN PERINGKAT PRODUK TERPOPULER";
      const data = await getTopProductsReport({ ...filter, limit: 20 });
      summaryText = `Periode: ${data.dateRange.startDateStr} s/d ${data.dateRange.endDateStr} | Top 20 Produk`;
      tableHeaders = ["Peringkat", "Nama Produk", "Kategori", "Total Unit Disewa", "Kontribusi Omzet (Rp)"];
      tableRows = data.topProducts.map((p) => [
        `#${p.rank}`,
        p.name,
        p.category,
        p.totalRentedUnits.toString(),
        p.totalRevenue.toLocaleString("id-ID"),
      ]);
    }

    // Build PDF Document
    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      defaultStyle: {
        font: "Helvetica",
        fontSize: 9,
      },
      pageMargins: [36, 40, 36, 40],
      header: {
        text: "ANNAPURNA ADVENTURE — SISTEM INFORMASI OPERASIONAL RENTAL OUTDOOR",
        fontSize: 8,
        color: "#6B7280",
        margin: [36, 20, 36, 0],
      },
      content: [
        {
          text: docTitle,
          fontSize: 14,
          bold: true,
          color: "#16624B",
          margin: [0, 0, 0, 4],
        },
        {
          text: summaryText,
          fontSize: 9,
          color: "#374151",
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            headerRows: 1,
            widths: Array(tableHeaders.length).fill("*"),
            body: [
              tableHeaders.map((h) => ({
                text: h,
                bold: true,
                fillColor: "#16624B",
                color: "#FFFFFF",
                fontSize: 8,
                margin: [3, 4, 3, 4],
              })),
              ...(tableRows.length === 0
                ? [
                    [
                      {
                        text: "Tidak ada data pada periode ini",
                        colSpan: tableHeaders.length,
                        alignment: "center",
                        italics: true,
                        color: "#6B7280",
                        margin: [0, 8, 0, 8],
                      },
                      ...Array(Math.max(0, tableHeaders.length - 1)).fill({ text: "" }),
                    ],
                  ]
                : tableRows.map((row) =>
                    row.map((cell) => ({
                      text: cell,
                      fontSize: 8,
                      margin: [3, 3, 3, 3],
                    }))
                  )),
            ],
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
            vLineWidth: () => 0.5,
            hLineColor: () => "#E5E7EB",
            vLineColor: () => "#E5E7EB",
          },
        },
      ],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          { text: `Dicetak oleh: ${user.email} (WIB)`, fontSize: 7, color: "#9CA3AF" },
          {
            text: `Halaman ${currentPage} dari ${pageCount}`,
            alignment: "right",
            fontSize: 7,
            color: "#9CA3AF",
          },
        ],
        margin: [36, 10, 36, 0],
      }),
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve());
      pdfDoc.on("error", (err: Error) => reject(err));
      pdfDoc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Audit log
    await logActivity(prisma, {
      userId: user.id,
      action: "REPORT_EXPORT_PDF",
      entityName: "Report",
      description: `Export laporan PDF: ${type} (${preset})`,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="annapurna-${type}-${Date.now()}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan export PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
