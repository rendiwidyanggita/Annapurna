# Audit & Rencana Peningkatan Interface Homepage ("Make Interfaces Feel Better")

## Context
Dokumen `docs/implementation plan.md` memetakan 8 seksi landing page (Navbar, Hero, Rental Search Widget, Trust Signals, Kategori, Highlight Produk, Highlight Paket Bento, Footer) dengan pendekatan visual alam dan story-commerce. Namun, spesifikasi di dokumen tersebut masih berstatus *draft anatomi* kasar: belum merinci prinsip *design engineering* (radius konsentris, kontras bayangan berlapis, alignment optis, kestabilan tipografi tabular, outlines gambar, dan feedback taktil), belum sinkron dengan kondisi komponen saat ini (widget search dan value props belum ada di kode, teks copy masih merujuk lokasi lama Malang dan DP 50%), serta masih banyak memakai `transition: all`. Rencana audit ini mematangkan dokumen dan kode landing page ANNAPURNA agar antarmuka terasa solid, responsif, dan konsisten (*feels better*).

*Note: Saya ingin merubah colour palette nya agar lebih konsisten, clean, dan professional, ubah Design.md nya jika perlu
---

## Approach

### 1. Audit Prinsip Design Engineering & Perbaikan Detail UI ("Feels Better")

#### Concentric Border Radius (`outerRadius = innerRadius + padding`)
Elemen bersarang yang memiliki radius sama atau acak membuat tampilan terkesan kaku dan tidak presisi. Diterapkan rumus matematis konsentris:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **Rental Search Widget** (`src/components/organisms/rental-search-widget.tsx`) | Belum ada komponen, card rencana memakai radius acak | Outer card `rounded-3xl` (24px) dengan padding `p-4` (16px), inner input & button fields `rounded-xl` (12px): `24 - 16 = 8` (optically 10-12px) |
| **ProductCard** (`src/components/molecules/product-card.tsx`) | Card `rounded-[var(--radius-lg)]` (12px), StatusBadge `rounded-full` / `rounded-md` (6px) di `top-2 right-2` (8px) | Card `rounded-2xl` (16px), inner badge `rounded-lg` (8px) dengan inset `top-3 right-3` (12px): `16 - 12 = 4` (inner radius proporsional) |
| **CategoryCard** (`src/components/molecules/category-card.tsx`) | Card `rounded-[var(--radius-lg)]` (12px), inner icon box tidak ada | Card `rounded-2xl` (16px), inner icon container `w-12 h-12 rounded-xl` (12px) dengan padding `p-4` (16px) |
| **Bento Package Card** (`src/components/molecules/package-card.tsx`) | Card `rounded-[var(--radius-lg)]` (12px), chip items `rounded-[var(--radius-sm)]` (6px) | Outer container bento `rounded-3xl` (24px), inner item tags `rounded-lg` (8px), tombol CTA `rounded-xl` (12px) |
| **Navbar Profile Pill** (`src/components/layouts/navbar.tsx`) | Outer `rounded-[var(--radius-md)]` (10px) dengan `py-1.5` (6px), inner avatar `rounded-full` (24px circle) | Outer container `rounded-full` dengan padding `pl-1.5 pr-3 py-1`, inner avatar `rounded-full` (konsisten oval pill) |

---

#### Shadows Over Borders (Kedalaman Alami Tanpa Garis Kaku)
Mengganti border solid tebal dengan multi-layer transparent box-shadow yang menyatu mulus di latar belakang foto maupun warna netral:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **Navbar Sticky Header** (`src/components/layouts/navbar.tsx`) | `border-b border-[var(--color-border)]` (garis abu-abu solid pemotong visual) | `border-b border-black/[0.04] bg-white/80 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]` |
| **Rental Search Widget** (`src/components/organisms/rental-search-widget.tsx`) | Rencana card melayang standar dengan border biasa | Multi-layer ambient + key shadow: `shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/[0.06] bg-white/95 backdrop-blur-sm` |
| **ProductCard Hover** (`src/components/molecules/product-card.tsx`) | `shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]` | Ambient lift: `shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)] border border-black/[0.06]` |
| **Bento Package Cards** (`src/components/organisms/featured-packages.tsx`) | Border solid standar `border-gray-200` | Kartu utama (featured): `shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-emerald-900/10 bg-gradient-to-b from-white to-[#F7FAF8]` |

