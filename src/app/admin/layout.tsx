import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { AdminSidebar } from "@/components/layouts/admin-sidebar";

/**
 * AdminLayout — Shell layout for all admin/owner pages.
 *
 * Next.js App Router pattern (context7):
 * - Server Component: fetches user server-side, no client bundle overhead
 * - Double-guards admin access beyond middleware:
 *   1. Middleware (proxy.ts) checks only authentication — fast, at edge
 *   2. Layout checks role via DB — authoritative, prevents JWT claim tampering
 * - AdminSidebar is a Client Component (needs usePathname) composed here
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

  const roleName: string = profileStatus.user.role?.name ?? "";

  // Not admin/owner → redirect to home
  if (roleName !== "ADMIN" && roleName !== "OWNER") {
    redirect("/");
  }

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      {/* ── Sidebar — fixed left ── */}
      <AdminSidebar
        adminName={profileStatus.profile?.fullName ?? profileStatus.user.email}
        adminRole={roleName}
      />

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-[var(--color-border)] bg-white flex items-center px-6 shrink-0">
          <h1 className="text-sm font-semibold text-[var(--color-muted)]">
            ANNAPURNA Admin Panel
          </h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
