"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import {
  createPackageSchema,
  updatePackageSchema,
  deletePackageSchema,
  togglePackageStatusSchema,
} from "@/schemas/package";
import { MediaType } from "@prisma/client";

export interface PackageActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

interface RawMediaInput {
  mediaUrl: string;
  storagePath: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string | null;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

/**
 * AA-50 & AA-51: Create Rental Package with duration prices & items composition
 */
export async function createRentalPackage(formData: FormData): Promise<PackageActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const rawItems = formData.get("items") ? JSON.parse(formData.get("items") as string) : [];
    const rawMedia: RawMediaInput[] = formData.get("media")
      ? JSON.parse(formData.get("media") as string)
      : [];

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || undefined,
      pricePermalam: parseInt(formData.get("pricePermalam") as string, 10),
      pricePerkegiatan1: parseInt(formData.get("pricePerkegiatan1") as string, 10),
      pricePerkegiatan2: parseInt(formData.get("pricePerkegiatan2") as string, 10),
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
      items: rawItems,
    };

    const parsed = createPackageSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Verify name uniqueness
    const existingName = await prisma.package.findUnique({
      where: { name: parsed.data.name },
    });

    if (existingName) {
      return {
        success: false,
        fieldErrors: { name: ["Nama paket sudah digunakan, pilih nama lain."] },
      };
    }

    // Determine banner URL from primary media
    const primaryMedia = rawMedia.find((m) => m.isPrimary) || rawMedia[0];
    const bannerUrl = primaryMedia?.mediaUrl || null;

    // Execute atomic transaction for package, items, and media
    const newPackage = await prisma.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          pricePermalam: parsed.data.pricePermalam,
          pricePerkegiatan1: parsed.data.pricePerkegiatan1,
          pricePerkegiatan2: parsed.data.pricePerkegiatan2,
          isActive: parsed.data.isActive,
          bannerUrl,
        },
      });

      // Insert composition package_items
      await tx.packageItem.createMany({
        data: parsed.data.items.map((item) => ({
          packageId: pkg.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // Insert package_media
      if (rawMedia.length > 0) {
        await tx.packageMedia.createMany({
          data: rawMedia.map((m, idx) => ({
            packageId: pkg.id,
            mediaType: m.mediaType === "video" ? MediaType.video : MediaType.image,
            mediaUrl: m.mediaUrl,
            storagePath: m.storagePath,
            thumbnailUrl: m.thumbnailUrl || null,
            altText: m.altText || null,
            sortOrder: m.sortOrder ?? idx,
            isPrimary: idx === 0 || Boolean(m.isPrimary),
          })),
        });
      }

      // Record ActivityLog
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "PACKAGE_CREATED",
          entityName: "Package",
          entityId: pkg.id,
          newValue: JSON.stringify({
            name: pkg.name,
            itemsCount: parsed.data.items.length,
            pricePermalam: pkg.pricePermalam,
          }),
          description: `Membuat paket sewa baru: ${pkg.name} (${parsed.data.items.length} item produk)`,
        },
      });

      return pkg;
    });

    revalidatePath("/admin/dashboard/paket");
    return { success: true, data: newPackage };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat paket sewa.",
    };
  }
}

/**
 * AA-50 & AA-51: Update Rental Package with duration prices & items composition
 */
