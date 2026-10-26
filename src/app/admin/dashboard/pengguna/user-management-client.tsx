"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { PERMISSION_MATRIX } from "@/lib/permissions";
import { updateUserRoleAction, toggleUserStatusAction } from "./actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  SecurityCheckIcon,
  AlertCircleIcon,
  FilterIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface UserItem {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date | string;
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

interface RoleItem {
  id: string;
  name: string;
}

interface UserManagementClientProps {
  currentUserId: string;
  users: UserItem[];
  roles: RoleItem[];
  total: number;
  page: number;
  totalPages: number;
  metrics: {
    totalOwners: number;
    totalAdmins: number;
    totalCustomers: number;
  };
  currentRole: string;
  currentSearch: string;
}

export function UserManagementClient({
  currentUserId,
  users,
  roles,
  total,
  page,
  totalPages,
  metrics,
  currentRole,
  currentSearch,
}: UserManagementClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [roleInput, setRoleInput] = useState(currentRole);
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  const [selectedUserForRole, setSelectedUserForRole] = useState<UserItem | null>(null);
  const [newRoleId, setNewRoleId] = useState<string>("");

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (roleInput && roleInput !== "ALL") params.set("role", roleInput);
    else params.delete("role");
    if (searchInput.trim()) params.set("search", searchInput.trim());
    else params.delete("search");
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/dashboard/pengguna?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setRoleInput("ALL");
    setSearchInput("");
    const params = new URLSearchParams();
    startTransition(() => {
      router.push(`/admin/dashboard/pengguna?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/admin/dashboard/pengguna?${params.toString()}`);
    });
  };

  const handleToggleStatus = (u: UserItem) => {
    if (u.id === currentUserId) {
      toast.error("Anda tidak dapat menonaktifkan akun Anda sendiri.");
      return;
    }
    const actionName = u.isActive ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Apakah Anda yakin ingin ${actionName} akun "${u.email}"?`)) return;

    startTransition(async () => {
      try {
        await toggleUserStatusAction(u.id);
        toast.success(`Akun ${u.email} berhasil di-${actionName}.`);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal mengubah status akun.";
        toast.error(msg);
      }
    });
  };

  const handleSaveRole = () => {
    if (!selectedUserForRole || !newRoleId) return;
    if (selectedUserForRole.id === currentUserId) {
      toast.error("Anda tidak dapat mengubah role akun Anda sendiri.");
      return;
    }

    startTransition(async () => {
      try {
        await updateUserRoleAction(selectedUserForRole.id, newRoleId);
        toast.success(`Role untuk ${selectedUserForRole.email} berhasil diperbarui.`);
        setSelectedUserForRole(null);
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memperbarui role.";
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Manajemen Pengguna & Hak Akses (AA-96 & AA-97)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kontrol otorisasi peran Customer, Admin, dan Owner dengan perlindungan Last-Owner Guard.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMatrixModal(true)}
          className="h-9 text-xs border-[#16624B] text-[#16624B] hover:bg-[#E7F3EE] font-semibold flex items-center gap-2 shrink-0"
        >
          <HugeiconsIcon icon={SecurityCheckIcon} size={15} />
          <span>Matriks Izin OQ-07</span>
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminKpiCard
          label="Owner Aktif"
          value={metrics.totalOwners}
          icon={SecurityCheckIcon}
          iconColorVariant="emerald"
          subtext="Pemilik toko & pengambil keputusan"
        />
        <AdminKpiCard
          label="Staff Admin Aktif"
          value={metrics.totalAdmins}
          icon={UserIcon}
          iconColorVariant="blue"
          subtext="Operasional kasir & inventaris"
        />
        <AdminKpiCard
          label="Total Customer Terdaftar"
          value={metrics.totalCustomers}
          icon={UserIcon}
          iconColorVariant="neutral"
          subtext="Pelanggan rental terdaftar"
        />
      </div>

      {/* ── Filter Toolbar ── */}
      <form
        onSubmit={handleApplyFilter}
        className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Filter Peran / Role
          </label>
          <select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] bg-white"
          >
            <option value="ALL">Semua Peran</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
            Pencarian Akun
          </label>
          <input
            type="text"
            placeholder="Cari email, nama lengkap, atau nomor telepon..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 h-8 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-medium flex items-center justify-center gap-1.5"
          >
            <HugeiconsIcon icon={FilterIcon} size={14} />
            <span>{isPending ? "Menyaring..." : "Saring"}</span>
          </Button>
          {(roleInput !== "ALL" || searchInput) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-8 text-xs border-gray-300 text-gray-600"
            >
              Reset
            </Button>
          )}
        </div>
      </form>

      {/* ── User Table Card ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-4">Kontak Telepon</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4 text-center">Transaksi</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi Tata Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="font-semibold text-gray-700 mb-1">Pengguna tidak ditemukan</p>
                    <p className="text-[11px]">Coba sesuaikan kata kunci pencarian atau filter peran.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {u.profile?.fullName || u.email.split("@")[0]}
                              {isCurrent && (
                                <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-[#16624B] font-bold">
                                  Anda
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 tabular-nums">
                        {u.profile?.phoneNumber || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.role.name === "OWNER"
                              ? "bg-purple-100 text-purple-700"
                              : u.role.name === "ADMIN"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-gray-700 tabular-nums">
                        {u._count.transactions}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {u.isActive ? "Aktif" : "Non-aktif"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCurrent || isPending}
                            onClick={() => {
                              setSelectedUserForRole(u);
                              setNewRoleId(u.role.id);
                            }}
                            className="h-7 text-[11px] px-2 font-semibold text-gray-700 hover:text-gray-900 border-gray-300"
                          >
                            Ubah Role
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCurrent || isPending}
                            onClick={() => handleToggleStatus(u)}
                            className={`h-7 text-[11px] px-2 font-semibold border ${
                              u.isActive
                                ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-500">
            <span>
              Menampilkan halaman <strong className="text-gray-900">{page}</strong> dari{" "}
              <strong className="text-gray-900">{totalPages}</strong> (Total {total} akun)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                onClick={() => handlePageChange(page - 1)}
                className="h-7 text-xs"
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isPending}
                onClick={() => handlePageChange(page + 1)}
                className="h-7 text-xs"
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Role Modal Dialog ── */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Ubah Peran (Role) Pengguna</h3>
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-gray-500">Target Akun:</p>
                <p className="font-bold text-gray-900 text-sm">{selectedUserForRole.email}</p>
                <p className="text-gray-500 mt-0.5">
                  Role Saat Ini: <strong className="text-gray-800">{selectedUserForRole.role.name}</strong>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                  Pilih Peran Baru:
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#16624B] bg-white font-medium"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                <HugeiconsIcon icon={InformationCircleIcon} size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Perubahan role akan segera berdampak pada hak akses saat pengguna memuat ulang halaman.
                  Sistem melarang penurunan peran jika akun tersebut adalah Owner aktif terakhir.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUserForRole(null)}
                className="h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isPending || newRoleId === selectedUserForRole.role.id}
                onClick={handleSaveRole}
                className="h-8 text-xs bg-[#16624B] hover:bg-[#0F4F3C] text-white font-semibold"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Matrix OQ-07 Modal Dialog ── */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-[#16624B]" />
                  <span>Matriks Hak Akses Peran (OQ-07 Standard)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Single Source of Truth pembagian wewenang peran Customer, Admin, dan Owner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Modul</th>
                    <th className="py-3 px-4">Fitur & Wewenang</th>
                    <th className="py-3 px-3 text-center">Customer</th>
                    <th className="py-3 px-3 text-center">Staff Admin</th>
                    <th className="py-3 px-3 text-center">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {PERMISSION_MATRIX.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-900">{item.module}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{item.feature}</p>
                        <p className="text-[11px] text-gray-500">{item.description}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.customer ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-[#16624B] font-bold text-xs leading-5">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-400 font-bold text-xs leading-5">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.admin ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-[#16624B] font-bold text-xs leading-5">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-400 font-bold text-xs leading-5">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.owner ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-emerald-100 text-[#16624B] font-bold text-xs leading-5">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-full bg-gray-100 text-gray-400 font-bold text-xs leading-5">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMatrixModal(false)}
                className="h-8 text-xs font-semibold"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
