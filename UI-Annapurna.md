# 🎨 UI Plan — ANNAPURNA Adventure (3 Sprint)

> **Terakhir diperbarui:** 8 Oktober 2026  
> **Sumber data:** Jira Project AA (Board ID: 3) — disinkronkan otomatis dari backlog  
> **Total sprint:** 3 sprint · **Total issues:** 92 issues (AA-25 s/d AA-111, AA-118–120)

---

## 📋 Ringkasan Keseluruhan

| Sprint | Periode | Status Board | Sprint Goal (Ringkasan) |
|---|---|---|---|
| **Sprint 1** | 17 Sep – 25 Okt 2026 | 🟢 Active | Fondasi teknis + Auth lengkap + Master data admin (CRUD) |
| **Sprint 2** | 25 Okt – 15 Nov 2026 | ⏳ Future | Alur rental end-to-end: booking, DP Midtrans, pickup, return, denda |
| **Sprint 3** | 15 Nov – 6 Des 2026 | ⏳ Future | Dashboard, laporan, chatbot AI, testing, security audit |

---

## 🏃 SPRINT 1 — Fondasi & Auth (17 Sep – 25 Okt 2026)

> **Sprint Goal:** Menyediakan fondasi teknis dan keamanan dasar sistem: autentikasi lengkap (customer, admin, owner, Google Login, forgot/reset password), profile completion gate, serta seluruh master data (kategori, produk, variasi, unit barang, consumable, paket) sudah dapat dikelola admin melalui CRUD — dilengkapi rate limiting dan CSRF protection di endpoint sensitif sejak awal.

---

### 🧱 EPIC-1: Foundation, Design System & Auth

#### 1. Setup Proyek & Infrastruktur
**Issues:** AA-25 · AA-26 · AA-30 · AA-31 · AA-32 · AA-33 · AA-34  
**Status:** ✅ Done

Setup pondasi teknis seluruh aplikasi.

**Yang sudah dibuat:**
- Next.js App Router dengan TypeScript strict mode
- Supabase PostgreSQL project + Supabase Auth (email/password + Google OAuth)
- Prisma ORM dan koneksi ke Supabase (pooler + direct URL)
- Struktur folder frontend dan backend sesuai Architecture.md (Atomic Design + Layered Architecture)
- Git repository, branch strategy, dan `.env` handling

---

#### 2. Design System & Token Visual
**Issues:** AA-27 · AA-28 · AA-29  
**Status:** ✅ Done

**Yang sudah dibuat:**
- Tailwind CSS v4 dengan custom design tokens:
  - **Color palette:** Primary `#16624B`, Success `#16A34A`, Error `#DC2626`, Warning `#F59E0B`, Neutral `#6B7280`, Background `#F9FAFB`
  - **Typography scale:** Heading H1–H6, body, caption — font **Manrope** via `next/font/google`
  - **Spacing:** 4px increment scale (8/12/16/24/32/40/48)
  - **Border radius:** card `12px`, button `10–12px`, badge `full`
  - **Shadow:** `shadow-card`, `shadow-card-hover`, `shadow-modal`
- shadcn/ui (`components.json`, theme resolver) terkonfigurasi
- Komponen primitif shadcn ter-generate: `Button`, `Input`, `Label`, `Form`

---

#### 3. Keamanan (Rate Limiting & CSRF)
**Issues:** AA-118 · AA-119 · AA-120  
**Status:** ✅ Done

**Yang sudah dibuat:**
- **AA-118** — Rate limiting via Upstash Redis (sliding window): auth 5/mnt, chatbot 10/mnt, checkout 5/mnt, payment 5/mnt
- **AA-119** — CSRF protection: origin/referer check middleware pada semua endpoint mutating (POST/PUT/PATCH/DELETE), kecuali OAuth callback dan Midtrans webhook
- **AA-120** — Provisioning akun admin/owner awal via Supabase dashboard (manual, prosedur terdokumentasi)

---

#### 4. Halaman Register Customer
**Issue:** AA-35  
**Status:** ✅ Done  
**Route:** `/register`

**Yang sudah dibuat — `src/app/(auth)/register/page.tsx`:**
- Form registrasi: Email, Password (+ toggle show/hide), Konfirmasi Password
- Tombol "Daftar dengan Google" (OAuth)
- Link ke halaman Login
- Notifikasi sukses: info email verifikasi terkirim
- State loading pada tombol submit + pesan error inline

---

#### 5. Halaman Login
**Issue:** AA-36  
**Status:** ✅ Done  
**Route:** `/login`

**Yang sudah dibuat — `src/app/(auth)/login/page.tsx`:**
- Form login: Email, Password (+ toggle show/hide)
- Tombol "Masuk dengan Google" (OAuth)
- Link "Lupa Password?" dan "Belum punya akun? Daftar"
- Redirect: Customer → `/`, Admin/Owner → `/admin/dashboard`
- State loading & pesan error (invalid credentials)

