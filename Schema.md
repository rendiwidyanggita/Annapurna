# Database Schema — ANNAPURNA Adventure

Dokumen ini mendefinisikan struktur database untuk sistem penyewaan alat outdoor ANNAPURNA Adventure. Struktur ini merinci tabel, kolom, tipe data (PostgreSQL sebagai kebenaran utama, dengan Prisma sebagai pemetaan/referensi), constraint, relasi, dan strategi indeks, mengacu pada rancangan ERD di `prd.md`.

---

## 1. Overview & Conventions

1. **Naming Convention**: 
   - Tabel: `snake_case` plural (contoh: `products`, `inventory_units`).
   - Kolom: `snake_case` (contoh: `created_at`, `is_active`).
2. **Primary Key**: Menggunakan UUID tipe `UUID` (PostgreSQL) / `String @id @default(uuid())` (Prisma).
3. **Timestamps**: Setiap tabel umumnya memiliki `created_at` (default `now()`) dan `updated_at`. Tabel dengan logical delete menggunakan `deleted_at`.
4. **Soft Delete**: Data entitas master tidak dihapus fisik melainkan diset `deleted_at` atau `is_active = false`.
5. **Data Types**: Ditulis dalam format `PostgreSQL Type (Prisma Type)`.

---

## 2. Enums

Berikut adalah tipe Enum yang mendefinisikan batas nilai (domain) yang diizinkan untuk kolom tertentu. Enum direpresentasikan sebagai tipe khusus di PostgreSQL (`CREATE TYPE`) atau mapping ke tipe `String` jika validasi di-handle via kode. Untuk konsistensi tipe dan integritas data, disarankan didefinisikan sebagai PostgreSQL Enum.

| Enum Name | Values |
|---|---|
| `transaction_status` | `Menunggu Pembayaran DP`, `DP Dibayar`, `Dikonfirmasi`, `Siap Diambil`, `Sedang Disewa`, `Terlambat`, `Dikembalikan`, `Selesai`, `Dibatalkan`, `Ditolak`, `Expired` |
| `payment_status` | `Unpaid`, `Pending`, `DP Paid`, `Failed`, `Expired`, `Refunded`, `Remaining Paid`, `Fully Paid` |
| `unit_status` | `Available`, `Reserved`, `Rented`, `Returned`, `Maintenance`, `Damaged`, `Lost`, `Inactive` |
| `guarantee_status`| `Not Received`, `Received`, `Returned` |
| `item_type` | `rental_unit`, `consumable` |
| `media_type` | `image`, `video` |
| `penalty_type` | `Late Return`, `Damage`, `Lost Item`, `Incomplete Item`, `Other` |

---

## 3. Auth & User Tables

### 3.1 `roles`
Mendefinisikan tipe role dalam sistem.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `name` | `VARCHAR` (`String`) | UNIQUE, NOT NULL | Nama role (e.g., 'customer', 'admin', 'owner') |
| `description` | `TEXT` (`String`) | | Penjelasan role |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 3.2 `users`
Tabel pengguna aplikasi yang terhubung ke Supabase Auth.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Relasi 1:1 ke Supabase Auth `auth.users` |
| `role_id` | `UUID` (`String`) | FK -> `roles.id`, NOT NULL | Role akses |
| `email` | `VARCHAR` (`String`) | UNIQUE, NOT NULL | Email login pengguna |
| `auth_provider` | `VARCHAR` (`String`) | NOT NULL | Metode login (e.g., 'email', 'google') |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Menandakan akun aktif |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 3.3 `profiles`
Data profil pengguna untuk kelengkapan sebelum checkout.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `user_id` | `UUID` (`String`) | FK -> `users.id`, UNIQUE, NOT NULL | Pemilik profil (1:1) |
| `full_name` | `VARCHAR` (`String`) | | Nama lengkap customer |
| `phone_number` | `VARCHAR` (`String`) | | No WhatsApp |
| `address` | `TEXT` (`String`) | | Alamat lengkap |
| `is_profile_complete`| `BOOLEAN` (`Boolean`) | DEFAULT false | Menandakan data wajib terisi |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

