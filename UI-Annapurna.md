# 🎨 UI Sprint 1 — ANNAPURNA Adventure

> **Sprint:** AA Sprint 1  
> **Periode:** 17 September 2026 – 15 Oktober 2026  
> **Sprint Goal:** Menyelesaikan seluruh instalasi proyek dasar, konfigurasi desain sistem visual, serta mengimplementasikan modul autentikasi pengguna dan penguncian profil sebelum checkout secara aman.

---

## 📋 Ringkasan

Sprint 1 berfokus pada dua area besar:
1. **EPIC-1 — Foundation, Design System & Auth:** Pondasi teknis (Next.js, Tailwind, shadcn/ui, Supabase) + seluruh halaman dan komponen autentikasi.
2. **EPIC-2 — Product, Inventory & Package Management:** Halaman admin untuk manajemen produk/inventaris + halaman-halaman publik katalog dan detail produk.

UI yang perlu dibuat dikelompokkan berdasarkan epic dan kategori fungsional di bawah ini.

---

## 🧱 EPIC-1: Foundation, Design System & Auth

### 1. Design System & Token Visual
**Issues:** AA-27 · AA-28 · AA-29  
**Status:** ✅ Done

Setup fondasi visual keseluruhan aplikasi.

**Yang harus dibuat:**
- Konfigurasi Tailwind CSS v4 dengan custom design tokens:
  - **Color palette:** Warna brand (Forest Green, Mountain Brown, Snow White, dsb.), warna semantik (success, warning, danger, info), warna neutral.
  - **Typography scale:** Heading H1–H6, body, caption — menggunakan font **Manrope** dari Google Fonts (`next/font/google`).
  - **Spacing & sizing:** Custom spacing scale yang konsisten.
  - **Border radius:** Token untuk card, button, badge, input.
  - **Shadow:** Elevation tokens (shadow-sm, shadow-md, shadow-lg).
- Instalasi dan konfigurasi **shadcn/ui** (`components.json`, theme resolver).
- Komponen primitif shadcn yang di-generate dan di-kustomisasi ke brand ANNAPURNA:
  - `Button` (variant: primary, secondary, outline, ghost, destructive)
  - `Input` & `Textarea`
  - `Badge` (variant status: available, reserved, rented, maintenance, damaged, lost)
  - `Card` & `CardHeader/Content/Footer`
  - `Dialog` / `AlertDialog`
  - `Toast` / `Sonner`
  - `Separator`

---

### 2. Layout Dasar Responsif
**Issue:** AA-42  
**Status:** 📋 To Do  
**Epic:** EPIC-1 (AA-2)

Layout shell yang membungkus seluruh halaman customer-facing dan admin.

**Yang harus dibuat:**

#### `src/components/layouts/CustomerNavbar.tsx`
- Navbar publik/customer dengan:
  - Logo brand ANNAPURNA Adventure (kiri)
  - Link navigasi: Beranda, Katalog, Paket
  - Tombol Login / Register (kondisi belum login)
  - Avatar + dropdown menu (kondisi sudah login): Pesanan Saya, Profil, Logout
  - Icon hamburger menu untuk mobile (responsif)
- Sticky/fixed di atas saat scroll, dengan subtle backdrop blur.

#### `src/components/layouts/AdminSidebar.tsx`
- Sidebar admin dengan:
  - Logo brand + nama toko
  - Menu navigasi: Dashboard, Transaksi, Produk, Unit Inventaris, Laporan, Log Aktivitas
  - Indikator menu aktif
  - Tombol collapse untuk layar sedang
  - Info akun (nama + role admin/owner) di bagian bawah sidebar

#### `src/components/layouts/Footer.tsx`
- Footer customer-facing dengan:
  - Logo brand
  - Link cepat: Katalog, Paket, S&K, Tentang Kami
  - Informasi kontak/alamat toko
  - Copyright

#### Container & Grid System
- Kelas utility `container` standar dengan max-width responsif
- Breakpoints: mobile (< 640px), tablet (640–1024px), desktop (> 1024px)

---

