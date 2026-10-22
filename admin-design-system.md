# Admin Dashboard Design System & Refactoring Guide — ANNAPURNA Adventure

Dokumen ini adalah suplemen teknis dari `Design.md` dan `PRD.md` yang dikhususkan untuk **Refactoring UI Admin Dashboard (Sprint 1 & 2)** serta **Implementasi Halaman Baru Admin (Sprint 3)**.

Referensi Visual Ground Truth (HTML Prototypes):
1. **Archetype A — List & Data Table View** (`admin-katalog-unit.html` / Adaptasi *Salesai*)
2. **Archetype B — Modular Form View** (`admin-tambah-produk-kusale.html` / Adaptasi *Kusale*)
3. **Archetype C — Interactive Detail & Matrix View** (`admin-detail-variasi-salessync.html` / Adaptasi *SalesSync*)

---

## 1. Prinsip Utilitarian Admin UI
- **Desktop-First with Mobile Usability (TDD-005):** Admin bekerja dominan di layar desktop/tablet toko (`1024px+` dan `1366px+`), namun seluruh halaman tetap wajib *usable* tanpa *broken layout* di layar mobile (`360px+`) menggunakan *off-canvas drawer* dan *horizontal table scroll*.
- **Compact & Action-Oriented:** Berbeda dengan halaman Customer yang *spacious*, halaman Admin menggunakan densitas kompak agar informasi tabel (kode unit, 3 skema harga durasi, status pembayaran, tanggal sewa) terlihat dalam satu pandangan tanpa *scrolling* berlebihan.
- **Anti "AI Slop" & Ratio 70/20/10 (TDD-004):**
  - **70% Surface Putih (`#FFFFFF`)** untuk kartu, tabel, sidebar, dan form.
  - **20% Neutral Gray (`#F9FAFB` background halaman, `#E5E7EB` border tipis `1px`)** untuk pemisah struktur.
  - **10% Brand Green (`#16624B` Primary, `#0F4F3C` Hover, `#E7F3EE` Soft Accent)** khusus untuk CTA utama, *active state* navigasi, dan indikator terpilih.

---

## 2. Tipografi & Keterbacaan Data Numerik
- **Font Family:** `Manrope` (weights: `400`, `500`, `600`, `700`).
- **Aturan Wajib `tabular-nums`:** Seluruh elemen yang menampilkan harga (`Rp`), nominal DP/pelunasan/denda, kuantitas stok, persentase, tanggal sewa, serta kode inventaris (`TND-001`, `TRX-...`) **WAJIB** menggunakan class `tabular-nums` (`font-variant-numeric: tabular-nums`).
- **Kode Unik & ID:** Gunakan kombinasi `font-mono text-xs font-semibold tabular-nums` pada `inventory_code` dan `transaction_code` agar mudah dipindai mata saat proses *pickup/return*.
- **Skala Teks Admin:**
  - Judul Halaman (Top Header): `text-lg font-bold text-[#111827]`
  - Judul Card / Section: `text-base font-bold text-[#111827]`
  - Sub-deskripsi Card: `text-xs text-[#6B7280]`
  - Label Form & Filter: `text-xs font-semibold text-[#111827]` atau `text-[#6B7280]`
  - Isi Tabel (Cell): `text-sm text-[#111827]`
  - Header Tabel (`<th>`): `text-xs font-semibold uppercase tracking-wider text-[#6B7280]`

---

## 3. Global Admin Shell (`src/app/admin/layout.tsx`)