---

## 4. Product & Inventory Tables

### 4.1 `categories`
Kategori alat outdoor (Tenda, Alat Masak, dll).

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `name` | `VARCHAR` (`String`) | UNIQUE, NOT NULL | Nama kategori |
| `description` | `TEXT` (`String`) | | Deskripsi singkat |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Status aktif |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 4.2 `products`
Entitas produk utama yang ditawarkan untuk disewa.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `category_id` | `UUID` (`String`) | FK -> `categories.id`, NOT NULL | Relasi kategori |
| `name` | `VARCHAR` (`String`) | NOT NULL | Nama produk |
| `description` | `TEXT` (`String`) | | Deskripsi produk |
| `item_type` | `item_type` (`Enum`) | NOT NULL | `rental_unit` / `consumable` |
| `is_reusable` | `BOOLEAN` (`Boolean`) | NOT NULL, DEFAULT true | Hanya relevan untuk `item_type = consumable`. `true` = stok dikembalikan saat return (e.g. matras massal). `false` = stok berkurang permanen, tidak dikembalikan (e.g. gas kaleng sekali pakai); item ini dihitung sebagai retail/jual putus dalam laporan, bukan rental. |
| `price_permalam` | `INTEGER` (`Int`) | NOT NULL | Harga per malam |
| `price_perkegiatan_1`| `INTEGER` (`Int`) | NOT NULL | Harga 3 hari 3 malam |
| `price_perkegiatan_2`| `INTEGER` (`Int`) | NOT NULL | Harga 5 hari 5 malam |
| `consumable_stock` | `INTEGER` (`Int`) | DEFAULT 0 | Stok khusus jika tipe `consumable` |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Status aktif |
| `deleted_at` | `TIMESTAMPTZ` (`DateTime?`)| NULLABLE | Soft delete |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 4.3 `product_variants`
Variasi dari produk utama (e.g., Ukuran XL, Warna Hitam). Produk tanpa variasi eksplisit dapat dipetakan dengan satu default variasi.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `product_id` | `UUID` (`String`) | FK -> `products.id`, NOT NULL | Relasi produk parent |
| `variant_name` | `VARCHAR` (`String`) | NOT NULL | Nama variasi / default |
| `size` | `VARCHAR` (`String`) | | Ukuran (e.g., L, XL, 39) |
| `color` | `VARCHAR` (`String`) | | Warna dominan |
| `brand` | `VARCHAR` (`String`) | | Merk (opsional) |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Status aktif |
| `deleted_at` | `TIMESTAMPTZ` (`DateTime?`)| NULLABLE | Soft delete |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 4.4 `product_media`
Galeri foto/video dari produk.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `product_id` | `UUID` (`String`) | FK -> `products.id`, NOT NULL | Relasi produk parent |
| `media_type` | `media_type` (`Enum`) | NOT NULL | `image` atau `video` |
| `media_url` | `TEXT` (`String`) | NOT NULL | URL publik Supabase Storage |
| `storage_path` | `TEXT` (`String`) | NOT NULL | Path relatif di storage (untuk delete) |
| `thumbnail_url`| `TEXT` (`String`) | | URL thumbnail untuk video |
| `alt_text` | `TEXT` (`String`) | | Teks aksesibilitas gambar |
| `sort_order` | `INTEGER` (`Int`) | DEFAULT 0 | Urutan tampil (0 = prioritas awal) |
| `is_primary` | `BOOLEAN` (`Boolean`) | DEFAULT false | Penanda gambar utama cover |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 4.5 `inventory_units`
Unit barang aktual dengan kode pelacakan. Diwajibkan untuk item tipe `rental_unit`.