export async function updateRentalPackage(
  id: string,
  formData: FormData
): Promise<PackageActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const rawItems = formData.get("items") ? JSON.parse(formData.get("items") as string) : [];
    const rawMedia: RawMediaInput[] = formData.get("media")
      ? JSON.parse(formData.get("media") as string)
      : [];

    const rawData = {
      id,
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || undefined,
      pricePermalam: parseInt(formData.get("pricePermalam") as string, 10),
      pricePerkegiatan1: parseInt(formData.get("pricePerkegiatan1") as string, 10),
      pricePerkegiatan2: parseInt(formData.get("pricePerkegiatan2") as string, 10),
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
      items: rawItems,
    };

    const parsed = updatePackageSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const pkg = await prisma.package.findUnique({
      where: { id: parsed.data.id, deletedAt: null },
    });

    if (!pkg) {
      return { success: false, error: "Paket sewa tidak ditemukan." };
    }

    // Check duplicate name
    if (parsed.data.name !== pkg.name) {
      const duplicateName = await prisma.package.findUnique({
        where: { name: parsed.data.name },
      });
      if (duplicateName) {
        return {
          success: false,
          fieldErrors: { name: ["Nama paket sudah digunakan, pilih nama lain."] },
        };
      }
    }

    const primaryMedia = rawMedia.find((m) => m.isPrimary) || rawMedia[0];
    const bannerUrl = primaryMedia?.mediaUrl || pkg.bannerUrl;

    const updatedPackage = await prisma.$transaction(async (tx) => {
      // 1. Update Package base fields
      const updated = await tx.package.update({
        where: { id: parsed.data.id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description,
          pricePermalam: parsed.data.pricePermalam,
          pricePerkegiatan1: parsed.data.pricePerkegiatan1,
          pricePerkegiatan2: parsed.data.pricePerkegiatan2,
          isActive: parsed.data.isActive,
          bannerUrl,
        },
      });

      // 2. Re-sync package items: delete old items, insert updated list
      await tx.packageItem.deleteMany({
        where: { packageId: parsed.data.id },
      });

      await tx.packageItem.createMany({
        data: parsed.data.items.map((item) => ({
          packageId: parsed.data.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // 3. Re-sync package media if provided
      if (rawMedia.length > 0) {
        await tx.packageMedia.deleteMany({
          where: { packageId: parsed.data.id },
        });

        await tx.packageMedia.createMany({
          data: rawMedia.map((m, idx) => ({
            packageId: parsed.data.id,
            mediaType: m.mediaType === "video" ? MediaType.video : MediaType.image,
            mediaUrl: m.mediaUrl,
            storagePath: m.storagePath,
            thumbnailUrl: m.thumbnailUrl || null,
            altText: m.altText || null,
            sortOrder: m.sortOrder ?? idx,
            isPrimary: idx === 0 || Boolean(m.isPrimary),
          })),
        });
      }

      // Record ActivityLog
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "PACKAGE_UPDATED",
          entityName: "Package",
          entityId: updated.id,
          oldValue: JSON.stringify({ name: pkg.name, pricePermalam: pkg.pricePermalam }),
          newValue: JSON.stringify({ name: updated.name, pricePermalam: updated.pricePermalam }),
          description: `Memperbarui paket sewa: ${updated.name}`,
        },
      });

      return updated;
    });

    revalidatePath("/admin/dashboard/paket");
    return { success: true, data: updatedPackage };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui paket sewa.",
    };
  }
}

/**
 * AA-50: Delete Rental Package (Soft-delete or Hard-delete)
 */
export async function deleteRentalPackage(id: string): Promise<PackageActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = deletePackageSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: "ID paket tidak valid." };
    }

    const pkg = await prisma.package.findUnique({
      where: { id: parsed.data.id },
    });

    if (!pkg) {
      return { success: false, error: "Paket tidak ditemukan." };
    }

    // Always soft-delete package to maintain audit history & integrity
    await prisma.package.update({
      where: { id: parsed.data.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PACKAGE_DELETED",
        entityName: "Package",
        entityId: parsed.data.id,
        oldValue: JSON.stringify({ name: pkg.name }),
        description: `Menghapus paket sewa: ${pkg.name}`,
      },
    });

    revalidatePath("/admin/dashboard/paket");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus paket sewa.",
    };
  }
}

/**
 * AA-50: Toggle active status of a package
 */
export async function togglePackageStatus(
  id: string,
  isActive: boolean
): Promise<PackageActionResponse> {
  try {
    const { user } = await requireRole(["admin", "owner"]);

    const parsed = togglePackageStatusSchema.safeParse({ id, isActive });
    if (!parsed.success) {
      return { success: false, error: "Data status tidak valid." };
    }

    const updated = await prisma.package.update({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.isActive },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PACKAGE_STATUS_TOGGLED",
        entityName: "Package",
        entityId: id,
        newValue: String(parsed.data.isActive),
        description: `Mengubah status aktif paket ${updated.name} menjadi ${
          parsed.data.isActive ? "Aktif" : "Non-aktif"
        }`,
      },
    });

    revalidatePath("/admin/dashboard/paket");
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah status aktif paket.",
    };
  }
}
