# 📋 Rekapitulasi Fitur yang Selesai Dikerjakan (Sprint 1 & Sprint 2)
### Proyek: ANNAPURNA Adventure — Sistem Informasi Rental Alat Outdoor

Dokumen ini merangkum seluruh fitur dan modul yang telah selesai diimplementasikan, diuji, dan terverifikasi secara fungsional pada **Sprint 1** dan **Sprint 2**.

---

## 🏃 SPRINT 1: Fondasi Teknis, Keamanan, Autentikasi, Master Data & Katalog Publik

> **Tujuan Sprint 1:** Membangun pondasi teknis, autentikasi multi-role lengkap, sistem keamanan (CSRF & Rate Limiting), antarmuka publik responsif, serta modul pengelolaan master data inventaris toko (CRUD) untuk admin dan owner.

### 1. Autentikasi Multi-Role & Routing Berbasis Peran
- **Role yang Didukung:** `Customer`, `Admin`, dan `Owner`.
- **Alur Login & Redirect Otomatis:**
  - Login berhasil untuk `Customer` diarahkan langsung ke landing page utama (`/`).
  - Login berhasil untuk `Admin` dan `Owner` diarahkan ke panel administrasi toko (`/admin/dashboard`).
- **Fitur Autentikasi Lengkap:**
  - Registrasi akun baru (`/register`) dengan validasi password dan konfirmasi email.
  - Login email & password (`/login`) dengan penanganan error kredensial.
  - Integrasi **Google OAuth Login** (`<GoogleLoginButton />`) untuk pendaftaran dan login cepat satu klik.
  - Alur Lupa Password (`/forgot-password`) dengan pengiriman email reset yang aman tanpa membocorkan status akun.
  - Alur Reset Password (`/reset-password`) dengan validasi token dan konfirmasi password baru.
  - Fitur Logout instan (`/logout`) untuk pembersihan sesi Supabase Auth.

### 2. Profile Completion Gate (Validasi Kelengkapan Data)
- Route: `/complete-profile`.
- Pengguna baru yang belum melengkapi data profil wajib mengisi Nama Lengkap (sesuai identitas KTP), Nomor WhatsApp, dan Alamat Lengkap sebelum dapat melakukan transaksi rental.
- Terdapat *layout gate middleware* yang secara otomatis mengarahkan pengguna belum lengkap ke form ini dan mengembalikannya ke halaman tujuan semula setelah tersimpan.

### 3. Keamanan Tingkat Lanjut (Security & Abuse Prevention)
- **Rate Limiting:** Menggunakan Upstash Redis dengan algoritma *sliding window* untuk melindungi endpoint rawan serangan brute-force:
  - Auth: 5 permintaan/menit.
  - Checkout & Pembayaran: 5 permintaan/menit.
  - Chatbot: 10 permintaan/menit.
- **Proteksi CSRF:** Middleware verifikasi header `Origin` dan `Referer` pada seluruh endpoint mutasi (POST, PUT, PATCH, DELETE) dengan mode *fail-closed* di production (mengecualikan webhook Midtrans dan callback OAuth).

### 4. Desain Sistem & Komponen UI Terstandarisasi
- Menggunakan **Tailwind CSS v4** dengan token warna khusus: Primary Forest Green (`#16624B`), Success Green, Error Red, Warning Amber, dan Neutral Slate.
- Tipografi konsisten menggunakan font **Manrope** via `next/font/google`.
- Koleksi ikon modern menggunakan **Hugeicons React**.
- Komponen dasar antarmuka berbasis **shadcn/ui**: Button, Input, Form, Label, Table, Card, Dialog, Badge, Select, Textarea, dan Switch.
- Layout responsif ramah mobile dan desktop dengan header transparan (*sticky backdrop-blur*) serta footer informasi toko.