**Fakta Terkonfirmasi (OQ-02):** `unit_status` di tabel ini merepresentasikan **kondisi fisik unit saja** (Available/Maintenance/Damaged/Lost/Inactive), bukan ketersediaan untuk tanggal tertentu. `Reserved`/`Rented` tidak boleh dijadikan penentu ketersediaan lintas tanggal — satu unit fisik yang sedang dalam transaksi aktif pada rentang tanggal X tetap harus muncul available untuk booking di rentang tanggal Y yang tidak overlap. Ketersediaan per tanggal **dihitung on-the-fly** via query overlap antara `rental_start_date`/`rental_end_date` pada `rental_transactions` berstatus aktif terhadap `unit_id` yang diminta — bukan dibaca langsung dari kolom `unit_status`.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `variant_id` | `UUID` (`String`) | FK -> `product_variants.id`, NOT NULL | Unit tergabung dalam variasi mana |
| `inventory_code`| `VARCHAR` (`String`) | UNIQUE, NOT NULL | Kode inventaris fisik unit (e.g. TND-001) |
| `unit_status` | `unit_status` (`Enum`)| NOT NULL, DEFAULT 'Available' | Status kondisi/ketersediaan unit |
| `condition_notes`| `TEXT` (`String`) | | Catatan admin terkait cacat/kondisi |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Menandakan tidak dipensiunkan/dijual |
| `deleted_at` | `TIMESTAMPTZ` (`DateTime?`)| NULLABLE | Soft delete |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 4.6 `unit_status_logs`
Riwayat perubahan status pada suatu unit.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `unit_id` | `UUID` (`String`) | FK -> `inventory_units.id`, NOT NULL | Relasi unit terkait |
| `previous_status`| `unit_status` (`Enum`)| NOT NULL | Status sebelum diubah |
| `new_status` | `unit_status` (`Enum`)| NOT NULL | Status setelah diubah |
| `notes` | `TEXT` (`String`) | | Catatan perubahan (alasan rusak, dll) |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | Waktu perubahan |

---

## 5. Package Tables

### 5.1 `rental_packages`
Kumpulan item yang disewa dalam satu harga (e.g. Paket Camping 2P).

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `name` | `VARCHAR` (`String`) | NOT NULL | Nama paket |
| `description` | `TEXT` (`String`) | | Deskripsi paket |
| `price_permalam`| `INTEGER` (`Int`) | NOT NULL | Harga paket per malam |
| `price_perkegiatan_1`| `INTEGER` (`Int`) | NOT NULL | Harga paket 3 hari 3 malam |
| `price_perkegiatan_2`| `INTEGER` (`Int`) | NOT NULL | Harga paket 5 hari 5 malam |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Status aktif paket |
| `deleted_at` | `TIMESTAMPTZ` (`DateTime?`)| NULLABLE | Soft delete |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 5.2 `package_media`
Galeri foto/video untuk paket (serupa dengan product_media).

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `package_id` | `UUID` (`String`) | FK -> `rental_packages.id`, NOT NULL| Relasi paket |
| `media_type` | `media_type` (`Enum`) | NOT NULL | `image` atau `video` |
| `media_url` | `TEXT` (`String`) | NOT NULL | URL publik Storage |
| `storage_path` | `TEXT` (`String`) | NOT NULL | Path storage |
| `thumbnail_url`| `TEXT` (`String`) | | URL thumbnail untuk video |
| `alt_text` | `TEXT` (`String`) | | Teks aksesibilitas |
| `sort_order` | `INTEGER` (`Int`) | DEFAULT 0 | |
| `is_primary` | `BOOLEAN` (`Boolean`) | DEFAULT false | Penanda gambar utama |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 5.3 `package_items`
Komposisi produk pembentuk sebuah paket (Many-to-Many products dan packages).

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `package_id` | `UUID` (`String`) | FK -> `rental_packages.id`, NOT NULL| Paket parent |
| `product_id` | `UUID` (`String`) | FK -> `products.id`, NOT NULL | Relasi produk pembentuk |
| `quantity` | `INTEGER` (`Int`) | NOT NULL, > 0 | Jumlah produk dalam paket |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

