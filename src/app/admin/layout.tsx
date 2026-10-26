import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { AdminShell } from "@/components/layouts";

/**
 * AdminLayout — Shell layout for all admin and owner routes.
 *
 * Architecture:
 * - Server Component: fetches user and authoritative DB role server-side.
 * - Double-guards access beyond middleware:
 *   1. Middleware checks authentication edge-level
 *   2. Layout verifies role in database, preventing JWT role tampering
 * - AdminShell is a Client Component managing the responsive desktop/mobile drawer and sticky header.
 *
 * Route: /admin/* → src/app/admin/...
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profileStatus = await getCurrentUserProfile();

  // Not authenticated → redirect to login
  if (!profileStatus.isAuthenticated || !profileStatus.user) {
    redirect("/login");
  }

  // Deactivated user check (AA-96 / Security Patch)
  if (!profileStatus.user.isActive) {
    redirect("/login?error=Akun+Anda+telah+dinonaktifkan");
  }
  const roleName: string = profileStatus.user.role?.name ?? "";

  // Not admin/owner → redirect to home
  if (roleName !== "ADMIN" && roleName !== "OWNER") {
    redirect("/");
  }

  const adminName =
    profileStatus.profile?.fullName ||
    profileStatus.user.email.split("@")[0] ||
    "Admin";

  return (
    <AdminShell adminName={adminName} adminRole={roleName}>
      {children}
    </AdminShell>
  );
}