### 5. Manajemen Master Data Kategori Produk (CRUD Admin)
- Route: `/admin/dashboard/kategori`.
- Admin dapat melihat tabel kategori lengkap, menambahkan kategori baru, mengubah data, serta menghapus kategori yang tidak lagi digunakan dengan proteksi konfirmasi dialog.

### 6. Manajemen Master Data Produk & Harga Berjenjang
- Route: `/admin/dashboard/produk`, `/admin/dashboard/produk/baru`, `/admin/dashboard/produk/[id]/edit`.
- **Tipe Item:** Membedakan antara unit fisik sewa (`rental_unit`) dan barang habis pakai (`consumable`).
- **Skema Harga Berjenjang Wajib:**
  - *Permalam* (hitungan 1 malam).
  - *Perkegiatan I* (skema 3 hari 2 malam / 3 hari 3 malam).
  - *Perkegiatan II* (skema 5 hari 4 malam / 5 hari 5 malam).
- Pengelolaan variasi produk (ukuran, warna, kapasitas) yang dinamis atau otomatis berstatus single-variant.

### 7. Manajemen Unit Fisik Inventaris
- Route: `/admin/dashboard/unit`.
- Pencatatan unit barang secara individual dengan kode inventaris unik (misal: `TND-001`, `TND-002`).
- Pelacakan status kondisi fisik unit: `Available`, `Reserved`, `Rented`, `Returned`, `Maintenance`, `Damaged`, `Lost`.
- Form ubah status unit disertai alasan wajib yang otomatis tercatat ke riwayat log teknisi (`unit_status_logs`).

### 8. Manajemen Stok Barang Habis Pakai (Consumable)
- Tab khusus di `/admin/dashboard/unit`.
- Penyesuaian stok barang habis pakai (misal: gas kaleng, jas hujan plastik) dengan flag `is_reusable` (menandai apakah barang bisa dikembalikan dan direstock otomatis atau habis sekali pakai).

### 9. Manajemen Paket Sewa (Bundling)
- Route: `/admin/dashboard/paket`.
- Admin dapat menyusun paket hemat sewa (misal: *Paket Camping Hemat 2 Orang*).
- Menentukan daftar isi item dalam paket beserta kuantitas masing-masing barang.
- Penetapan harga paket tersendiri (*snapshot pricing*) per skema durasi.

### 10. Pengelolaan Media & Galeri Produk
- Komponen uploader media dengan fitur *drag & drop*, pratinjau thumbnail, dan penanda foto utama.
- Validasi keamanan ganda: filter ekstensi di sisi klien dan pemeriksaan **magic bytes** di sisi server untuk mencegah file berbahaya terselubung.

### 11. Halaman Publik & Katalog Rental Pelanggan
- **Landing Page (`/`):** Hero section inspiratif, grid kategori alat outdoor, tab produk unggulan (terpopuler & terbaru), paket sewa, serta panduan alur "Cara Sewa".
- **Katalog Produk (`/katalog`):** Pencarian teks langsung, filter kategori, filter tipe barang, pengurutan harga/popularitas, tampilan grid responsif, dan paginasi.
- **Detail Produk & Paket (`/katalog/[id]` & `/paket/[id]`):** Galeri foto produk, selector variasi, tabel skema harga durasi, indikator ketersediaan stok, dan tombol cepat hubungi admin via WhatsApp.

---

## 🏃 SPRINT 2: Alur Rental End-to-End, Concurrency Locking, Pembayaran DP Midtrans & Operasional Toko

> **Tujuan Sprint 2:** Menyelesaikan siklus operasional rental secara penuh (end-to-end): mulai dari pemesanan durasi sewa, validasi ketersediaan anti-overbooking, checkout dengan row-level locking, pembayaran DP 50% via Midtrans Snap & webhook otomatis, hingga operasional serah terima barang (pickup), pemeriksaan pengembalian (return), denda manual PRD 16.14, dan rekonsiliasi keterlambatan di toko fisik.