---

## 6. Transaction Tables

### 6.1 `rental_transactions`
Informasi utama pemesanan dan penyewaan customer.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `user_id` | `UUID` (`String`) | FK -> `users.id`, NOT NULL | Customer pemilik transaksi |
| `terms_id` | `UUID` (`String`) | FK -> `terms_conditions.id`, NOT NULL| S.K versi yang disetujui |
| `transaction_code`| `VARCHAR` (`String`) | UNIQUE, NOT NULL | Kode referensi invoice (e.g. TRX-12345) |
| `rental_duration_type`| `VARCHAR` (`String`) | NOT NULL | Enum/Literal: 'Permalam', 'Perkegiatan I', 'Perkegiatan II' |
| `rental_start_date` | `DATE` (`DateTime`) | NOT NULL | Tanggal pengambilan rencana |
| `rental_end_date` | `DATE` (`DateTime`) | NOT NULL | Tanggal maksimal pengembalian (calculated backend) |
| `actual_return_date` | `DATE` (`DateTime`) | NULLABLE | Tanggal barang dikembalikan aktual |
| `total_rental_amount`| `INTEGER` (`Int`) | NOT NULL | Total sewa murni |
| `dp_amount` | `INTEGER` (`Int`) | NOT NULL | DP yang harus dibayar (50%) |
| `remaining_amount` | `INTEGER` (`Int`) | NOT NULL | Sisa pelunasan (Total - DP) |
| `penalty_amount` | `INTEGER` (`Int`) | DEFAULT 0 | Total nominal denda manual |
| `final_amount` | `INTEGER` (`Int`) | NOT NULL | Total akhir keseluruhan |
| `payment_status`| `payment_status` (`Enum`)| NOT NULL | Status payment (DP/Remaining/Fully Paid) |
| `transaction_status`| `transaction_status` (`Enum`)| NOT NULL | Status flow penyewaan |
| `guarantee_type`| `VARCHAR` (`String`) | | Jenis jaminan (KTP, SIM, dll) diset Admin |
| `guarantee_status`| `guarantee_status` (`Enum`)| | Status penyimpanan jaminan di toko |
| `guarantee_notes`| `TEXT` (`String`) | | |
| `terms_agreed` | `BOOLEAN` (`Boolean`) | NOT NULL | Bukti centang setuju S.K saat checkout |
| `terms_agreed_at`| `TIMESTAMPTZ` (`DateTime`) | NOT NULL | Waktu setuju checkout |
| `terms_snapshot`| `TEXT` (`String`) | NOT NULL | Teks copy dari S.K untuk immutable reference |
| `notes` | `TEXT` (`String`) | | Catatan khusus dari admin / customer |
| `expires_at` | `TIMESTAMPTZ` (`DateTime`) | NOT NULL | Batas waktu pembayaran DP sblm expired |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 6.2 `rental_transaction_items`
Rincian item unit fisik yang disewa. Item adalah snapshot produk.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `transaction_id`| `UUID` (`String`) | FK -> `rental_transactions.id`, NOT NULL| Relasi transaksi parent |
| `unit_id` | `UUID` (`String`) | FK -> `inventory_units.id` | Jika `rental_unit` |
| `product_id` | `UUID` (`String`) | FK -> `products.id`, NOT NULL | Jika tracking referensi produk (e.g. consumable) |
| `item_type_snapshot`| `VARCHAR` (`String`) | NOT NULL | 'rental_unit' / 'consumable' saat transaksi |
| `item_name_snapshot`| `VARCHAR` (`String`) | NOT NULL | Nama produk saat checkout |
| `variant_snapshot`| `VARCHAR` (`String`) | | Detail ukuran/warna (jika ada) |
| `package_snapshot`| `VARCHAR` (`String`) | | Jika dibooking dari paket, rekam nama paketnya |
| `duration_snapshot`| `VARCHAR` (`String`) | NOT NULL | 'Permalam' / dll |
| `rental_price_snapshot`| `INTEGER` (`Int`) | NOT NULL | Harga per unit per durasi |
| `quantity` | `INTEGER` (`Int`) | NOT NULL, DEFAULT 1 | Biasanya 1 untuk unit unik (1 row = 1 unit fisik, lihat OQ-06), bisa > 1 untuk consumable |
| `subtotal` | `INTEGER` (`Int`) | NOT NULL | subtotal qty * price |
| `is_returned` | `BOOLEAN` (`Boolean`) | NOT NULL, DEFAULT false | Partial return per item (OQ-08). Transaksi baru boleh berubah ke `Dikembalikan`/`Selesai` setelah seluruh item terkait `is_returned = true` |
| `returned_at` | `TIMESTAMPTZ` (`DateTime?`) | NULLABLE | Waktu item ini dicentang kembali oleh admin |
| `item_condition_notes`| `TEXT` (`String`) | | Catatan kondisi khusus item ini saat dikembalikan (jika berbeda dari catatan umum di `returns`) |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 6.3 `payments`
Rekam jejak integrasi payment gateway Midtrans dan catatan manual.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `transaction_id`| `UUID` (`String`) | FK -> `rental_transactions.id`, NOT NULL| |
| `payment_type` | `VARCHAR` (`String`) | NOT NULL | 'DP', 'PELUNASAN', 'DENDA' |
| `payment_method`| `VARCHAR` (`String`) | | 'Midtrans', 'Cash' (admin pelunasan) |
| `midtrans_order_id`| `VARCHAR` (`String`) | UNIQUE (nullable) | ID Order integrasi Midtrans |
| `midtrans_transaction_id`| `VARCHAR` (`String`) | UNIQUE (nullable) | Transaction ID dari gateway |
| `amount` | `INTEGER` (`Int`) | NOT NULL | Jumlah yang dibayarkan |
| `payment_status`| `payment_status` (`Enum`)| NOT NULL | Status rekaman pembayaran ini |
| `paid_at` | `TIMESTAMPTZ` (`DateTime`) | | Waktu webhook/manual konfirmasi lunas |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 6.4 `returns`
Data meta untuk proses pengembalian fisik.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `transaction_id`| `UUID` (`String`) | FK -> `rental_transactions.id`, NOT NULL| |
| `planned_return_date`| `DATE` (`DateTime`) | NOT NULL | Salinan dari end_date booking awal |
| `actual_return_date` | `DATE` (`DateTime`) | NOT NULL | Kapan diserahkan fisik |
| `return_condition`| `TEXT` (`String`) | | Catatan keseluruhan (baik, kurang lengkap, basah, dll) |
| `return_notes` | `TEXT` (`String`) | | |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 6.5 `penalties`
Denda operasional manual yang dikenakan oleh Admin.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `transaction_id`| `UUID` (`String`) | FK -> `rental_transactions.id`, NOT NULL| |
| `penalty_type` | `penalty_type` (`Enum`)| NOT NULL | Alasan denda |
| `amount` | `INTEGER` (`Int`) | NOT NULL | Nominal tagihan |
| `reason` | `TEXT` (`String`) | NOT NULL | Deskripsi kenapa denda (wajib sesuai PRD) |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

