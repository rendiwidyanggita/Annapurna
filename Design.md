# Design System — ANNAPURNA Adventure

Dokumen ini adalah spesifikasi desain visual untuk website ANNAPURNA Adventure. Dipisahkan dari `prd.md` agar PRD tetap fokus pada business requirement dan functional logic, sementara detail visual (warna, tipografi, komponen, penggunaan logo) dikelola terpisah dan dapat diperbarui tanpa menyentuh dokumen requirement utama.

Referensi silang: `prd.md` Section 7 merujuk ke dokumen ini untuk seluruh keputusan desain.

---

## Design Direction & Principles

### Design Direction

Website menggunakan arah desain:

**Modern Outdoor Minimalist**

Karakter desain:

- Modern
- Clean
- Professional
- Natural
- Eye-catching tanpa terlalu ramai
- Mobile-first
- Tidak terlihat seperti template AI/generic SaaS

Desain harus terasa seperti platform rental outdoor yang rapi, terpercaya, dan mudah digunakan.

### Design Principles

- Gunakan whitespace yang cukup.
- Gunakan warna brand secara konsisten.
- Hindari dekorasi berlebihan.
- Gunakan foto produk asli.
- Gunakan video produk asli hanya jika membantu customer memahami kondisi, ukuran, atau penggunaan barang.
- Gunakan komponen reusable.
- Prioritaskan keterbacaan dan kemudahan booking.
- Customer side harus mobile-first.
- Admin dashboard harus fungsional, tidak dekoratif.

---

## Colour Palette

Palette mengikuti logo ANNAPURNA yang dominan hijau dan hitam.

### Primary Colors

| Token | Hex | Usage |
|---|---|---|
| Primary Green | `#16624B` | CTA utama, active state, highlight |
| Dark Green | `#0F4F3C` | Hover button, dark brand section |
| Deep Green | `#0B3E2F` | Background gelap terbatas |
| Soft Green | `#E7F3EE` | Background lembut, badge, info card |

### Neutral Colors

| Token | Hex | Usage |
|---|---|---|
| Text Primary | `#111827` | Judul dan teks utama |
| Text Secondary | `#6B7280` | Deskripsi, meta text |
| Border | `#E5E7EB` | Border card, input, table |
| Background | `#F9FAFB` | Background halaman |
| Surface | `#FFFFFF` | Card, modal, form |

### Status Colors

| Status | Hex | Usage |
|---|---|---|
| Success | `#16A34A` | Available, success state |
| Warning | `#D97706` | Pending, maintenance |
| Danger | `#DC2626` | Damaged, lost, failed |
| Info | `#2563EB` | Rented, informational state |
| Muted | `#6B7280` | Returned, inactive |

### Color Usage Ratio

```text
70% neutral / white space
20% gray / layout / border
10% green / accent / status
```

---

## Typography

### Font Decision

Primary font:

```text
Manrope
```

Fallback font:

```text
Inter, system-ui, sans-serif
```

Plus Jakarta Sans tidak digunakan.

### Font Usage

| Element    | Font    | Weight  |
| ---------- | ------- | ------- |
| Heading    | Manrope | 600–700 |
| Body       | Manrope | 400–500 |
| Button     | Manrope | 600     |
| Table      | Manrope | 400–500 |
| Form Label | Manrope | 500–600 |

### Font Size Guide

```text
H1: 36–48px
H2: 28–32px
H3: 22–24px
Body: 16px
Caption: 14px
Small: 12px
```

### Tailwind Font Config

```ts
fontFamily: {
  sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
}
```

---

## UI Component Rules

### Button

Primary button:

```text
Background: #16624B
Text: #FFFFFF
Hover: #0F4F3C
Radius: 10–12px
```

Digunakan untuk:

* Booking Sekarang
* Bayar DP
* Simpan
* Konfirmasi
* Checkout

Secondary button:

```text
Background: #FFFFFF
Border: #16624B
Text: #16624B
Hover Background: #E7F3EE
```

Digunakan untuk:

* Lihat Detail
* Filter
* Kembali
* Batal

### Card

Card digunakan untuk produk, paket, transaksi, laporan, dan dashboard.

Style:

```text
Background: #FFFFFF
Border: #E5E7EB
Radius: 14–16px
Shadow: subtle
Padding: 16–24px
```

Product card maksimal menampilkan:

* Foto produk
* Nama produk
* Harga mulai dari
* Durasi/harga singkat
* Status ketersediaan
* CTA detail/booking

