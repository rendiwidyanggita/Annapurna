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
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

/**
 * Formula Injection Defense (CSV / Excel Injection / CWE-1236)
 * If cell starts with '=', '+', '-', '@', prepend a single quote (')
 */
function sanitizeFormulaInjection(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed.startsWith("=") ||
      trimmed.startsWith("+") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("@")
    ) {
      return `'${value}`;
    }
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const { user, role } = await requireRole(["admin", "owner"]);
    const isOwner = role.toUpperCase() === "OWNER";

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "transactions";
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

    const filter = { preset, startDate, endDate, limit: 500 };
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ANNAPURNA Adventure Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Laporan");

    // Forest green header style (#16624B)
    const headerFill: ExcelJS.FillPattern = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF16624B" },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    if (type === "revenue") {
      const data = await getRevenueSummary(filter);
      sheet.columns = [
        { header: "Komponen Finansial", key: "item", width: 30 },
        { header: "Keterangan", key: "desc", width: 45 },
        { header: "Volume / Transaksi", key: "count", width: 22 },
        { header: "Nominal (Rp)", key: "amount", width: 22 },
      ];

      const rows = [
        {
          item: "Down Payment (DP Online)",
          desc: "Penerimaan DP online via Midtrans",
          count: `${data.paymentCount} transaksi`,
          amount: data.grossInflows,
        },
        {
          item: "Pelunasan Kasir Toko",
          desc: "Sisa tagihan sewa diterima di toko (Cash/QRIS)",
          count: `${data.remainingCount} transaksi`,
          amount: data.cashierRemaining,
        },
        {
          item: "Denda & Klaim Kerusakan",
          desc: "Penerimaan denda telat/rusak/hilang",
          count: `${data.penaltyCount} klaim`,
          amount: data.totalPenalties,
        },
        {
          item: "Pengembalian Dana (Refund)",
          desc: "Pengembalian dana pembatalan sewa",
          count: `${data.refundCount} transaksi`,
          amount: -data.totalRefunded,
        },
        {
          item: "TOTAL PENDAPATAN BERSIH",
          desc: "Net revenue operasional rental",
          count: "-",
          amount: data.netRevenue,
        },
      ];

      for (const r of rows) {
        const addedRow = sheet.addRow(r);
        addedRow.getCell("amount").numFmt = '"Rp"#,##0';
        if (r.item === "TOTAL PENDAPATAN BERSIH") {
          addedRow.font = { bold: true };
        }
      }
    } else if (type === "transactions") {
      const data = await getRentalTransactionReport(filter);
      sheet.columns = [
        { header: "Penyewa", key: "customer", width: 25 },
        { header: "Email", key: "email", width: 25 },
        { header: "No. Telepon", key: "phone", width: 18 },
        { header: "Mulai Sewa (WIB)", key: "start", width: 16 },
        { header: "Selesai Sewa (WIB)", key: "end", width: 16 },
        { header: "Durasi (Hari)", key: "duration", width: 14 },
        { header: "Status Sewa", key: "status", width: 16 },
        { header: "Status Bayar", key: "paymentStatus", width: 16 },
        { header: "Total Biaya (Rp)", key: "total", width: 18 },
        { header: "DP (Rp)", key: "dp", width: 16 },
        { header: "Sisa Pelunasan (Rp)", key: "remaining", width: 18 },
      ];

      for (const tx of data.transactions) {
        const row = sheet.addRow({
          code: sanitizeFormulaInjection(tx.transactionCode),
          customer: sanitizeFormulaInjection(tx.user.profile?.fullName || "-"),
          email: sanitizeFormulaInjection(tx.user.email),
          phone: sanitizeFormulaInjection(tx.user.profile?.phoneNumber || "-"),
          start: new Date(tx.startDate).toLocaleDateString("id-ID"),
          end: new Date(tx.endDate).toLocaleDateString("id-ID"),
          duration: tx.totalDurationDays,
          status: tx.transactionStatus,
          paymentStatus: tx.paymentStatus,
          total: tx.totalAmount,
          dp: tx.dpAmount,
          remaining: tx.remainingAmount,
        });

        // Numeric currency format
        row.getCell("total").numFmt = '"Rp"#,##0';
        row.getCell("dp").numFmt = '"Rp"#,##0';
        row.getCell("remaining").numFmt = '"Rp"#,##0';
      }
    } else if (type === "dp") {
      const data = await getDpReport(filter);
      sheet.columns = [
        { header: "Order ID Midtrans", key: "orderId", width: 25 },
        { header: "Kode Transaksi", key: "txCode", width: 20 },
        { header: "Penyewa", key: "customer", width: 25 },
        { header: "Metode Bayar", key: "method", width: 18 },
        { header: "Status Pembayaran", key: "status", width: 18 },
        { header: "Waktu Bayar (WIB)", key: "paidAt", width: 20 },
        { header: "Nominal DP (Rp)", key: "amount", width: 18 },
      ];

      for (const p of data.payments) {
        const row = sheet.addRow({
          orderId: sanitizeFormulaInjection(p.midtransOrderId),
          txCode: sanitizeFormulaInjection(p.transaction?.transactionCode || "-"),
          customer: sanitizeFormulaInjection(p.transaction?.user.profile?.fullName || p.transaction?.user.email || "-"),
          method: p.paymentType || "-",
          status: p.paymentStatus,
          paidAt: p.paidAt ? new Date(p.paidAt).toLocaleString("id-ID") : "-",
          amount: p.grossAmount,
        });
        row.getCell("amount").numFmt = '"Rp"#,##0';
      }
    } else if (type === "remaining") {
      const data = await getRemainingPaymentReport(filter);
      sheet.columns = [
        { header: "Kode Transaksi", key: "txCode", width: 20 },
        { header: "Penyewa", key: "customer", width: 25 },
        { header: "Email", key: "email", width: 25 },
        { header: "No. Telepon", key: "phone", width: 18 },
        { header: "Sisa Pelunasan Kasir (Rp)", key: "remaining", width: 22 },
      ];

      for (const tx of data.transactions) {
        const row = sheet.addRow({
          txCode: sanitizeFormulaInjection(tx.transactionCode),
          customer: sanitizeFormulaInjection(tx.user.profile?.fullName || "-"),
          email: sanitizeFormulaInjection(tx.user.email),
          phone: sanitizeFormulaInjection(tx.user.profile?.phoneNumber || "-"),
          remaining: tx.remainingAmount,
        });
        row.getCell("remaining").numFmt = '"Rp"#,##0';
      }
    } else if (type === "penalties") {
      const data = await getPenaltyReport(filter);
      sheet.columns = [
        { header: "Kode Transaksi", key: "txCode", width: 20 },
        { header: "Penyewa", key: "customer", width: 25 },
        { header: "Tipe Denda", key: "type", width: 20 },
        { header: "Alasan / Rincian", key: "reason", width: 35 },
        { header: "Tanggal", key: "date", width: 18 },
        { header: "Nominal Denda (Rp)", key: "amount", width: 20 },
      ];

      for (const pen of data.penalties) {
        const row = sheet.addRow({
          txCode: sanitizeFormulaInjection(pen.transaction?.transactionCode || "-"),
          customer: sanitizeFormulaInjection(pen.transaction?.user.profile?.fullName || "-"),
          type: pen.penaltyType,
          reason: sanitizeFormulaInjection(pen.reason),
          date: new Date(pen.createdAt).toLocaleDateString("id-ID"),
          amount: pen.amount,
        });
        row.getCell("amount").numFmt = '"Rp"#,##0';
      }
    } else if (type === "units") {
      const data = await getProblematicUnitsReport(filter);
      sheet.columns = [
        { header: "Kode Inventaris Unit", key: "code", width: 22 },
        { header: "Produk", key: "product", width: 25 },
        { header: "Variasi", key: "variant", width: 18 },
        { header: "Status Fisik", key: "status", width: 18 },
        { header: "Catatan Kondisi", key: "notes", width: 35 },
      ];

      for (const u of data.units) {
        sheet.addRow({
          code: sanitizeFormulaInjection(u.inventoryCode),
          product: sanitizeFormulaInjection(u.variant.product.name),
          variant: sanitizeFormulaInjection(u.variant.variantName),
          status: u.unitStatus,
          notes: sanitizeFormulaInjection(u.conditionNotes || "-"),
        });
      }
    } else if (type === "consumables") {
      const data = await getConsumableUsageReport(filter);
      sheet.columns = [
        { header: "Nama Barang", key: "name", width: 25 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Tipe Barang", key: "type", width: 20 },
        { header: "Stok Saat Ini", key: "stock", width: 16 },
        { header: "Total Dipakai (Sewa)", key: "rented", width: 18 },
      ];

      const allConsumables = [...data.nonReusable, ...data.reusable];
      for (const c of allConsumables) {
        sheet.addRow({
          name: sanitizeFormulaInjection(c.name),
          category: sanitizeFormulaInjection(c.category),
          type: c.isReusable ? "Reusable (Pakai Ulang)" : "Habis Pakai",
          stock: c.currentStock,
          rented: c.rentedQty,
        });
      }
    } else if (type === "top_products") {
      const data = await getTopProductsReport({ ...filter, limit: 50 });
      sheet.columns = [
        { header: "Peringkat", key: "rank", width: 12 },
        { header: "Nama Produk", key: "name", width: 25 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Tipe", key: "type", width: 16 },
        { header: "Total Unit Disewa", key: "qty", width: 18 },
        { header: "Total Omzet (Rp)", key: "revenue", width: 20 },
      ];

      for (const p of data.topProducts) {
        const row = sheet.addRow({
          rank: p.rank,
          name: sanitizeFormulaInjection(p.name),
          category: sanitizeFormulaInjection(p.category),
          type: p.itemType,
          qty: p.totalRentedUnits,
          revenue: p.totalRevenue,
        });
        row.getCell("revenue").numFmt = '"Rp"#,##0';
      }
    }

    // Apply header row styles
    const headerRow = sheet.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // Audit log
    await logActivity(prisma, {
      userId: user.id,
      action: "REPORT_EXPORT_EXCEL",
      entityName: "Report",
      description: `Export laporan Excel: ${type} (${preset})`,
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="annapurna-${type}-${Date.now()}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan export Excel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
