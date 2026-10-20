import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { checkoutSchema } from "@/schemas/checkout";
import { ConflictError } from "@/lib/errors";
import { successResponse, errorResponse } from "@/lib/api-response";
import { TransactionStatus, PaymentStatus, UnitStatus } from "@prisma/client";

/**
 * Checkout API Route (AA-68, AA-59, AA-60, AA-65, AA-66)
 *
 * Implements atomic checkout with row-level locking (SELECT FOR UPDATE),
 * strict deadlock prevention via ascending ID sorting (OQ-17),
 * real-time overlap collision avoidance, and consumable stock decrement.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return errorResponse(
        "Silakan login terlebih dahulu untuk melakukan reservasi rental.",
        "UNAUTHORIZED",
        401
      );
    }

    const userId = profileStatus.user.id;

    // 2. Validate input schema
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Data checkout tidak valid";
      return errorResponse(firstError, "VALIDATION_ERROR", 422, parsed.error.flatten());
    }

    const { items, notes } = parsed.data;

    // 3. Fetch active Terms & Conditions snapshot (AA-60)
    const activeTerms = await prisma.termsCondition.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeTerms) {
      return errorResponse(
        "Syarat & Ketentuan sewa belum dikonfigurasi oleh administrator.",
        "INTERNAL_ERROR",
        500
      );
    }

    // 4. Separate rental items and consumable items
    const rentalItems = items.filter((i) => i.itemType === "rental_unit");
    const consumableItems = items.filter((i) => i.itemType === "consumable");

    // 5. Atomic Transaction with SELECT FOR UPDATE (Anti-Race Condition & Anti-Deadlock)
    const transactionResult = await prisma.$transaction(
      async (tx) => {
        // ─────────────────────────────────────────────────────────────────────
        // Step A: Collect & Lock Candidate Inventory Units for Rental Items
        // ─────────────────────────────────────────────────────────────────────
        // Map to hold assigned unit records per rental item index
        const assignedUnitsPerItem: Map<number, Array<{ id: string; inventoryCode: string }>> = new Map();

        if (rentalItems.length > 0) {
          // Pre-fetch candidate units that are physically available
          const candidateMap = new Map<string, Array<{ id: string; inventoryCode: string; variantId: string }>>();
          const allCandidateUnitIdsSet = new Set<string>();

          for (const item of rentalItems) {
            const variantFilter = item.variantId
              ? { variantId: item.variantId }
              : { variant: { productId: item.productId, deletedAt: null } };

            const candidates = await tx.inventoryUnit.findMany({
              where: {
                ...variantFilter,
                isActive: true,
                deletedAt: null,
                unitStatus: UnitStatus.Available,
              },
              select: {
                id: true,
                inventoryCode: true,
                variantId: true,
              },
            });

            if (candidates.length < item.quantity) {
              throw new ConflictError(
                `Unit fisik untuk "${item.productName}" tidak mencukupi (dibutuhkan ${item.quantity}, tersedia ${candidates.length}).`
              );
            }

            candidateMap.set(item.productId + (item.variantId || ""), candidates);
            candidates.forEach((c) => allCandidateUnitIdsSet.add(c.id));
          }

          // Anti-Deadlock Protocol (OQ-17 & Supabase Rule 5.2): Sort candidate IDs alphabetically ASCENDING before locking
          const sortedUnitIds = Array.from(allCandidateUnitIdsSet).sort();

          if (sortedUnitIds.length > 0) {
            await tx.$queryRaw`SELECT id FROM inventory_units WHERE id = ANY(${sortedUnitIds}::text[]) ORDER BY id ASC FOR UPDATE`;
          }

          // Re-verify availability inside the lock without overlapping active transactions
          const globallyAllocatedUnitIds = new Set<string>();

          for (let itemIdx = 0; itemIdx < rentalItems.length; itemIdx++) {
            const item = rentalItems[itemIdx];
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);

            const candidates = candidateMap.get(item.productId + (item.variantId || "")) || [];
            const freeUnits: Array<{ id: string; inventoryCode: string }> = [];

            for (const cand of candidates) {
              if (globallyAllocatedUnitIds.has(cand.id)) continue;

              // Check if cand has overlapping active transaction
              const overlap = await tx.rentalTransactionItem.findFirst({
                where: {
                  unitId: cand.id,
                  transaction: {
                    transactionStatus: { in: ACTIVE_STATUSES },
                    startDate: { lte: endDate },
                    endDate: { gte: startDate },
                  },
                },
              });

              if (!overlap) {
                freeUnits.push({ id: cand.id, inventoryCode: cand.inventoryCode });
                globallyAllocatedUnitIds.add(cand.id);
                if (freeUnits.length === item.quantity) break;
              }
            }

            if (freeUnits.length < item.quantity) {
              throw new ConflictError(
                `Unit "${item.productName}" sudah dipesan oleh pengguna lain untuk rentang tanggal tersebut.`
              );
            }

            assignedUnitsPerItem.set(itemIdx, freeUnits);
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step B: Lock & Decrement Consumable Items (PRD Section 1c)
        // ─────────────────────────────────────────────────────────────────────
        if (consumableItems.length > 0) {
          const sortedConsumableProductIds = Array.from(
            new Set(consumableItems.map((c) => c.productId))
          ).sort();

          if (sortedConsumableProductIds.length > 0) {
            await tx.$queryRaw`SELECT id FROM products WHERE id = ANY(${sortedConsumableProductIds}::text[]) ORDER BY id ASC FOR UPDATE`;
          }

          for (const item of consumableItems) {
            const product = await tx.product.findUniqueOrThrow({
              where: { id: item.productId, deletedAt: null },
            });

            if (product.consumableStock < item.quantity) {
              throw new ConflictError(
                `Stok barang habis pakai "${item.productName}" tidak mencukupi (tersisa ${product.consumableStock}).`
              );
            }

            // Immediately decrement consumable stock inside transaction
            await tx.product.update({
              where: { id: item.productId },
              data: {
                consumableStock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step C: Calculate Amounts & Create RentalTransaction
        // ─────────────────────────────────────────────────────────────────────
        const totalAmount = items.reduce(
          (acc, item) => acc + item.unitPrice * item.quantity,
          0
        );
        const dpAmount = Math.ceil(totalAmount * 0.5);
        const remainingAmount = totalAmount - dpAmount;

        // Earliest start date and latest end date
        const allStartDates = items.map((i) => new Date(i.startDate).getTime());
        const allEndDates = items.map((i) => new Date(i.endDate).getTime());
        const overallStartDate = new Date(Math.min(...allStartDates));
        const overallEndDate = new Date(Math.max(...allEndDates));

        const maxDurationDays = Math.max(
          1,
          Math.ceil(
            (overallEndDate.getTime() - overallStartDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        // Generate unique readable transaction code (e.g. TRX-261018-4921)
        const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const transactionCode = `TRX-${dateCode}-${randomDigits}`;

        const createdTx = await tx.rentalTransaction.create({
          data: {
            transactionCode,
            userId,
            termsConditionId: activeTerms.id,
            termsAgreedAt: new Date(),
            termsSnapshot: activeTerms.content,
            startDate: overallStartDate,
            endDate: overallEndDate,
            totalDurationDays: maxDurationDays,
            pricingScheme: items[0]?.durationScheme || "permalam",
            totalAmount,
            dpAmount,
            remainingAmount,
            transactionStatus: TransactionStatus.Menunggu_Pembayaran_DP,
            paymentStatus: PaymentStatus.Unpaid,
            notes: notes || undefined,
          },
        });

        // ─────────────────────────────────────────────────────────────────────
        // Step D: Insert RentalTransactionItem Records
        // ─────────────────────────────────────────────────────────────────────
        // Insert rental item units (each physical unit assigned gets 1 record)
        for (let idx = 0; idx < rentalItems.length; idx++) {
          const item = rentalItems[idx];
          const assignedUnits = assignedUnitsPerItem.get(idx) || [];

          for (const u of assignedUnits) {
            await tx.rentalTransactionItem.create({
              data: {
                transactionId: createdTx.id,
                unitId: u.id,
                productId: item.productId,
                productNameSnap: item.productName,
                unitCodeSnap: u.inventoryCode,
                priceSnap: item.unitPrice,
                quantity: 1,
                subtotal: item.unitPrice,
              },
            });
          }
        }

        // Insert consumable item records
        for (const item of consumableItems) {
          await tx.rentalTransactionItem.create({
            data: {
              transactionId: createdTx.id,
              unitId: null,
              productId: item.productId,
              productNameSnap: item.productName,
              unitCodeSnap: null,
              priceSnap: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.unitPrice * item.quantity,
            },
          });
        }

        // ─────────────────────────────────────────────────────────────────────
        // Step E: Audit Trail Activity Log
        // ─────────────────────────────────────────────────────────────────────
        await tx.activityLog.create({
          data: {
            userId,
            action: "RENTAL_TRANSACTION_CREATED",
            entityName: "RentalTransaction",
            entityId: createdTx.id,
            newValue: JSON.stringify({
              code: createdTx.transactionCode,
              totalAmount,
              dpAmount,
              status: createdTx.transactionStatus,
            }),
            description: `Checkout reservasi baru: ${createdTx.transactionCode} oleh user ${userId}`,
          },
        });

        return createdTx;
      },
      {
        timeout: 15000, // 15 seconds transaction limit
      }
    );

    return successResponse(
      {
        transactionId: transactionResult.id,
        transactionCode: transactionResult.transactionCode,
        totalAmount: transactionResult.totalAmount,
        dpAmount: transactionResult.dpAmount,
        remainingAmount: transactionResult.remainingAmount,
        transactionStatus: transactionResult.transactionStatus,
      },
      "Reservasi berhasil dibuat. Silakan lakukan pembayaran DP.",
      201
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return errorResponse(error.message, "CONFLICT", 409, error.details);
    }

    return errorResponse(
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses checkout",
      "INTERNAL_ERROR",
      500
    );
  }
}