### Badge / Status

Status harus menggunakan warna dan teks, tidak boleh hanya warna.

| Status      | Style          |
| ----------- | -------------- |
| Available   | Green badge    |
| Reserved    | Amber badge    |
| Rented      | Blue badge     |
| Returned    | Gray badge     |
| Maintenance | Amber badge    |
| Damaged     | Red badge      |
| Lost        | Red/Dark badge |
| Inactive    | Gray badge     |

### Rental Date Selector

Komponen pemilihan tanggal sewa pada detail produk, detail paket, cart edit, dan checkout menggunakan tiga informasi yang saling terkait:

```text
Tgl Ambil | Durasi | Maks. Pengembalian
```

Rules:

* `Tgl Ambil` menggunakan date picker dan tidak menerima tanggal masa lalu.
* `Durasi` menggunakan pilihan Permalam, Perkegiatan I, atau Perkegiatan II.
* `Maks. Pengembalian` bersifat read-only dan dihitung otomatis setelah tanggal ambil serta durasi valid.
* Perubahan tanggal ambil atau durasi langsung memperbarui tanggal maksimal pengembalian dan memicu availability check ulang.
* Sebelum kedua input valid, field maksimal pengembalian menampilkan placeholder yang jelas.
* Desktop menggunakan satu container tiga kolom dengan separator; mobile menggunakan susunan vertikal tanpa horizontal scroll.
* Setiap field memiliki label visible, icon konsisten, focus state, dan tap target minimal 44px.
* Perubahan tanggal maksimal diumumkan melalui `aria-live="polite"` untuk screen reader.

### Product and Package Media Gallery

* Detail produk dan paket menggunakan satu media utama dengan daftar thumbnail atau carousel media.
* Galeri mendukung beberapa foto dan video.
* Foto menggunakan aspect ratio konsisten dan tidak berubah ukuran ketika media berpindah.
* Video menggunakan native controls, tidak autoplay dengan suara, dan memiliki poster/thumbnail.
* Carousel mendukung swipe pada mobile serta tombol previous/next yang keyboard-accessible.
* Media di bawah fold dan video di-lazy-load untuk mengurangi initial load.
* Media utama wajib memiliki alt text atau label yang menjelaskan produk/paket.

---

## Logo Usage

Logo ANNAPURNA digunakan sebagai identitas utama website.

Rules:

* Logo full color digunakan di background terang.
* Logo versi putih digunakan di background gelap/hijau.
* Logo tidak boleh di-stretch.
* Logo tidak boleh diberi shadow berlebihan.
* Warna logo tidak boleh diubah sembarangan.
* Logo navbar memiliki tinggi sekitar `32–40px`.
* Logo hero boleh lebih besar selama tetap proporsional.

---

## Anti "AI Slop" Design Rules

Untuk mencegah tampilan terlihat seperti hasil template AI yang generic, sistem harus mengikuti aturan berikut:

* Gunakan design system secara konsisten.
* Jangan membuat warna baru tanpa kebutuhan.
* Jangan menggunakan gradient berlebihan.
* Jangan menggunakan shadow tebal.
* Jangan menggunakan terlalu banyak icon style.
* Jangan menggunakan random illustration.
* Gunakan foto produk asli.
* Gunakan spacing konsisten.
* Gunakan komponen reusable.
* Customer UI harus clean, spacious, dan professional.
* Admin UI harus utilitarian dan fokus pada aksi.
* Hindari layout yang terlalu penuh.
* Hindari card yang terlalu banyak teks.
* Hindari penggunaan animasi berlebihan.

Design goal:

```text
Simple, clean, trustworthy, outdoor-friendly, dan mudah digunakan.
```

---

## UI/UX Flow

### Sitemap

Peta halaman keseluruhan sistem, dikelompokkan berdasarkan akses user.