### 1. Halaman Syarat & Ketentuan (S&K) Publik & Snapshot Transaksi
- Route: `/syarat-ketentuan`.
- Informasi aturan sewa, ketentuan jaminan identitas, denda keterlambatan/kerusakan, dan kebijakan pembatalan.
- **S&K Checkout Gate:** Pelanggan wajib mencentang persetujuan aturan sewa sebelum lanjut pembayaran.
- Versi snapshot isi S&K tersimpan permanen secara *immutable* di dalam record transaksi untuk keperluan hukum pembuktian.

### 2. Pemilih Tanggal & Durasi Sewa Otomatis
- Komponen pemilih durasi: *Permalam*, *Perkegiatan I* (3 hari), dan *Perkegiatan II* (5 hari).
- Pemilihan tanggal ambil menggunakan kalender interaktif yang otomatis menghitung tanggal maksimal pengembalian barang secara real-time.

### 3. Cek Ketersediaan Real-Time & Stepper Kuantitas
- **Availability Check API (`/api/availability`):** Pengecekan unit fisik aktif yang tidak bentrok pada rentang tanggal sewa yang dipilih.
- Komponen stepper kuantitas cerdas pada halaman produk: otomatis membatasi jumlah maksimal sewa berdasarkan ketersediaan unit fisik bebas jadwal pada rentang tanggal tersebut.

### 4. Keranjang Sewa Persisten (Persistent Cart)
- Route: `/cart`.
- Keranjang belanja sewa tersimpan di penyimpanan lokal browser (*localStorage*) sehingga tidak hilang saat halaman di-refresh.
- Menampilkan rincian barang, pilihan variasi, rentang jadwal sewa, durasi, subtotal biaya, dan indikator badge jumlah barang di navbar atas.

### 5. Checkout Transaksi dengan Concurrency Row-Level Locking
- Route: `/checkout`.
- **Pencegahan Overbooking (Anti-Collision):**
  - Menggunakan query batch Prisma PostgreSQL berurut menaik (`SELECT id FROM inventory_units WHERE id = ANY(...) ORDER BY id ASC FOR UPDATE`) untuk mencegah tabrakan data (*race condition*) dan *deadlock*.
  - Mengalokasikan unit fisik berstatus `Reserved` (Soft-Hold) secara atomik.
- Pengurangan otomatis stok barang konsumsi saat transaksi checkout dibuat.
- Rincian biaya transparan: Total Biaya Sewa, DP 50% yang wajib dibayar online, dan Sisa 50% yang dilunasi di toko saat pengambilan barang.

### 6. Pengujian Konkurensi Otomatis
- Simulasi pengujian backend di mana beberapa pengguna melakukan checkout terhadap unit fisik terakhir pada milidetik yang sama.
- Sistem berhasil menjamin hanya satu transaksi yang menang alokasi, sementara pengguna lain menerima respon penolakan konflik secara aman tanpa inkonsistensi data.

### 7. Integrasi Pembayaran DP 50% Midtrans Snap
- Route: `/pesanan/[id]`.
- Integrasi server-side ke Midtrans Snap Sandbox untuk menghasilkan payment token dan popup pembayaran multi-metode (BCA/Mandiri/BRI Virtual Account, Gopay, QRIS).
- Endpoint Webhook Midtrans (`POST /api/webhooks/midtrans`):
  - Verifikasi keamanan signature SHA-512 Midtrans.
  - Penanganan idempotensi: webhook duplikat dari Midtrans tidak akan mengubah status ganda.
  - Transisi otomatis status pembayaran menjadi `DP_Paid` dan status transaksi menjadi `DP_Dibayar`.

### 8. Countdown Timer Expired Booking & Pembatalan Otomatis
- Invoice tagihan DP dilengkapi *countdown timer* 60 menit.
- Endpoint CRON / pengecekan kadaluarsa: jika pembayaran DP tidak diselesaikan dalam waktu 60 menit, pesanan otomatis berstatus `Expired` dan alokasi unit yang di-soft hold langsung dilepas kembali ke inventaris.

