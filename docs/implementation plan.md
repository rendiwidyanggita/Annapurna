# Anatomi Landing Page (Homepage) — ANNAPURNA Adventure

*(Menggabungkan gaya visual outdoor pine green, clean slate neutrals, dan fungsionalitas booking/rental berstandar WCAG)*

---

## 1. Header (Navbar) — *Sticky/Fixed Top*
*   **Layout:** Flexbox Horizontal (Kiri, Tengah, Kanan). Sticky menempel di bagian atas saat di-scroll.
*   **Surfaces & Shadows:** `bg-white/80 backdrop-blur-md border-b border-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.02)]`.
*   **Komponen Kiri:** Logo Annapurna (Teks / Ikon).
*   **Komponen Tengah:** Navigation Links (Katalog, Paket, Syarat & Ketentuan) dengan active underline tanpa layout shift. Target sentuh ≥ 44px. *Catatan: Di mobile, masuk ke Hamburger Menu.*
*   **Komponen Kanan:** 
    *   Ikon Cart: `min-w-[44px] min-h-[44px]` dengan badge kuantitas `tabular-nums` berwarna `bg-brand-600`.
    *   Profil / Auth: Tombol Masuk & Daftar (`bg-brand-600 hover:bg-brand-700`), atau pill profil pengguna `rounded-full` konsentris dengan avatar `rounded-full` 24px berlatar `bg-brand-50`.

## 2. Hero Section — *The Hook*
*   **Layout:** Full-width, tinggi proporsional `min-h-[75vh] md:min-h-[85vh]` untuk mengakomodasi search widget yang melayang di bawahnya.
*   **Elemen Background:** Foto pemandangan alam beresolusi tinggi dengan prioritas muat (*LCP element*).
*   **Scrim Overlay:** Multi-stop gradient `bg-gradient-to-t from-black/85 via-black/40 via-50% to-transparent` serta subtle top gradient `from-black/25`.
*   **Elemen Teks (Bottom-Left):**
    *   **Eyebrow:** Garis aksen `bg-brand-300` dan teks "Penyewaan Alat Outdoor Purwokerto".
    *   **H1:** Tipografi besar `text-balance tracking-tight` dengan highlight teks signature `text-brand-300` ("Bersama Kami").
    *   **P (Subtitle):** Deskripsi `text-pretty leading-relaxed` menegaskan identitas basecamp Purwokerto (Gunung Slamet & Jawa Tengah).
*   **Elemen Action:** 2 Tombol berdampingan dengan tactile feedback `active:scale-[0.96]`: Tombol Utama `bg-brand-600 hover:bg-brand-700` (`[Lihat Katalog]`) dan Tombol Sekunder `bg-white/15 hover:bg-white/25` (`[Lihat Paket]`).

## 3. Rental Search Widget (Widget Cek Ketersediaan)
*   **Layout:** Kotak Card melayang (*overlapping*) `-mt-10 sm:-mt-12 md:-mt-14 relative z-20 container-page` yang memotong batas bawah Hero Section.
*   **Surfaces & Shadows:** `rounded-2xl md:rounded-3xl bg-white/95 backdrop-blur-md p-4 md:p-5 border border-black/[0.06] shadow-floating`.
*   **Komponen di dalam Card (Grid 1 kolom mobile, 3 kolom desktop):**
    *   *Date Picker:* Popover trigger dengan icon `Calendar01Icon`, font `tabular-nums`, tinggi 48px, radius `rounded-xl`.
    *   *Select Dropdown:* Input pilihan skema durasi ("Permalam", "Perkegiatan I", "Perkegiatan II") dengan icon `Clock01Icon`, tinggi 48px, radius `rounded-xl`.
    *   *Button:* Tombol CTA Utama `[Cek Ketersediaan]` berwarna `bg-brand-600 hover:bg-brand-700 text-white rounded-xl h-12 px-7 font-semibold active:scale-[0.96]`, mengarahkan ke `/katalog?startDate=...&scheme=...`.

## 4. Trust Signals / Value Proposition (4 Pilar Layanan)
*   **Layout:** Grid 1 kolom (mobile), 2 kolom (tablet), 4 kolom (desktop) dengan padding bernapas (`pt-10 pb-8 md:pt-14 md:pb-12`).
*   **Style Kartu:** `rounded-2xl bg-white border border-black/[0.04] p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5`.
*   **Pilar Layanan:**
    1.  **Peralatan Bersih & Terawat:** Ikon `ShieldCheckIcon`, dicuci dan dicek kelengkapannya sebelum diserahkan.
    2.  **Tarif Fleksibel & Transparan:** Ikon `Tag01Icon`, pilihan sewa permalam atau perkegiatan tanpa biaya tersembunyi.
    3.  **Booking Cepat, DP 30%:** Ikon `CreditCardIcon`, cukup bayar DP 30% via transfer bank/QRIS, sisa dilunasi di toko.
    4.  **Basecamp Akses Gunung:** Ikon `MountainIcon`, letak strategis Purwokerto untuk jalur Slamet, Prau, & Sindoro-Sumbing.