---

#### 6. Google OAuth Login
**Issue:** AA-37  
**Status:** ✅ Done

**Yang sudah dibuat:**
- Komponen `<GoogleLoginButton />` — reusable, tampil di Login & Register
- Handle callback redirect dari Supabase OAuth (`/auth/callback`)
- Account linking: email duplikat di-link tanpa membuat akun baru

---

#### 7. Halaman Lupa Password
**Issue:** AA-38  
**Status:** ✅ Done  
**Route:** `/forgot-password`

**Yang sudah dibuat — `src/app/(auth)/forgot-password/page.tsx`:**
- Form email tunggal + tombol "Kirim Link Reset"
- Tampilan sukses: "Cek email Anda" (tidak membocorkan apakah email terdaftar)
- State loading pada tombol submit

---

#### 8. Halaman Reset Password
**Issue:** AA-39  
**Status:** ✅ Done  
**Route:** `/reset-password`

**Yang sudah dibuat — `src/app/(auth)/reset-password/page.tsx`:**
- Form: Password Baru (+ toggle) + Konfirmasi Password Baru
- Validasi: min. 8 karakter, kedua field harus cocok
- Tampilan sukses: "Password berhasil diubah" + link ke Login
- Tampilan error: token expired/invalid

---

#### 9. Halaman Profile Completion Gate
**Issue:** AA-40  
**Status:** ✅ Done  
**Route:** `/complete-profile`

**Yang sudah dibuat — `src/app/complete-profile/page.tsx`:**
- Banner: "Lengkapi data dirimu sebelum melanjutkan pemesanan"
- Form: Nama Lengkap (sesuai KTP), Nomor WhatsApp, Alamat Lengkap (textarea)
- Redirect kembali ke halaman sebelumnya setelah berhasil

---

#### 10. Role-Based Access Control — UI Guard
**Issue:** AA-41  
**Status:** ✅ Done

**Yang sudah dibuat:**
- `src/proxy.ts` — Next.js middleware: proteksi route `/admin/*` (admin/owner), `/pesanan/*` (customer), redirect auth jika sudah login
- RLS (Row Level Security) di Supabase sesuai permission matrix OQ-07

---

#### 11. Responsive Layout Dasar (Navbar, Footer, Container)
**Issue:** AA-42  
**Status:** 🔄 In Progress  
**Epic:** EPIC-1 (AA-2)

Layout shell yang membungkus seluruh halaman customer-facing.

**Yang harus dibuat:**

##### `src/components/layouts/Navbar.tsx`
- Logo SVG brand ANNAPURNA Adventure (kiri) — file: `public/images/favicon.svg`
- Link navigasi desktop: Katalog, Paket, S&K
- Kondisi belum login: tombol "Masuk" + "Daftar"
- Kondisi sudah login: Cart icon + Avatar dropdown (Pesanan Saya, Profil, Logout)
- Mobile: Logo | Cart icon | Hamburger menu
- Active state: underline (bukan bold, menghindari layout shift)
- Sticky dengan `backdrop-blur` saat scroll

##### `src/components/layouts/Footer.tsx`
- Background: dark green `#0F4F3C`, teks putih
- Logo brand (putih)
- 3 kolom: Navigasi (Katalog, Paket, S&K), Layanan (Cara Sewa, FAQ), Kontak (WhatsApp, Instagram, Alamat toko)
- Copyright

##### Container System
- Max-width responsif: mobile `100%`, tablet `768px`, desktop `1280px`
- Padding horizontal: `px-4 sm:px-6 lg:px-8`

---

### 🛒 EPIC-2: Product, Inventory & Package Management (Admin)

#### 12. CRUD Kategori Produk
**Issue:** AA-43  
**Status:** 🔄 In Progress  
**Route:** `/admin/dashboard/kategori`

**Yang harus dibuat:**
- Tabel kategori: Nama, Slug, Jumlah Produk, Aksi (Edit, Hapus)
- Tombol "Tambah Kategori" → modal form
- Modal form: Nama Kategori, Slug (auto-generated), Ikon (opsional)
- Konfirmasi hapus (AlertDialog) dengan peringatan jika kategori masih punya produk

---

#### 13. CRUD Produk
**Issues:** AA-44 · AA-45 · AA-46  
**Status:** 🔄 In Progress (AA-44) · 📋 To Do (AA-45, AA-46)  
**Route:** `/admin/dashboard/produk`

**Yang harus dibuat:**

##### Halaman List Produk
- Tabel: Thumbnail, Nama, Kategori, Tipe (rental_unit / consumable), Harga, Status, Aksi
- Filter: dropdown kategori, dropdown tipe
- Search berdasarkan nama
- Pagination
- Tombol "Tambah Produk"

##### Form Produk (`/admin/dashboard/produk/baru` dan `/admin/dashboard/produk/[id]/edit`)
- **Section 1 — Info Dasar (AA-44):**
  - Nama, Kategori (dropdown), Tipe Item (rental_unit vs consumable), `is_reusable` flag (jika consumable), Deskripsi, Status Aktif/Nonaktif
