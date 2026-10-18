import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User, Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message: string = "Belum login atau sesi telah berakhir") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Tidak memiliki akses untuk aksi ini") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type AllowedRole = "admin" | "owner" | "ADMIN" | "OWNER" | "customer" | "CUSTOMER";

export interface RequireRoleResult {
  user: User & { role?: Role | null };
  role: string;
}

/**
 * Shared Authorization Helper (PRD 13 / Plan v2)
 *
 * Enforces role-based access control inside Server Actions.
 * Queries Supabase Auth and database Prisma User/Role directly.
 * Always call this as the very first statement in every Server Action.
 */
export async function requireRole(
  allowedRoles: AllowedRole[] = ["admin", "owner"]
): Promise<RequireRoleResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new UnauthorizedError("Belum login atau sesi telah berakhir.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      role: true,
    },
  });

  if (!dbUser || !dbUser.isActive) {
    throw new UnauthorizedError("Akun pengguna tidak ditemukan atau dinonaktifkan.");
  }

  const userRole = dbUser.role?.name ?? "";
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  if (!normalizedAllowed.includes(userRole.toUpperCase())) {
    throw new ForbiddenError("Anda tidak memiliki izin untuk melakukan aksi ini.");
  }

  return { user: dbUser, role: userRole };
}
