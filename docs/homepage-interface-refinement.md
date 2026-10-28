# Homepage Interface & Colour Palette Refinement Plan

## Context
Antarmuka landing page ANNAPURNA Adventure dan dokumentasi desain (`Design.md` serta `docs/implementation plan.md`) memerlukan standardisasi visual yang konsisten, clean, dan profesional. Saat ini terdapat inkonsistensi palet warna di mana utility Tailwind `emerald-*` bercampur aduk dengan warna brand pine green (`#16624B`), variasi shade hijau belum terkalibrasi secara sistematis (50–950), serta detail antarmuka belum menerapkan prinsip design engineering modern (*concentric border radius*, *layered ambient shadows*, *tabular numbers*, *text balancing*, *image edge outlines*, dan *tactile scale on press*). Rencana ini menyusun restrukturisasi komprehensif token warna di `Design.md` & `src/app/globals.css`, pemutakhiran blueprint `docs/implementation plan.md`, serta perbaikan visual dan implementasi komponen landing page (Hero, Rental Search Widget, Trust Signals, Category Grid, Product Tabs, Bento Packages, dan How It Works).

---

## Approach

### 1. Refrukturisasi & Standardisasi Colour Palette ("Consistent, Clean, Professional")

Perbarui definisi warna di `Design.md` dan daftarkan sebagai token CSS Variables serta Tailwind v4 `@theme` di `src/app/globals.css`. Hentikan penggunaan arbitrer `emerald-*` dan heksadesimal ad-hoc.

#### A. Annapurna Pine Brand Scale (11-Step Tonal Scale)
Dikalibrasi dari warna signature `#16624B` (Forest Pine) untuk seluruh elemen brand outdoor:

| Token Tailwind | CSS Variable | Hex Code | Peruntukan & Panduan Penggunaan |
| --- | --- | --- | --- |
| `brand-50` | `--color-brand-50` | `#F0F7F4` | Ultra-clean soft wash: background card lembut, banner info, background How It Works |
| `brand-100` | `--color-brand-100` | `#DCEDE5` | Chip items, badge aktif, hover state container ringan |
| `brand-200` | `--color-brand-200` | `#BDDDD0` | Border halus komponen brand, divider elemen aktif |
| `brand-300` | `--color-brand-300` | `#8EC4B0` | Highlight teks pada dark hero (menggantikan `#7EDDB5` ad-hoc), subtle accent |
| `brand-400` | `--color-brand-400` | `#5AA58D` | Secondary icon accents, decorative subtle marks |
| `brand-500` | `--color-brand-500` | `#33856D` | Fresh outdoor foliage accent, vibrant indicators |
| `brand-600` | `--color-brand-600` | `#16624B` | **Primary Signature Brand Color**: Tombol CTA utama, logo brand, harga produk, active links |
| `brand-700` | `--color-brand-700` | `#0F4F3C` | Hover button utama, pressed state, stroke aktif gelap |
| `brand-800` | `--color-brand-800` | `#0B3E2F` | Deep forest surface: background Footer, dark card containers |
| `brand-900` | `--color-brand-900` | `#072C21` | Deep spruce: dark banner scrim, dark header contrast |
| `brand-950` | `--color-brand-950` | `#031711` | Near-black spruce: deep photo overlays, ambient shadow undertone |

#### B. Clean & Crisp Neutral Scale (Slate-Tinted Modern Neutrals)
Menghindari tampilan "murahan / kusam" (*dirty gray*) dan memberikan kontras tajam berstandar WCAG AAA (≥ 7:1) dan AA (≥ 4.5:1):

| Token Tailwind | CSS Variable | Hex Code | Peruntukan & Panduan Penggunaan |
| --- | --- | --- | --- |
| `canvas` | `--color-background` | `#F8FAFC` | Background halaman utama (Slate-50, bersih dan cerah) |
| `surface` | `--color-surface` | `#FFFFFF` | Latar belakang kartu produk, widget melayang, dialog modal |
| `surface-subtle` | `--color-surface-subtle` | `#F1F5F9` | Table header background, card hover secondary, placeholder container |
| `border-subtle` | `--color-border-subtle` | `rgba(15,23,42,0.04)` | Border kartu modern (dikombinasikan dengan layered shadow) |
| `border-default` | `--color-border` | `#E2E8F0` | Border standar input form, separator, divider tabel |
| `border-strong` | `--color-border-strong` | `#CBD5E1` | Active input border, focused tab outlines |
| `text-muted` | `--color-text-muted` | `#94A3B8` | Placeholder, subtle timestamps, non-interactive icon strokes |
| `text-secondary` | `--color-muted` | `#64748B` | Subtitle, deskripsi produk, helper text (kontras 5.8:1 pada background putih) |
| `text-primary` | `--color-foreground` | `#0F172A` | Judul H1/H2/H3, nama produk, teks utama (Deep Slate Ink, tajam & elegan) |

