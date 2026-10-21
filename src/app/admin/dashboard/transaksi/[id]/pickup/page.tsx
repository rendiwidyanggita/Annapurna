import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { PickupForm } from "./pickup-form";
import { TransactionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PickupPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PickupPage({ params }: PickupPageProps) {
  try {
    await requireRole(["admin", "owner"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const { id } = await params;

  const transaction = await prisma.rentalTransaction.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      items: {
        include: {
          unit: true,
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  // Precondition: Only allow pickup if DP is paid or ready
  const validPickupStatuses: TransactionStatus[] = [
    TransactionStatus.DP_Dibayar,
    TransactionStatus.Siap_Diambil,
    TransactionStatus.Dikonfirmasi,
  ];

  if (!validPickupStatuses.includes(transaction.transactionStatus)) {
    redirect(`/admin/dashboard/transaksi/${id}`);
  }

  return <PickupForm transaction={transaction} />;
}