- **Section 2 — Harga per Durasi Sewa (AA-54):**
  - Permalam (1 malam), Perkegiatan I (3 hari 3 malam), Perkegiatan II (5 hari 5 malam) — semua wajib diisi
- **Section 3 — Variasi (AA-46):**
  - Toggle "Produk memiliki variasi (ukuran/warna)"
  - Jika aktif: tabel variasi (Nama Variasi + Tambah/Hapus)
  - Jika tidak aktif: default variant dibuat otomatis (tersembunyi dari UI)

---

#### 14. CRUD Unit Fisik Inventaris
**Issues:** AA-47 · AA-48  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/unit`

**Yang harus dibuat:**

##### Halaman List Unit
- Tabel: Kode Unit, Produk, Variasi, Status Fisik, Terakhir Diupdate, Aksi
- Filter: dropdown produk, dropdown status
- Badge status berwarna:
  - `Available` → hijau `#16A34A`
  - `Reserved` → kuning `#F59E0B`
  - `Rented` → biru `#2563EB`
  - `Returned` → abu `#6B7280` (transit)
  - `Maintenance` → oranye `#EA580C`
  - `Damaged` → merah `#DC2626`
  - `Lost` → merah gelap `#7F1D1D`
- Tombol "Tambah Unit" → modal form

##### Modal Form Tambah/Edit Unit
- Kode Unit (contoh: TND-001), Produk (dropdown — hanya `rental_unit`), Variasi (kondisional), Status Fisik, Catatan teknisi (opsional)

##### Modal Ubah Status Unit
- Dropdown status baru
- Textarea wajib: alasan perubahan (dicatat ke `unit_status_logs`)
- Riwayat 3 entri terakhir ditampilkan

---

#### 15. CRUD Stok Consumable
**Issue:** AA-49  
**Status:** 📋 To Do  
**Route:** Tab di `/admin/dashboard/unit`

**Yang harus dibuat:**
- Tab "Stok Habis Pakai" di halaman inventaris
- Tabel: Produk, Variasi, Stok Tersedia, Stok Total, Flag `is_reusable`, Aksi
- Modal update stok: Stok Tersedia, Stok Total

---

#### 16. CRUD Paket Sewa
**Issues:** AA-50 · AA-51  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/paket`

**Yang harus dibuat:**

##### Halaman List Paket
- Tabel: Thumbnail, Nama Paket, Jumlah Item, Harga (per durasi), Status, Aksi

##### Form Paket
- **Section 1:** Nama Paket, Deskripsi, Status
- **Section 2 — Harga Snapshot (AA-50):** Harga per durasi (tersimpan tetap di transaksi — OQ-14)
- **Section 3 — Isi Paket (AA-51):** Tabel item (Produk + Variasi + Jumlah), tombol "Tambah Item" via modal, minimal 1 item

---

#### 17. Upload & Pengelolaan Media
**Issues:** AA-52 · AA-53  
**Status:** 📋 To Do  
**Route:** Terintegrasi dalam form produk/paket (Section Galeri)

**Yang harus dibuat — `src/components/organisms/MediaUploader.tsx`:**
- Drop-zone drag & drop
- Preview grid gambar/video yang sudah diupload
- Progress bar per file saat upload
- Tombol hapus per item
- Client-side: validasi tipe (jpg, png, webp, mp4) dan ukuran file
- Server-side (AA-53): magic byte check (bukan hanya ekstensi)
- Drag to reorder; foto pertama otomatis jadi thumbnail

---

### 🌐 EPIC-2: Halaman Publik Customer

#### 18. Homepage — Hero & Produk Highlight
**Issue:** AA-57  
**Status:** 🔄 In Progress  
**Route:** `/`

**Yang harus dibuat — `src/app/(main)/page.tsx`:**

##### Hero Section
- Full-width foto `public/images/hero.png` via `next/image` (`fill`, `object-cover`)
- Gradient overlay: `from-black/70 via-black/30 to-transparent` (bawah ke atas)
- Teks bottom-left: H1 tagline + subtext
- CTA button "Lihat Katalog" → `/katalog`
- Height: `min-h-[70vh]` desktop, `min-h-[60vh]` mobile

##### Section Kategori
- Grid 5 kategori: Tenda, Carrier, Sleeping Gear, Alat Masak, Paket Camping
- Tiap item: icon Hugeicons + nama + link ke katalog dengan filter
- Desktop: 5 kolom · Mobile: 2 kolom atau horizontal scroll

##### Section Produk Pilihan
- Tab underline: "Terlaris" | "Terbaru"
- Grid 8 product cards (2 cols mobile, 4 cols desktop)
- CTA "Lihat Semua Produk" → `/katalog`

##### Section Paket Sewa
- 2–3 package cards horizontal
- CTA "Lihat Semua Paket" → `/paket`

##### Section Cara Sewa
- Background: soft green `#E7F3EE`
- 4 langkah: Pilih Produk → Bayar DP → Ambil di Toko → Kembalikan
- Icon Hugeicons + nomor langkah + teks singkat