---

#### Tabular Numbers (`tabular-nums`)
Mencegah layout shift (teks bergeser/bergetar) saat angka mata uang, durasi, tanggal, atau badge berganti:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **ProductCard Price** (`src/components/molecules/product-card.tsx:130-135`) | `<p className="text-sm font-bold text-[var(--color-primary)]">{formatRupiah(pricePerNight)}` | `<p className="text-sm font-bold text-[var(--color-primary)] tabular-nums tracking-tight">{formatRupiah(pricePerNight)}` |
| **PackageCard Price & Savings** (`src/components/molecules/package-card.tsx:132-134`) | `<span className="text-sm sm:text-base font-bold ...">{formatRupiah(pricePermalam)}` | Tambahkan `tabular-nums` pada harga sewa dan harga coret (original price) |
| **Rental Search Widget Date & Duration** | Belum ada | Tampilan rentang tanggal (misal `14 Nov - 16 Nov 2026`) dan jumlah malam wajib berkelas `tabular-nums font-mono` |
| **Cart Button Badge** (`src/components/layouts/cart-button.tsx`) | Badge angka jumlah barang di navbar | Tambahkan `tabular-nums` agar lebar badge tidak melebar/menyempit saat item bertambah |
| **Category Card Item Count** (`src/components/molecules/category-card.tsx:90-94`) | `<span>{productCount} {unitLabel}</span>` | Tambahkan `tabular-nums` pada angka kuantitas katalog |

---

#### Typography & Text Wrapping (`text-wrap: balance` & `text-wrap: pretty`)
Mencegah kata menggantung (*widows/orphans*) pada headline dan memastikan paragraf mengalir rapi:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **Hero Headline & Subtitle** (`src/components/organisms/hero-section.tsx:70-82`) | Teks H1 dengan `<br />` kaku; sub-headline tanpa balancing | H1 menggunakan `text-balance leading-[1.12] tracking-tight`, sub-headline menggunakan `text-pretty leading-relaxed` |
| **Section Titles** (Kategori, Produk, Paket, Trust Signals) | Judul seksi memakai `leading-normal` tanpa balance | Semua H2 seksi diberi `text-balance font-extrabold tracking-tight` |
| **Product & Package Titles** | `line-clamp-2` tanpa kontrol orphan | Judul produk menggunakan `line-clamp-2 text-pretty leading-snug` |
| **Trust Signals Body** (`src/components/organisms/trust-signals-section.tsx`) | Belum ada | H3 `text-balance font-bold text-gray-900`, P `text-pretty text-xs text-gray-600 leading-relaxed` |

---

#### Image Outlines (Subtle Edge Definition)
Foto alat outdoor berlatar putih/terang tidak boleh membaur ke background kartu:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **ProductCard Thumbnail Container** (`src/components/molecules/product-card.tsx:86`) | `relative w-full aspect-[4/3] overflow-hidden` tanpa outline | Ubah aspect ratio ke `aspect-square` (1:1 per plan) dan tambahkan `ring-1 ring-black/[0.06] rounded-xl overflow-hidden` |
| **PackageCard Banner Container** (`src/components/molecules/package-card.tsx:68`) | `relative w-full aspect-[16/9] overflow-hidden` | Tambahkan `ring-1 ring-black/[0.06] overflow-hidden` untuk batas gambar yang tajam |
| **Hero Image Scrim** (`src/components/organisms/hero-section.tsx:42`) | Gradient kaku 3-step hitam | Gradient multi-stop `bg-gradient-to-t from-black/85 via-black/40 via-50% to-transparent` menjaga keterbacaan teks |

---

