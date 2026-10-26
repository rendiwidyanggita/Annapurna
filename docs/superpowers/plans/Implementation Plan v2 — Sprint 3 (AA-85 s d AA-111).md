# Implementation Plan v2 — Sprint 3 (AA-85 s/d AA-111)

26 Oktober 2026 · Menggantikan plan Sprint 3 versi 1 (22 Okt). Dasar: peta tiket di `UI-Annapurna.md`, PRD Sprint 3 dan Section 24/30, OQ-03/07/12, kode repo Annapurna, serta audit plan v1.

## 1. Ringkasan: 4 plan

Sprint 3 memuat 27 tiket (AA-85 s/d AA-111). Seperti Sprint 2, pekerjaan dipecah per fase supaya tiap plan bisa diimplementasi, diuji, dan di-demo sendiri. Tiket dikelompokkan menurut kedekatan kode dan urutan ketergantungan:

- **Plan 1 — Dashboard, Laporan & Export** (AA-85 s/d AA-95, 11 tiket). Fondasi data untuk semua laporan dan export PDF/Excel.
- **Plan 2 — Governance: User & Role, Activity Log, Purging** (AA-96, AA-97, AA-98, AA-105, 4 tiket). Activity log harus ada sebelum purging dan sebelum audit keamanan.
- **Plan 3 — Chatbot AI** (AA-99 s/d AA-104, 6 tiket). Paling berisiko, dikerjakan setelah fondasi stabil.
- **Plan 4 — QA, Security, Deploy & UAT** (AA-106 s/d AA-111, 6 tiket; AA-109 sudah Done). Dimulai paralel sejak hari pertama lewat deploy staging, lalu dipanen di akhir.

AA-105 (purging) dipindah dari fase tersendiri ke Plan 2 karena tergantung langsung pada tabel dan index activity log.

## 2. Keputusan dan asumsi (mohon dikonfirmasi)

1. **Definisi omzet = basis kas.** Dihitung dari tabel `payments` berdasarkan `paidAt` pembayaran yang sukses (DP Midtrans, pelunasan kasir, denda). Pembayaran berstatus Refunded dikurangkan. DP hangus tetap tercatat sebagai pemasukan dan diberi label terpisah. Satu definisi dipakai di dashboard, laporan, dan export.
2. **Zona waktu WIB.** Database tetap UTC (OQ-11). Semua preset tanggal (Hari Ini, 7 Hari, Bulan Ini) dan filter dihitung lewat util `src/lib/date-range.ts` yang mengubah batas hari WIB ke UTC. Saat ini repo belum punya handling `Asia/Jakarta`.
3. **Library export.** Excel pakai `exceljs`. PDF dibuat server-side dengan `pdfmake` (atau `@react-pdf/renderer`), bukan print browser dan bukan headless Chrome. Paket `xlsx` dari npm dihindari karena versinya lama; cek `npm audit` bila tetap ingin dipakai.
4. **Agregasi di SQL.** Laporan memakai `groupBy`/query raw, bukan loop di JavaScript. Satu fungsi service dipakai UI dan export sehingga total pasti sama.
5. **Pembagian akses laporan (OQ-07).** Laporan finansial (omzet, DP, pelunasan, denda, produk terlaris) owner-only. Laporan operasional (unit bermasalah, consumable usage) boleh admin dan owner. Cek ulang kalimat OQ-07 untuk batas persisnya; guard tetap `requireRole` di server, bukan hanya menu sidebar.
6. **Purging = archive lalu hapus (OQ-12).** Log dan chat lebih dari 12 bulan diarsipkan (JSONL ke Supabase Storage) sebelum dihapus. Customer non-aktif lebih dari 24 bulan dianonimisasi, bukan dihapus, karena transaksi dan laporan keuangan masih mereferensikannya.
7. **Chatbot.** Identitas pengguna selalu dari session server-side. Cek status pesanan hanya untuk customer yang login. Pesan di luar scope dijawab dengan template tetap, bukan teks hasil LLM.
8. **Biaya perbaikan unit tidak masuk scope.** Schema tidak punya field biaya perbaikan. Laporan AA-91 menampilkan riwayat status dan catatan kondisi saja. Jika ingin biaya perbaikan, tambah kolom lewat migrasi terpisah.

## 3. Koreksi dan hal yang perlu dicek