---

#### 19. Halaman Katalog Produk
**Issue:** AA-55  
**Status:** 🔄 In Progress  
**Route:** `/katalog`

**Yang harus dibuat — `src/app/(main)/katalog/page.tsx`:**
- **Sidebar filter (desktop) / Drawer filter (mobile):**
  - Filter Kategori (checkbox per kategori)
  - Filter Tipe: Satuan / Paket
  - Filter Harga: range slider atau input min-max
  - Tombol "Reset Filter"
- **Area hasil:**
  - Search bar di atas
  - Toggle tampilan: Grid vs List
  - Sort dropdown: Terbaru, Terpopuler, Harga Terendah, Harga Tertinggi
  - Grid `<ProductCard />`: foto, nama, kategori badge, harga mulai dari, tombol "Lihat Detail"
  - Empty state jika tidak ada produk
  - Pagination
- URL parameter: `?kategori=tenda&sort=terbaru&page=2`

---

#### 20. Halaman Detail Produk & Paket
**Issue:** AA-56  
**Status:** 🔄 In Progress  
**Route:** `/katalog/[slug]` · `/paket/[slug]`

**Yang harus dibuat:**

##### `src/app/(main)/katalog/[slug]/page.tsx`
- Galeri Media: foto utama + thumbnail strip + lightbox zoom
- Info Produk: nama, kategori badge, selector variasi (toggle button), harga per durasi (Permalam/Perkegiatan I/II), deskripsi, indikator ketersediaan unit (real-time)
- CTA: "Sewa Sekarang" + "Tanya via WhatsApp"

##### `src/app/(main)/paket/[slug]/page.tsx`
- List item dalam paket (foto thumbnail per item)
- Harga paket snapshot per durasi
- CTA "Sewa Paket Ini"

---

### 📊 Ringkasan Status Sprint 1

| # | UI / Halaman | Issues | Status |
|---|---|---|---|
| 1 | Setup Proyek & Infrastruktur | AA-25, 26, 30–34 | ✅ Done |
| 2 | Design System (warna, tipografi, token) | AA-27, 28, 29 | ✅ Done |
| 3 | Rate Limiting + CSRF Protection | AA-118, 119, 120 | ✅ Done |
| 4 | Halaman Register | AA-35 | ✅ Done |
| 5 | Halaman Login | AA-36 | ✅ Done |
| 6 | Google OAuth Button & Callback | AA-37 | ✅ Done |
| 7 | Halaman Lupa Password | AA-38 | ✅ Done |
| 8 | Halaman Reset Password | AA-39 | ✅ Done |
| 9 | Profile Completion Gate | AA-40 | ✅ Done |
| 10 | Route Guard / RBAC + RLS | AA-41 | ✅ Done |
| 11 | Responsive Layout (Navbar, Footer) | AA-42 | 🔄 In Progress |
| 12 | CRUD Kategori Produk | AA-43 | 🔄 In Progress |
| 13 | CRUD Produk (List + Form + Tipe) | AA-44, 45, 46 | 🔄 In Progress / 📋 To Do |
| 14 | CRUD Unit Fisik Inventaris | AA-47, 48 | 📋 To Do |
| 15 | CRUD Stok Consumable | AA-49 | 📋 To Do |
| 16 | CRUD Paket Sewa + Isi Paket | AA-50, 51 | 📋 To Do |
| 17 | MediaUploader (Upload Foto/Video) | AA-52, 53 | 📋 To Do |
| 18 | Harga per Durasi Sewa | AA-54 | 📋 To Do |
| 19 | Homepage (Hero + Kategori + Produk) | AA-57 | 🔄 In Progress |
| 20 | Halaman Katalog Produk | AA-55 | 🔄 In Progress |
| 21 | Halaman Detail Produk & Paket | AA-56 | 🔄 In Progress |

---

## 🏃 SPRINT 2 — Alur Rental End-to-End (25 Okt – 15 Nov 2026)

> **Sprint Goal:** Mengimplementasikan alur rental end-to-end: pemilihan durasi sewa, availability check anti-overbooking dengan locking eksplisit, checkout dengan soft-hold, pembayaran DP 50% via Midtrans beserta webhook idempotent, hingga proses pengambilan, pengembalian, dan denda manual di toko.

---

### 📜 Syarat & Ketentuan

#### 1. Halaman S&K Publik + Checkout Gate
**Issues:** AA-58 · AA-59 · AA-60  
**Status:** 📋 To Do