### 9. Halaman Pesanan & Stepper Progres Transaksi
- Route: `/pesanan` dan `/pesanan/[id]`.
- Pelanggan dapat memantau riwayat seluruh pesanan mereka.
- Komponen `<TransactionStepper />` interaktif menampilkan 5 fase progres sewa:
  1. *Menunggu Pembayaran DP*
  2. *DP Dibayar (Dikonfirmasi)*
  3. *Siap Diambil di Toko*
  4. *Sedang Disewa*
  5. *Selesai*

### 10. Dashboard & Panel Transaksi Admin
- Route: `/admin/dashboard/transaksi`.
- Sidebar menu **Transaksi** aktif untuk navigasi cepat admin dan owner.
- **Metric Cards Real-time:** Menampilkan total transaksi toko, transaksi siap diambil (*pickup ready*), transaksi sedang aktif disewa, dan transaksi terlambat kembali.
- **Tab Filter Cepat:** *Semua*, *Siap Pickup*, *Sedang Disewa*, *Terlambat*, *Selesai*, dan *Dibatalkan*.
- Form pencarian instan berdasarkan kode transaksi, nama penyewa, atau email.
- **Halaman Detail Transaksi (`/admin/dashboard/transaksi/[id]`):** Tinjauan profil penyewa, daftar unit dan barang konsumsi, ringkasan pembayaran, riwayat denda manual, dan jejak aktivitas audit log (*audit trail*).

### 11. Operasional Serah Terima Barang / Handover Pickup di Toko
- Route: `/admin/dashboard/transaksi/[id]/pickup`.
- **Validasi DP:** Memastikan pesanan telah terverifikasi lunas DP online sebelum serah terima diproses.
- **Pelunasan Sisa Biaya Sewa:** Form pencatatan pelunasan sisa tagihan di kasir fisik menggunakan metode **Kas Tunai (Cash)** atau **QRIS Toko**.
- **Verifikasi Fisik Unit:** Checklist pemeriksaan fisik unit satu per satu oleh staff toko sebelum diserahkan ke tangan penyewa.
- **Penguncian Atomik:** Row lock pada database mengubah status unit inventaris menjadi `Rented` dan status transaksi menjadi `Sedang_Disewa`, disertai pencatatan riwayat di `unit_status_logs`.

### 12. Keamanan & Masking Privasi Dokumen Jaminan Identitas (PRD 30)
- Pencatatan dokumen jaminan fisik yang ditinggalkan pelanggan di toko: **KTP**, **SIM**, atau **KTM**.
- Pencatatan catatan lokasi rak/map penyimpanan fisik (misal: `"Kotak Jaminan B-02"`).
- **Default Masking NIK/ID:** Nomor NIK disamarkan secara otomatis di layar kasir (contoh: `3273 •••• •••• 1234`) untuk mencegah kebocoran data pribadi pelanggan.
- **Tombol "Lihat NIK":** Nomor asli hanya dapat dibuka melalui tombol verifikasi oleh staff yang memiliki hak akses (*role admin/owner*) saat mencocokkan kartu fisik di meja kasir.
- Query API pelanggan diproteksi secara otomatis agar tidak pernah memaparkan field nomor jaminan identitas.

### 13. Pemeriksaan Pengembalian Barang / Return Fisik
- Route: `/admin/dashboard/transaksi/[id]/return`.
- **Transisi Dua Fase Unit (PRD 16.13 & 16.9):**
  - Unit fisik yang kembali mengalami transisi status pertama ke `Returned` (status transit pengembalian).
  - Dilanjutkan transisi ke klasifikasi kondisi akhir: `Available` (bagus/siap sewa kembali), `Maintenance` (perlu dicuci/diservis), `Damaged` (rusak fisik), atau `Lost` (hilang).
  - Setiap fase transisi menghasilkan riwayat audit log terpisah pada `unit_status_logs`.