- **Pemetaan AA-96/AA-97.** Audit sebelumnya menyebut AA-96 sebagai CRUD akun. Yang benar: AA-96 = tabel daftar akun, AA-97 = assign/ubah role + permission matrix OQ-07. Skenario BBT "Owner dapat membuat admin" dipenuhi lewat promosi akun yang sudah ada (AA-97).
- **Jadwal Sprint 3 berbeda antar dokumen.** PRD: 16–29 November (2 minggu). `UI-Annapurna.md`: 15 November–6 Desember. Plan ini diurutkan menurut prioritas supaya muat di 2 minggu dan punya ruang bila dipakai 3 minggu.
- **Status tiket belum terverifikasi.** Peta tiket diambil dari `UI-Annapurna.md` di repo, bukan dari Jira (Jira tidak terjangkau saat plan ini disusun). Status "To Do" bisa sudah usang; misalnya halaman overview dashboard (AA-85) sudah ada sebagian di repo.
- **Detail API OpenRouter belum diverifikasi ke dokumentasi** (dukungan tool-calling per model). Plan 3 sengaja tidak bergantung pada tool-calling.

## 4. Plan 1 — Dashboard, Laporan & Export (AA-85 s/d AA-95)

### Fondasi (kerjakan dulu)

- `src/lib/date-range.ts`: preset dan konversi WIB→UTC, dengan test.
- `src/schemas/report-filter.ts`: Zod untuk rentang tanggal (maksimum 366 hari), status, `productId`.
- `src/lib/services/report-service.ts`: satu fungsi per laporan, memakai konstanta status yang sudah ada (`ACTIVE_STATUSES` di `src/lib/constants.ts`) dan tidak menulis ulang daftar status.
- Cek kebutuhan index untuk kolom filter (`payments.paidAt`, `rental_transactions.startDate`) dan tambah bila query lambat.

### Per tiket

- **AA-85 Dashboard.** Halaman overview sudah ada (KPI, transaksi terbaru, stok rendah). Sisa yang perlu dicek dan dikerjakan: grafik tren booking mingguan/bulanan, tabel jadwal ambil vs kembali hari ini, quick actions. "Revenue Bulan Ini" memakai fungsi omzet yang sama dengan laporan.
- **AA-86 Filter transaksi.** Tambahkan ke `/admin/dashboard/transaksi` (halaman sudah ada): filter status, date range, produk. Simpan state di URL search params agar bisa di-bookmark dan dipakai ulang oleh export.
- **AA-87 Laporan transaksi rental.** Tabel plus ringkasan total pada `/admin/dashboard/laporan`.
- **AA-88 Laporan DP.** Rekap DP Midtrans yang sukses.
- **AA-89 Laporan sisa pembayaran.** Rekap pelunasan kas/QRIS toko.
- **AA-90 Laporan denda.** Denda per transaksi dan total; sumber dari tabel `penalties` yang diinput manual (PRD 16.14).
- **AA-91 Unit maintenance/damaged/lost.** Daftar unit bermasalah dan riwayatnya dari `unit_status_logs`.
- **AA-92 Consumable usage (OQ-03).** Dua bagian terpisah: `is_reusable=false` (terpakai habis) dan `is_reusable=true` (keluar-masuk stok).
- **AA-93 Produk/paket terlaris.** Peringkat berdasarkan frekuensi rental sesuai tiket; kontribusi omzet boleh ditambah sebagai kolom pendukung.
- **AA-94 Export PDF.** Route handler server-side dengan guard role yang sama dengan halamannya. Layout A4 dengan kop, tanggal cetak, dan filter yang dipakai.
- **AA-95 Export Excel.** Satu workbook per laporan dengan header berformat. Sel yang diawali `=`, `+`, `-`, atau `@` (misalnya nama customer) di-prefix agar tidak dieksekusi sebagai formula. Batasi jumlah baris, dan catat setiap export ke activity log.

### Pengujian dan Definition of Done

- Test unit untuk `date-range` (batas hari WIB, pergantian bulan) dan `report-service` dengan data fixture, memakai folder `tests/` yang sudah ada.
- Total di layar sama dengan total di PDF dan Excel untuk filter yang sama.
- Akses laporan finansial oleh admin ditolak di server (halaman dan endpoint export).
- Demo ke mitra dengan skenario: filter periode, lihat laporan, export kedua format.

## 5. Plan 2 — Governance: User & Role, Activity Log, Purging (AA-96, AA-97, AA-98, AA-105)

### AA-98 Activity log (kerjakan paling awal di plan ini)

