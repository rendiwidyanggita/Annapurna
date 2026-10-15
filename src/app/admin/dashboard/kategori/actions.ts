"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type DeleteCategoryInput,
} from "@/schemas/category";

export type CategoryActionState = {
  error?: string;
  success?: string;
};

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }
    const roleName = profileStatus.user.role?.name;
    if (roleName !== "ADMIN" && roleName !== "OWNER") {
      return { error: "Tidak memiliki akses untuk membuat kategori." };
    }

    const rawData: CreateCategoryInput = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    };

    const validated = createCategorySchema.safeParse(rawData);
    if (!validated.success) {
      return { error: validated.error.errors[0]?.message ?? "Data tidak valid" };
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name: validated.data.name },
    });
    if (existingCategory) {
      return { error: "Nama kategori sudah digunakan. Pilih nama yang berbeda." };
    }

    await prisma.category.create({
      data: {
        name: validated.data.name,
        description: validated.data.description || null,
        isActive: validated.data.isActive,
      },
    });

    revalidatePath("/admin/dashboard/kategori");
    return { success: "Kategori berhasil dibuat" };
  } catch (error) {
    console.error("Error creating category:", error);
    return { error: "Terjadi kesalahan saat membuat kategori. Coba lagi nanti." };
  }
}

export async function updateCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }
    const roleName = profileStatus.user.role?.name;
    if (roleName !== "ADMIN" && roleName !== "OWNER") {
      return { error: "Tidak memiliki akses untuk mengedit kategori." };
    }

    const rawData: UpdateCategoryInput = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    };

    const validated = updateCategorySchema.safeParse(rawData);
    if (!validated.success) {
      return { error: validated.error.errors[0]?.message ?? "Data tidak valid" };
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: validated.data.id },
    });
    if (!existingCategory) {
      return { error: "Kategori tidak ditemukan." };
    }

    if (validated.data.name !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: validated.data.name },
      });
      if (nameConflict) {
        return { error: "Nama kategori sudah digunakan. Pilih nama yang berbeda." };
      }
    }

    await prisma.category.update({
      where: { id: validated.data.id },
      data: {
        name: validated.data.name,
        description: validated.data.description || null,
        isActive: validated.data.isActive,
      },
    });

    revalidatePath("/admin/dashboard/kategori");
    return { success: "Kategori berhasil diperbarui" };
  } catch (error) {
    console.error("Error updating category:", error);
    return { error: "Terjadi kesalahan saat memperbarui kategori. Coba lagi nanti." };
  }
}

export async function deleteCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  try {
    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return { error: "Sesi telah berakhir. Silakan login kembali." };
    }
    const roleName = profileStatus.user.role?.name;
    if (roleName !== "ADMIN" && roleName !== "OWNER") {
      return { error: "Tidak memiliki akses untuk menghapus kategori." };
    }

    const rawData: DeleteCategoryInput = {
      id: formData.get("id") as string,
    };

    const validated = deleteCategorySchema.safeParse(rawData);
    if (!validated.success) {
      return { error: validated.error.errors[0]?.message ?? "Data tidak valid" };
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: validated.data.id },
      include: {
        products: { where: { deletedAt: null } },
      },
    });
    if (!existingCategory) {
      return { error: "Kategori tidak ditemukan." };
    }

    if (existingCategory.products.length > 0) {
      return {
        error: `Tidak dapat menghapus kategori "${existingCategory.name}" karena masih memiliki ${existingCategory.products.length} produk aktif. Hapus atau pindahkan produk terlebih dahulu.`,
      };
    }

    await prisma.category.delete({ where: { id: validated.data.id } });

    revalidatePath("/admin/dashboard/kategori");
    return { success: `Kategori "${existingCategory.name}" berhasil dihapus` };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: "Terjadi kesalahan saat menghapus kategori. Coba lagi nanti." };
  }
}

export async function getCategories() {
  try {
    const profileStatus = await getCurrentUserProfile();
    if (!profileStatus.isAuthenticated || !profileStatus.user) {
      return [];
    }
    const roleName = profileStatus.user.role?.name;
    if (roleName !== "ADMIN" && roleName !== "OWNER") {
      return [];
    }

    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
