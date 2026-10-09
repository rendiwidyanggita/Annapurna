import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { Navbar } from "@/components/layouts/navbar";
import { Footer } from "@/components/layouts/footer";

/**
 * MainLayout — Shell layout for all customer-facing pages.
 *
 * Next.js App Router best practice (context7):
 * - Layout is a Server Component by default.
 * - Navbar and Footer live here so they persist across all (main) routes
 *   without re-mounting on navigation — no duplicate code in page files.
 * - Profile gate redirect happens server-side before rendering children.
 *
 * Structure: Navbar (sticky top) → <main flex-1> → Footer
 */
export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profileStatus = await getCurrentUserProfile();

  // Profile Gate: redirect to profile completion if logged in but incomplete
  if (profileStatus.isAuthenticated && !profileStatus.isProfileComplete) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
