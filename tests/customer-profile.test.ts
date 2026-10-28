import test from "node:test";
import assert from "node:assert/strict";
import { completeProfileSchema } from "../src/schemas/profile";

test("Customer Profile Test Suite", async (t) => {
  await t.test("Validasi Schema: data profil valid diterima", () => {
    const validData = {
      fullName: "Budi Santoso",
      phoneNumber: "081234567890",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(validData);
    assert.equal(result.success, true);
  });

  await t.test("Validasi Schema: format nomor WhatsApp internasional (+62)", () => {
    const validData = {
      fullName: "Budi Santoso",
      phoneNumber: "+6281234567890",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(validData);
    assert.equal(result.success, true);
  });

  await t.test("Validasi Schema: nama lengkap terlalu pendek (<3 karakter)", () => {
    const invalidData = {
      fullName: "Jo",
      phoneNumber: "081234567890",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(invalidData);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.fullName);
    }
  });

  await t.test("Validasi Schema: nomor WhatsApp tidak valid", () => {
    const invalidData = {
      fullName: "Budi Santoso",
      phoneNumber: "123456",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(invalidData);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.phoneNumber);
    }
  });

  await t.test("Validasi Schema: alamat terlalu pendek (<10 karakter)", () => {
    const invalidData = {
      fullName: "Budi Santoso",
      phoneNumber: "081234567890",
      address: "Jl. A",
    };
    const result = completeProfileSchema.safeParse(invalidData);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.address);
    }
  });

  await t.test("Validasi Schema: alamat terlalu panjang (>500 karakter)", () => {
    const invalidData = {
      fullName: "Budi Santoso",
      phoneNumber: "081234567890",
      address: "A".repeat(501),
    };
    const result = completeProfileSchema.safeParse(invalidData);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.flatten().fieldErrors.address);
    }
  });
});