```
ANNAPURNA Adventure
│
├── Public (Tanpa Login)
│   ├── Homepage
│   │   ├── Hero section + CTA
│   │   ├── Produk Pilihan (Tab: Terlaris / Terbaru)
│   │   ├── Kategori highlight
│   │   ├── Tentang ANNAPURNA
│   │   └── CTA "Lihat Semua Produk"
│   │
│   ├── Katalog Produk
│   │   ├── Filter kategori
│   │   ├── Grid product cards
│   │   └── Detail Produk
│   │       ├── Media gallery (foto/video)
│   │       ├── Info produk & harga per durasi
│   │       ├── Pilih variasi (jika ada)
│   │       ├── Rental date selector
│   │       ├── Availability indicator
│   │       └── CTA "Tambah ke Cart"
│   │
│   ├── Katalog Paket
│   │   ├── Grid package cards
│   │   └── Detail Paket
│   │       ├── Media gallery (foto/video)
│   │       ├── Isi paket
│   │       ├── Harga per durasi
│   │       ├── Rental date selector
│   │       └── CTA "Tambah ke Cart"
│   │
│   ├── Syarat & Ketentuan
│   │
│   ├── Login
│   ├── Register
│   ├── Forgot Password
│   └── Reset Password
│
├── Customer (Login Required)
│   ├── Profil
│   │   ├── Lihat profil
│   │   └── Lengkapi/edit profil
│   │
│   ├── Cart
│   │   ├── Daftar item cart
│   │   ├── Edit item (durasi, tanggal, variasi)
│   │   ├── Ringkasan biaya + DP 50%
│   │   ├── Persetujuan S.K
│   │   └── CTA "Checkout"
│   │
│   ├── Pesanan Saya
│   │   ├── Daftar pesanan (status, tanggal)
│   │   └── Detail Pesanan
│   │       ├── Info transaksi
│   │       ├── Item yang disewa
│   │       ├── Status pembayaran
│   │       ├── Status transaksi
│   │       ├── Denda (jika ada)
│   │       └── Timeline status
│   │
│   └── Chatbot Widget (floating, accessible dari semua halaman customer)
│
├── Admin (Role: Admin)
│   └── Dashboard
│       ├── Ringkasan (transaksi aktif, pending, unit status)
│       ├── Manajemen Kategori (CRUD)
│       ├── Manajemen Produk (CRUD + media + harga durasi)
│       ├── Manajemen Variasi (CRUD per produk)
│       ├── Manajemen Unit Barang (CRUD + status management)
│       ├── Manajemen Paket (CRUD + isi paket + media)
│       ├── Transaksi Penyewaan
│       │   ├── Daftar transaksi (filter, search, pagination)
│       │   └── Detail Transaksi
│       │       ├── Info customer & item
│       │       ├── Pembayaran DP status
│       │       ├── Proses pengambilan (jaminan, pelunasan)
│       │       ├── Proses pengembalian (kondisi, status unit)
│       │       └── Input denda manual
│       ├── Syarat & Ketentuan (CRUD)
│       ├── Chatbot Knowledge Base (CRUD)
│       ├── Laporan Transaksi
│       │   ├── Filter periode
│       │   ├── Summary cards (omzet, DP, sisa, denda)
│       │   ├── Tabel detail
│       │   └── Export PDF / Excel
│       └── Activity Log (read-only)
│
└── Owner (Role: Super Admin / Owner)
    └── Dashboard (semua akses admin +)
        ├── Manajemen User (daftar user, ubah role)
        ├── Manajemen Role
        └── Laporan lengkap + export
```

### Customer Journey Flow

```
Homepage → Katalog/Paket → Detail → Pilih Variasi + Durasi + Tanggal
    → Cek Availability → Tambah ke Cart → Login/Register
    → Lengkapi Profil (jika belum) → Cart Review
    → Setujui S.K → Checkout → Bayar DP (Midtrans)
    → Lihat Status di Pesanan Saya → Datang ke Toko (offline)
    → Pengambilan → Pengembalian → Selesai
```

### Admin Journey Flow

```
Login → Dashboard Ringkasan → Kelola Produk/Paket/Unit
    → Lihat Transaksi Masuk → Cek Status DP
    → Proses Pengambilan (jaminan + pelunasan)
    → Proses Pengembalian (cek kondisi)
    → Input Denda (jika ada) → Selesaikan Transaksi
    → Lihat Laporan → Export PDF/Excel
```

### Halaman Per Screen