- **Penanganan Parsial vs Penuh:** Sistem memeriksa apakah semua barang telah dikembalikan. Jika pengembalian baru sebagian, status transaksi tetap aktif di `Sedang_Disewa`. Jika sudah lengkap seluruhnya, transaksi resmi ditutup dengan status `Selesai`.
- **Pelepasan Jaminan:** Konfirmasi wajib pengembalian fisik kartu identitas jaminan (KTP/SIM/KTM) kepada pelanggan.

### 14. Restock Otomatis Barang Konsumsi Reusable
- Saat pemeriksaan pengembalian barang habis pakai, sistem memeriksa atribut produk `isReusable`.
- Untuk barang reusable (misal: botol gas isi ulang, nesting set), sistem secara otomatis mengembalikan jumlah kuantitas stok ke kolom `Product.consumableStock` dan mencatatnya di log aktivitas toko.

### 15. Penetapan Denda Manual Terverifikasi Admin (Kepatuhan PRD 16.14)
- **Kalkulator Saran Sistem:** Sistem menghitung selisih keterlambatan hari dari batas tanggal sewa (`lateDays`) dan menampilkan estimasi rekomendasi denda keterlambatan sebagai referensi awal admin.
- **Penegakan Manual (Zero Auto-Commit):** Sistem mematuhi PRD 16.14 secara tegas — tidak pernah membebankan denda otomatis ke pelanggan tanpa persetujuan staff. Admin wajib memasukkan atau menyetujui nominal denda secara sadar.
- **Alasan Denda Wajib:** Setiap baris denda bernilai > Rp 0 (keterlambatan, kerusakan, kehilangan, ketidaklengkapan) **wajib menyertakan alasan yang jelas**.
- **Pelunasan Denda di Tempat:** Pembuatan record pembayaran instan dengan metode Kas Tunai atau QRIS Toko untuk penyelesaian denda di meja kasir.

### 16. Kebijakan Pembatalan & Refund Transparan (PRD 16.11)
- **Pembatalan Mandiri oleh Pelanggan:** Jika pesanan sudah membayar DP lalu dibatalkan oleh pelanggan, uang muka dianggap hangus (*DP Hangus*), jadwal unit segera dibebaskan kembali.
- **Pembatalan oleh Pihak Toko / Admin:** Memerlukan alasan pembatalan wajib dari admin, status transaksi menjadi `Dibatalkan`, dan status pembayaran ditandai untuk pengembalian dana penuh (*Refunded*).

### 17. Rekonsiliasi Otomatis Webhook Midtrans Terlambat (Anti-Overbooking)
- Menangani kondisi jika pembayaran Midtrans baru tiba setelah batas waktu 60 menit terlewati (saat pesanan sudah berstatus `Expired` atau `Dibatalkan`).
- Sistem melakukan pengecekan tabrakan: jika unit sudah terlanjur dipesan pelanggan lain untuk tanggal yang sama, sistem **memblokir pemesanan ulang (anti-overbooking)**, menandai status pembayaran sebagai `LATE_PAYMENT_REFUND_REQUIRED`, dan memicu notifikasi admin untuk pengembalian dana manual.

---

## 🧪 Status Pengujian & Kualitas Kode

- **Unit & Integration Test Suite (`tests/transaction-operations.test.ts`):** 14/14 skenario pengujian lulus (100% pass) mencakup masking NIK, validasi skema Zod PRD 16.14, row-level locking pickup, idempotensi double-submit, transisi status 2-fase return, restock consumable reusable, pembatalan DP hangus vs refund, dan proteksi overbooking webhook.
- **TypeScript Type Checking:** Bebas dari kesalahan tipe (`npx tsc --noEmit` lolos 100%).
- **Production Build:** Sukses dikompilasi secara optimal menggunakan App Router Next.js 16 (`npx next build` lolos 100%).
