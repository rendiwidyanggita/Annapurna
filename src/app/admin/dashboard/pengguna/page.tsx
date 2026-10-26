import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { getUsersList } from "./actions";
import { UserManagementClient } from "./user-management-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Pengguna & Role — Admin ANNAPURNA",
};

interface UserPageProps {
  searchParams: Promise<{
    page?: string;
    role?: string;
    search?: string;
  }>;
}

export default async function UserManagementPage({ searchParams }: UserPageProps) {
  let authResult;
  try {
    authResult = await requireRole(["OWNER"]);
  } catch {
    redirect("/admin/dashboard");
  }

  const resolved = await searchParams;
  const page = resolved.page ? parseInt(resolved.page, 10) : 1;
  const role = resolved.role || "ALL";
  const search = resolved.search || "";

  const data = await getUsersList({
    page,
    limit: 20,
    role,
    search,
  });

  return (
    <UserManagementClient
      currentUserId={authResult.user.id}
      users={data.users}
      roles={data.roles}
      total={data.total}
      page={data.page}
      totalPages={data.totalPages}
      metrics={data.metrics}
      currentRole={role}
      currentSearch={search}
    />
  );
}
