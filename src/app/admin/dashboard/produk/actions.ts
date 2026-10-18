"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  transformProductFormData,
} from "@/schemas/product";
import {
  uploadProductMedia,
  replaceProductMedia,
  deleteProductMedia,
} from "@/lib/storage";

export type ProductActionState = {
  error?: string;
  success?: string;
  productId?: string;
};

/**
 * Check if the current user has ADMIN or OWNER privileges.
 */
async function checkAdminAuthorization() {
  const profileStatus = await getCurrentUserProfile();
  if (!profileStatus.isAuthenticated || !profileStatus.user) {
    return { authorized: false, error: "Sesi telah berakhir. Silakan login kembali." };
  }
  const roleName = profileStatus.user.role?.name;
  if (roleName !== "ADMIN" && roleName !== "OWNER") {
    return { authorized: false, error: "Tidak memiliki hak akses untuk tindakan ini." };
  }
  return { authorized: true, user: profileStatus.user };
}

/**
 * Create a new product with duration pricing, variants, and optional primary media.
 * (Fulfills AA-44, AA-54, AA-46)
 */
export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try {
    const authCheck = await checkAdminAuthorization();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    const rawData = transformProductFormData(formData);
    const validated = createProductSchema.safeParse(rawData);

    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message ?? "Data produk tidak valid";
      return { error: firstError };
    }

    const {
      name,
      description,
      categoryId,
      itemType,
      pricePermalam,
      pricePerkegiatan1,
      pricePerkegiatan2,
      consumableStock,
      isReusable,
      isActive,
      imageUrl,
      variants,
    } = validated.data;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return { error: "Kategori yang dipilih tidak ditemukan." };
    }

    // Process optional uploaded media file
    const mediaFile = formData.get("mediaFile") as File | null;
    let uploadedMedia: { url: string; storagePath: string; mediaType: "image" | "video" } | null = null;
    if (mediaFile && mediaFile instanceof File && mediaFile.size > 0) {
      try {
        uploadedMedia = await uploadProductMedia(mediaFile);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal mengunggah berkas media";
        return { error: msg };
      }
    }

    // Execute atomic creation
    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description: description || null,
          categoryId,
          itemType,
          pricePermalam,
          pricePerkegiatan1,
          pricePerkegiatan2,
          consumableStock: itemType === "consumable" ? consumableStock : 0,
          isReusable: itemType === "consumable" ? isReusable : true,
          isActive,
        },
      });

      // Handle variants (AA-46): If custom variants are provided, create them;
      // otherwise, automatically create 1 default variant to maintain relational integrity for inventory units
      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v) => ({
            productId: product.id,
            variantName: v.variantName,
            size: v.size || null,
            color: v.color || null,
            brand: v.brand || null,
            isActive: true,
          })),
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: product.id,
            variantName: "Default",
            isActive: true,
          },
        });
      }

      // Handle primary image/video if provided via file upload or initial URL
      const finalMediaUrl = uploadedMedia?.url || imageUrl;
      const finalStoragePath = uploadedMedia?.storagePath || imageUrl;
      const finalMediaType = uploadedMedia?.mediaType || "image";

      if (finalMediaUrl) {
        await tx.productMedia.create({
          data: {
            productId: product.id,
            mediaType: finalMediaType,
            mediaUrl: finalMediaUrl,
            storagePath: finalStoragePath || finalMediaUrl,
            isPrimary: true,
            sortOrder: 0,
            altText: name,
          },
        });
      }

      return product;
    });

    revalidatePath("/admin/dashboard/produk");
    revalidatePath("/katalog");

    return {
      success: `Produk "${createdProduct.name}" berhasil ditambahkan.`,
      productId: createdProduct.id,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: "Terjadi kesalahan pada server saat menambahkan produk." };
  }
}

/**
 * Update an existing product, duration pricing, and synchronize variants.
 */