- `src/lib/services/audit-log.ts` dengan `logActivity(tx, {...})`. Parameter `tx` wajib supaya log tertulis atomik di dalam `$transaction` yang sama dengan mutasinya, mengikuti pola yang sudah dipakai di kode transaksi.
- Retrofit aksi **produk** dan **kategori** yang saat ini belum menulis log (aksi paket dan unit sudah).
- Jangan menyimpan NIK dan data PII ke `oldValue`/`newValue`; simpan hanya field yang relevan.
- Migrasi index: `activity_logs(created_at)`, `activity_logs(user_id, created_at)`, `activity_logs(entity_name, entity_id)`. Index `created_at` untuk tabel chat juga ditambahkan di sini karena dipakai purging.
- Halaman `/admin/dashboard/activity-log`: filter rentang tanggal, user, tipe aksi; pagination berbasis cursor; dialog lihat perubahan (old vs new). Log tidak punya aksi ubah atau hapus dari UI.

### AA-96 Daftar akun dan AA-97 Role

- Halaman `/admin/dashboard/pengguna`, owner-only di layout dan di setiap server action.
- Aturan keselamatan: owner tidak bisa menurunkan atau menonaktifkan dirinya sendiri; minimal satu owner aktif harus selalu ada (cek di dalam transaksi).
- Menonaktifkan akun (`isActive=false`) harus memutus akses nyata: cek `isActive` di guard server dan ban user di Supabase Auth lewat Admin API agar session yang sedang berjalan tidak lolos. Verifikasi apakah role dibaca dari database pada tiap request sehingga perubahan role langsung berlaku.
- Permission matrix OQ-07 ditampilkan sebagai tabel (admin vs owner) yang bersumber dari satu konfigurasi (`src/lib/permissions.ts`), bukan teks statis yang bisa menyimpang dari guard sebenarnya.
- Setiap perubahan role dan status masuk activity log.

### AA-105 Purging job

- Endpoint `src/app/api/cron/purge-retention/route.ts` dengan autentikasi Bearer seperti cron `expire-bookings`. `CRON_SECRET` belum ada di `.env.example`; tambahkan.
- Langkah: (1) arsipkan chat dan activity log lebih dari 12 bulan ke Storage, (2) hapus per batch (misalnya 1.000 baris) dengan batas waktu eksekusi, (3) anonimisasi customer non-aktif lebih dari 24 bulan, (4) catat ringkasan jumlah baris. Bersifat idempotent dan punya mode `dry-run`.
- Jadwal harian. Cek plan Vercel: cron yang lebih sering dari sekali sehari (seperti `*/5 * * * *` saat ini) setahu saya tidak diizinkan di plan Hobby.
- Bila waktu sangat mepet, OQ-12 mengizinkan purging menjadi future work; minimal sediakan dry-run dan dokumentasinya.

### Pengujian dan Definition of Done

- Test: last-owner guard, self-demotion, aksi admin ke halaman pengguna ditolak, log atomik (rollback transaksi ikut membatalkan log), purge terhadap fixture berumur.
- Demo: owner mengubah role, log tercatat, admin tidak bisa membuka halaman pengguna.

## 6. Plan 3 — Chatbot AI (AA-99 s/d AA-104)

- **AA-99 Knowledge base admin** di `/admin/dashboard/chatbot`: CRUD topik, kata kunci (teks biasa, bukan regex), jawaban, status aktif. Isi awal FAQ lewat script seed. Untuk MVP, KB yang kecil cukup disisipkan seluruh entri aktif ke prompt dengan batas jumlah karakter; retrieval (full-text atau trigram) baru ditambahkan bila KB membesar.
- **AA-100 Integrasi OpenRouter** di `src/app/api/chatbot/chat/route.ts`: cek origin CSRF, rate limit chatbot yang sudah ada (reuse `rate-limit.ts`) ditambah batas harian per sesi dan global, validasi Zod (pesan maksimum 500 karakter), riwayat dikirim hanya 8 pesan terakhir, timeout dengan abort, pesan fallback saat error, model dari `OPENROUTER_MODEL`. Streaming adalah nilai tambah, bukan syarat.
- **AA-101 Scope classification.** Dua langkah: classifier singkat (in-scope, out-of-scope, sensitif) lalu jawaban. Hasilnya mengisi `isOutOfScope` pada pesan. Pra-filter kata kunci deterministik untuk kasus jelas.
- **AA-102 Conversation boundaries.** Tolak politik, SARA, hukum, kesehatan, programming, dan sejenisnya dengan template penolakan tetap. Pesan user dan isi KB diperlakukan sebagai data tidak tepercaya (dibatasi delimiter), dan system prompt tidak boleh dibocorkan.
- **AA-103 Cek status pesanan (ownership-scoped).** Server mendeteksi kode transaksi di pesan, mengambil data dengan `userId` dari session, lalu menyisipkan hasil sebagai konteks. Identitas tidak pernah berasal dari argumen yang dipilih LLM. Guest mendapat arahan untuk login. Kode yang tidak ada dan kode milik orang lain mendapat jawaban yang sama (tanpa enumerasi). Hanya field terbatas: status, tanggal ambil/kembali, sisa pembayaran.
- **AA-104 Riwayat chat.** `ChatSession` per user login; guest memakai session id di cookie httpOnly bertanda tangan. Endpoint riwayat memverifikasi kepemilikan. Retensi 12 bulan dijalankan oleh AA-105.
- **Widget** `src/components/organisms/chatbot-widget.tsx` (ikuti penamaan kebab-case repo), tampil di halaman customer: tombol mengambang, panel, indikator mengetik, `aria-live`, layar penuh di mobile.