---

## 7. Terms & Conditions Table

### 7.1 `terms_conditions`
Versi S.K operasional.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `version` | `VARCHAR` (`String`) | UNIQUE, NOT NULL | (e.g. 'v1.0') |
| `content` | `TEXT` (`String`) | NOT NULL | Isi S.K (Markdown / HTML support) |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | Flag S.K mana yang live digunakan saat ini |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

---

## 8. Chatbot Tables

### 8.1 `chat_sessions`
Pembatasan chat dan memori konteks percakapan.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `user_id` | `UUID` (`String`) | FK -> `users.id` (nullable)| Jika user login |
| `session_status`| `VARCHAR` (`String`) | | 'Active', 'Ended' |
| `started_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `ended_at` | `TIMESTAMPTZ` (`DateTime`) | | |

### 8.2 `chat_messages`
Penyimpanan percakapan RAG chatbot.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `chat_session_id`| `UUID` (`String`) | FK -> `chat_sessions.id`, NOT NULL| |
| `knowledge_base_id`| `UUID` (`String`) | FK -> `chatbot_knowledge_base.id`| Source RAG yang di pick LLM (opsional) |
| `sender` | `VARCHAR` (`String`) | NOT NULL | 'User', 'Bot' |
| `message` | `TEXT` (`String`) | NOT NULL | Konten chat |
| `is_out_of_scope`| `BOOLEAN` (`Boolean`) | DEFAULT false | Penanda ditolak (out of boundary) |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

### 8.3 `chatbot_knowledge_base`
Basis pengetahuan admin (FAQ, data manual) yang tidak ada otomatis di database.

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `topic` | `VARCHAR` (`String`) | NOT NULL | Label kategori topik |
| `question_pattern`| `TEXT` (`String`) | | Prediksi ragam kata pertanyaan user |
| `answer` | `TEXT` (`String`) | NOT NULL | Jawaban valid dari toko |
| `is_active` | `BOOLEAN` (`Boolean`) | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` (`DateTime`) | | |