export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try {
    const authCheck = await checkAdminAuthorization();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    const rawData = transformProductFormData(formData);
    const validated = updateProductSchema.safeParse({
      ...rawData,
      id: productId,
    });

    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message ?? "Data produk tidak valid";
      return { error: firstError };
    }

    const {
      name,
      description,
      categoryId,
      itemType,
      pricePermalam,
      pricePerkegiatan1,
      pricePerkegiatan2,
      consumableStock,
      isReusable,
      isActive,
      imageUrl,
      variants,
    } = validated.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, media: true },
    });

    if (!existingProduct || existingProduct.deletedAt) {
      return { error: "Produk tidak ditemukan atau telah dihapus." };
    }

    // Process optional uploaded media file
    const mediaFile = formData.get("mediaFile") as File | null;
    let uploadedMedia: { url: string; storagePath: string; mediaType: "image" | "video" } | null = null;
    if (mediaFile && mediaFile instanceof File && mediaFile.size > 0) {
      const oldPrimaryMedia = existingProduct.media.find((m) => m.isPrimary) || existingProduct.media[0];
      try {
        uploadedMedia = await replaceProductMedia(oldPrimaryMedia?.storagePath, mediaFile);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal mengunggah berkas media";
        return { error: msg };
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update core product info
      await tx.product.update({
        where: { id: productId },
        data: {
          name,
          description: description || null,
          categoryId,
          itemType,
          pricePermalam,
          pricePerkegiatan1,
          pricePerkegiatan2,
          consumableStock: itemType === "consumable" ? consumableStock : 0,
          isReusable: itemType === "consumable" ? isReusable : true,
          isActive,
        },
      });

      // 2. Synchronize variants (AA-46)
      if (variants && variants.length > 0) {
        // Remove variants that no longer exist (if they don't have active rental units)
        const incomingNames = new Set(variants.map((v) => v.variantName.toLowerCase()));
        for (const existingVar of existingProduct.variants) {
          if (!incomingNames.has(existingVar.variantName.toLowerCase())) {
            // Check if variant has inventory units
            const unitCount = await tx.inventoryUnit.count({
              where: { variantId: existingVar.id, deletedAt: null },
            });
            if (unitCount === 0) {
              await tx.productVariant.delete({ where: { id: existingVar.id } });
            } else {
              // Soft deactivate instead
              await tx.productVariant.update({
                where: { id: existingVar.id },
                data: { isActive: false },
              });
            }
          }
        }

        // Upsert incoming variants
        for (const v of variants) {
          const match = existingProduct.variants.find(
            (ev) => ev.variantName.toLowerCase() === v.variantName.toLowerCase()
          );
          if (match) {
            await tx.productVariant.update({
              where: { id: match.id },
              data: {
                size: v.size || null,
                color: v.color || null,
                brand: v.brand || null,
                isActive: true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId,
                variantName: v.variantName,
                size: v.size || null,
                color: v.color || null,
                brand: v.brand || null,
                isActive: true,
              },
            });
          }
        }
      } else {
        // If variants toggle disabled, ensure at least one default variant exists
        const hasDefault = existingProduct.variants.some(
          (v) => v.variantName.toLowerCase() === "default"
        );
        if (!hasDefault && existingProduct.variants.length === 0) {
          await tx.productVariant.create({
            data: {
              productId,
              variantName: "Default",
              isActive: true,
            },
          });
        }
      }

      // 3. Update primary media if a new file was uploaded or url provided
      const finalMediaUrl = uploadedMedia?.url || imageUrl;
      const finalStoragePath = uploadedMedia?.storagePath || imageUrl;
      const finalMediaType = uploadedMedia?.mediaType || "image";

      if (finalMediaUrl) {
        const primaryMedia = existingProduct.media.find((m) => m.isPrimary);
        if (primaryMedia) {
          await tx.productMedia.update({
            where: { id: primaryMedia.id },
            data: {
              mediaType: finalMediaType,
              mediaUrl: finalMediaUrl,
              storagePath: finalStoragePath || finalMediaUrl,
              altText: name,
            },
          });
        } else {
          await tx.productMedia.create({
            data: {
              productId,
              mediaType: finalMediaType,
              mediaUrl: finalMediaUrl,
              storagePath: finalStoragePath || finalMediaUrl,
              isPrimary: true,
              sortOrder: 0,
              altText: name,
            },
          });
        }
      }
    });

    revalidatePath("/admin/dashboard/produk");
    revalidatePath(`/admin/dashboard/produk/${productId}/edit`);
    revalidatePath("/katalog");
    revalidatePath(`/katalog/${productId}`);

    return {
      success: `Produk "${name}" berhasil diperbarui.`,
      productId,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return { error: "Terjadi kesalahan pada server saat memperbarui produk." };
  }
}

/**
 * Toggle product active status directly from table.
 */
export async function toggleProductStatus(productId: string): Promise<ProductActionState> {
  try {
    const authCheck = await checkAdminAuthorization();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.deletedAt) {
      return { error: "Produk tidak ditemukan." };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    });

    revalidatePath("/admin/dashboard/produk");
    revalidatePath("/katalog");

    return {
      success: `Status produk "${updated.name}" berhasil diubah menjadi ${
        updated.isActive ? "Aktif" : "Nonaktif"
      }.`,
    };
  } catch (error) {
    console.error("Error toggling product status:", error);
    return { error: "Gagal memperbarui status produk." };
  }
}

/**
 * Soft delete a product.
 * Verifies that the product doesn't have active units in non-terminal rentals.
 */
export async function deleteProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  try {
    const authCheck = await checkAdminAuthorization();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    const id = formData.get("id") as string;
    const validated = deleteProductSchema.safeParse({ id });

    if (!validated.success) {
      return { error: "ID produk tidak valid." };
    }

    const product = await prisma.product.findUnique({
      where: { id: validated.data.id },
      include: {
        media: true,
        variants: {
          include: {
            units: {
              where: {
                unitStatus: {
                  in: ["Reserved", "Rented"],
                },
              },
            },
          },
        },
      },
    });

    if (!product || product.deletedAt) {
      return { error: "Produk tidak ditemukan." };
    }

    // Check for active rented/reserved units
    const activeUnits = product.variants.flatMap((v) => v.units);
    if (activeUnits.length > 0) {
      return {
        error: `Tidak dapat menghapus produk. Terdapat ${activeUnits.length} unit yang sedang dalam status Reserved atau Sedang Disewa.`,
      };
    }

    // Clean up physical media files in storage (batch remove)
    if (product.media && product.media.length > 0) {
      const storagePaths = product.media.map((m) => m.storagePath).filter(Boolean);
      try {
        await deleteProductMedia(storagePaths);
      } catch (err) {
        console.warn("[PRODUCT DELETE] Gagal membersihkan media dari storage:", err);
      }
    }

    // Execute soft delete
    await prisma.product.update({
      where: { id: validated.data.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/admin/dashboard/produk");
    revalidatePath("/katalog");

    return { success: `Produk "${product.name}" berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: "Terjadi kesalahan pada server saat menghapus produk." };
  }
}