### 3. Halaman Register Customer
**Issue:** AA-35  
**Status:** 🔄 In Progress  
**Route:** `/register`

**Yang harus dibuat — `src/app/(auth)/register/page.tsx`:**
- Form registrasi dengan field:
  - Email (input + validasi format)
  - Password (input type=password + toggle show/hide)
  - Konfirmasi Password
  - Tombol "Daftar" (submit)
- Tombol "Daftar dengan Google" (OAuth — AA-37)
- Link ke halaman Login
- Notifikasi sukses: info email verifikasi terkirim (banner/toast)
- Validasi sisi klien (Zod + react-hook-form):
  - Email wajib & format valid
  - Password min. 8 karakter
  - Konfirmasi password harus sama
- State loading pada tombol submit
- Pesan error inline di bawah setiap field

---

### 4. Halaman Login
**Issue:** AA-36  
**Status:** 🔄 In Progress  
**Route:** `/login`

**Yang harus dibuat — `src/app/(auth)/login/page.tsx`:**
- Form login dengan field:
  - Email
  - Password (input type=password + toggle show/hide)
  - Tombol "Masuk"
- Tombol "Masuk dengan Google" (OAuth)
- Link "Lupa Password?" → `/forgot-password`
- Link "Belum punya akun? Daftar" → `/register`
- Redirect otomatis setelah login:
  - Customer → `/` (beranda)
  - Admin/Owner → `/admin/dashboard`
- State loading & pesan error umum (invalid credentials)

---

### 5. Google OAuth Login
**Issue:** AA-37  
**Status:** 🔄 In Progress

**Yang harus dibuat:**
- Tombol `<GoogleLoginButton />` — komponen reusable dengan logo Google dan label "Lanjutkan dengan Google"
- Tampil di halaman Login dan Register
- Handle callback redirect dari Supabase OAuth (`/auth/callback`)
- Strategi account linking: jika email sudah terdaftar via email/password, Google login ter-link ke akun yang sama tanpa membuat duplikat

---

### 6. Halaman Lupa Password
**Issue:** AA-38  
**Status:** 🔄 In Progress  
**Route:** `/forgot-password`

**Yang harus dibuat — `src/app/(auth)/forgot-password/page.tsx`:**
- Form satu field: Email
- Tombol "Kirim Link Reset"
- Tampilan sukses setelah submit: pesan "Cek email Anda" (tanpa membocorkan apakah email terdaftar atau tidak — lihat accepted risk OQ-21)
- Link kembali ke Login
- State loading pada tombol submit

---

### 7. Halaman Reset Password
**Issue:** AA-39  
**Status:** 🔄 In Progress  
**Route:** `/reset-password` (dengan token dari email)

**Yang harus dibuat — `src/app/(auth)/reset-password/page.tsx`:**
- Form dengan field:
  - Password Baru (+ toggle show/hide)
  - Konfirmasi Password Baru
  - Tombol "Simpan Password Baru"
- Validasi: password min. 8 karakter, kedua field harus cocok
- Tampilan sukses: "Password berhasil diubah" + link ke Login
- Tampilan error: token expired/invalid

---

### 8. Halaman Profile Completion Gate
**Issue:** AA-40  
**Status:** 📋 To Do  
**Route:** `/profile/complete` (redirect otomatis saat checkout jika profil belum lengkap)

**Yang harus dibuat — `src/app/(customer)/profile/complete/page.tsx`:**
- Banner/alert informatif: "Lengkapi data dirimu sebelum melanjutkan pemesanan"
- Form dengan field wajib:
  - Nama Lengkap (sesuai KTP)
  - Nomor WhatsApp (format: 08xxx / +62xxx)
  - Alamat Lengkap (sesuai KTP — textarea)
- Tombol "Simpan & Lanjutkan"
- Tombol "Lewati untuk sekarang" (hanya di halaman profil biasa, bukan saat redirect dari checkout)
- Validasi semua field wajib diisi
- Redirect kembali ke halaman checkout setelah berhasil

