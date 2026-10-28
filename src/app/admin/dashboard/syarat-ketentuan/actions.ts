"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/services/audit-log";
import {
  createTermsSchema,
  updateTermsSchema,
  toggleTermsActiveSchema,
  type CreateTermsInput,
  type UpdateTermsInput,
} from "@/schemas/terms";

export type TermsActionState = {
  error?: string;
  success?: string;
};

/**
 * Server Action: Buat versi Syarat & Ketentuan baru.
 * Hanya role OWNER yang berhak melakukan perubahan S&K (PRD OQ-07).
 */
export async function createTermsVersion(
  _prevState: TermsActionState,
  formData: FormData
): Promise<TermsActionState> {
  try {
    const authResult = await requireRole(["OWNER"]);

    const rawData: CreateTermsInput = {
      version: (formData.get("version") as string)?.trim() || "",
      content: (formData.get("content") as string)?.trim() || "",
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    };

    const validated = createTermsSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        error: validated.error.errors[0]?.message ?? "Data input tidak valid",
      };
    }

    // Check version uniqueness
    const existing = await prisma.termsCondition.findUnique({
      where: { version: validated.data.version },
    });
    if (existing) {
      return {
        error: `Versi "${validated.data.version}" sudah pernah dibuat. Gunakan kode versi lain.`,
      };
    }

    // Database transaction: deactivate other versions if new version is marked active
    const newRecord = await prisma.$transaction(async (tx) => {
      if (validated.data.isActive) {
        await tx.termsCondition.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return await tx.termsCondition.create({
        data: {
          version: validated.data.version,
          content: validated.data.content,
          isActive: validated.data.isActive,
        },
      });
    });

    await logActivity(prisma, {
      userId: authResult.user.id,
      action: "TERMS_CREATE",
      entityName: "TermsCondition",
      entityId: newRecord.id,
      newValue: newRecord,
      description: `Membuat Syarat & Ketentuan versi ${newRecord.version} (status: ${
        newRecord.isActive ? "Aktif" : "Nonaktif"
      })`,
    });

    revalidatePath("/admin/dashboard/syarat-ketentuan");
    revalidatePath("/syarat-ketentuan");

    return {
      success: `Syarat & Ketentuan versi ${newRecord.version} berhasil dibuat!`,
    };
  } catch (err: unknown) {
    console.error("[createTermsVersion error]:", err);
    if (err instanceof Error && (err.name === "UnauthorizedError" || err.name === "ForbiddenError")) {
      return { error: err.message };
    }
    return {
      error: "Terjadi kesalahan pada sistem saat menyimpan versi baru.",
    };
  }
}

/**
 * Server Action: Edit isi atau versi Syarat & Ketentuan existing.
 */
export async function updateTermsVersion(
  _prevState: TermsActionState,
  formData: FormData
): Promise<TermsActionState> {
  try {
    const authResult = await requireRole(["OWNER"]);

    const rawData: UpdateTermsInput = {
      id: formData.get("id") as string,
      version: (formData.get("version") as string)?.trim() || "",
      content: (formData.get("content") as string)?.trim() || "",
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    };

    const validated = updateTermsSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        error: validated.error.errors[0]?.message ?? "Data input tidak valid",
      };
    }

    const currentRecord = await prisma.termsCondition.findUnique({
      where: { id: validated.data.id },
    });
    if (!currentRecord) {
      return { error: "Data Syarat & Ketentuan tidak ditemukan." };
    }

    // Check version collision with other records
    if (validated.data.version !== currentRecord.version) {
      const collision = await prisma.termsCondition.findFirst({
        where: {
          version: validated.data.version,
          id: { not: validated.data.id },
        },
      });
      if (collision) {
        return {
          error: `Versi "${validated.data.version}" sudah digunakan oleh catatan lain.`,
        };
      }
    }

    const updatedRecord = await prisma.$transaction(async (tx) => {
      if (validated.data.isActive) {
        await tx.termsCondition.updateMany({
          where: {
            isActive: true,
            id: { not: validated.data.id },
          },
          data: { isActive: false },
        });
      }

      return await tx.termsCondition.update({
        where: { id: validated.data.id },
        data: {
          version: validated.data.version,
          content: validated.data.content,
          isActive: validated.data.isActive,
        },
      });
    });

    await logActivity(prisma, {
      userId: authResult.user.id,
      action: "TERMS_UPDATE",
      entityName: "TermsCondition",
      entityId: updatedRecord.id,
      oldValue: currentRecord,
      newValue: updatedRecord,
      description: `Memperbarui Syarat & Ketentuan versi ${updatedRecord.version}`,
    });

    revalidatePath("/admin/dashboard/syarat-ketentuan");
    revalidatePath("/syarat-ketentuan");

    return {
      success: `Syarat & Ketentuan versi ${updatedRecord.version} berhasil diperbarui!`,
    };
  } catch (err: unknown) {
    console.error("[updateTermsVersion error]:", err);
    if (err instanceof Error && (err.name === "UnauthorizedError" || err.name === "ForbiddenError")) {
      return { error: err.message };
    }
    return {
      error: "Terjadi kesalahan pada sistem saat memperbarui versi S&K.",
    };
  }
}

/**
 * Server Action: Aktifkan versi S&K tertentu (menonaktifkan versi aktif lainnya).
 */
export async function activateTermsVersion(id: string): Promise<TermsActionState> {
  try {
    const authResult = await requireRole(["OWNER"]);

    const validated = toggleTermsActiveSchema.safeParse({ id });
    if (!validated.success) {
      return { error: "ID versi tidak valid." };
    }

    const target = await prisma.termsCondition.findUnique({
      where: { id: validated.data.id },
    });
    if (!target) {
      return { error: "Versi S&K tidak ditemukan." };
    }

    if (target.isActive) {
      return { success: `Versi ${target.version} sudah dalam status aktif.` };
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Deactivate all
      await tx.termsCondition.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Activate target
      return await tx.termsCondition.update({
        where: { id: validated.data.id },
        data: { isActive: true },
      });
    });

    await logActivity(prisma, {
      userId: authResult.user.id,
      action: "TERMS_ACTIVATE",
      entityName: "TermsCondition",
      entityId: updated.id,
      oldValue: target,
      newValue: updated,
      description: `Mengaktifkan Syarat & Ketentuan versi ${updated.version} sebagai acuan aktif`,
    });

    revalidatePath("/admin/dashboard/syarat-ketentuan");
    revalidatePath("/syarat-ketentuan");

    return {
      success: `Versi ${updated.version} kini aktif digunakan sebagai acuan pelanggan!`,
    };
  } catch (err: unknown) {
    console.error("[activateTermsVersion error]:", err);
    if (err instanceof Error && (err.name === "UnauthorizedError" || err.name === "ForbiddenError")) {
      return { error: err.message };
    }
    return {
      error: "Gagal mengaktifkan versi S&K.",
    };
  }
}
