import { PrismaClient, UnitStatus, TransactionStatus } from "@prisma/client";
import { ACTIVE_STATUSES } from "../src/lib/constants";
import { ConflictError } from "../src/lib/errors";

const prisma = new PrismaClient();

/**
 * Concurrency Test Runner (AA-69)
 *
 * Simulates two concurrent customers attempting to checkout and book the exact same
 * physical inventory unit simultaneously for overlapping dates.
 *
 * Expected Result:
 * - Exactly ONE checkout succeeds (HTTP 201 Created)
 * - Exactly ONE checkout is rejected with ConflictError (HTTP 409 Conflict)
 * - Zero deadlocks or duplicate bookings
 */
async function runConcurrencyTest() {
  console.log("=================================================================");
  console.log("🧪 STARTING CONCURRENCY & ANTI-OVERBOOKING TEST (AA-69)");
  console.log("=================================================================");

  try {
    // 1. Find or pick a test user
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length === 0) {
      throw new Error("Tidak ada user di database untuk pengujian.");
    }
    const userA = users[0].id;
    const userB = users[1] ? users[1].id : users[0].id;

    // 2. Find an active rental product with at least 1 physical unit or provision temporary unit
    let unit = await prisma.inventoryUnit.findFirst({
      where: {
        unitStatus: UnitStatus.Available,
        isActive: true,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    let temporaryCreatedUnit = false;

    if (!unit) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          deletedAt: null,
          product: { itemType: "rental_unit", deletedAt: null },
        },
        include: { product: true },
      });

      if (!variant) {
        throw new Error("Tidak ada varian produk rental di database untuk pengujian.");
      }

      console.log(`ℹ️ Belum ada unit fisik. Membuat unit uji sementara untuk: "${variant.product.name}"`);
      unit = await prisma.inventoryUnit.create({
        data: {
          variantId: variant.id,
          inventoryCode: `TEST-UNIT-${Date.now().toString().slice(-4)}`,
          unitStatus: UnitStatus.Available,
        },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
      temporaryCreatedUnit = true;
    }

    const product = unit.variant.product;
    console.log(`📦 Menguji produk: "${product.name}" (Kode Unit: ${unit.inventoryCode})`);

    // 3. Setup test date range (future date to avoid colliding with actual data)
    const testStartDate = new Date("2026-12-01T00:00:00.000Z");
    const testEndDate = new Date("2026-12-04T00:00:00.000Z");

    // Clean up any previous test transactions for this range first
    await prisma.rentalTransactionItem.deleteMany({
      where: {
        unitId: unit.id,
        transaction: {
          startDate: { lte: testEndDate },
          endDate: { gte: testStartDate },
        },
      },
    });

    // 4. Fetch active Terms & Conditions
    const activeTerms = await prisma.termsCondition.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeTerms) {
      throw new Error("Syarat & Ketentuan aktif tidak ditemukan.");
    }

    // 5. Atomic Checkout Simulation Function (Exact replica of /api/checkout logic)
    const simulateCheckout = async (userId: string, customerLabel: string) => {
      console.log(`⏱️ [${customerLabel}] Memulai checkout...`);

      return await prisma.$transaction(
        async (tx) => {
          // A. Fetch candidate units
          const candidates = await tx.inventoryUnit.findMany({
            where: {
              variantId: unit.variantId,
              isActive: true,
              deletedAt: null,
              unitStatus: UnitStatus.Available,
            },
            select: { id: true, inventoryCode: true },
          });

          // B. Deadlock prevention: Sort IDs ascending before locking
          const sortedIds = candidates.map((c) => c.id).sort();
          for (const uid of sortedIds) {
            await tx.$queryRaw`SELECT id FROM inventory_units WHERE id = ${uid} FOR UPDATE`;
          }

          // Small artificial delay to ensure contention overlap
          await new Promise((resolve) => setTimeout(resolve, 50));

          // C. Re-check overlap inside lock
          const freeUnits: Array<{ id: string; inventoryCode: string }> = [];
          for (const cand of candidates) {
            const overlap = await tx.rentalTransactionItem.findFirst({
              where: {
                unitId: cand.id,
                transaction: {
                  transactionStatus: { in: ACTIVE_STATUSES },
                  startDate: { lte: testEndDate },
                  endDate: { gte: testStartDate },
                },
              },
            });

            if (!overlap) {
              freeUnits.push(cand);
              break; // Need 1 unit
            }
          }

          if (freeUnits.length < 1) {
            throw new ConflictError(
              `[409 Conflict] Unit "${product.name}" sudah dipesan oleh pengguna lain.`
            );
          }

          const assigned = freeUnits[0];

          // D. Create transaction
          const testCode = `TEST-CONC-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900)}`;
          const createdTx = await tx.rentalTransaction.create({
            data: {
              transactionCode: testCode,
              userId,
              termsConditionId: activeTerms.id,
              termsAgreedAt: new Date(),
              termsSnapshot: activeTerms.content,
              startDate: testStartDate,
              endDate: testEndDate,
              totalDurationDays: 3,
              pricingScheme: "perkegiatan1",
              totalAmount: product.pricePerkegiatan1,
              dpAmount: Math.ceil(product.pricePerkegiatan1 * 0.5),
              remainingAmount: product.pricePerkegiatan1 - Math.ceil(product.pricePerkegiatan1 * 0.5),
              transactionStatus: TransactionStatus.Menunggu_Pembayaran_DP,
              notes: `Concurrency Test Run by ${customerLabel}`,
            },
          });

          await tx.rentalTransactionItem.create({
            data: {
              transactionId: createdTx.id,
              unitId: assigned.id,
              productId: product.id,
              productNameSnap: product.name,
              unitCodeSnap: assigned.inventoryCode,
              priceSnap: product.pricePerkegiatan1,
              quantity: 1,
              subtotal: product.pricePerkegiatan1,
            },
          });

          return createdTx;
        },
        { timeout: 15000 }
      );
    };

    // 6. Execute Concurrent Parallel Requests (Simultaneous Promise.all)
    console.log("⚡ Menembakkan 2 request checkout secara bersamaan (Promise.all)...");
    const results = await Promise.allSettled([
      simulateCheckout(userA, "Customer A"),
      simulateCheckout(userB, "Customer B"),
    ]);

    let successCount = 0;
    let conflictCount = 0;
    let createdTxId: string | null = null;

    results.forEach((res, idx) => {
      const customer = idx === 0 ? "Customer A" : "Customer B";
      if (res.status === "fulfilled") {
        successCount++;
        createdTxId = res.value.id;
        console.log(`✅ ${customer}: SUKSES [201 Created] — TRX Code: ${res.value.transactionCode}`);
      } else {
        if (res.reason instanceof ConflictError || res.reason?.message?.includes("409 Conflict")) {
          conflictCount++;
          console.log(`🛡️ ${customer}: DITOLAK [409 Conflict] — ${res.reason.message}`);
        } else {
          console.error(`❌ ${customer}: ERROR LAIN:`, res.reason);
        }
      }
    });

    // 7. Verify Assertions
    console.log("-----------------------------------------------------------------");
    console.log(`Hasil Pengujian:`);
    console.log(`- Berhasil (201): ${successCount}`);
    console.log(`- Konflik Ditolak (409): ${conflictCount}`);

    if (successCount === 1 && conflictCount === 1) {
      console.log("🎉 VERIFIKASI BERHASIL: Tidak terjadi overbooking atau double reservation!");
    } else {
      console.error("❌ VERIFIKASI GAGAL: Jumlah sukses dan konflik tidak sesuai ekspektasi.");
    }

    // 8. Clean up test transaction & temporary unit
    if (createdTxId) {
      await prisma.rentalTransactionItem.deleteMany({ where: { transactionId: createdTxId } });
      await prisma.rentalTransaction.delete({ where: { id: createdTxId } });
      console.log("🧹 Data transaksi pengujian berhasil dibersihkan.");
    }

    if (temporaryCreatedUnit && unit) {
      await prisma.inventoryUnit.delete({ where: { id: unit.id } });
      console.log("🧹 Unit inventaris uji coba berhasil dibersihkan.");
    }
  } catch (error) {
    console.error("❌ Fatal Error saat concurrency test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runConcurrencyTest();