#### `src/app/(customer)/profile/page.tsx` (halaman profil lengkap)
- Tampilkan data profil yang sudah ada
- Form edit profil (sama dengan form di atas)
- Section: "Ubah Password" (jika akun email/password — bukan OAuth)
- Indikator kelengkapan profil (progress bar / checklist)

---

### 9. Role-Based Access Control — UI Guard
**Issue:** AA-41  
**Status:** 📋 To Do

Bukan halaman berdiri sendiri, tapi komponen dan middleware UI.

**Yang harus dibuat:**
- `src/middleware.ts` — Next.js middleware untuk proteksi route:
  - Route `/admin/*` → hanya role `admin` dan `owner`
  - Route `/profile/*`, `/pesanan/*` → hanya role `customer` (harus login)
  - Route auth (`/login`, `/register`) → redirect ke home jika sudah login
- HOC / komponen `<ProtectedRoute role="admin">` untuk digunakan di layout admin
- Halaman **403 Forbidden** (`src/app/unauthorized/page.tsx`):
  - Pesan "Anda tidak memiliki akses ke halaman ini"
  - Tombol kembali ke Beranda

---

## 🛒 EPIC-2: Product, Inventory & Package Management

### 10. Halaman Admin — Manajemen Kategori Produk
**Issue:** AA-43  
**Status:** 📋 To Do  
**Route:** `/admin/categories`

**Yang harus dibuat:**
- Tabel daftar kategori dengan kolom: Nama, Slug, Jumlah Produk, Aksi (Edit, Hapus)
- Tombol "Tambah Kategori" → membuka modal/dialog form
- Modal form kategori:
  - Field: Nama Kategori, Slug (auto-generated dari nama), Ikon (opsional)
  - Tombol Simpan & Batal
  - Validasi: nama wajib, slug unik
- Konfirmasi hapus (AlertDialog) dengan peringatan jika kategori masih memiliki produk

---

### 11. Halaman Admin — Manajemen Produk
**Issue:** AA-44 · AA-45 · AA-46  
**Status:** 📋 To Do  
**Route:** `/admin/products`

**Yang harus dibuat:**

#### Halaman List Produk (`/admin/products`)
- Tabel produk dengan kolom: Foto Thumbnail, Nama, Kategori, Tipe (rental_unit / consumable), Harga, Status (Aktif/Nonaktif), Aksi
- Filter: dropdown kategori, dropdown tipe item
- Search: input pencarian berdasarkan nama
- Pagination
- Tombol "Tambah Produk" → redirect ke form create

#### Halaman Form Produk (`/admin/products/new` dan `/admin/products/[id]/edit`)
- Section 1 — Informasi Dasar:
  - Nama Produk
  - Kategori (dropdown/select)
  - Tipe Item: toggle/radio "Unit Fisik (rental_unit)" vs "Stok Habis Pakai (consumable)"
  - Flag `is_reusable` (checkbox — hanya tampil jika tipe = consumable): "Barang dapat digunakan kembali setelah dicuci/dibersihkan"
  - Deskripsi (rich text sederhana / textarea)
  - Status: Aktif / Nonaktif (toggle)
- Section 2 — Harga per Durasi Sewa (AA-54):
  - Input harga untuk masing-masing durasi:
    - Permalam (1 malam)
    - Perkegiatan I (3 hari 3 malam)
    - Perkegiatan II (5 hari 5 malam)
  - Semua harga wajib diisi (tidak boleh 0)
- Section 3 — Variasi (AA-46):
  - Toggle "Produk ini memiliki variasi (ukuran/warna)"
  - Jika aktif: tabel variasi dengan kolom Nama Variasi (misal: "2P", "4P", "Hijau Olive") + tombol Tambah/Hapus Variasi
  - Jika tidak aktif: sistem otomatis membuat satu default variant (tersembunyi dari UI)
- Tombol Simpan & Batal

---

### 12. Halaman Admin — Manajemen Unit Fisik Inventaris
**Issue:** AA-47 · AA-48  
**Status:** 📋 To Do  
**Route:** `/admin/inventory`

**Yang harus dibuat:**