#### Tactile Press Feedback (`active:scale-[0.96]`) & Penghapusan `transition: all`
Memastikan interaksi sentuh/klik terasa membal dan performan GPU tanpa jitter:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **Tombol CTA Hero** (`src/components/organisms/hero-section.tsx:86-114`) | `transition-all duration-150` | `active:scale-[0.96] transition-transform duration-150 ease-out` |
| **Tombol Cek Ketersediaan** (Rental Search Widget) | Belum ada | `active:scale-[0.96] transition-transform duration-150 shadow-md hover:shadow-lg` |
| **ProductCard & CategoryCard** | `transition-all duration-200 ease-out hover:scale-105 active:scale-100` | Ganti ke spesifik: `transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-1 active:scale-[0.98]` |
| **Tab Switcher Buttons** (`src/components/atoms/tab-switcher.tsx`) | `transition-colors duration-150` | `transition-[color,background-color,border-color] duration-150 active:scale-[0.97]` |

---

#### Minimum Hit Area (≥ 40×40px Touch Target)
Menjamin kemudahan navigasi di mobile/tablet:

| Komponen & Lokasi | Kondisi Saat Ini (Before) | Rekomendasi Solutif (After) |
| --- | --- | --- |
| **Navbar Links** (`src/components/layouts/nav-links.tsx`) | `px-3 py-1.5 text-sm` (~32px total height) | `px-3.5 py-2.5 text-sm flex items-center min-h-[40px]` |
| **Footer Nav Links** (`src/components/layouts/footer.tsx`) | Teks bertumpuk rapat `space-y-2.5` | `space-y-1` dengan setiap link `py-2 block text-sm min-h-[40px] flex items-center text-white/70 hover:text-white` |
| **Mobile Menu Toggle & Cart Icon** | Ukuran tombol standar | Beri `min-w-[40px] min-h-[40px] flex items-center justify-center` |

---

### 2. Implementasi Komponen Baru & Pemutakhiran Halaman

#### A. Pembuatan `RentalSearchWidget` (`src/components/organisms/rental-search-widget.tsx`)
- Letak: Melayang (*overlapping*) antara bagian bawah Hero dan section berikutnya (menggunakan negative margin `-mt-12 md:-mt-16 relative z-20 container-page`).
- Desain:
  - Container card: `rounded-2xl md:rounded-3xl bg-white/95 backdrop-blur-md p-3.5 md:p-5 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/[0.06]`.
  - Field 1 (Tanggal Mulai Sewa): Popover DatePicker dengan ikon `Calendar01Icon`, trigger tinggi 48px, radius `rounded-xl`, font `tabular-nums`.
  - Field 2 (Skema Durasi): Select dropdown ("Permalam - 1 Hari", "Perkegiatan I - 2 Hari", "Perkegiatan II - 3 Hari") dengan ikon `Clock01Icon`.
  - Field 3 (Tombol Aksi CTA): `[Cek Ketersediaan]` berwarna hijau Annapurna (`#16624B`), efek `active:scale-[0.96] transition-transform`, mengarahkan ke `/katalog?startDate=...&scheme=...`.

#### B. Pembuatan `TrustSignalsSection` (`src/components/organisms/trust-signals-section.tsx`)
- Menggantikan placeholder dan memperbaiki copy "Harga Transparan" menjadi:
  1. **Peralatan Bersih & Terawat:** Tenda dan alat masak dicuci, dicek kelengkapannya, dan siap pakai ke gunung.
  2. **Tarif Fleksibel & Transparan:** Pilihan skema sewa per malam atau per kegiatan tanpa biaya tersembunyi.
  3. **Booking Cepat, DP 30%:** Amankan booking secara instan via transfer online, pelunasan di kasir toko.
  4. **Basecamp Akses Gunung:** Lokasi strategis di Purwokerto (dekat jalur Gunung Slamet, Prau, & Dieng).
- Layout: Grid 2 kolom di mobile, 4 kolom di desktop dengan padding bernapas (`py-12 md:py-16`).
- Ikon SVG optis: Container kotak bersudut lembut `w-12 h-12 rounded-xl bg-[#E7F3EE] text-[#16624B] flex items-center justify-center`.

