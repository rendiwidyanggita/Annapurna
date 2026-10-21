import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getTransactionsList } from "./actions";
import { TransactionTable } from "./transaction-table";

export const dynamic = "force-dynamic";

interface TransactionsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const status = resolvedParams.status || "ALL";
  const search = resolvedParams.search || "";

  const data = await getTransactionsList({
    page,
    limit: 15,
    status,
    search,
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Manajemen Transaksi & Operasional Toko
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola siklus rental fisik: serah terima barang (pickup), pemeriksaan pengembalian (return), denda manual, dan pencatatan jaminan identitas.
        </p>
      </div>

      {/* ── Transaction Table Client Component ── */}
      <TransactionTable
        transactions={data.transactions}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
        metrics={data.metrics}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
