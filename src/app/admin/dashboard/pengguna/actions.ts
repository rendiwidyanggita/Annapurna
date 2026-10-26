"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";
import { logActivity } from "@/lib/services/audit-log";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UserManagementItem {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  role: { id: string; name: string };
  profile?: {
    fullName: string | null;
    phoneNumber: string | null;
    address: string | null;
  } | null;
  _count: {
    transactions: number;
  };
}

export async function getUsersList({
  page = 1,
  limit = 20,
  role = "ALL",
  search = "",
}: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
} = {}) {
  await requireRole(["OWNER"]);

  const skip = (page - 1) * limit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (role && role !== "ALL") {
    where.role = { name: role };
  }

  if (search && search.trim().length > 0) {
    const trimmed = search.trim();
    where.OR = [
      { email: { contains: trimmed, mode: "insensitive" } },
      { profile: { fullName: { contains: trimmed, mode: "insensitive" } } },
      { profile: { phoneNumber: { contains: trimmed, mode: "insensitive" } } },
    ];
  }

  const [total, users, roles, ownerCount, adminCount, customerCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        role: { select: { id: true, name: true } },
        profile: { select: { fullName: true, phoneNumber: true, address: true } },
        _count: { select: { transactions: true } },
      },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.user.count({ where: { role: { name: "OWNER" }, isActive: true } }),
    prisma.user.count({ where: { role: { name: "ADMIN" }, isActive: true } }),
    prisma.user.count({ where: { role: { name: "CUSTOMER" } } }),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    roles,
    metrics: {
      totalOwners: ownerCount,
      totalAdmins: adminCount,
      totalCustomers: customerCount,
    },
  };
}

export async function updateUserRoleAction(targetUserId: string, newRoleId: string) {
  const { user: currentUser } = await requireRole(["OWNER"]);

  // 1. Self demotion guard
  if (targetUserId === currentUser.id) {
    throw new Error("Anda tidak dapat mengubah role akun Anda sendiri.");
  }

  return await prisma.$transaction(async (tx) => {
    const targetUser = await tx.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!targetUser) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    const newRole = await tx.role.findUnique({
      where: { id: newRoleId },
    });

    if (!newRole) {
      throw new Error("Role tujuan tidak valid.");
    }

    // 2. Last-Owner Guard
    if (targetUser.role?.name === "OWNER" && newRole.name !== "OWNER") {
      const activeOwners = await tx.user.count({
        where: {
          role: { name: "OWNER" },
          isActive: true,
        },
      });

      if (activeOwners <= 1) {
        throw new Error(
          "Tidak dapat mendemosi Owner terakhir. Sistem wajib memiliki minimal 1 Owner aktif."
        );
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: { roleId: newRoleId },
      include: { role: true },
    });

    await logActivity(tx, {
      userId: currentUser.id,
      action: "USER_ROLE_CHANGED",
      entityName: "User",
      entityId: targetUserId,
      oldValue: { role: targetUser.role?.name },
      newValue: { role: newRole.name },
      description: `Mengubah role ${targetUser.email} dari ${targetUser.role?.name} menjadi ${newRole.name}`,
    });

    revalidatePath("/admin/dashboard/pengguna");
    return { success: true, updatedUser };
  });
}

export async function toggleUserStatusAction(targetUserId: string) {
  const { user: currentUser } = await requireRole(["OWNER"]);

  // 1. Self deactivation guard
  if (targetUserId === currentUser.id) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
  }

  return await prisma.$transaction(async (tx) => {
    const targetUser = await tx.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!targetUser) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    const nextStatus = !targetUser.isActive;

    // 2. Last-Owner Guard
    if (targetUser.role?.name === "OWNER" && !nextStatus) {
      const activeOwners = await tx.user.count({
        where: {
          role: { name: "OWNER" },
          isActive: true,
        },
      });

      if (activeOwners <= 1) {
        throw new Error(
          "Tidak dapat menonaktifkan Owner terakhir. Sistem wajib memiliki minimal 1 Owner aktif."
        );
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: targetUserId },
      data: { isActive: nextStatus },
      include: { role: true },
    });

    await logActivity(tx, {
      userId: currentUser.id,
      action: nextStatus ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entityName: "User",
      entityId: targetUserId,
      oldValue: { isActive: targetUser.isActive },
      newValue: { isActive: nextStatus },
      description: `${nextStatus ? "Mengaktifkan kembali" : "Menonaktifkan"} akun pengguna: ${targetUser.email}`,
    });

    // 3. Supabase Auth Ban if deactivated
    if (!nextStatus) {
      try {
        const supabaseAdmin = createAdminClient();
        if (supabaseAdmin) {
          // Ban for 100 years
          await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
            ban_duration: "876000h",
          });
        }
      } catch (err) {
        console.warn("[USER DEACTIVATE] Gagal mem-ban user di Supabase Auth:", err);
      }
    } else {
      try {
        const supabaseAdmin = createAdminClient();
        if (supabaseAdmin) {
          // Unban user
          await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
            ban_duration: "none",
          });
        }
      } catch (err) {
        console.warn("[USER ACTIVATE] Gagal meng-unban user di Supabase Auth:", err);
      }
    }

    revalidatePath("/admin/dashboard/pengguna");
    return { success: true, updatedUser };
  });
}