#### Halaman List Unit (`/admin/inventory`)
- Tabel unit dengan kolom: Kode Unit (TND-001), Produk, Variasi, Status Fisik, Terakhir Diupdate, Aksi
- Filter: dropdown produk, dropdown status unit
- Badge status unit berwarna:
  - `Available` → hijau
  - `Reserved` → kuning
  - `Rented` → biru
  - `Returned` → abu (transit)
  - `Maintenance` → oranye
  - `Damaged` → merah
  - `Lost` → merah gelap/hitam
- Tombol "Tambah Unit" → modal form

#### Modal Form Tambah/Edit Unit
- Field:
  - Kode Unit (input text, contoh: TND-001, STV-004)
  - Produk (dropdown — filter otomatis hanya tampilkan produk tipe rental_unit)
  - Variasi (dropdown — kondisional sesuai produk terpilih)
  - Status Fisik (select: Available, Maintenance, Damaged, Lost, Inactive)
  - Catatan (textarea opsional — catatan teknisi/kondisi)
- Validasi: kode unit unik, produk & variasi wajib dipilih

#### Modal Ubah Status Unit
- Tampil saat klik aksi "Ubah Status" pada unit tertentu
- Dropdown status baru
- Textarea wajib: alasan/catatan perubahan (dicatat ke `unit_status_logs`)
- Riwayat status singkat (3 entri terakhir ditampilkan di modal)

---

### 13. Halaman Admin — Manajemen Stok Consumable
**Issue:** AA-49  
**Status:** 📋 To Do  
**Route:** Bagian dari `/admin/inventory` atau tab terpisah

**Yang harus dibuat:**
- Tab atau sub-halaman "Stok Habis Pakai" di halaman inventaris
- Tabel dengan kolom: Produk, Variasi, Stok Tersedia, Stok Total, Flag `is_reusable`, Aksi
- Modal form update stok:
  - Field: Stok Tersedia, Stok Total
  - Tombol Simpan

---

### 14. Halaman Admin — Manajemen Paket Sewa
**Issue:** AA-50 · AA-51  
**Status:** 📋 To Do  
**Route:** `/admin/packages`

**Yang harus dibuat:**

#### Halaman List Paket (`/admin/packages`)
- Tabel paket: Foto, Nama Paket, Jumlah Item, Harga (per durasi), Status, Aksi
- Tombol "Tambah Paket"

#### Halaman Form Paket (`/admin/packages/new` dan `/admin/packages/[id]/edit`)
- Section 1 — Info Paket:
  - Nama Paket (contoh: "Paket Camping Keluarga")
  - Deskripsi
  - Status: Aktif/Nonaktif
- Section 2 — Harga Paket per Durasi Sewa (AA-50, OQ-14, snapshot harga):
  - Input harga snapshot per durasi (Permalam, Perkegiatan I, Perkegiatan II)
  - Catatan UI: "Harga paket ini akan disimpan secara tetap pada transaksi yang menggunakannya"
- Section 3 — Isi Paket / Package Items (AA-51):
  - Tabel item paket dengan kolom: Produk, Variasi, Jumlah, Aksi Hapus
  - Tombol "Tambah Item" → modal pilih produk + variasi + jumlah
  - Validasi: minimal 1 item

---

### 15. Halaman Admin — Upload Media Produk/Paket
**Issue:** AA-52 · AA-53  
**Status:** 📋 To Do  
**Route:** Terintegrasi dalam form produk/paket (Section Galeri)

**Yang harus dibuat — Section Galeri di form produk & paket:**
- Komponen `<MediaUploader />`:
  - Area drop-zone drag & drop
  - Preview grid gambar/video yang sudah diupload
  - Tombol "Tambah Foto/Video" (membuka file picker)
  - Indikator upload progress (progress bar per file)
  - Tombol hapus per item media
  - Batas: maksimal file size dan tipe (validasi client-side: jpg, png, webp, mp4)