---

## 9. Audit Table

### 9.1 `activity_logs`
Sistem riwayat aktivitas krusial untuk owner audit (e.g. ubah role, denda manual).

| Kolom | Tipe PostgreSQL (Prisma) | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `UUID` (`String`) | PK | Primary Key |
| `user_id` | `UUID` (`String`) | FK -> `users.id` (nullable) | Aktor eksekutor aksi |
| `action` | `VARCHAR` (`String`) | NOT NULL | Enum setara 'UPDATE_ROLE', 'CANCEL_TRANSACTION' dll. |
| `entity_name` | `VARCHAR` (`String`) | NOT NULL | Nama tabel entitas, e.g. 'rental_transactions' |
| `entity_id` | `UUID` (`String`) | | ID entitas |
| `old_value` | `TEXT` (`String`) | | Format JSON serialize value lama |
| `new_value` | `TEXT` (`String`) | | Format JSON serialize value baru |
| `description` | `TEXT` (`String`) | | Narasi singkat aktivitas |
| `created_at` | `TIMESTAMPTZ` (`DateTime`) | DEFAULT NOW() | |

---

## 10. Index Strategy

Index disarankan dipasang di sisi PostgreSQL melalui Prisma `@@index` untuk mempercepat query filtering yang intensif:

- `users(email)` — untuk lookup login.
- `inventory_units(variant_id, unit_status, is_active)` — optimasi ketersediaan cek unit per produk.
- `rental_transactions(user_id)` — lookup halaman orders untuk customer dengan cepat.
- `rental_transactions(transaction_status, payment_status)` — filter di admin dashboard dan pengecekan expiry background.
- `rental_transactions(transaction_code)` — untuk searching order dari input.
- `rental_transaction_items(transaction_id, unit_id)` — overlap conflict availability query.
- `payments(midtrans_order_id, midtrans_transaction_id)` — lookup idempotency dari provider.

---

## 11. ERD Reference

Sesuai section 26 `prd.md`, relasi digambarkan sebagai berikut:
- **Tabel Transaksi** berfungsi sebagai hub utama (memiliki Relasi dari User, Terms_Conditions).
- **Tabel Transaction Items** menjembatani relasi Transactions ke Inventory_Units secara many-to-one, dengan menyimpan snapshot harga dan relasi parent unitnya.
- **Tabel Pembayaran, Returns, dan Penalties** berelasi 1:1 atau Many:1 (Payment retry) ke Transaksi.