### 3.1 Admin Sidebar (`AdminSidebar`)
- **Dimensi:** Lebar tetap `w-64` (`256px`) pada layar `lg:` ke atas; berubah menjadi *Sheet / Drawer* (`shadcn/ui Sheet`) pada layar `< 1024px`.
- **Header Sidebar:** Tinggi `h-16` (`64px`), border bawah `border-[#E5E7EB]`, memuat SVG Logo ANNAPURNA Adventure, teks nama brand, dan badge role (`ADMIN` / `OWNER`).
- **Pengelompokan Menu (Sesuai PRD Section 16.15 & OQ-07):**
  1. **Grup Operasional:**
     - Dashboard Ringkasan (`/admin/dashboard`)
     - Transaksi Penyewaan (`/admin/dashboard/transaksi`) — mencakup Pickup, Return, Pelunasan, & Denda
  2. **Grup Katalog & Inventaris:**
     - Produk & Variasi (`/admin/dashboard/produk`)
     - Unit & Stok Consumable (`/admin/dashboard/unit`)
     - Paket Penyewaan (`/admin/dashboard/paket`)
     - Kategori Alat (`/admin/dashboard/kategori`)
  3. **Grup Konten & Laporan:**
     - Laporan & Export (`/admin/dashboard/laporan`)
     - Knowledge Base AI (`/admin/dashboard/knowledge-base`)
     - Syarat & Ketentuan (`/admin/dashboard/syarat-ketentuan` — *Owner Only*)
  4. **Grup Administrasi (*Owner Only - OQ-07*):**
     - Manajemen User & Role (`/admin/dashboard/users`)
     - Activity Log (`/admin/dashboard/activity-log`)
- **State Item Navigasi:**
  - *Default:* `text-[#6B7280] hover:bg-[#E7F3EE] hover:text-[#16624B] font-medium rounded-lg px-3 py-2.5`
  - *Active:* `bg-[#E7F3EE] text-[#16624B] font-semibold rounded-lg px-3 py-2.5`
- **Footer Sidebar:** Menampilkan inisial/avatar pengguna, nama lengkap, jabatan role, dan tombol Logout.

### 3.2 Admin Top Header (`AdminHeader`)
- **Dimensi & Posisi:** `h-16 bg-white border-b border-[#E5E7EB] px-6 sticky top-0 z-10 flex items-center justify-between`.
- **Sisi Kiri:** Tombol *hamburger* (khusus mobile/tablet), tombol kembali (`<-`) + *breadcrumb* (untuk halaman sub-form/detail), dan judul halaman aktif.
- **Sisi Kanan:** Global *search input* (atau kontekstual *action buttons* seperti `Batal` + `Simpan` pada halaman form).

---

## 4. Tiga Archetype Layout Halaman Admin

