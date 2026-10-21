import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/prisma";
import { ReturnForm } from "./return-form";
import { TransactionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface ReturnPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReturnPage({ params }: ReturnPageProps) {
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
          returnItems: true,
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  // Precondition: Only allow return if currently rented or late
  const validReturnStatuses: TransactionStatus[] = [
    TransactionStatus.Sedang_Disewa,
    TransactionStatus.Terlambat,
  ];

  if (!validReturnStatuses.includes(transaction.transactionStatus)) {
    redirect(`/admin/dashboard/transaksi/${id}`);
  }

  // Map items with product details to check reusable status
  const productIds = transaction.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, isReusable: true },
  });

  const productMap = new Map<string, boolean>();
  for (const p of products) {
    productMap.set(p.id, p.isReusable);
  }

  const formattedItems = transaction.items.map((item) => {
    const totalReturned = item.returnItems.reduce(
      (sum, r) => sum + r.quantity,
      0
    );

    return {
      id: item.id,
      productNameSnap: item.productNameSnap,
      quantity: item.quantity,
      unitId: item.unitId,
      unitCode: item.unit?.inventoryCode || item.unitCodeSnap,
      isReusable: productMap.get(item.productId) ?? false,
      previouslyReturnedQty: totalReturned,
    };
  });

  return (
    <ReturnForm
      transaction={{
        id: transaction.id,
        transactionCode: transaction.transactionCode,
        startDate: transaction.startDate,
        endDate: transaction.endDate,
        guaranteeDocType: transaction.guaranteeDocType,
        guaranteeNotes: transaction.guaranteeNotes,
        user: transaction.user,
        items: formattedItems,
      }}
    />
  );
}
