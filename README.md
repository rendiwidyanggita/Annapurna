# 🌲 ANNAPURNA Adventure — Sistem Informasi Penyewaan Alat Outdoor

[![Next.js](https://img.shields.io/badge/Next.js-15%2B%20%2F%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres%20%7C%20Storage-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Midtrans](https://img.shields.io/badge/Payment-Midtrans%20Snap-002855?style=flat-square)](https://midtrans.com/)

Platform website modern untuk mendigitalisasi proses operasional dan penyewaan alat outdoor di **ANNAPURNA Adventure**. Menggantikan pencatatan manual/spreadsheet dengan sistem manajemen booking terintegrasi, pembayaran uang muka (DP 50%), pelacakan stok unit fisik unik, dan otomasi aturan penyewaan.

---

## 📌 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
  - [Role Customer](#1-role-customer)
  - [Role Admin / Operasional](#2-role-admin--operasional)
  - [Role Owner / Super Admin](#3-role-owner--super-admin)
- [Tech Stack](#-tech-stack)
- [Arsitektur & Prinsip Desain](#-arsitektur--prinsip-desain)
- [Struktur Direktori](#-struktur-direktori)
- [Panduan Memulai (Getting Started)](#-panduan-memulai-getting-started)
- [Environment Variables](#-environment-variables)
- [Database & Prisma Commands](#-database--prisma-commands)
- [Aturan Bisnis Kunci](#-aturan-bisnis-kunci)
- [Dokumentasi Lengkap](#-dokumentasi-lengkap)

---

## ⛰️ Tentang Proyek

Proses penyewaan alat outdoor sebelumnya masih bergantung pada WhatsApp, catatan manual, dan spreadsheet yang rawan terjadi *overbooking*, ketidakjelasan status unit yang rusak/perbaikan, serta pencatatan denda dan jaminan identitas yang tidak terpusat.

**ANNAPURNA Adventure** menghadirkan solusi menyeluruh dengan:
1. **Penyewaan Online Berbasis Durasi Tetap:** Permalam (1 malam), Perkegiatan I (3 hari 3 malam), dan Perkegiatan II (5 hari 5 malam).
2. **Validasi Booking melalui DP 50%:** Terintegrasi langsung dengan Midtrans Payment Gateway (QRIS, Virtual Account, E-Wallet).
3. **Pelacakan Fisik Barang Unik:** Manajemen unit inventaris granular (`TND-001`, `STV-004`) dengan status *Available, Reserved, Rented, Returned, Maintenance, Damaged, Lost*.
4. **Pencatatan Jaminan & Pelunasan Offline:** Pencatatan jaminan identitas fisik asli (KTP/SIM/KTM) dan sisa pelunasan saat pengambilan alat di toko.
5. **Chatbot AI Layanan Pelanggan:** Asisten virtual berbasis OpenRouter AI untuk FAQ, ketentuan sewa, dan status pesanan.

---

## ✨ Fitur Utama

### 1. Role Customer
* **Katalog & Paket Sewa:** Eksplorasi produk per kategori (*Tenda, Alat Masak, Carrier, Sleeping Gear, Paket Camping*) lengkap dengan galeri foto/video dan variasi (ukuran/warna).
* **Rental Date Selector Cerdas:** Komponen 3 kolom terintegrasi (`Tgl Ambil` | `Durasi` | `Maks. Pengembalian`) dengan kalkulasi otomatis batas tanggal kembali.
* **Profile Completion Gate:** Validasi kelengkapan data diri (Nama, WhatsApp, Alamat sesuai KTP) sebelum checkout.
* **Booking & Checkout DP 50%:** Rincian biaya transparan dengan pemisahan DP 50% online dan sisa pelunasan toko.
* **Persetujuan S.K Digital:** Checkbox persetujuan Syarat & Ketentuan dengan snapshot versi tersimpan pada transaksi.
* **Tracking Status Pesanan:** Stepper 5 tahap (*Menunggu DP → DP Dibayar → Siap Diambil → Sedang Disewa → Selesai*).
* **Autentikasi:** Login/Register via Email & Google OAuth, serta Lupa/Reset Password via email.

### 2. Role Admin / Operasional
* **Dashboard Operasional Toko:** KPI metrik harian (transaksi aktif, verifikasi DP, unit maintenance) dan papan jadwal pergerakan barang (*Jadwal Ambil vs Jadwal Kembali Hari Ini*).
* **Manajemen Transaksi (Handover & Return):**
  * *Proses Pengambilan:* Checklist kondisi fisik barang, pencatatan jaminan identitas asli, dan input pelunasan kas/QRIS.
  * *Proses Pengembalian:* Verifikasi kondisi unit, penginputan denda manual (*terlambat/rusak/hilang*), dan konfirmasi pengembalian KTP.
* **Manajemen Produk & Unit Inventaris:**
  * Pemisahan tipe item: `rental_unit` (wajib kode unit unik) dan `consumable` (stok kuantitas).
  * CRUD master produk, variasi ukuran/warna, dan galeri media.
  * Manajemen siklus status unit fisik serta pencatatan riwayat teknisi ke `unit_status_logs`.
* **Chatbot Knowledge Base:** Pengelolaan data tanya-jawab untuk memperkaya konteks AI Chatbot.

### 3. Role Owner / Super Admin
* **Laporan Keuangan & Rental:** Rekapitulasi omzet sewa, total DP Midtrans, pelunasan kas toko, serta total denda operasional.
* **Export Data:** Export laporan resmi ke format **PDF** dan **Excel (.xlsx)**.
* **Manajemen Pengguna & Role:** Pengelolaan hak akses staf admin dan monitoring `activity_logs`.

---

## 🛠️ Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | React Server Components, Server Actions & Route Handlers |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (v5) | Full strict type safety |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (v4) | Modern utility-first CSS |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) | Accessible & customizable UI primitives |
| **Icons** | [Hugeicons](https://hugeicons.com/) / Lucide | Set ikon modern dan konsisten |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) & [TanStack Query](https://tanstack.com/query) | Global client-state & Server-state management |
| **Validation** | [Zod](https://zod.dev/) | Schema validation pada backend & API contracts |
| **Database & ORM** | [Supabase PostgreSQL](https://supabase.com/) & [Prisma ORM](https://www.prisma.io/) | Relational schema, migrations & type-safe queries |
| **Auth & Storage** | [Supabase Auth](https://supabase.com/auth) & Storage | OAuth, session management, dan media catalog storage |
| **Payment Gateway** | [Midtrans](https://midtrans.com/) (Snap API) | Pembayaran online DP 50% via Webhook idempotent |
| **AI Integration** | [OpenRouter](https://openrouter.ai/) | LLM gateway untuk customer service chatbot |

---

## 🏗️ Arsitektur & Prinsip Desain

Struktur aplikasi mengadopsi **Layered Architecture** di backend dan **Atomic Design** di frontend:

```
[ Browser / Client ]
        │ (HTTP / JSON)
        ▼
[ Route Handlers (Controller Entry Point) ]
        │ (Zod Validation)
        ▼
[ Domain Services (Business Rules & Transactions) ]
        │
   ┌────┴────────────────────────┬──────────────────────┐
   ▼                             ▼                      ▼
[ Repositories (Prisma) ]  [ Supabase / Storage ]  [ Midtrans / AI ]
   │
   ▼
[ PostgreSQL Database ]
```

### Prinsip Utama:
1. **Backend as Single Source of Truth:** Validasi input, kalkulasi harga/durasi, dan pengecekan ketersediaan unit hanya dijalankan pada backend service.
2. **Database Transactions:** Proses booking, assign unit inventaris, pelunasan, dan pengembalian dijalankan dalam transaksi atomic PostgreSQL.
3. **Auditability & Snapshot:** Transaksi menyimpan snapshot harga, nama produk, variasi, dan isi S.K yang disetujui untuk integritas data historis.

---

## 📁 Struktur Direktori

```
annapurna-rent/
├── prisma/
│   ├── schema.prisma            # Skema database relasional Prisma
│   └── seed.ts                  # Seeder data awal (kategori, produk, S.K)
├── public/                      # Aset statis & logo brand
├── src/
│   ├── app/
│   │   ├── (auth)/              # Halaman Login, Register, Lupa & Reset Password
│   │   ├── (customer)/          # Halaman Publik: Beranda, Katalog, Paket, Cart, Pesanan Saya
│   │   ├── (admin)/             # Dashboard Staf: Transaksi, Produk, Unit, Laporan, Log
│   │   └── api/                 # Next.js Route Handlers (Auth, Checkout, Webhooks, Admin API)
│   ├── components/
│   │   ├── ui/                  # Primitif shadcn/ui (Button, Dialog, Input, Table, dll)
│   │   ├── atoms/               # Komponen atom (StatusBadge, PriceDisplay, EmptyState)
│   │   ├── molecules/           # Komponen molekul (ProductCard, RentalDateSelector, CartItem)
│   │   ├── organisms/           # Bagian kompleks (TransactionTable, ChatbotWidget, CheckoutForm)
│   │   └── layouts/             # Navbar, Sidebar Admin, Footer
│   ├── config/                  # Konfigurasi navigasi & metadata situs
│   ├── hooks/                   # Custom React hooks (useCart, useAvailability, useOrders)
│   ├── lib/                     # Client singleton (Prisma, Supabase, Midtrans, OpenRouter, Utils)
│   ├── repositories/            # Data access layer (Prisma queries)
│   ├── schemas/                 # Zod validation schemas
│   ├── services/                # Business logic layer
│   ├── stores/                  # Zustand stores (Cart, Checkout state)
│   └── types/                   # TypeScript interface & API contracts
├── .env.example                 # Template environment variables
├── Architecture.md              # Spesifikasi teknis & arsitektur sistem
├── Design.md                    # Panduan Design System & UI/UX
├── PRD.md                       # Product Requirements Document (Single Source of Truth)
├── Schema.md                    # Spesifikasi detail database schema & ERD
└── rules.md                     # Panduan aturan development & mentor AI
```

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat
- [Bun](https://bun.sh/) versi 1.1+ (runtime & package manager)
- Akun [Supabase](https://supabase.com/) & [Midtrans Sandbox](https://dashboard.sandbox.midtrans.com/)

### 2. Kloning Repositori & Instal Dependensi
```bash
git clone https://github.com/rendiwidyanggita/Annapurna-rent.git
cd Annapurna-rent
bun install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` ke `.env.local` lalu lengkapi kredensial Anda:
```bash
cp .env.example .env.local
```

### 4. Setup Database & Prisma
Jalankan sinkronisasi skema ke database PostgreSQL Supabase:
```bash
# Generate Prisma Client
bun run db:generate

# Push schema ke database
bun run db:push

# (Opsional) Buka Prisma Studio untuk inspeksi data visual
bun run db:studio
```

### 5. Jalankan Server Pengembangan
```bash
bun run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔐 Environment Variables

Daftar environment variable yang dibutuhkan (lihat `.env.example`):

```env
# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Midtrans Payment Gateway
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
MIDTRANS_IS_PRODUCTION="false"

# OpenRouter AI Chatbot
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="openai/gpt-4o-mini"
```

---

## 📜 Aturan Bisnis Kunci

1. **Durasi Sewa:**
   - `Permalam`: Pengembalian esok hari (Tgl Ambil + 1 hari).
   - `Perkegiatan I`: Sewa 3 hari 3 malam (Tgl Ambil + 3 hari).
   - `Perkegiatan II`: Sewa 5 hari 5 malam (Tgl Ambil + 5 hari).
2. **Uang Muka (DP 50%):** Booking baru sah dan unit ter-reservasi setelah webhook Midtrans mengonfirmasi pembayaran DP 50%.
3. **Jaminan Identitas Asli:** Customer wajib menyerahkan KTP/SIM/KTM asli saat pengambilan fisik barang di toko. Jaminan disimpan di brankas toko dan diserahkan kembali saat pengembalian lengkap.
4. **Sanksi & Denda:** Keterlambatan pengembalian dikenakan denda sesuai tarif harian. Kerusakan/kehilangan dicatat dan ditagihkan secara transparan oleh admin melalui sistem.

---

## 📚 Dokumentasi Terkait

Untuk pemahaman teknis dan desain lebih mendalam, silakan pelajari dokumen arsitektur proyek:
- 📄 [PRD.md](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna-rent/PRD.md) — *Product Requirements Document & User Stories*
- 🎨 [Design.md](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna-rent/Design.md) — *Design System, Color Palette, & UI/UX Guidelines*
- 🏛️ [Architecture.md](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna-rent/Architecture.md) — *Technical Architecture, Data Flows, & Layer Boundaries*
- 🗄️ [Schema.md](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna-rent/Schema.md) — *Database Schema, Enums, Tables, & Relations*
- ⚖️ [rules.md](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna-rent/rules.md) — *AI Mentor Rules & Implementation Guardrails*

---

<div align="center">
  <sub>Dibangun dengan ❤️ untuk <b>ANNAPURNA Adventure</b></sub>
</div>