#### C. Refaktor `FeaturedPackages` ke Bento Grid Style (`src/components/organisms/featured-packages.tsx`)
- Mengubah susunan dari 4 kolom biasa menjadi Asymmetric Bento Layout:
  - **Sisi Kiri (40% desktop):** Editorial text card ("Sewa Paket Lebih Hemat & Praktis"), teks panduan pendakian Jawa Tengah, badge "Solusi Lengkap Sekali Angkut", dan tombol CTA `[Lihat Semua Paket]`.
  - **Sisi Kanan (60% desktop):** Bento card grid (1 kartu utama lanskap + 2 kartu sekunder) yang menampilkan:
    - Foto banner dengan outline `ring-1 ring-black/[0.06]`.
    - Daftar isi paket dengan bullet icon bersih.
    - Harga coret (estimasi satuan) + harga paket tebal berlabel `tabular-nums`.
    - Badge hemat ("Hemat s/d 25%").

#### D. Penyesuaian Copy Identitas & Alamat Toko
- Mengoreksi copy di `src/components/organisms/hero-section.tsx` dari "di Malang" menjadi "di Purwokerto (Basecamp pendakian Gunung Slamet & Jawa Tengah)".
- Mengoreksi copy di `src/components/organisms/how-it-works-section.tsx` dari "Bayar DP 50%" menjadi "Bayar DP 30%".
- Memastikan footer menampilkan alamat lengkap Purwokerto: Jl. Kampus No.8-9 Grendeng, Purwokerto Utara, jam operasional 09:00 - 21:30 WIB.

---

## Critical files & anchors

1. `docs/implementation plan.md`: Dokumen blueprint landing page yang diperbarui dengan prinsip-prinsip *feels better*.
2. `src/components/organisms/hero-section.tsx`: Koreksi copy Purwokerto, penyesuaian tinggi 80vh-85vh untuk overlapping widget, `text-wrap: balance`, dan feedback tombol.
3. `src/components/organisms/rental-search-widget.tsx` (File Baru): Organism widget cek ketersediaan melayang dengan radius konsentris dan bayangan berlapis.
4. `src/components/organisms/trust-signals-section.tsx` (File Baru): Organism 4 nilai keunggulan Annapurna dengan copy tarif transparan dan DP 30%.
5. `src/components/organisms/featured-packages.tsx`: Transformasi layout ke Bento Grid (40% cerita editorial, 60% showcase paket).
6. `src/components/molecules/product-card.tsx`: Aspek rasio 1:1, image outline `ring-1 ring-black/[0.06]`, `tabular-nums` pada harga sewa, dan tactile click feedback.
7. `src/app/(main)/page.tsx`: Susunan urutan seksi beranda yang rapi: Hero -> RentalSearchWidget -> TrustSignals -> CategoryGrid -> ProductTabs -> FeaturedBentoPackages -> HowItWorks.

---

## Verification

1. **Audit Visual & Feel (Manual Inspection via Browser):**
   - Jalankan `npm run dev` dan buka halaman utama di browser.
   - Periksa widget search yang melayang di antara Hero dan Trust Signals: pastikan tidak ada clipping, bayangan halus menimpa foto hero, dan input interaktif responsif pada desktop maupun mobile.
   - Uji klik tombol (Hero CTA, Search, ProductCard, PackageCard): amati feedback tactile `scale-[0.96]`.
   - Periksa typography harga di ProductCard dan BentoCard: pastikan angka tidak bergoyang saat tab diubah (terverifikasi `tabular-nums`).
   - Periksa headline Hero dan Section: pastikan tidak ada orphan kata tunggal di baris baru (`text-wrap: balance`).
2. **Type Safety & Build Verification:**
   - Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe props pada komponen baru/refaktor.
3. **Regression Testing:**
   - Jalankan `npm test` untuk memastikan 40 unit dan regression test tetap berstatus 100% PASS.

---

## Assumptions & contingencies
- Ketersediaan Gambar Banner Kategori: Jika foto asli kategori belum tersedia di storage Supabase, sistem menggunakan fallback visual background gradient alam bertema outdoor dengan Hugeicons yang terpusat secara optis.
- Perhitungan Diskon Paket: Jika paket sewa tidak memiliki nilai harga coret eksplisit di basis data, sistem menghitung estimasi penghematan sebesar 15-20% atau menampilkan badge "Paket Hemat Komplit" secara dinamis.