- Validasi server-side (AA-53): magic byte check untuk memastikan file benar-benar sesuai tipe MIME yang diklaim (bukan sekadar pengecekan ekstensi)
- Urutan foto bisa diatur (drag to reorder)
- Foto pertama otomatis menjadi thumbnail produk

---

### 16. Halaman Publik — Homepage
**Issue:** AA-57  
**Status:** 📋 To Do  
**Route:** `/`

**Yang harus dibuat — `src/app/(customer)/page.tsx`:**
- **Hero Section:**
  - Headline utama + sub-headline brand ANNAPURNA Adventure
  - Background gambar/video alam pegunungan
  - CTA button "Lihat Katalog" → `/katalog`
- **Section Kategori:** Grid ikon/gambar per kategori produk (Tenda, Carrier, Sleeping Bag, Alat Masak, Paket Camping)
- **Section Produk Terlaris:** Horizontal scroll atau grid 4 kolom `<ProductCard />` — diisi data produk paling sering disewa (berdasarkan `order_count` atau kurated manual oleh admin)
- **Section Produk Terbaru:** Grid produk yang baru ditambahkan ke katalog
- **Section Paket Camping Populer:** Preview 2–3 paket unggulan
- **Section CTA Akhir:** "Rencanakan petualanganmu hari ini" + tombol WhatsApp / lihat katalog

---

### 17. Halaman Publik — Katalog Produk
**Issue:** AA-55  
**Status:** 📋 To Do  
**Route:** `/katalog`

**Yang harus dibuat — `src/app/(customer)/katalog/page.tsx`:**
- **Sidebar filter (desktop) / Drawer filter (mobile):**
  - Filter Kategori (checkbox per kategori)
  - Filter Tipe: Satuan / Paket
  - Filter Harga: range slider atau input min-max
  - Tombol "Reset Filter"
- **Area hasil produk:**
  - Search bar di atas
  - Toggle tampilan: Grid vs List
  - Sort dropdown: Terbaru, Terpopuler, Harga Terendah, Harga Tertinggi
  - Grid produk menggunakan komponen `<ProductCard />`:
    - Foto thumbnail
    - Nama produk
    - Kategori badge
    - Harga mulai dari (harga Permalam)
    - Tombol "Lihat Detail"
  - Empty state jika tidak ada produk ditemukan
  - Pagination (atau infinite scroll)
- URL parameter untuk filter: `?kategori=tenda&sort=terbaru&page=2`

---

### 18. Halaman Publik — Detail Produk
**Issue:** AA-56  
**Status:** 📋 To Do  
**Route:** `/katalog/[slug]` (produk) dan `/paket/[slug]` (paket)

**Yang harus dibuat:**

#### `src/app/(customer)/katalog/[slug]/page.tsx`
- **Galeri Media:**
  - Foto utama besar
  - Thumbnail strip bawah (klik untuk ganti foto utama)
  - Support lightbox untuk zoom
- **Info Produk:**
  - Nama produk
  - Kategori badge
  - Selector Variasi (jika produk memiliki variasi ukuran/warna):
    - Toggle button per pilihan variasi
    - Harga update otomatis sesuai variasi dipilih
  - Harga per durasi ditampilkan secara eksplisit:
    - Permalam: Rp X.XXX
    - Perkegiatan I (3 hari): Rp X.XXX
    - Perkegiatan II (5 hari): Rp X.XXX
  - Deskripsi produk (full text)
  - Indikator ketersediaan unit (tersedia / stok terbatas / tidak tersedia — real-time)
- **CTA Sewa:**
  - Tombol "Sewa Sekarang" → mulai alur booking (redirect ke checkout atau cart)
  - Tombol "Tanya via WhatsApp" (fallback)

#### `src/app/(customer)/paket/[slug]/page.tsx`
- Sama dengan halaman detail produk, tapi menampilkan:
  - List item yang termasuk dalam paket (dengan foto thumbnail per item)
  - Harga paket (snapshot) per durasi
  - CTA "Sewa Paket Ini"

---

## 🔧 Komponen Reusable yang Perlu Dibuat di Sprint 1

