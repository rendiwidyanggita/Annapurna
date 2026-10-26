import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getTransactionsList, getFilterProducts } from "./actions";
import { TransactionTable } from "./transaction-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transaksi & Operasional — Admin ANNAPURNA",
};

interface TransactionsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    productId?: string;
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
  const startDate = resolvedParams.startDate || "";
  const endDate = resolvedParams.endDate || "";
  const productId = resolvedParams.productId || "";

  const [data, products] = await Promise.all([
    getTransactionsList({
      page,
      limit: 15,
      status,
      search,
      startDate,
      endDate,
      productId,
    }),
    getFilterProducts(),
  ]);
  return (
    <div className="space-y-6">
      <TransactionTable
        transactions={data.transactions}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
        metrics={data.metrics}
        currentStatus={status}
        currentSearch={search}
        currentStartDate={startDate}
        currentEndDate={endDate}
        currentProductId={productId}
        availableProducts={products}
      />
    </div>
  );
}

