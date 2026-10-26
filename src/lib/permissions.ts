/**
 * Matrix OQ-07: Single Source of Truth for Role Permissions
 * Defined in PRD Section 13 & Sprint 2/3 Governance.
 */

export type UserRoleName = "CUSTOMER" | "ADMIN" | "OWNER";

export interface PermissionFeature {
  module: string;
  feature: string;
  customer: boolean;
  admin: boolean;
  owner: boolean;
  description: string;
}

export const PERMISSION_MATRIX: PermissionFeature[] = [
  {
    module: "Katalog & Transaksi",
    feature: "Pemesanan & Checkout Sewa",
    customer: true,
    admin: true,
    owner: true,
    description: "Memilih unit/paket sewa, checkout, dan pembayaran DP.",
  },
  {
    module: "Operasional Toko",
    feature: "Proses Pickup, Return, & Denda",
    customer: false,
    admin: true,
    owner: true,
    description: "Serah terima barang di kasir, input kondisi kembali, dan denda manual.",
  },
  {
    module: "Katalog & Inventaris",
    feature: "Kelola Produk, Paket, & Unit Fisik",
    customer: false,
    admin: true,
    owner: true,
    description: "CRUD master produk, kategori, barcode inventaris, dan stok consumable.",
  },
  {
    module: "AI & Konten",
    feature: "Knowledge Base Chatbot AI",
    customer: false,
    admin: true,
    owner: true,
    description: "Mengelola FAQ pola pertanyaan dan jawaban panduan AI.",
  },
  {
    module: "Tata Kelola & Hukum",
    feature: "Editor Syarat & Ketentuan (S&K)",
    customer: false,
    admin: false,
    owner: true,
    description: "Membuat versi baru klausul hukum sewa dan snapshot terms.",
  },
  {
    module: "Pelaporan & Finansial",
    feature: "Laporan Omzet, DP, & Export Keuangan",
    customer: false,
    admin: false,
    owner: true,
    description: "Akses omzet kas toko, laporan Midtrans, dan export PDF/Excel finansial.",
  },
  {
    module: "Administrasi Sistem",
    feature: "Manajemen Pengguna & Role",
    customer: false,
    admin: false,
    owner: true,
    description: "Promosi role (Admin/Owner), penonaktifan akun, dan ban security.",
  },
  {
    module: "Audit Trail",
    feature: "Activity Log Explorer & Purging",
    customer: false,
    admin: false,
    owner: true,
    description: "Memeriksa jejak audit atomik dan konfigurasi retensi data.",
  },
];