#### C. Semantic Status Tokens (Jelas & Terisolasi dari Brand Color)
Memastikan status tidak tertukar atau melemahkan identitas brand green:
- **Success (`available`):** Text `#15803D`, Background `#ECFDF5`, Border `#A7F3D0`
- **Warning (`reserved` / `maintenance`):** Text `#B45309`, Background `#FFFBEB`, Border `#FDE68A`
- **Danger (`damaged` / `lost` / `late`):** Text `#B91C1C`, Background `#FEF2F2`, Border `#FECACA`
- **Info (`rented`):** Text `#1D4ED8`, Background `#EFF6FF`, Border `#BFDBFE`

#### D. Multi-layer Box Shadow System (Menggantikan Garis Border Tebal)
Definisikan 4 level bayangan di `@theme`:
```css
--shadow-card: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
--shadow-card-hover: 0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
--shadow-floating: 0 20px 40px -6px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06);
--shadow-modal: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
```

---

### 2. Penerapan Prinsip Design Engineering UI ("Make Interfaces Feel Better")

#### A. Concentric Border Radius (`outerRadius = innerRadius + padding`)
Menghapus radius acak atau radius seragam pada kontainer bersarang:
- **Rental Search Widget:** Kontainer utama `rounded-2xl md:rounded-3xl` (padding `p-4 md:p-5` = 16-20px), input & tombol di dalamnya `rounded-xl` (12px) `[24 - 16 = 8, optically 12px]`.
- **ProductCard:** Kartu `rounded-2xl` (16px), inner badge `rounded-lg` (8px) dengan margin inset `top-3 right-3` (12px).
- **CategoryCard:** Kartu `rounded-2xl` (16px), inner icon container `rounded-xl` (12px) dengan padding `p-3` (12px).
- **Featured Bento Box:** Bento master container `rounded-3xl` (24px), preview chips `rounded-lg` (8px), tombol CTA `rounded-xl` (12px).
- **Navbar Profile Pill:** Kontainer `rounded-full` (`pl-1.5 pr-3 py-1`), avatar ikon di dalamnya `rounded-full` (24px).

#### B. Shadows Over Borders
Ganti border solid tebal `border-gray-200` dengan kombinasi multi-layer shadow + border beropasitas rendah:
- **Navbar Sticky Header:** `bg-white/80 backdrop-blur-md border-b border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.02)]`.
- **Rental Search Widget:** `bg-white/95 backdrop-blur-md border border-black/[0.06] shadow-[0_20px_40px_-6px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06)]`.
- **ProductCard:** `bg-white border border-black/[0.04] shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)]`.

#### C. Tabular Numbers (`tabular-nums`)
Mencegah getaran teks (*layout shift*) saat angka berganti atau dimuat dinamis:
- `ProductCard`: harga sewa `tabular-nums tracking-tight`.
- `PackageCard`: harga coret, harga final sewa, dan badge hemat `tabular-nums`.
- `RentalSearchWidget`: tanggal terpilih dan durasi hari berkelas `tabular-nums`.
- `CartButton`: angka kuantitas badge navbar menggunakan `tabular-nums`.
- `CategoryCard`: jumlah total barang katalog `tabular-nums`.

#### D. Typography & Text Wrapping (`text-wrap: balance` & `text-wrap: pretty`)
- **Headings (H1, H2, H3):** Beri kelas `text-balance tracking-tight` pada Hero headline, section titles (Kategori, Produk, Paket, Cara Sewa), dan widget heading untuk mencegah kata menggantung (*widows/orphans*).
- **Body & Subtitles:** Beri kelas `text-pretty leading-relaxed` pada sub-headline Hero, deskripsi paket, dan butir keunggulan Trust Signals.

#### E. Image Outlines (Subtle Edge Definition)
Foto outdoor berlatar belakang putih atau langit terang wajib diberi garis tepi lembut murni hitam beropasitas rendah (`ring-1 ring-black/[0.06]`):
- `ProductCard` thumbnail: `aspect-square ring-1 ring-black/[0.06] rounded-xl overflow-hidden`.
- `PackageCard` banner: `aspect-[16/9] ring-1 ring-black/[0.06] rounded-2xl overflow-hidden`.
- `HeroSection` image scrim: gradient multi-stop `bg-gradient-to-t from-black/85 via-black/40 via-50% to-transparent`.