**Yang harus dibuat:**
- **AA-58** — `src/app/(main)/syarat-ketentuan/page.tsx`: Halaman S&K statis yang dapat diakses publik, konten dikelola admin
- **AA-59** — Checkbox persetujuan S&K wajib di halaman checkout (harus di-centang sebelum lanjut)
- **AA-60** — Snapshot versi S&K yang disetujui tersimpan pada transaksi (data immutable)

---

### 📅 Rental Date Selector

#### 2. UI Pilih Durasi & Tanggal Sewa
**Issues:** AA-61 · AA-62 · AA-63  
**Status:** 📋 To Do

**Yang harus dibuat:**
- **AA-61** — Komponen selector durasi: Permalam / Perkegiatan I (3 hari 3 malam) / Perkegiatan II (5 hari 5 malam)
- **AA-62** — Auto-calculate tanggal maksimal pengembalian (Tgl Ambil + durasi — OQ-16)
- **AA-63** — UI 3 grup input dalam satu baris: `Tanggal Ambil` | `Durasi` | `Maks. Pengembalian` (readonly, kalkulasi otomatis)

---

### 🔒 Availability Check

#### 3. Cek Ketersediaan Anti-Overbooking
**Issues:** AA-64 · AA-65 · AA-66  
**Status:** 📋 To Do

**Yang harus dibuat:**
- **AA-64** — Availability check pre-checkout (UI realtime): indikator "Tersedia / Stok Terbatas / Tidak Tersedia" di halaman detail produk (OQ-02)
- **AA-65** — Availability check post-checkout (transaction boundary): database locking eksplisit saat assign unit ke transaksi
- **AA-66** — Consumable stock check saat checkout: validasi stok tersedia > 0 sebelum konfirmasi

---

### 🛒 Cart & Checkout

#### 4. Cart Rental
**Issue:** AA-67  
**Status:** 📋 To Do  
**Route:** `/cart`

**Yang harus dibuat — `src/app/(main)/cart/page.tsx`:**
- List item cart: foto, nama produk, variasi, durasi terpilih, harga, tombol hapus
- Ringkasan total harga
- CTA "Lanjut ke Checkout"
- Empty state jika cart kosong

---

#### 5. Checkout + Soft-Hold
**Issue:** AA-68  
**Status:** 📋 To Do  
**Route:** `/checkout`

**Yang harus dibuat — `src/app/(main)/checkout/page.tsx`:**
- Ringkasan item yang akan disewa (produk, variasi, durasi, tgl ambil, tgl kembali)
- Ringkasan biaya: subtotal, DP 50% (yang dibayar online), sisa pelunasan (dibayar di toko)
- Checkbox persetujuan S&K (AA-59)
- CTA "Bayar DP Sekarang" → trigger Midtrans Snap
- Soft-hold saat checkout dibuat: unit di-reserve sementara selama 60 menit (OQ-01)

---

#### 6. Test Concurrency
**Issue:** AA-69  
**Status:** 📋 To Do

- Pengujian skenario overbooking: 2 user checkout unit yang sama secara bersamaan
- Tidak ada halaman UI tersendiri; ini adalah test backend dengan UI error state yang ditampilkan di checkout

---

### 💳 Pembayaran DP via Midtrans

#### 7. Invoice & Integrasi Midtrans
**Issues:** AA-70 · AA-71 · AA-72 · AA-73 · AA-74 · AA-75  
**Status:** 📋 To Do

**Yang harus dibuat:**
- **AA-70** — `src/app/(main)/pesanan/[id]/page.tsx` (invoice pending): tampilan ringkasan booking + tombol "Bayar DP" saat status "Menunggu DP"
- **AA-71** — Expired booking rule: countdown timer 60 menit, auto-cancel booking jika tidak dibayar (OQ-13)
- **AA-72** — Integrasi Midtrans Snap sandbox: server-side create payment token DP
- **AA-73** — Webhook Midtrans: endpoint `POST /api/webhooks/midtrans` + signature verification
- **AA-74** — Idempotency handling: duplicate webhook tidak membuat double-update status
- **AA-75** — Auto-update status transaksi ke "DP Dibayar" via webhook

---

### 📦 State Machine Transaksi

#### 8. Status Transaksi & Stepper UI
**Issue:** AA-76  
**Status:** 📋 To Do

**Yang harus dibuat:**
- State machine: `Menunggu DP` → `DP Dibayar` → `Siap Diambil` → `Sedang Disewa` → `Selesai` (tanpa status Pending — OQ-04)
- Komponen `<TransactionStepper />`: progress bar/stepper 5 tahap di halaman detail pesanan customer
- Status "Dibatalkan" sebagai terminal state tersendiri

---

### 🏪 Proses Toko (Admin)

#### 9. Handover (Pengambilan Barang)
**Issues:** AA-77 · AA-78 · AA-79  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/transaksi/[id]/pickup`

**Yang harus dibuat:**
- **AA-77** — Form catat jaminan identitas: dropdown tipe jaminan (KTP/SIM/KTM) + input nomor identitas
- **AA-78** — Form pelunasan sisa pembayaran: input nominal + metode pembayaran (Kas/QRIS) + konfirmasi
- **AA-79** — Halaman proses pickup: checklist kondisi fisik per unit yang diambil + validasi DP sudah dibayar sebelum bisa diproses

---

#### 10. Return (Pengembalian Barang)
**Issues:** AA-80 · AA-81 · AA-82  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/transaksi/[id]/return`