| Halaman | Deskripsi Singkat | Komponen Utama |
|---|---|---|
| Homepage | Landing page dengan hero, highlight produk, dan CTA | Hero, product highlight tabs, category cards, footer |
| Katalog Produk | Grid produk dengan filter kategori | Filter bar, product card grid, pagination |
| Detail Produk | Info lengkap produk dengan booking interface | Media gallery, price table, variant selector, rental date selector, availability badge |
| Katalog Paket | Grid paket rental | Package card grid, pagination |
| Detail Paket | Info paket dengan isi dan booking | Media gallery, package contents list, rental date selector |
| Syarat & Ketentuan | Halaman S.K publik | Formatted text content |
| Login | Form login email/password + Google | Login form, Google button, link register/forgot |
| Register | Form registrasi customer | Register form, link login |
| Forgot Password | Form request reset password | Email input, submit, success message |
| Reset Password | Form password baru | Password input, confirm, submit |
| Profil | Lengkapi/edit data customer | Profile form (nama, email, WhatsApp, alamat) |
| Cart | Review item sebelum checkout | Cart item list, cost summary, S.K checkbox, checkout button |
| Pesanan Saya | Daftar pesanan customer | Order list cards, status badges |
| Detail Pesanan | Detail lengkap satu pesanan | Transaction info, item list, payment status, timeline |
| Admin Dashboard | Ringkasan operasional | Summary cards, quick action shortcuts |
| Admin Produk | CRUD produk | Data table, form modal/page, media upload |
| Admin Transaksi | Daftar + detail transaksi | Filter bar, transaction table, detail panel |
| Admin Laporan | Laporan transaksi + export | Date range filter, summary cards, detail table, export buttons |
| Admin Knowledge Base | Kelola FAQ chatbot | CRUD table, form |
| Admin User | Kelola user dan role (owner only) | User table, role dropdown |

---

## Spacing System

Spacing menggunakan skala 4px base untuk konsistensi vertikal dan horizontal.

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Jarak antar icon dan teks inline |
| `space-2` | 8px | Padding kecil, gap antar elemen inline |
| `space-3` | 12px | Padding badge, gap antar item list kecil |
| `space-4` | 16px | Padding default card, form field gap |
| `space-5` | 20px | Gap antar form groups |
| `space-6` | 24px | Padding card besar, margin antar sections kecil |
| `space-8` | 32px | Margin antar section dalam satu halaman |
| `space-10` | 40px | Spacing section utama |
| `space-12` | 48px | Margin besar antar major sections |
| `space-16` | 64px | Section padding vertikal (desktop) |
| `space-20` | 80px | Spacing antar full sections (desktop) |
| `space-24` | 96px | Hero/footer padding vertikal |

### Tailwind Spacing Config

Tailwind default spacing scale sudah menggunakan base 4px (`1 = 0.25rem = 4px`). Gunakan utility classes:

```text
p-4 = 16px padding
gap-4 = 16px gap
my-8 = 32px margin vertical
py-16 = 64px padding vertical
```

### Spacing Rules

- Gunakan spacing scale secara konsisten — jangan gunakan nilai arbitrary (e.g. `p-[13px]`).
- Section padding: `py-12` sampai `py-24` tergantung konten.
- Card padding: `p-4` sampai `p-6`.
- Form field gap: `gap-4` sampai `gap-5`.
- Button padding: `px-4 py-2` (small), `px-6 py-3` (default), `px-8 py-4` (large).
- Grid gap: `gap-4` (mobile), `gap-6` (desktop).

---

## Responsive Breakpoints

### Breakpoint Definitions

| Breakpoint | Tailwind | Width | Device Target |
|---|---|---|---|
| Default (mobile) | — | 0–639px | Small phones (360px+) |
| `sm` | `sm:` | 640px+ | Large phones |
| `md` | `md:` | 768px+ | Tablets portrait |
| `lg` | `lg:` | 1024px+ | Tablets landscape, small desktop |
| `xl` | `xl:` | 1280px+ | Desktop |
| `2xl` | `2xl:` | 1366px+ | Large desktop |

### Testing Widths Wajib

Sesuai PRD, responsive testing dilakukan minimal pada:

```text
360px   — Small Android phone
390px   — iPhone standard
768px   — iPad portrait
1024px  — iPad landscape / small laptop
1366px  — Standard laptop/desktop
```

### Layout Strategy

| Halaman | Mobile (< 768px) | Tablet (768px–1023px) | Desktop (1024px+) |
|---|---|---|---|
| Homepage | Single column, stacked sections | 2-column grid highlights | Full-width hero, 3-column grid |
| Katalog | 1–2 column card grid | 2–3 column grid | 3–4 column grid |
| Detail Produk | Stacked: gallery → info → booking | 2-column: gallery + info | 2-column: gallery (60%) + info (40%) |
| Cart | Stacked: items → summary | Side-by-side: items + summary | Side-by-side with wider items |
| Admin Dashboard | Stacked panels, hamburger nav | Sidebar collapsed + content | Full sidebar + content |
| Admin Table | Card layout atau horizontal scroll | Table with horizontal scroll | Full table |

### Responsive Rules

