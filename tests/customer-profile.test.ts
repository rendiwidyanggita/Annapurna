import { describe, it, expect } from "bun:test";
import { completeProfileSchema } from "../src/schemas/profile";

describe("Customer Profile Test Suite", () => {
  it("Validasi Schema: data profil valid diterima", () => {
    const validData = {
      fullName: "Budi Santoso",
      phoneNumber: "081234567890",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("Validasi Schema: format nomor WhatsApp internasional (+62)", () => {
    const validData = {
      fullName: "Budi Santoso",
      phoneNumber: "+6281234567890",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("Validasi Schema: nama lengkap terlalu pendek (<3 karakter)", () => {
    const invalidData = {
      fullName: "Jo",
      phoneNumber: "081234567890",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fullName).toBeDefined();
    }
  });

  it("Validasi Schema: nomor WhatsApp tidak valid", () => {
    const invalidData = {
      fullName: "Budi Santoso",
      phoneNumber: "123456",
      address: "Jl. Merapi No. 12, Sleman, Yogyakarta",
    };
    const result = completeProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phoneNumber).toBeDefined();
    }
  });

  it("Validasi Schema: alamat terlalu pendek (<10 karakter)", () => {
    const invalidData = {
      fullName: "Budi Santoso",
      phoneNumber: "081234567890",
      address: "Jl. A",
    };
    const result = completeProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address).toBeDefined();
    }
  });

  it("Validasi Schema: alamat terlalu panjang (>500 karakter)", () => {
    const invalidData = {
      fullName: "Budi Santoso",
      phoneNumber: "081234567890",
      address: "A".repeat(501),
    };
    const result = completeProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.address).toBeDefined();
    }
  });
});