**Yang harus dibuat:**
- **AA-80** — Checklist return per item (`is_returned` flag per unit, OQ-08)
- **AA-81** — Form input denda manual: dropdown tipe denda (terlambat/rusak/hilang) + nominal + alasan wajib
- **AA-82** — Audit trail: setiap perubahan status unit tercatat di `unit_status_logs`

---

#### 11. Refund & Reconciliation
**Issues:** AA-83 · AA-84  
**Status:** 📋 To Do

**Yang harus dibuat:**
- **AA-83** — UI konfirmasi pembatalan: DP hangus jika customer membatalkan sendiri; notifikasi refund penuh jika toko membatalkan (OQ-09)
- **AA-84** — Reconciliation job untuk webhook terlambat/gagal: tidak re-reserve, refund otomatis, notifikasi admin dashboard (OQ-10)

---

### 📊 Ringkasan Status Sprint 2

| # | UI / Halaman | Issues | Status |
|---|---|---|---|
| 1 | Halaman S&K Publik | AA-58 | 📋 To Do |
| 2 | Persetujuan S&K + Snapshot Transaksi | AA-59, 60 | 📋 To Do |
| 3 | UI Pilih Durasi Sewa | AA-61, 62, 63 | 📋 To Do |
| 4 | Availability Check (Pre & Post Checkout) | AA-64, 65, 66 | 📋 To Do |
| 5 | Halaman Cart Rental | AA-67 | 📋 To Do |
| 6 | Halaman Checkout + Soft-Hold | AA-68 | 📋 To Do |
| 7 | Test Concurrency (Overbooking Prevention) | AA-69 | 📋 To Do |
| 8 | Invoice Booking + Expired Rule | AA-70, 71 | 📋 To Do |
| 9 | Integrasi Midtrans Snap (DP) | AA-72 | 📋 To Do |
| 10 | Webhook Midtrans + Idempotency | AA-73, 74, 75 | 📋 To Do |
| 11 | State Machine + Stepper UI Transaksi | AA-76 | 📋 To Do |
| 12 | Form Catat Jaminan Identitas | AA-77 | 📋 To Do |
| 13 | Form Pelunasan Sisa Pembayaran | AA-78 | 📋 To Do |
| 14 | Proses Pickup (Handover) | AA-79 | 📋 To Do |
| 15 | Proses Return + Checklist | AA-80 | 📋 To Do |
| 16 | Input Denda Manual | AA-81 | 📋 To Do |
| 17 | Unit Status Audit Trail | AA-82 | 📋 To Do |
| 18 | Refund Flow | AA-83 | 📋 To Do |
| 19 | Reconciliation Job (Webhook Gagal) | AA-84 | 📋 To Do |

---

## 🏃 SPRINT 3 — Dashboard, Laporan, Chatbot & Testing (15 Nov – 6 Des 2026)

> **Sprint Goal:** Melengkapi sistem dengan dashboard admin dan laporan transaksi yang dapat diexport, chatbot customer berbasis OpenRouter dengan conversation boundaries, serta memastikan seluruh sistem lulus Black Box Testing dan siap dirilis ke production sebelum evaluasi UAT.

---

### 📊 Dashboard & Laporan Admin

#### 1. Dashboard Admin
**Issue:** AA-85  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard`

**Yang harus dibuat — `src/app/(admin)/dashboard/page.tsx`:**
- KPI cards: Transaksi Aktif, Menunggu DP, Unit Maintenance, Revenue Bulan Ini
- Grafik: tren booking mingguan/bulanan
- Tabel: Jadwal Ambil Hari Ini vs Jadwal Kembali Hari Ini
- Quick actions: akses cepat ke transaksi pending, unit bermasalah

---

#### 2. Filter & Laporan Transaksi
**Issues:** AA-86 · AA-87 · AA-88 · AA-89 · AA-90 · AA-91 · AA-92 · AA-93  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/laporan`

**Yang harus dibuat:**
- **AA-86** — Filter transaksi: dropdown status, date range picker, filter produk
- **AA-87** — Laporan transaksi rental: tabel + ringkasan total
- **AA-88** — Laporan DP: rekapitulasi semua pembayaran DP via Midtrans
- **AA-89** — Laporan sisa pembayaran: rekapitulasi pelunasan kas toko
- **AA-90** — Laporan denda: tabel denda per transaksi + total
- **AA-91** — Laporan unit maintenance/damaged/lost: tabel unit bermasalah + history
- **AA-92** — Laporan consumable usage: pisahkan `is_reusable=true` vs `false` (OQ-03)
- **AA-93** — Laporan produk/paket terlaris: ranking berdasarkan frekuensi rental

