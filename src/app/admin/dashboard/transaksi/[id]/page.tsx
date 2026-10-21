import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getTransactionDetail } from "../actions";
import { TransactionDetailClient } from "./transaction-detail-client";

export const dynamic = "force-dynamic";

interface TransactionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const { id } = await params;
  const transaction = await getTransactionDetail(id);

  if (!transaction) {
    notFound();
  }

  return <TransactionDetailClient transaction={transaction} />;
}