### Pengujian dan Definition of Done

- Suite skenario dengan klien OpenRouter di-mock: FAQ sah, di luar scope, topik sensitif, upaya prompt injection, status pesanan milik orang lain, guest meminta status pesanan. Ditambah satu putaran manual dengan model asli.
- Tidak ada API key atau secret di bundle klien.
- Batas biaya (rate limit dan cap harian) terbukti aktif.

## 7. Plan 4 — QA, Security, Deploy & UAT (AA-106 s/d AA-111)

### Track paralel sejak hari pertama

- Deploy **staging** ke Vercel + Supabase lebih awal untuk memunculkan masalah khas platform (cron, env, batas fungsi) sebelum akhir sprint.
- Dokumentasikan RLS per tabel ke `Schema.md` (section baru), karena RLS adalah bagian audit AA-111.

### Per tiket

- **AA-111 Security audit.** Checklist terdokumentasi: secret di bundle dan env, cakupan RLS (uji dengan role anon dan authenticated), validasi ownership (transaksi, invoice, chatbot), keamanan upload (magic bytes, ukuran, policy bucket), webhook (signature, idempotency, replay), CSRF dan rate limit, autentikasi endpoint cron, guard role di route admin dan export.
- **AA-107 Black Box Testing.** Eksekusi skenario PRD Section 24 dalam spreadsheet berisi hasil, bukti, dan log bug; tambahkan edge case: expired booking, overbooking, webhook gagal, token kedaluwarsa. Skenario denda ditulis sebagai input manual (PRD 16.14), tidak otomatis.
- **AA-106 Responsive testing.** Mobile 375, tablet 768, desktop 1280 dan 1440; Chrome, Firefox, Safari, Edge; dokumen hasil dengan screenshot.
- **AA-108 Persiapan UAT.** Skenario, responden (owner dan beberapa customer), kuesioner dengan target PRD (task success, error rate, kepuasan), dan environment staging berisi data seed.
- **AA-109.** Sudah Done tetapi judulnya "pelaksanaan evaluasi" sementara keterangannya "persiapan awal"; rapikan relasinya dengan AA-108 supaya laporan sprint tidak ambigu.
- **AA-110 Perbaikan akhir.** Sisihkan buffer minimal 3 hari setelah UAT; triase bug berdasarkan tingkat keparahan.
- **Rilis production.** Checklist env, `prisma migrate deploy` ke Supabase production, plan Vercel dan jadwal cron, keputusan kunci Midtrans (sandbox selama UAT), serta backup sebelum rilis.

### Gerbang rilis

Tidak ada temuan keamanan tingkat tinggi yang terbuka, BBT kritis lulus, UAT selesai, dan dokumen hasil tersimpan.

## 8. Urutan dan jadwal usulan (2 minggu)

- **Hari 1–2:** deploy staging, `date-range`, skema filter, mulai Plan 1.
- **Hari 2–5:** Plan 1 sampai export, lalu demo ke mitra.
- **Hari 5–7:** Plan 2 (activity log dulu, lalu pengguna/role, lalu purging).
- **Hari 7–10:** Plan 3 (chatbot), disertai suite skenario.
- **Hari 10–14:** Plan 4 (security audit, BBT, responsive, UAT) dan buffer perbaikan.

Bila sprint ternyata 3 minggu, tambahan satu minggu dialokasikan ke UAT dan perbaikan akhir, bukan ke fitur baru.

**Urutan pemangkasan jika waktu habis:** streaming chatbot, tab PDF per laporan (cukup satu PDF ringkasan), anonimisasi customer non-aktif (dokumentasikan sebagai future work per OQ-12). Fitur inti yang tidak dipangkas: laporan finansial akurat, guard role, ownership chatbot, security audit.