### Archetype A: Data Table & Management View (Pola *Salesai*)
Digunakan pada: **Daftar Produk, Daftar Unit/Consumable, Daftar Paket, Daftar Kategori, Daftar Transaksi, Laporan Transaksi, Knowledge Base, User Management, Activity Log.**
Struktur vertikal (`space-y-6`):
1. **KPI Summary Strip (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`):**
   - Kartu ringkas `bg-white p-4 rounded-xl border border-[#E5E7EB] flex items-center justify-between`.
   - Sisi kiri: Label metrik (`text-xs text-[#6B7280]`) + Nilai angka (`text-2xl font-bold tabular-nums`).
   - Sisi kanan: Kotak ikon `w-10 h-10 rounded-lg` dengan warna latar lembut sesuai konteks status.
2. **Unified Filter & Action Toolbar (`bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-4`):**
   - **Baris Atas:** *Segmented view switcher* (jika ada tab seperti Rental Unit vs Consumable), *Search input* dengan ikon, dropdown *Sort*, tombol *Reset Filter* (`border-[#16624B] text-[#16624B]`), dan CTA Utama (`bg-[#16624B] text-white`).
   - **Baris Bawah (`pt-3 border-t border-[#E5E7EB] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`):** Dropdown filter spesifik domain (misal: Kategori, Rentang Harga, Status Unit/Transaksi, Tipe Item, atau Rentang Tanggal Laporan).
3. **Compact Data Table Card (`bg-white rounded-xl border border-[#E5E7EB] overflow-hidden`):**
   - Dibungkus `overflow-x-auto`.
   - Padding sel: `py-3.5 px-4`.
   - Baris menggunakan `hover:bg-[#F9FAFB] transition-colors`.
   - Menyertakan indikator visual ketersediaan (*Health Progress Bar* `h-2 rounded-full` dengan persentase unit layak sewa).
   - Footer tabel memuat teks jumlah data (`Menampilkan X–Y dari Z`) dan kontrol *Pagination*.

### Archetype B: Modular Split-Form View (Pola *Kusale*)
Digunakan pada: **Tambah/Edit Produk, Tambah/Edit Paket, Form Knowledge Base, Editor S&K.**
Struktur Grid (`grid-cols-1 lg:grid-cols-12 gap-6`):
1. **Kolom Utama Kiri (`lg:col-span-8 space-y-6`):**
   - **Card Informasi Umum:** Input nama dan deskripsi kelengkapan (`bg-white p-6 rounded-xl border border-[#E5E7EB]`).
   - **Card Skema Harga 3 Durasi:** Grid 3 kolom (`grid-cols-1 md:grid-cols-3 gap-4`) dengan sub-card `bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]` untuk `Permalam (+1H)`, `Perkegiatan I (3H3M)`, dan `Perkegiatan II (5H5M)`.
   - **Card Variasi / Komposisi Isi Paket:** Pengaturan variasi produk atau daftar item penyusun paket.
2. **Kolom Kontekstual Kanan (`lg:col-span-4 space-y-6`):**
   - **Card Media Uploader:** Grid *thumbnail* media yang sudah diunggah (menampilkan badge `UTAMA #1` dengan border `border-2 border-[#16624B]` untuk `is_primary`), kontrol urutan tampil, dan area *dropzone* unggah file baru.
   - **Card Klasifikasi & Status:** Pilihan kategori, radio card `item_type` (`rental_unit` vs `consumable`), switch `is_reusable` (OQ-03), dan switch `is_active`.

### Archetype C: Interactive Detail, Variant & Operational Matrix View (Pola *SalesSync*)
Digunakan pada: **Detail Variasi & Status Fisik Unit, serta Halaman Detail Operasional Transaksi (Pickup, Return Checkbox per Item, Pelunasan, Input Denda Manual).**
Struktur Grid (`grid-cols-1 lg:grid-cols-12 gap-6`):
1. **Kolom Interaktif Kiri (`lg:col-span-7 space-y-6`):**
   - **Interactive Chip Selector:** Pilihan ukuran/warna berbentuk tombol chip (`w-11 h-11 rounded-lg`, state aktif `bg-[#16624B] text-white font-bold`, state tersedia `bg-[#E7F3EE] border-2 border-[#16624B] text-[#16624B]`).
   - **Unit / Transaction Item Action List:** Daftar baris item (`p-3.5 rounded-lg border border-[#E5E7EB]`) yang menampilkan kode unit (`JKT-L-001`), catatan kondisi/jadwal sewa, badge status saat ini, dan kontrol langsung (dropdown ubah `unit_status` atau checkbox `is_returned` saat proses pengembalian).
2. **Kolom Pratinjau & Ringkasan Kanan (`lg:col-span-5 space-y-6`):**
   - Pratinjau galeri media utama (`aspect-[4/3]`) beserta strip thumbnail, atau kartu ringkasan finansial transaksi (Total Sewa, Status DP Midtrans, Sisa Pelunasan, Jaminan Identitas, dan Total Denda).

---

## 5. Standarisasi Status Badge & Warna (Wajib Teks + Warna/Ikon)
Sesuai `Design.md`, status tidak boleh hanya mengandalkan warna:
- **Available / Selesai / Fully Paid / DP Paid:** `bg-green-100 text-[#16A34A]` + dot/ikon hijau.
- **Maintenance / Menunggu Pembayaran DP / Reserved:** `bg-amber-100 text-[#D97706]` + ikon peringatan/jam.
- **Rented / Sedang Disewa / Siap Diambil / Dikonfirmasi:** `bg-blue-100 text-[#2563EB]` + ikon info.
- **Damaged / Lost / Terlambat / Ditolak / Failed:** `bg-red-100 text-[#DC2626]` + ikon bahaya.
- **Returned / Inactive / Expired / Dibatalkan:** `bg-gray-200 text-[#6B7280]`.