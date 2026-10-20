import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Script from "next/script";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { InvoiceContent } from "./invoice-content";

interface PesananDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * /pesanan/[id] — Invoice Pending & Booking Summary Page
 *
 * Server Component:
 * - Fetches transaction with all relations from Postgres.
 * - Validates ownership (user must own the transaction).
 * - Passes serialized data to <InvoiceContent /> (Client Component).
 * - Injects Midtrans Snap.js script via next/script (lazyOnload).
 *
 * AA-70: Halaman Invoice Pending & Ringkasan Booking
 */
export default async function PesananDetailPage({ params }: PesananDetailPageProps) {
  const { id } = await params;

  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/login?redirect=/pesanan/${id}`);
  }

  // 2. Fetch transaction from database
  const transaction = await prisma.rentalTransaction.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  // 3. Ownership check — customer can only see their own orders
  if (transaction.userId !== authUser.id) {
    notFound();
  }

  // 4. Serialize dates to strings for safe client hydration
  const serialized = {
    id: transaction.id,
    transactionCode: transaction.transactionCode,
    transactionStatus: transaction.transactionStatus,
    paymentStatus: transaction.paymentStatus,
    totalAmount: transaction.totalAmount,
    dpAmount: transaction.dpAmount,
    remainingAmount: transaction.remainingAmount,
    pricingScheme: transaction.pricingScheme,
    startDate: transaction.startDate.toISOString(),
    endDate: transaction.endDate.toISOString(),
    totalDurationDays: transaction.totalDurationDays,
    createdAt: transaction.createdAt.toISOString(),
    notes: transaction.notes ?? null,
    items: transaction.items.map((item) => ({
      id: item.id,
      productNameSnap: item.productNameSnap,
      unitCodeSnap: item.unitCodeSnap ?? null,
      priceSnap: item.priceSnap,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  };

  const isSandbox = process.env.MIDTRANS_IS_PRODUCTION !== "true";
  const snapJsUrl = isSandbox
    ? "https://app.sandbox.midtrans.com/snap/snap.js"
    : "https://app.midtrans.com/snap/snap.js";

  return (
    <>
      {/* Midtrans Snap.js — loaded lazily, only when page is rendered */}
      <Script
        src={snapJsUrl}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <InvoiceContent transaction={serialized} />
      </Suspense>
    </>
  );
}

/**
 * Dynamic metadata for the invoice page.
 */
export async function generateMetadata({ params }: PesananDetailPageProps) {
  const { id } = await params;

  const transaction = await prisma.rentalTransaction.findUnique({
    where: { id },
    select: { transactionCode: true, transactionStatus: true },
  });

  if (!transaction) {
    return { title: "Pesanan tidak ditemukan — Annapurna Adventure" };
  }

  return {
    title: `Pesanan ${transaction.transactionCode} — Annapurna Adventure`,
    description: `Detail pesanan dan status pembayaran untuk reservasi ${transaction.transactionCode}.`,
  };
}