- **Mobile-first approach** — Mulai dari mobile, progressive enhancement ke desktop.
- Tidak boleh ada horizontal scroll yang tidak disengaja.
- CTA utama di mobile: tap area minimal **44px**.
- Tabel besar di mobile: gunakan card layout atau controlled horizontal scroll.
- Chatbot widget tidak boleh menutupi CTA utama.
- Gambar menggunakan `next/image` dengan responsive sizes dan aspect ratio konsisten.

---

## Navigation Design

### Customer Navbar

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]   Katalog   Paket   S.K        [Login] [Cart]  │  ← Desktop
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐
│  [Logo]              [Cart] [☰] │  ← Mobile (hamburger)
└──────────────────────────────────┘
```

- Logo di kiri, navigasi di tengah (desktop), actions di kanan.
- Mobile: hamburger menu untuk navigasi, cart icon selalu terlihat.
- Navbar sticky di atas saat scroll.
- Background: `Surface (#FFFFFF)` dengan border bawah `Border (#E5E7EB)`.
- Tinggi navbar: `64px` desktop, `56px` mobile.
- Logo height: `32–40px`.
- Active link: Primary Green underline atau bold.

### Customer Footer

```
┌─────────────────────────────────────────────────────┐
│  [Logo]                                             │
│  Deskripsi singkat ANNAPURNA Adventure              │
│                                                     │
│  Navigasi       Layanan         Kontak              │
│  ─────────      ─────────       ──────              │
│  Katalog        S.K Penyewaan   Alamat toko         │
│  Paket          Cara Sewa       WhatsApp            │
│  Tentang Kami                   Instagram            │
│                                                     │
│  © 2026 ANNAPURNA Adventure                         │
└─────────────────────────────────────────────────────┘
```

- Background: `Deep Green (#0B3E2F)` atau `Dark Green (#0F4F3C)`.
- Text: `#FFFFFF`.
- Logo menggunakan versi putih.
- Mobile: single column stacked.

### Admin Sidebar

```
┌──────────────┬──────────────────────────────────┐
│  [Logo]      │  Admin Header ([User] [Logout])  │
│              │                                  │
│  Dashboard   │                                  │
│  Kategori    │         Main Content             │
│  Produk      │                                  │
│  Variasi     │                                  │
│  Unit        │                                  │
│  Paket       │                                  │
│  Transaksi   │                                  │
│  Laporan     │                                  │
│  S.K         │                                  │
│  Chatbot     │                                  │
│  ─────────   │                                  │
│  Pengguna*   │         (* = Owner only)         │
│  Role*       │                                  │
│  Log*        │                                  │
└──────────────┴──────────────────────────────────┘
```

- Sidebar width: `240–260px` desktop, collapsible di tablet, off-canvas di mobile.
- Background sidebar: `Surface (#FFFFFF)` dengan border kanan.
- Active item: `Soft Green (#E7F3EE)` background + `Primary Green (#16624B)` text.
- Hover: `Soft Green (#E7F3EE)` background.
- Icon di setiap menu item (Hugeicons).
- Menu items dikelompokkan: Operasional, Konten, Administrasi.
- Mobile: hamburger trigger, sidebar muncul sebagai drawer.

### Admin Header

```
┌───────────────────────────────────────────────┐
│  Page Title              [Admin Name] [Logout]│
└───────────────────────────────────────────────┘
```

- Menampilkan judul halaman aktif.
- User info dan logout di kanan.
- Sticky di atas content area.

---

## Form Design Patterns

### Input Field

```text
Label (Manrope 500, Text Primary)
┌─────────────────────────────────┐
│  Placeholder text               │
└─────────────────────────────────┘
Helper text (optional, Caption 14px, Text Secondary)
```

Style:

```text
Background: #FFFFFF
Border: #E5E7EB
Border focus: #16624B
Border error: #DC2626
Radius: 8px
Padding: 12px 16px
Font: Manrope 400, 16px
```

### Select / Dropdown

- Gunakan shadcn/ui Select component.
- Style konsisten dengan input field.
- Chevron icon di kanan.

### Textarea

- Same style as input, taller height.
- Resize: vertical only.

### Error Display

- Error message muncul **di bawah field terkait**.
- Warna: `Danger (#DC2626)`.
- Font: Caption 14px.
- Error berasal dari `fieldErrors` API response — frontend tidak generate error sendiri.
- Border field berubah ke `Danger` saat error.

```text
Label
┌─────────────────────────────────┐
│  Input value                    │  ← border merah
└─────────────────────────────────┘
⚠ Pesan error dari API
```

### Form Layout

- Vertical layout (satu field per baris) sebagai default.
- 2-column layout hanya untuk field pendek yang berpasangan (e.g. nama depan/belakang).
- Gap antar field: `gap-4` sampai `gap-5`.
- Button submit di bawah form, full-width di mobile.
- Form submit selalu menampilkan loading state (button disabled + spinner).

### Confirmation Dialog

- Digunakan untuk aksi destruktif: batalkan transaksi, ubah status unit, input denda, hapus item.
- Gunakan shadcn/ui AlertDialog.
- Judul jelas ("Konfirmasi Pembatalan", bukan "Apakah Anda yakin?").
- Deskripsi menjelaskan konsekuensi.
- Button: Secondary (Batal) + Primary/Danger (Konfirmasi).

---

## Loading, Empty & Error State Design

### Loading States

**Skeleton Loading:**
- Gunakan shadcn/ui Skeleton component.
- Skeleton harus memiliki ukuran stabil yang mendekati konten final — hindari layout shift.
- Skeleton menggunakan animated pulse (`bg-muted animate-pulse`).
- Gunakan skeleton untuk: product cards, tables, detail pages, dashboard cards.

**Button Loading:**
- Button disabled + spinner icon menggantikan teks atau muncul di sebelah teks.
- Teks berubah menjadi "Memproses..." atau sesuai konteks aksi.

**Page Loading:**
- Gunakan Next.js `loading.tsx` untuk page-level loading.
- Spinner centered untuk operasi singkat.

### Empty States

```text
┌─────────────────────────────────┐
│                                 │
│        [Relevant Icon]          │
│                                 │
│     Judul Deskriptif            │
│  Penjelasan singkat + CTA      │
│                                 │
│      [Action Button]            │
│                                 │
└─────────────────────────────────┘
```

Rules:
- Jangan tampilkan section kosong tanpa penjelasan.
- Selalu sertakan tindakan yang bisa dilakukan user.
- Contoh: "Belum ada pesanan" + CTA "Lihat Katalog".
- Contoh admin: "Belum ada produk" + CTA "Tambah Produk".
- Gunakan Hugeicons yang relevan, bukan ilustrasi random.

### Error States

**Inline Error (form/field):**
- Muncul di bawah field terkait.
- Warna `Danger (#DC2626)`.
- Ikon warning kecil (opsional).

**Page/Section Error:**
```text
┌─────────────────────────────────┐
│                                 │
│       [AlertTriangle Icon]      │
│                                 │
│   Gagal memuat data             │
│   Periksa koneksi dan coba lagi │
│                                 │
│      [Coba Lagi]                │
│                                 │
└─────────────────────────────────┘
```

**Toast Error:**
- Untuk error operasi async (save, delete, update).
- Menggunakan Sonner toast.
- Posisi: top-right desktop, top-center mobile.
- Auto-dismiss setelah 5 detik.
- Warna: Danger background subtle.

### Success States

**Toast Success:**
- Untuk konfirmasi operasi berhasil.
- Posisi sama dengan toast error.
- Warna: Success background subtle.
- Auto-dismiss setelah 3 detik.

**Redirect dengan Feedback:**
- Setelah checkout berhasil: redirect ke halaman pesanan + toast success.
- Setelah save berhasil: tetap di halaman + toast success.

---

## Icon System

### Icon Library

Sistem menggunakan **Hugeicons React** sebagai satu-satunya icon library.

### Icon Sizing

| Context | Size | Tailwind |
|---|---|---|
| Inline text | 16px | `w-4 h-4` |
| Button icon | 16–20px | `w-4 h-4` atau `w-5 h-5` |
| Navigation | 20px | `w-5 h-5` |
| Empty state | 48px | `w-12 h-12` |
| Hero/feature | 32–40px | `w-8 h-8` atau `w-10 h-10` |

### Icon Usage Rules

- Gunakan **satu style** secara konsisten — default Hugeicons stroke style (stroke/outline).
- Jangan mix icon dari library berbeda.
- Icon selalu memiliki `aria-hidden="true"` jika ada teks label yang menyertainya.
- Icon tanpa teks label harus memiliki `aria-label` yang deskriptif.
- Warna icon mengikuti warna teks parent atau warna status.
- Jangan gunakan icon sebagai satu-satunya penanda status — selalu sertakan teks.

### Common Icon Mapping

| Usage | Icon (Hugeicons) |
|---|---|
| Calendar/tanggal | `Calendar01Icon` |
| Duration/clock | `Clock01Icon` |
| Cart | `ShoppingCart01Icon` |
| Search | `Search01Icon` |
| Filter | `SlidersIcon` |
| Close/dismiss | `Cancel01Icon` |
| Menu/hamburger | `Menu01Icon` |
| Check/success | `CheckmarkCircle02Icon` |
| Warning | `AlertTriangleIcon` |
| Error | `AlertCircleIcon` |
| Info | `InformationCircle02Icon` |
| Edit | `PencilEdit01Icon` |
| Delete | `Trash02Icon` |
| Add/create | `PlusSignIcon` |
| Upload | `Upload01Icon` |
| Download/export | `Download01Icon` |
| User/profile | `UserIcon` |
| Logout | `Logout01Icon` |
| Settings | `Settings01Icon` |
| Eye/view | `EyeIcon` |
| ChevronDown | `ChevronDownIcon` |
| ChevronRight | `ChevronRightIcon` |
| ArrowLeft/back | `ArrowLeftIcon` |
| Package | `PackageIcon` |
| Home | `Home01Icon` |

---

## Animation & Motion Guidelines

### Motion Principles

- Motion digunakan untuk **memberikan feedback**, bukan dekorasi.
- Setiap animasi harus memiliki tujuan yang jelas: memperjelas state transition, menarik perhatian ke perubahan, atau meningkatkan perceived performance.
- Motion tidak boleh menghambat interaksi atau memperlambat task completion.

### Allowed Transitions

| Elemen | Animasi | Durasi | Easing |
|---|---|---|---|
| Page transition | Fade in | 150–200ms | `ease-out` |
| Modal/dialog | Fade + scale in | 200ms | `ease-out` |
| Modal close | Fade out | 150ms | `ease-in` |
| Dropdown/menu | Slide down + fade | 150ms | `ease-out` |
| Toast appear | Slide in dari kanan/atas | 200ms | `ease-out` |
| Toast dismiss | Fade out | 150ms | `ease-in` |
| Skeleton pulse | Continuous pulse | 1.5s cycle | `ease-in-out` |
| Button hover | Background color | 150ms | `ease` |
| Button press | Subtle scale (0.98) | 100ms | `ease` |
| Sidebar collapse | Width transition | 200ms | `ease-in-out` |

### Motion Rules

- Durasi animasi: **100–300ms** untuk UI feedback, tidak lebih.
- Jangan gunakan animasi panjang (> 500ms) untuk elemen interaktif.
- Jangan gunakan bounce, elastic, atau spring effect yang berlebihan.
- Skeleton loading menggunakan pulse, bukan shimmer berlebihan.
- Carousel transition: smooth slide, durasi 300ms.
- `motion` library hanya digunakan pada interactive boundaries — jangan import di setiap component.

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Semua animasi harus menghormati `prefers-reduced-motion`.
- Jika reduced motion aktif, elemen langsung muncul tanpa animasi.
- Test selalu dilakukan dengan reduced motion on dan off.

---

## Accessibility Design Rules

### Contrast & Color

- Teks utama harus memenuhi **WCAG 2.1 AA** contrast ratio (minimal 4.5:1 untuk teks normal, 3:1 untuk teks besar).
- Status tidak dibedakan **hanya** dengan warna — selalu sertakan teks dan/atau icon.
- Badge menggunakan kombinasi warna background + teks yang kontras.

### Focus States

- Semua elemen interaktif harus memiliki **visible focus indicator**.
- Focus ring: `ring-2 ring-offset-2 ring-[#16624B]` (Primary Green).
- Focus state tidak boleh dihilangkan dengan `outline: none` tanpa pengganti.
- Tab order mengikuti urutan visual halaman.

### Keyboard Navigation

- Semua fungsi harus dapat diakses menggunakan keyboard.
- Form navigasi: `Tab` ke field berikutnya, `Shift+Tab` ke sebelumnya.
- Modal: focus trapped di dalam modal saat terbuka.
- Carousel: tombol previous/next keyboard-accessible.
- Dropdown/select: `Enter` atau `Space` untuk open, `Arrow` untuk navigate, `Escape` untuk close.

### Form Accessibility

- Setiap field input harus memiliki `<label>` yang terhubung (via `htmlFor`/`id`).
- Placeholder tidak menggantikan label.
- Required fields ditandai dengan teks atau asterisk (`*`), bukan hanya warna.
- Error message terhubung ke field via `aria-describedby`.
- Grup radio/checkbox menggunakan `fieldset` + `legend`.

### Image & Media

- Semua gambar produk/paket memiliki `alt` text deskriptif.
- Gambar dekoratif (non-informational) menggunakan `alt=""`.
- Video memiliki poster/thumbnail dan native controls.
- Video tidak autoplay dengan suara.

### Screen Reader

- Perubahan dinamis (e.g. tanggal maksimal pengembalian berubah) diumumkan via `aria-live="polite"`.
- Icon-only buttons memiliki `aria-label`.
- Status badge memiliki teks yang dapat dibaca screen reader.
- Loading state dikomunikasikan via `aria-busy="true"`.

### Tap Target

- Touch target minimal **44×44px** untuk semua elemen interaktif di mobile.
- Spacing antar tap targets minimal **8px** untuk menghindari accidental tap.

---

## Technical Design Decisions

### TDD-001: Manrope sebagai Primary Font

**Keputusan:** Menggunakan Manrope sebagai satu-satunya font.

**Alasan:** Manrope adalah geometric sans-serif yang modern, clean, dan memiliki excellent readability di berbagai ukuran. Mendukung multi-weight (400–700) yang mencukupi semua kebutuhan UI. Satu font mengurangi HTTP request dan mempercepat loading. Plus Jakarta Sans dipertimbangkan tapi Manrope lebih cocok dengan karakter "outdoor minimalist".

**Fallback:** Inter → system-ui → sans-serif.

---

### TDD-002: Atomic Design untuk Component Architecture

**Keputusan:** Menggunakan Atomic Design sederhana (atoms, molecules, organisms, layouts).

**Alasan:**
- **Atoms** (`ui/`): shadcn/ui primitives yang sudah accessible dan customizable.
- **Molecules**: Komposisi beberapa atoms dengan satu fungsi spesifik (product card, rental date selector).
- **Organisms**: Section kompleks yang terdiri dari beberapa molecules (catalog grid, checkout form).
- **Layouts**: Page-level structure (navbar, sidebar, footer).

Pendekatan ini memaksa developer berpikir reusable, mengurangi duplikasi, dan membuat design review lebih mudah.

---

### TDD-003: shadcn/ui vs Component Library Tradisional

**Keputusan:** Menggunakan shadcn/ui, bukan MUI, Ant Design, atau Chakra UI.

**Alasan:**
- Kode di-copy ke project — full control, tidak ada vendor lock-in.
- Built on Radix UI primitives — accessible by default.
- Tailwind-native — konsisten dengan design system.
- Customizable — komponen dapat diubah sesuai brand tanpa fighting framework.
- Bundle size minimal — hanya include yang digunakan.

**Trade-off:** Tidak ada automatic theming atau pre-built complex components (data table, chart). Dimitigasi dengan menambah library spesifik hanya saat dibutuhkan.

---

### TDD-004: Color Usage Ratio 70/20/10

**Keputusan:** 70% neutral/white, 20% gray/layout, 10% green/accent.

**Alasan:** Rasio ini memastikan tampilan clean dan professional tanpa overwhelming user dengan warna. Hijau brand digunakan secara strategis untuk CTA, active state, dan highlight — membuat elemen penting menonjol. Rasio ini juga mencegah tampilan terlihat seperti template AI yang overuse warna.

---

### TDD-005: Mobile-First Customer, Desktop-First Admin

**Keputusan:** Customer UI menggunakan mobile-first design. Admin UI menggunakan desktop-first dengan mobile usability.

**Alasan:** Customer kemungkinan besar browse dan booking dari smartphone. Admin kemungkinan besar bekerja dari desktop/tablet di toko. Mobile-first memastikan customer experience optimal, sementara admin dashboard tetap usable di mobile meskipun tidak fully optimized.

---

### TDD-006: No Frontend Validation — Error from API Only

**Keputusan:** Frontend tidak menjalankan validasi. Error ditampilkan dari `fieldErrors` API response.

**Alasan desain:** Satu sumber kebenaran menghindari inkonsistensi rule antara frontend dan backend. Dmitigasi secara UX dengan: immediate loading state setelah submit, error message yang jelas dan ditampilkan dekat field terkait, form tidak menghapus input setelah error.

**Implikasi desain:**
- Submit button selalu menampilkan loading state.
- Error message muncul di bawah field terkait setelah API response.
- Form tetap mempertahankan input user setelah error — user hanya perlu perbaiki field yang salah.