---

#### 3. Export Laporan
**Issues:** AA-94 · AA-95  
**Status:** 📋 To Do

**Yang harus dibuat:**
- **AA-94** — Tombol "Export PDF" di setiap halaman laporan → generate PDF via server
- **AA-95** — Tombol "Export Excel (.xlsx)" → generate file Excel dengan format yang rapi

---

### 👥 Manajemen Pengguna (Owner Only)

#### 4. Manajemen User & Role
**Issues:** AA-96 · AA-97  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/pengguna`

**Yang harus dibuat:**
- **AA-96** — Tabel daftar akun (admin/owner): nama, email, role, status, aksi — hanya bisa diakses owner (OQ-07)
- **AA-97** — Form assign/ubah role + permission matrix sesuai OQ-07 (admin vs owner)

---

#### 5. Activity Log
**Issue:** AA-98  
**Status:** 📋 To Do  
**Route:** `/admin/dashboard/activity-log`

**Yang harus dibuat:**
- Tabel log aktivitas: timestamp, user, aksi, detail perubahan (siapa mengubah apa, kapan)
- Filter: date range, user, tipe aksi
- Pagination

---

### 🤖 Chatbot AI Customer Service

#### 6. Knowledge Base & Integrasi OpenRouter
**Issues:** AA-99 · AA-100 · AA-101 · AA-102 · AA-103 · AA-104 · AA-105  
**Status:** 📋 To Do

**Yang harus dibuat:**

- **AA-99** — Halaman admin knowledge base (`/admin/dashboard/chatbot`): CRUD data tanya-jawab (produk, S&K, pembayaran, pickup/return, denda, kontak admin)
- **AA-100** — Integrasi API OpenRouter: koneksi ke LLM untuk memproses pertanyaan customer
- **AA-101** — Scope classification: deteksi pertanyaan di luar konteks layanan ANNAPURNA
- **AA-102** — Conversation boundaries: tolak topik sensitif (politik, SARA, hukum, kesehatan, programming, dll.)
- **AA-103** — Cek status pesanan via chatbot: ownership-scoped (customer hanya bisa lihat pesanannya sendiri)
- **AA-104** — Chat history per user dengan retensi 12 bulan (OQ-12)
- **AA-105** — Automated purging job: chat history & activity log (12 bulan) + data customer non-aktif (24 bulan)

##### Widget Chatbot Customer
- `src/components/organisms/ChatbotWidget.tsx`:
  - Bubble button floating di pojok kanan bawah
  - Panel chat: riwayat pesan + input field + tombol kirim
  - Indikator "bot sedang mengetik..."
  - Tampil di semua halaman customer-facing

---

### 🔬 Testing & Security

#### 7. Responsive Testing
**Issue:** AA-106  
**Status:** 📋 To Do

- Testing lintas device: mobile (375px), tablet (768px), desktop (1280px, 1440px)
- Testing lintas browser: Chrome, Firefox, Safari, Edge
- Dokumen hasil testing dengan screenshot

---

#### 8. Black Box Testing
**Issue:** AA-107  
**Status:** 📋 To Do

- Testing seluruh fitur kritis sesuai PRD Section 24:
  - Auth flow, booking flow, payment flow, pickup/return flow
  - Edge cases: expired booking, overbooking, webhook gagal, token expired
- Test plan dokumen tersendiri

---

#### 9. Evaluasi UAT
**Issues:** AA-108 · AA-109 · AA-110  
**Status:** 📋 To Do (AA-108, 110) · ✅ Done (AA-109)

- **AA-108** — Persiapan UAT: scenario test, user recruitment, test environment setup
- **AA-109** — ✅ Pelaksanaan evaluasi UAT/Black Box (sudah selesai — persiapan awal)
- **AA-110** — Perbaikan akhir berdasarkan hasil testing dan evaluasi

---

#### 10. Security Audit Final
**Issue:** AA-111  
**Status:** 📋 To Do

- Audit: secret exposure, RLS coverage, ownership validation, upload security, webhook security
- Sesuai PRD Section 30
- Checklist audit terdokumentasi

---

### 📊 Ringkasan Status Sprint 3

| # | UI / Halaman | Issues | Status |
|---|---|---|---|
| 1 | Dashboard Admin (KPI + Jadwal) | AA-85 | 📋 To Do |
| 2 | Filter Transaksi | AA-86 | 📋 To Do |
| 3 | Laporan Transaksi Rental | AA-87 | 📋 To Do |
| 4 | Laporan DP | AA-88 | 📋 To Do |
| 5 | Laporan Sisa Pembayaran | AA-89 | 📋 To Do |
| 6 | Laporan Denda | AA-90 | 📋 To Do |
| 7 | Laporan Unit Maintenance/Damaged/Lost | AA-91 | 📋 To Do |
| 8 | Laporan Consumable Usage | AA-92 | 📋 To Do |
| 9 | Laporan Produk/Paket Terlaris | AA-93 | 📋 To Do |
| 10 | Export PDF | AA-94 | 📋 To Do |
| 11 | Export Excel (.xlsx) | AA-95 | 📋 To Do |
| 12 | Manajemen User & Role (Owner Only) | AA-96, 97 | 📋 To Do |
| 13 | Activity Log | AA-98 | 📋 To Do |
| 14 | Admin Knowledge Base Chatbot | AA-99 | 📋 To Do |
| 15 | Integrasi OpenRouter (LLM) | AA-100 | 📋 To Do |
| 16 | Scope Classification Chatbot | AA-101 | 📋 To Do |
| 17 | Conversation Boundaries | AA-102 | 📋 To Do |
| 18 | Cek Status Pesanan via Chatbot | AA-103 | 📋 To Do |
| 19 | Chat History + Retensi 12 Bulan | AA-104 | 📋 To Do |
| 20 | Automated Purging Job | AA-105 | 📋 To Do |
| 21 | Responsive Testing | AA-106 | 📋 To Do |
| 22 | Black Box Testing | AA-107 | 📋 To Do |
| 23 | Persiapan & Evaluasi UAT | AA-108, 109, 110 | 📋 To Do / ✅ Done |
| 24 | Security Audit Final | AA-111 | 📋 To Do |

---

## 🔧 Komponen Reusable — Keseluruhan Sprint

| Komponen | Path | Digunakan di | Sprint |
|---|---|---|---|
| `<Navbar />` | `layouts/Navbar.tsx` | Semua halaman customer | 1 |
| `<Footer />` | `layouts/Footer.tsx` | Semua halaman customer | 1 |
| `<ProductCard />` | `molecules/ProductCard.tsx` | Homepage, Katalog | 1 |
| `<StatusBadge />` | `atoms/StatusBadge.tsx` | Inventaris, Transaksi | 1 |
| `<TabSwitcher />` | `atoms/TabSwitcher.tsx` | Homepage, Admin tabs | 1 |
| `<MediaUploader />` | `organisms/MediaUploader.tsx` | Form Produk, Form Paket | 1 |
| `<GoogleLoginButton />` | `atoms/GoogleLoginButton.tsx` | Login, Register | 1 |
| `<EmptyState />` | `atoms/EmptyState.tsx` | Tabel kosong, katalog kosong | 1 |
| `<PriceDisplay />` | `atoms/PriceDisplay.tsx` | Kartu produk, detail produk | 1 |
| `<ConfirmDialog />` | `molecules/ConfirmDialog.tsx` | Hapus data, ubah status | 1 |
| `<RentalDateSelector />` | `molecules/RentalDateSelector.tsx` | Detail produk, checkout | 2 |
| `<TransactionStepper />` | `molecules/TransactionStepper.tsx` | Halaman detail pesanan | 2 |
| `<CartItem />` | `molecules/CartItem.tsx` | Halaman Cart | 2 |
| `<CheckoutForm />` | `organisms/CheckoutForm.tsx` | Halaman Checkout | 2 |
| `<ChatbotWidget />` | `organisms/ChatbotWidget.tsx` | Semua halaman customer | 3 |
| `<TransactionTable />` | `organisms/TransactionTable.tsx` | Dashboard admin, Laporan | 3 |

---

## 🗒️ Catatan Implementasi

- **Font:** Gunakan `next/font/google` untuk Manrope. Jangan load via CDN.
- **Icon:** Gunakan **Hugeicons React** (`hugeicons-react@0.4.0`) sebagai library utama. Jangan mix dengan Lucide dalam satu komponen.
- **Form validation:** Backend-only untuk auth dan checkout (TDD-006). Jangan validasi manual dengan `useState` — gunakan `zod` untuk schema contract.
- **Gambar:** Gunakan `next/image` untuk semua gambar produk/media. Set `sizes` dan `priority` yang tepat.
- **Loading state:** Setiap aksi async (submit form, fetch data) harus menampilkan loading state — skeleton, spinner, atau disabled button.
- **Error state:** Setiap form harus menampilkan error inline (di bawah field) dan error global (toast/banner).
- **Responsivitas:** Semua halaman wajib berfungsi di mobile (320px) hingga desktop (1440px+).
- **Aksesibilitas:** Gunakan semantic HTML, label pada input, `aria-label` pada ikon interaktif, color contrast ratio ≥ 4.5:1.
- **Zona waktu:** Semua timestamp tampil dalam WIB (Asia/Jakarta) — keputusan OQ-11.
- **Shadow system:** `shadow-card` untuk card default, `shadow-card-hover` untuk hover state — jangan gunakan `shadow-md` bawaan Tailwind langsung.
- **Color:** Primary `#16624B` untuk CTA/interactive, Success `#16A34A` untuk status badge — dibedakan via shape/affordance bukan hanya warna.