#### F. Tactile Press Feedback & Eliminasi `transition: all`
- Seluruh tombol interaktif utama (`[Lihat Katalog]`, `[Cek Ketersediaan]`, `[Lihat Paket]`, `[Lihat Detail]`): tambahkan `active:scale-[0.96] transition-transform duration-150 ease-out`.
- Kartu produk & paket: `active:scale-[0.98] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1`.
- Tab switcher: `transition-[color,background-color,border-color] duration-150 active:scale-[0.97]`.
- Hapus semua deklarasi `transition-all` yang berpotensi memicu jitter layout GPU.

#### G. Minimum Hit Area (≥ 44×44px Touch Targets)
- Link navbar: `min-h-[44px] flex items-center px-3.5`.
- Link footer: `min-h-[44px] flex items-center py-2`.
- Mobile toggle button & cart button: `min-w-[44px] min-h-[44px] flex items-center justify-center`.

---

### 3. Implementasi Komponen Landing Page & Pemutakhiran Halaman

#### A. Pembuatan `RentalSearchWidget` (`src/components/organisms/rental-search-widget.tsx`)
- Letak: Melayang (*overlapping*) dengan margin negatif `-mt-12 md:-mt-16 relative z-20 container-page`.
- Desain & Struktur:
  - Outer container: `rounded-2xl md:rounded-3xl bg-white/95 backdrop-blur-md p-4 md:p-5 shadow-[0_20px_40px_-6px_rgba(15,23,42,0.12),0_8px_16px_-4px_rgba(15,23,42,0.06)] border border-black/[0.06]`.
  - Grid: 1 kolom di mobile, 3 kolom di desktop (`grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center`).
  - Field 1 (Tanggal Mulai): Popover trigger dengan icon `Calendar01Icon`, font `tabular-nums`, tinggi input 48px, radius `rounded-xl`, border `border-slate-200 focus:border-brand-600`.
  - Field 2 (Durasi Sewa): Select dropdown durasi ("Permalam - 1 Hari", "Perkegiatan I - 2 Hari", "Perkegiatan II - 3 Hari") dengan icon `Clock01Icon`.
  - Field 3 (Tombol Aksi CTA): Tombol `[Cek Ketersediaan]` berwarna `bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-12 px-6 font-semibold active:scale-[0.96] transition-transform shadow-sm`. Mengarahkan ke `/katalog?startDate=...&scheme=...`.

#### B. Pembuatan `TrustSignalsSection` (`src/components/organisms/trust-signals-section.tsx`)
- Menggantikan placeholder dan menyajikan 4 pilar nilai layanan:
  1. **Peralatan Bersih & Terawat:** Peralatan dicuci, disterilkan, dan dicek kelengkapannya sebelum diserahkan.
  2. **Tarif Fleksibel & Transparan:** Pilihan skema sewa permalam atau perkegiatan tanpa biaya tersembunyi.
  3. **Booking Cepat, DP 30%:** Cukup bayar DP 30% via online transfer/QRIS, pelunasan sisa saat ambil di kasir toko.
  4. **Basecamp Akses Gunung:** Berlokasi strategis di Purwokerto (jalur cepat Gunung Slamet, Prau, & Sindoro-Sumbing).
