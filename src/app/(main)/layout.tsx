import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/profile";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profileStatus = await getCurrentUserProfile();

  // Profile Gate: Jika user sudah login tapi profilnya belum lengkap
  if (profileStatus.isAuthenticated && !profileStatus.isProfileComplete) {
    redirect("/complete-profile");
  }

  return <>{children}</>;
}