| Komponen | Path | Digunakan di |
|---|---|---|
| `<ProductCard />` | `components/molecules/ProductCard.tsx` | Homepage, Katalog |
| `<StatusBadge />` | `components/atoms/StatusBadge.tsx` | Inventaris unit, Transaksi |
| `<MediaUploader />` | `components/organisms/MediaUploader.tsx` | Form Produk, Form Paket |
| `<GoogleLoginButton />` | `components/atoms/GoogleLoginButton.tsx` | Login, Register |
| `<ProtectedRoute />` | `components/layouts/ProtectedRoute.tsx` | Admin layout |
| `<EmptyState />` | `components/atoms/EmptyState.tsx` | Tabel kosong, katalog kosong |
| `<PriceDisplay />` | `components/atoms/PriceDisplay.tsx` | Kartu produk, detail produk |
| `<ConfirmDialog />` | `components/molecules/ConfirmDialog.tsx` | Hapus data, ubah status |

---

## 📊 Ringkasan Status UI Sprint 1

| # | UI / Halaman | Jira Issue | Status |
|---|---|---|---|
| 1 | Design Tokens (warna, tipografi, token) | AA-27, AA-28, AA-29 | ✅ Done |
| 2 | Layout Responsif (Navbar, Sidebar Admin, Footer) | AA-42 | 📋 To Do |
| 3 | Halaman Register | AA-35 | 🔄 In Progress |
| 4 | Halaman Login | AA-36 | 🔄 In Progress |
| 5 | Google OAuth Button & Callback | AA-37 | 🔄 In Progress |
| 6 | Halaman Lupa Password | AA-38 | 🔄 In Progress |
| 7 | Halaman Reset Password | AA-39 | 🔄 In Progress |
| 8 | Halaman Profile Completion Gate | AA-40 | 📋 To Do |
| 9 | Route Guard / Halaman 403 Unauthorized | AA-41 | 📋 To Do |
| 10 | Halaman Admin — Manajemen Kategori | AA-43 | 📋 To Do |
| 11 | Halaman Admin — Manajemen Produk (List + Form) | AA-44, AA-45, AA-46 | 📋 To Do |
| 12 | Halaman Admin — Manajemen Unit Fisik | AA-47, AA-48 | 📋 To Do |
| 13 | Halaman Admin — Manajemen Stok Consumable | AA-49 | 📋 To Do |
| 14 | Halaman Admin — Manajemen Paket Sewa | AA-50, AA-51 | 📋 To Do |
| 15 | Komponen MediaUploader (Upload Foto/Video) | AA-52, AA-53 | 📋 To Do |
| 16 | Homepage (Hero, Produk Terlaris & Terbaru) | AA-57 | 📋 To Do |
| 17 | Halaman Katalog Produk | AA-55 | 📋 To Do |
| 18 | Halaman Detail Produk & Paket | AA-56 | 📋 To Do |

> **Legend:** ✅ Done · 🔄 In Progress · 📋 To Do

---

## 🗒️ Catatan Implementasi

- **Font:** Gunakan `next/font/google` untuk Manrope. Jangan load via CDN.
- **Icon:** Gunakan Hugeicons (utama) atau Lucide (fallback). Konsisten dalam satu komponen.
- **Form validation:** Selalu gunakan `zod` + `react-hook-form`. Jangan validasi manual dengan `useState`.
- **Gambar:** Gunakan `next/image` untuk semua gambar produk/media. Set `sizes` dan `priority` yang tepat.
- **Loading state:** Setiap aksi async (submit form, fetch data) harus menampilkan loading state yang jelas — skeleton, spinner, atau disabled button.
- **Error state:** Setiap form harus menampilkan error inline (di bawah field) dan error global (toast/banner).
- **Responsivitas:** Semua halaman wajib berfungsi di mobile (320px) hingga desktop (1440px+).
- **Aksesibilitas:** Gunakan semantic HTML, label pada input, aria-label pada ikon interaktif, dan pastikan color contrast ratio ≥ 4.5:1.
- **Zona waktu:** Semua timestamp tampil dalam WIB (Asia/Jakarta) — keputusan OQ-11.