---

## 12. Catatan & Keputusan Final (dahulu Open Questions)

1. Snapshot field di `rental_transaction_items` dan `rental_transactions` WAJIB disimpan saat checkout commit. Database normalization relax pada snapshot untuk tujuan rekam jejak history keuangan yang immutable.
2. `unit_id` pada transaksi adalah opsional pada schema level untuk support Item tipe consumable.
3. Sejalan dengan PRD OQ-06: 1 unit unik = 1 Row di tabel `rental_transaction_items` (karena qty fixed 1 dan untuk memegang `unit_id` FK). Untuk Consumable `unit_id` NULL, qty bisa lebih dari 1. Ini menjawab struktur di schema.

Seluruh 16 Pertanyaan Terbuka pada PRD Section 34 telah diputuskan. Ringkasan dampak terhadap schema:

| ID | Keputusan Final | Dampak Schema |
|---|---|---|
| OQ-01 | Soft-hold saat checkout (sebelum DP), auto-release jika `expires_at` terlampaui | `rental_transactions.expires_at` sudah ada; job cleanup diperlukan di service layer |
| OQ-02 | `unit_status` = kondisi fisik saja; ketersediaan per tanggal dihitung via overlap query | Lihat catatan di Section 4.5 |
| OQ-03 | `is_reusable` pada `products`: `true` = stok kembali saat return, `false` = stok berkurang permanen (dihitung retail) | Kolom baru `products.is_reusable` |
| OQ-04 | `Pending` dihapus dari `transaction_status`, disatukan jadi `Menunggu Pembayaran DP` | Enum `transaction_status` diperbarui (Section 2) |
| OQ-05 | Produk tanpa variasi eksplisit dipetakan ke satu default variant | Sudah sesuai schema (`inventory_units.variant_id` NOT NULL) |
| OQ-06 | 1 unit unik = 1 row di `rental_transaction_items`; consumable pakai `quantity` tanpa `unit_id` | Sudah sesuai schema |
| OQ-07 | Owner-only: S.K, user/role, laporan finansial ringkasan. Admin: sisanya | Permission matrix di service layer, bukan schema |
| OQ-08 | Partial return didukung via checkbox per item | Kolom baru `rental_transaction_items.is_returned`, `returned_at`, `item_condition_notes` |
| OQ-09 | DP hangus jika customer batalkan sendiri; refund penuh jika toko batalkan | Aturan bisnis di service layer, memakai `payment_status = Refunded` yang sudah ada |
| OQ-10 | Webhook telat setelah expired: tidak re-reserve otomatis, refund otomatis, notifikasi admin | Business rule di webhook handler |
| OQ-11 | Zona waktu operasional: WIB (Asia/Jakarta). Simpan `TIMESTAMPTZ` (UTC) di DB, hitung di application layer | Tidak ada perubahan tipe kolom (`TIMESTAMPTZ` sudah tepat) |
| OQ-12 | Retensi: chat/activity log 12 bulan lalu archive; data customer 24 bulan setelah non-aktif | Job archival, di luar scope MVP awal (dokumentasikan sebagai future work jika belum sempat) |
| OQ-13 | Durasi sebelum `Expired`: **60 menit** sejak checkout | Nilai konfigurasi di service layer, memakai `rental_transactions.expires_at` |
| OQ-14 | Harga paket adalah snapshot tetap, tidak terpengaruh perubahan harga item penyusun | Sudah sesuai schema (`rental_packages` punya field harga sendiri, terpisah dari `products`) |
| OQ-15 | DP Midtrans tetap wajib; teks S.K disesuaikan agar konsisten | Perubahan konten `terms_conditions`, bukan schema |
| OQ-16 | Tanggal maksimal pengembalian = kalender murni (tanggal ambil + durasi hari), tidak dipengaruhi jam operasional | Formula di service layer saat mengisi `rental_end_date` |