- Visual Ikon: Kontainer `w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center`.
- Layout: 2 kolom di mobile, 4 kolom di desktop (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`).

#### C. Refaktor `FeaturedPackages` ke Asymmetric Bento Grid (`src/components/organisms/featured-packages.tsx`)
- Susunan:
  - **Sisi Kiri (40% desktop):** Editorial story card berlatar `bg-gradient-to-b from-brand-50 to-white border border-brand-100 rounded-3xl p-6 md:p-8 flex flex-col justify-between`. Teks: "Sewa Paket Lebih Hemat & Praktis", badge "Solusi Lengkap Sekali Angkut", callout keuntungan, dan tombol CTA `[Lihat Semua Paket]`.
  - **Sisi Kanan (60% desktop):** Grid asimetris (1 kartu utama lanskap + 2 kartu sekunder) yang menampilkan:
    - Banner paket dengan `ring-1 ring-black/[0.06] rounded-2xl`.
    - Daftar preview isi paket dengan chip pill `rounded-lg bg-slate-100 text-slate-700`.
    - Harga sewa tebal berlabel `tabular-nums` dan badge hemat dinamis.

#### D. Penyesuaian Copy Identitas & Alamat Toko
- `hero-section.tsx`: Ubah "di Malang" menjadi "di Purwokerto (Basecamp pendakian Gunung Slamet & Jawa Tengah)", tinggi section disesuaikan ke `min-h-[75vh] md:min-h-[85vh]` agar overlapping widget proporsional, ganti teks highlight `#7EDDB5` menjadi `text-brand-300`.
- `how-it-works-section.tsx`: Ubah copy Step 2 dari "Bayar DP 50%" menjadi "Bayar DP 30%".
- `footer.tsx`: Pastikan alamat toko Purwokerto tertera lengkap: "Jl. Kampus No 8-9, Grendeng, Purwokerto Utara, Purwokerto, Jawa Tengah 53122".

#### E. Pembaruan Dokumen Acuan Desain
- `Design.md`:
  - Perbarui Section 3 ("Colour Palette") dengan tabel 11-step Pine Brand Scale, Clean Slate Neutrals, Semantic Statuses, dan aturan anti-pattern (larangan `emerald-*` arbitrer).
  - Perbarui Section 4 ("UI Component Rules") untuk Button, Card, Badge, dan Floating Widget dengan rumus radius konsentris dan layered shadows.
- `docs/implementation plan.md`:
  - Sinkronkan 8 anatomi section dengan komponen yang ada dan token warna baru.

---

## Critical files & anchors

1. `Design.md:43-160`: Pemutakhiran spesifikasi colour palette resmi, rasio warna (70/20/10), aturan anti-pattern, dan panduan komponen.
2. `src/app/globals.css:1-76`: Konfigurasi token Tailwind v4 `@theme` (definisi `--color-brand-50` s/d `950`, slate neutrals, dan multi-layer shadow tokens).
3. `src/components/organisms/rental-search-widget.tsx` (File Baru): Organism widget pencarian ketersediaan rental melayang dengan radius konsentris dan layered shadow.
4. `src/components/organisms/trust-signals-section.tsx` (File Baru): Organism 4 trust signals dengan copy tarif transparan dan DP 30%.
5. `src/components/organisms/featured-packages.tsx`: Transformasi layout ke Asymmetric Bento Grid (40% cerita editorial, 60% showcase paket).
6. `src/components/molecules/product-card.tsx:67-140`: Rasio thumbnail 1:1 (`aspect-square`), `ring-1 ring-black/[0.06]`, `tabular-nums` pada harga, dan feedback `scale-[0.98]`.
7. `src/app/(main)/page.tsx:20-64`: Orkestrasi seksi beranda yang rapi: Hero -> RentalSearchWidget -> TrustSignals -> CategoryGrid -> ProductTabs -> FeaturedPackages -> HowItWorks.

---

## Verification

1. **Audit Visual & Feel (Smoke Run via Browser):**
   - Jalankan `npm run dev` dan buka `http://localhost:3000`.
   - Pastikan widget search melayang secara seamless memotong batas bawah Hero dan section Trust Signals tanpa clipping atau overflow horizontal pada resolusi 375px (mobile) maupun 1440px (desktop).
   - Pastikan warna hijau di seluruh landing page bersumber seragam dari palet `brand-600` (`#16624B`), hero highlight menggunakan `brand-300` (`#8EC4B0`), dan footer menggunakan `brand-800` (`#0B3E2F`) tanpa ada warna hijau `emerald-*` yang bertabrakan.
   - Uji klik tombol (Hero CTA, Search Button, Product Card): verifikasi tactile feedback `active:scale-[0.96]` terasa membal dan instan.
   - Periksa typography angka: pastikan harga pada ProductCard dan PackageCard menggunakan angka tabular (`tabular-nums`) yang stabil tanpa pergeseran layout.
   - Periksa headline Hero dan judul section: verifikasi tidak ada satu kata terisolasi (*widow*) berkat `text-wrap: balance`.
2. **Type Safety & Integrity Check:**
   - Jalankan `npx tsc --noEmit` untuk memastikan seluruh tipe komponen baru dan refaktor valid tanpa error TypeScript.
3. **Regression Test Suite:**
   - Jalankan `npm test` untuk memverifikasi seluruh 40 unit dan regression test tetap berstatus 100% PASS (0 failures).

---

## Assumptions & contingencies

- **Backward Compatibility Token:** Untuk menjaga kompatibilitas komponen internal yang sudah memakai `--color-primary`, `--color-primary-hover`, `--color-primary-dark`, dan `--color-primary-soft`, variabel-variabel tersebut dialiaskan langsung ke token `brand-600`, `brand-700`, `brand-800`, dan `brand-50` di `src/app/globals.css`. Jika komponen tertentu masih membutuhkan penyesuaian kontras lokal, implementer menggunakan token `brand-*` terkait tanpa memutus caller lain.
- **Data Ketersediaan di Search Widget:** Jika pengguna menekan tombol `[Cek Ketersediaan]` tanpa memilih tanggal atau skema durasi secara spesifik, widget secara otomatis mengarahkan ke halaman `/katalog` umum dengan query parameter default hari esok (`tomorrow`) dan skema `permalam`.
