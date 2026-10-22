"use client";

import { useState } from "react";
import { AdminSidebar, AdminMobileSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

export interface AdminShellProps {
  children: React.ReactNode;
  adminName?: string;
  adminRole?: string;
}

export function AdminShell({
  children,
  adminName,
  adminRole,
}: AdminShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden text-[#111827]">
      {/* ── Fixed Left Sidebar for Desktop ── */}
      <AdminSidebar adminName={adminName} adminRole={adminRole} />

      {/* ── Mobile Off-Canvas Drawer (< 1024px) ── */}
      <AdminMobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        adminName={adminName}
        adminRole={adminRole}
      />

      {/* ── Main Viewport Container ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <AdminHeader
          onMenuClick={() => setIsMobileOpen(true)}
          adminRole={adminRole}
        />

        {/* Scrollable Content Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