## 5. Section Kategori (Jelajahi Berdasarkan Kategori)
*   **Layout:** Grid 5 kolom (desktop) / 2–3 kolom (mobile).
*   **Komponen CategoryCard:**
    *   Card `rounded-2xl bg-white border border-black/[0.04] shadow-card hover:shadow-card-hover hover:-translate-y-1 active:scale-[0.96]`.
    *   Icon container konsentris `rounded-xl bg-slate-50 group-hover:bg-brand-50 text-slate-700 group-hover:text-brand-600`.
    *   Total ketersediaan barang berlabel angka tabular `tabular-nums`.

## 6. Section Highlight Produk (Pilihan Utama Pendaki)
*   **Layout:** Section vertikal standar dengan lebar Container maksimal (`py-8 md:py-12`).
*   **Header Section:** Judul H2 "Pilihan Utama Pendaki" `text-balance tracking-tight` dan subjudul `text-pretty`.
*   **Komponen Kontrol:** `TabSwitcher` ("Terlaris", "Terbaru") dengan underline aktif dan tactile feedback `active:scale-[0.97]`.
*   **Komponen Konten (Product Grid):** Grid 4 kolom (Desktop), 2 kolom (Mobile/Tablet).
*   **Anatomi ProductCard:**
    *   *Image Wrapper:* Aspect ratio 1:1 (`aspect-square`), `rounded-xl ring-1 ring-black/[0.06] overflow-hidden`.
    *   *Badge:* `StatusBadge` di pojok kanan atas gambar (`top-2.5 right-2.5`).
    *   *Title:* H3 `text-balance line-clamp-2`.
    *   *Price Block:* "Mulai dari", diikuti teks tebal berlabel `tabular-nums tracking-tight font-bold text-brand-600`.
    *   *Tactile:* `hover:-translate-y-1 active:scale-[0.98] transition-[transform,box-shadow,border-color] duration-200`.

## 7. Section Highlight Paket (Asymmetric Bento Grid)
*   **Layout:** Split 2 sisi asimetris (Kiri 40% Story Card, Kanan 60% Showcase Grid Paket).
*   **Kolom Kiri (Editorial Story Card):**
    *   Latar `bg-gradient-to-b from-brand-50/80 via-white to-white border border-brand-100 rounded-3xl p-6 md:p-8`.
    *   Badge "Solusi Lengkap Sekali Angkut", H3 "Sewa Paket Lebih Hemat & Praktis".
    *   3 butir keuntungan (hemat hingga 20%, alat teruji lengkap, tas pelindung rapi).
    *   Tombol CTA `[Jelajahi Semua Paket]` berwarna `bg-brand-600 hover:bg-brand-700 active:scale-[0.96]`.
*   **Kolom Kanan (Showcase Paket):**
    *   *Kartu Utama Lanskap (Hero Bento Item):* Banner `aspect-[16/10]` dengan `ring-1 ring-black/[0.06] rounded-2xl`, badge "Paling Diminati", preview chips isi paket `rounded-lg bg-slate-100 text-slate-700`, harga final `tabular-nums`.
    *   *Kartu Sekunder (Subgrid 2 Kolom):* Dua `PackageCard` pendamping dengan layout konsentris, harga `tabular-nums`, dan thumbnail `aspect-[16/9]`.

## 8. Section Cara Sewa (How It Works)
*   **Layout:** Section full-width berlatar `bg-brand-50 py-14 md:py-20 border-t border-brand-100/60`.
*   **Alur 4 Langkah:**
    1.  *Pilih Produk:* Jelajahi katalog dan tentukan perlengkapan camping.
    2.  *Bayar DP 30%:* Konfirmasi booking dengan bayar DP 30% via QRIS atau transfer bank.
    3.  *Ambil di Toko:* Datang ke toko sesuai jadwal dengan identitas asli sebagai jaminan.
    4.  *Kembalikan Tepat Waktu:* Selesaikan pelunasan sisa saat pengembalian alat.

## 9. Footer (Area Navigasi Bawah)
*   **Layout:** Background `bg-brand-800` (`#0B3E2F`) dengan grid 3 kolom desktop dan baris copyright di bawah.
*   **Kolom 1:** Logo Annapurna putih, deskripsi layanan Purwokerto basecamp Slamet.
*   **Kolom 2 (Navigasi):** Link Katalog, Paket Sewa, dan Syarat & Ketentuan dengan tap target `min-h-[44px]`.
*   **Kolom 3 (Kontak):** WhatsApp, Instagram, dan alamat resmi lengkap: "Jl. Kampus No 8-9, Grendeng, Purwokerto Utara, Purwokerto, Jawa Tengah 53122".
