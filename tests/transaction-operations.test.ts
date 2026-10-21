import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import {
  maskIdentityNumber,
  sanitizeTransactionForCustomer,
} from "../src/lib/services/transaction-privacy";
import {
  pickupSchema,
  returnSchema,
  penaltyItemSchema,
  cancellationSchema,
} from "../src/schemas/transaction-operations";
import {
  processPickupTransaction,
  processReturnTransaction,
  processCancellationTransaction,
  reconcileLateMidtransPayment,
} from "../src/lib/services/transaction-operations";
import {
  TransactionStatus,
  PaymentStatus,
  UnitStatus,
  GuaranteeStatus,
  PenaltyType,
} from "@prisma/client";

describe("Store Operations & Rental Lifecycle Test Suite", () => {
  // ============================================================================
  // 1. Privacy & Masking Tests (PRD 30)
  // ============================================================================
  describe("Privacy & Masking Utilities", () => {
    it("should mask 16-digit NIK retaining first 4 and last 4 digits", () => {
      const rawNik = "3273123456789999";
      const masked = maskIdentityNumber(rawNik);
      assert.equal(masked, "3273 •••• •••• 9999");
    });

    it("should mask 8-digit SIM retaining first 2 and last 2 digits", () => {
      const rawSim = "12345678";
      const masked = maskIdentityNumber(rawSim);
      assert.equal(masked, "12 •••• 78");
    });

    it("should mask short IDs completely", () => {
      assert.equal(maskIdentityNumber("1234"), "••••");
      assert.equal(maskIdentityNumber(""), "-");
      assert.equal(maskIdentityNumber(null), "-");
      assert.equal(maskIdentityNumber(undefined), "-");
    });

    it("should sanitize guarantee fields from customer-facing objects", () => {
      const tx = {
        id: "tx-123",
        transactionCode: "TRX-001",
        guaranteeDocType: "KTP",
        guaranteeIdNumber: "3273123456789999",
        guaranteeNotes: "Loker A-1",
        totalAmount: 100000,
      };

      const safeTx = sanitizeTransactionForCustomer(tx);
      assert.equal("guaranteeIdNumber" in safeTx, false);
      assert.equal("guaranteeNotes" in safeTx, false);
      assert.equal((safeTx as typeof tx).totalAmount, 100000);
      assert.equal((safeTx as typeof tx).guaranteeDocType, "KTP");
    });
  });

  // ============================================================================
  // 2. Zod Validation Schemas Tests (PRD 16.14 Compliance)
  // ============================================================================
  describe("Zod Validation Schemas", () => {
    it("pickupSchema accepts valid data and rejects invalid doc type", () => {
      const valid = pickupSchema.safeParse({
        transactionId: "11111111-1111-1111-1111-111111111111",
        guaranteeDocType: "KTP",
        guaranteeIdNumber: "3273000011112222",
        guaranteeNotes: "Rak B-02",
        paymentMethod: "Cash",
        verifiedUnitIds: [],
      });
      assert.equal(valid.success, true);

      const invalidDoc = pickupSchema.safeParse({
        transactionId: "11111111-1111-1111-1111-111111111111",
        guaranteeDocType: "PASSPORT", // Invalid
        guaranteeIdNumber: "3273000011112222",
        paymentMethod: "Cash",
      });
      assert.equal(invalidDoc.success, false);
    });

    it("returnSchema rejects when guaranteeReturned is false", () => {
      const invalid = returnSchema.safeParse({
        transactionId: "11111111-1111-1111-1111-111111111111",
        returnedItems: [
          {
            transactionItemId: "22222222-2222-2222-2222-222222222222",
            quantity: 1,
            condition: "Available",
          },
        ],
        guaranteeReturned: false, // Must be confirmed returned
      });
      assert.equal(invalid.success, false);
    });

    it("PRD 16.14: penaltyItemSchema rejects penalty without reason", () => {
      const validPenalty = penaltyItemSchema.safeParse({
        penaltyType: "Late_Return",
        amount: 50000,
        reason: "Terlambat 1 hari",
      });
      assert.equal(validPenalty.success, true);

      const missingReason = penaltyItemSchema.safeParse({
        penaltyType: "Damage",
        amount: 25000,
        reason: "   ", // Blank reason must fail
      });
      assert.equal(missingReason.success, false);
    });

    it("cancellationSchema requires minimum reason length", () => {
      const tooShort = cancellationSchema.safeParse({
        transactionId: "11111111-1111-1111-1111-111111111111",
        reason: "no",
        cancelledBy: "admin",
      });
      assert.equal(tooShort.success, false);

      const valid = cancellationSchema.safeParse({
        transactionId: "11111111-1111-1111-1111-111111111111",
        reason: "Pelanggan membatalkan secara mendadak",
        cancelledBy: "customer",
      });
      assert.equal(valid.success, true);
    });
  });

  // ============================================================================
  // 3. Database Integration Flow Tests
  // ============================================================================
  describe("End-to-End Service Operations Integration", () => {
    let testUserId: string;
    let testTermsId: string;
    let testProductId: string;
    let testVariantId: string;
    let testUnitId: string;
    let testTxId: string;
    const testTxCode = `TEST-OP-${Date.now()}`;

    before(async () => {
      // 1. Get or create test user
      const user = await prisma.user.findFirst({
        where: { role: { name: "CUSTOMER" } },
      });
      if (user) {
        testUserId = user.id;
      } else {
        const role = await prisma.role.findUniqueOrThrow({ where: { name: "CUSTOMER" } });
        const newUser = await prisma.user.create({
          data: {
            email: `test-op-${Date.now()}@annapurna.test`,
            roleId: role.id,
            authProvider: "email",
          },
        });
        testUserId = newUser.id;
      }

      // 2. Get active terms
      const terms = await prisma.termsCondition.findFirst({ where: { isActive: true } });
      if (terms) {
        testTermsId = terms.id;
      } else {
        const newTerms = await prisma.termsCondition.create({
          data: {
            version: `v-test-${Date.now()}`,
            content: "Test S&K Rental",
            isActive: true,
          },
        });
        testTermsId = newTerms.id;
      }

      // 3. Create test category, product, variant & unit
      const category = await prisma.category.findFirst();
      const product = await prisma.product.create({
        data: {
          name: `Tenda Operasional Test ${Date.now()}`,
          categoryId: category!.id,
          itemType: "rental_unit",
          pricePermalam: 50000,
          pricePerkegiatan1: 80000,
          pricePerkegiatan2: 120000,
          isReusable: true,
          consumableStock: 5,
        },
      });
      testProductId = product.id;

      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          variantName: "Standard",
        },
      });
      testVariantId = variant.id;

      const unit = await prisma.inventoryUnit.create({
        data: {
          variantId: variant.id,
          inventoryCode: `UNIT-TEST-${Date.now()}`,
          unitStatus: UnitStatus.Reserved,
        },
      });
      testUnitId = unit.id;

      // 4. Create test RentalTransaction in DP_Dibayar
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 3); // 3 days ago
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1); // 1 day ago (overdue by 1 day)

      const tx = await prisma.rentalTransaction.create({
        data: {
          transactionCode: testTxCode,
          userId: testUserId,
          termsConditionId: testTermsId,
          startDate,
          endDate,
          totalDurationDays: 2,
          pricingScheme: "permalam",
          totalAmount: 100000,
          dpAmount: 50000,
          remainingAmount: 50000,
          transactionStatus: TransactionStatus.DP_Dibayar,
          paymentStatus: PaymentStatus.DP_Paid,
          guaranteeStatus: GuaranteeStatus.Not_Received,
          items: {
            create: [
              {
                unitId: unit.id,
                productId: product.id,
                productNameSnap: product.name,
                unitCodeSnap: unit.inventoryCode,
                priceSnap: 50000,
                quantity: 1,
                subtotal: 100000,
              },
            ],
          },
          payments: {
            create: [
              {
                midtransOrderId: `TEST-${testTxCode}-DP`,
                paymentType: "DP",
                grossAmount: 50000,
                paymentStatus: PaymentStatus.DP_Paid,
                paidAt: new Date(),
              },
            ],
          },
        },
      });
      testTxId = tx.id;
    });

    after(async () => {
      // Clean up test data
      if (testTxId) {
        await prisma.returnItem.deleteMany({
          where: { returnTransaction: { transactionId: testTxId } },
        });
        await prisma.returnTransaction.deleteMany({
          where: { transactionId: testTxId },
        });
        await prisma.penalty.deleteMany({
          where: { transactionId: testTxId },
        });
        await prisma.payment.deleteMany({
          where: { transactionId: testTxId },
        });
        await prisma.rentalTransactionItem.deleteMany({
          where: { transactionId: testTxId },
        });
        await prisma.rentalTransaction.delete({
          where: { id: testTxId },
        });
      }
      if (testUnitId) {
        await prisma.unitStatusLog.deleteMany({
          where: { unitId: testUnitId },
        });
        await prisma.inventoryUnit.delete({
          where: { id: testUnitId },
        });
      }
      if (testVariantId) {
        await prisma.productVariant.delete({
          where: { id: testVariantId },
        });
      }
      if (testProductId) {
        await prisma.product.delete({
          where: { id: testProductId },
        });
      }
    });

    // ── Test 1: Handover / Pickup ──
    it("processPickupTransaction locks transaction, records cash settlement, sets unit to Rented", async () => {
      const updatedTx = await processPickupTransaction(
        {
          transactionId: testTxId,
          guaranteeDocType: "KTP",
          guaranteeIdNumber: "3273123456789999",
          guaranteeNotes: "Kotak Jaminan B-02",
          paymentMethod: "Cash",
          verifiedUnitIds: [testUnitId],
        },
        testUserId
      );

      assert.equal(updatedTx.transactionStatus, TransactionStatus.Sedang_Disewa);
      assert.equal(updatedTx.paymentStatus, PaymentStatus.Fully_Paid);
      assert.equal(updatedTx.guaranteeStatus, GuaranteeStatus.Received);
      assert.equal(updatedTx.guaranteeDocType, "KTP");
      assert.equal(updatedTx.guaranteeIdNumber, "3273123456789999");

      // Verify unit transitioned to Rented
      const unit = await prisma.inventoryUnit.findUniqueOrThrow({
        where: { id: testUnitId },
      });
      assert.equal(unit.unitStatus, UnitStatus.Rented);

      // Verify UnitStatusLog was recorded
      const log = await prisma.unitStatusLog.findFirst({
        where: { unitId: testUnitId, newStatus: UnitStatus.Rented },
      });
      assert.ok(log, "UnitStatusLog should be created for Rented transition");

      // Verify remaining Payment record created
      const remainingPayment = await prisma.payment.findUnique({
        where: { midtransOrderId: `MANUAL-${testTxCode}-REMAINING` },
      });
      assert.ok(remainingPayment, "Remaining payment record should exist");
      assert.equal(remainingPayment.grossAmount, 50000);
      assert.equal(remainingPayment.paymentMethod, "Cash");
    });

    // ── Test 2: Double-submit Idempotency for Pickup ──
    it("processPickupTransaction rejects double-submit on already rented transaction", async () => {
      await assert.rejects(
        async () => {
          await processPickupTransaction(
            {
              transactionId: testTxId,
              guaranteeDocType: "KTP",
              guaranteeIdNumber: "3273123456789999",
              paymentMethod: "Cash",
              verifiedUnitIds: [testUnitId],
            },
            testUserId
          );
        },
        {
          name: "AppError",
          message: /Transaksi tidak dalam status siap pickup/,
        }
      );
    });

    // ── Test 3: Return & Two-Phase Unit Transition ──
    it("processReturnTransaction performs two-phase transition (Rented -> Returned -> Available) and PRD 16.14 manual penalty", async () => {
      const txItem = await prisma.rentalTransactionItem.findFirstOrThrow({
        where: { transactionId: testTxId },
      });

      const result = await processReturnTransaction(
        {
          transactionId: testTxId,
          returnedItems: [
            {
              transactionItemId: txItem.id,
              unitId: testUnitId,
              quantity: 1,
              condition: UnitStatus.Available,
              notes: "Kondisi tenda baik dan bersih",
            },
          ],
          penalties: [
            {
              penaltyType: PenaltyType.Late_Return,
              amount: 50000,
              reason: "Terlambat 1 hari pengembalian",
            },
          ],
          penaltyPaymentMethod: "Cash",
          guaranteeReturned: true,
          notes: "Pengembalian selesai lengkap",
        },
        testUserId
      );

      assert.equal(result.isFullyReturned, true);
      assert.equal(result.updatedTransaction.transactionStatus, TransactionStatus.Selesai);
      assert.equal(result.updatedTransaction.guaranteeStatus, GuaranteeStatus.Returned);

      // Verify final unit status is Available
      const unit = await prisma.inventoryUnit.findUniqueOrThrow({
        where: { id: testUnitId },
      });
      assert.equal(unit.unitStatus, UnitStatus.Available);

      // Verify Two-Phase Transition in UnitStatusLog: Rented -> Returned AND Returned -> Available
      const logs = await prisma.unitStatusLog.findMany({
        where: { unitId: testUnitId },
        orderBy: { createdAt: "desc" },
      });

      const returnedLog = logs.find(
        (l) => l.previousStatus === UnitStatus.Rented && l.newStatus === UnitStatus.Returned
      );
      const availableLog = logs.find(
        (l) => l.previousStatus === UnitStatus.Returned && l.newStatus === UnitStatus.Available
      );

      assert.ok(returnedLog, "Two-phase log missing: Rented -> Returned");
      assert.ok(availableLog, "Two-phase log missing: Returned -> Available");

      // Verify Penalty record created with explicit reason
      const penalty = await prisma.penalty.findFirst({
        where: { transactionId: testTxId },
      });
      assert.ok(penalty, "Penalty record should exist");
      assert.equal(penalty.amount, 50000);
      assert.equal(penalty.reason, "Terlambat 1 hari pengembalian");

      // Verify Penalty Payment recorded
      const penaltyPayment = await prisma.payment.findFirst({
        where: { transactionId: testTxId, paymentType: "Penalty" },
      });
      assert.ok(penaltyPayment, "Penalty payment should be created");
      assert.equal(penaltyPayment.grossAmount, 50000);
      assert.equal(penaltyPayment.paymentMethod, "Cash");
    });

    // ── Test 4: Reusable Consumable Restock on Return ──
    it("processReturnTransaction increments consumableStock for reusable items", async () => {
      // Create consumable product
      const category = await prisma.category.findFirstOrThrow();
      const consumableProduct = await prisma.product.create({
        data: {
          name: `Gas Kaleng Reusable Test ${Date.now()}`,
          categoryId: category.id,
          itemType: "consumable",
          pricePermalam: 15000,
          pricePerkegiatan1: 25000,
          pricePerkegiatan2: 35000,
          isReusable: true,
          consumableStock: 10,
        },
      });

      const consumableTxCode = `TEST-CONSUMABLE-${Date.now()}`;
      const cTx = await prisma.rentalTransaction.create({
        data: {
          transactionCode: consumableTxCode,
          userId: testUserId,
          termsConditionId: testTermsId,
          startDate: new Date(),
          endDate: new Date(),
          totalDurationDays: 1,
          pricingScheme: "permalam",
          totalAmount: 30000,
          dpAmount: 15000,
          remainingAmount: 15000,
          transactionStatus: TransactionStatus.Sedang_Disewa,
          paymentStatus: PaymentStatus.Fully_Paid,
          items: {
            create: [
              {
                productId: consumableProduct.id,
                productNameSnap: consumableProduct.name,
                priceSnap: 15000,
                quantity: 2,
                subtotal: 30000,
              },
            ],
          },
        },
        include: { items: true },
      });

      const returnRes = await processReturnTransaction(
        {
          transactionId: cTx.id,
          returnedItems: [
            {
              transactionItemId: cTx.items[0].id,
              quantity: 2,
              condition: UnitStatus.Available,
            },
          ],
          penalties: [],
          guaranteeReturned: true,
        },
        testUserId
      );

      assert.equal(returnRes.isFullyReturned, true);

      // Verify stock was incremented by 2 (10 -> 12)
      const reloadedProduct = await prisma.product.findUniqueOrThrow({
        where: { id: consumableProduct.id },
      });
      assert.equal(reloadedProduct.consumableStock, 12);

      // Cleanup
      await prisma.returnItem.deleteMany({
        where: { returnTransaction: { transactionId: cTx.id } },
      });
      await prisma.returnTransaction.deleteMany({
        where: { transactionId: cTx.id },
      });
      await prisma.rentalTransactionItem.deleteMany({
        where: { transactionId: cTx.id },
      });
      await prisma.rentalTransaction.delete({ where: { id: cTx.id } });
      await prisma.product.delete({ where: { id: consumableProduct.id } });
    });

    // ── Test 5: Cancellation Policies (Customer Forfeit vs Admin Refund) ──
    it("processCancellationTransaction handles customer DP forfeit and admin refund correctly", async () => {
      // Case A: Customer cancel forfeits DP
      const cancelTxCodeA = `TEST-CANCEL-A-${Date.now()}`;
      const txA = await prisma.rentalTransaction.create({
        data: {
          transactionCode: cancelTxCodeA,
          userId: testUserId,
          termsConditionId: testTermsId,
          startDate: new Date(),
          endDate: new Date(),
          totalDurationDays: 1,
          pricingScheme: "permalam",
          totalAmount: 100000,
          dpAmount: 50000,
          remainingAmount: 50000,
          transactionStatus: TransactionStatus.DP_Dibayar,
          paymentStatus: PaymentStatus.DP_Paid,
        },
      });

      const cancelledA = await processCancellationTransaction(
        {
          transactionId: txA.id,
          reason: "Customer batalkan mendadak",
          cancelledBy: "customer",
        },
        testUserId
      );

      assert.equal(cancelledA.transactionStatus, TransactionStatus.Dibatalkan);
      assert.equal(cancelledA.paymentStatus, PaymentStatus.DP_Paid); // DP forfeited
      assert.ok(cancelledA.cancelledReason?.includes("DP Hangus"));

      // Case B: Admin cancel triggers refund
      const cancelTxCodeB = `TEST-CANCEL-B-${Date.now()}`;
      const txB = await prisma.rentalTransaction.create({
        data: {
          transactionCode: cancelTxCodeB,
          userId: testUserId,
          termsConditionId: testTermsId,
          startDate: new Date(),
          endDate: new Date(),
          totalDurationDays: 1,
          pricingScheme: "permalam",
          totalAmount: 100000,
          dpAmount: 50000,
          remainingAmount: 50000,
          transactionStatus: TransactionStatus.DP_Dibayar,
          paymentStatus: PaymentStatus.DP_Paid,
        },
      });

      const cancelledB = await processCancellationTransaction(
        {
          transactionId: txB.id,
          reason: "Toko kebanjiran, tidak dapat beroperasi",
          cancelledBy: "admin",
        },
        testUserId
      );

      assert.equal(cancelledB.transactionStatus, TransactionStatus.Dibatalkan);
      assert.equal(cancelledB.paymentStatus, PaymentStatus.Refunded); // Refunded
      assert.ok(cancelledB.cancelledReason?.includes("Refund Penuh"));

      // Cleanup
      await prisma.rentalTransaction.deleteMany({
        where: { id: { in: [txA.id, txB.id] } },
      });
    });

    // ── Test 6: Webhook Reconciliation Overbooking Protection ──
    it("reconcileLateMidtransPayment prevents double booking if unit was booked on conflicting dates", async () => {
      // 1. Create unit
      const category = await prisma.category.findFirstOrThrow();
      const testProd = await prisma.product.create({
        data: {
          name: `Tenda Reconcile ${Date.now()}`,
          categoryId: category.id,
          itemType: "rental_unit",
          pricePermalam: 50000,
          pricePerkegiatan1: 75000,
          pricePerkegiatan2: 100000,
        },
      });
      const testVar = await prisma.productVariant.create({
        data: { productId: testProd.id, variantName: "Standar" },
      });
      const conflictUnit = await prisma.inventoryUnit.create({
        data: {
          variantId: testVar.id,
          inventoryCode: `CONF-${Date.now()}`,
          unitStatus: UnitStatus.Available,
        },
      });

      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 2);

      // 2. Expired transaction with midtrans payment
      const expiredOrderId = `MID-EXP-${Date.now()}`;
      const expiredTx = await prisma.rentalTransaction.create({
        data: {
          transactionCode: `EXP-${Date.now()}`,
          userId: testUserId,
          termsConditionId: testTermsId,
          startDate: start,
          endDate: end,
          totalDurationDays: 2,
          pricingScheme: "permalam",
          totalAmount: 100000,
          dpAmount: 50000,
          remainingAmount: 50000,
          transactionStatus: TransactionStatus.Expired,
          paymentStatus: PaymentStatus.Pending,
          items: {
            create: [
              {
                unitId: conflictUnit.id,
                productId: testProd.id,
                productNameSnap: testProd.name,
                priceSnap: 50000,
                quantity: 1,
                subtotal: 100000,
              },
            ],
          },
          payments: {
            create: [
              {
                midtransOrderId: expiredOrderId,
                paymentType: "DP",
                grossAmount: 50000,
                paymentStatus: PaymentStatus.Pending,
              },
            ],
          },
        },
      });

      // 3. Newer active transaction booked the SAME unit on overlapping dates
      const activeTx = await prisma.rentalTransaction.create({
        data: {
          transactionCode: `ACTIVE-${Date.now()}`,
          userId: testUserId,
          termsConditionId: testTermsId,
          startDate: start,
          endDate: end,
          totalDurationDays: 2,
          pricingScheme: "permalam",
          totalAmount: 100000,
          dpAmount: 50000,
          remainingAmount: 50000,
          transactionStatus: TransactionStatus.DP_Dibayar,
          paymentStatus: PaymentStatus.DP_Paid,
          items: {
            create: [
              {
                unitId: conflictUnit.id,
                productId: testProd.id,
                productNameSnap: testProd.name,
                priceSnap: 50000,
                quantity: 1,
                subtotal: 100000,
              },
            ],
          },
        },
      });

      // 4. Try to reconcile late payment for the expired transaction
      const reconcileResult = await reconcileLateMidtransPayment(expiredOrderId);

      // Must detect conflict and reject re-reserving unit!
      assert.equal(reconcileResult.success, false);
      assert.equal(reconcileResult.conflict, true);
      assert.ok(reconcileResult.message.includes("refund"));

      // Verify payment was marked for refund in rawResponse
      const reloadedPayment = await prisma.payment.findUniqueOrThrow({
        where: { midtransOrderId: expiredOrderId },
      });
      assert.ok(
        reloadedPayment.rawResponse?.includes("LATE_PAYMENT_REFUND_REQUIRED")
      );

      // Cleanup
      await prisma.rentalTransactionItem.deleteMany({
        where: { transactionId: { in: [expiredTx.id, activeTx.id] } },
      });
      await prisma.payment.deleteMany({
        where: { transactionId: expiredTx.id },
      });
      await prisma.rentalTransaction.deleteMany({
        where: { id: { in: [expiredTx.id, activeTx.id] } },
      });
      await prisma.inventoryUnit.delete({ where: { id: conflictUnit.id } });
      await prisma.productVariant.delete({ where: { id: testVar.id } });
      await prisma.product.delete({ where: { id: testProd.id } });
    });
  });
});
