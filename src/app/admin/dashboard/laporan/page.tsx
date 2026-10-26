import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
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
import { ReportViewClient } from "./report-view-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan & Rekapitulasi — Admin ANNAPURNA",
};

interface ReportPageProps {
  searchParams: Promise<{
    tab?: string;
    preset?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AdminReportPage({ searchParams }: ReportPageProps) {
  let authResult;
  try {
    authResult = await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const { role } = authResult;
  const isOwner = role.toUpperCase() === "OWNER";

  const resolved = await searchParams;
  let tab = resolved.tab || (isOwner ? "revenue" : "transactions");
  const preset = (resolved.preset as DateRangePreset) || "30d";
  const startDate = resolved.startDate || undefined;
  const endDate = resolved.endDate || undefined;

  // Protect financial tabs if user is non-owner admin
  const financialTabs = ["revenue", "dp", "remaining", "penalties"];
  if (financialTabs.includes(tab) && !isOwner) {
    tab = "transactions";
  }

  const filter = { preset, startDate, endDate };

  // Fetch report based on active tab
  const [
    revenueData,
    transactionsData,
    dpData,
    remainingData,
    penaltyData,
    unitsData,
    consumablesData,
    topProductsData,
  ] = await Promise.all([
    isOwner ? getRevenueSummary(filter) : null,
    tab === "transactions" ? getRentalTransactionReport(filter) : null,
    tab === "dp" && isOwner ? getDpReport(filter) : null,
    tab === "remaining" && isOwner ? getRemainingPaymentReport(filter) : null,
    tab === "penalties" && isOwner ? getPenaltyReport(filter) : null,
    tab === "units" ? getProblematicUnitsReport(filter) : null,
    tab === "consumables" ? getConsumableUsageReport(filter) : null,
    tab === "top_products" ? getTopProductsReport(filter) : null,
  ]);

  return (
    <ReportViewClient
      isOwner={isOwner}
      activeTab={tab}
      currentPreset={preset}
      currentStartDate={startDate || ""}
      currentEndDate={endDate || ""}
      revenueData={revenueData}
      transactionsData={transactionsData}
      dpData={dpData}
      remainingData={remainingData}
      penaltyData={penaltyData}
      unitsData={unitsData}
      consumablesData={consumablesData}
      topProductsData={topProductsData}
    />
  );
}
