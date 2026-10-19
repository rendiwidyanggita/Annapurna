# Technical Design Document: Dynamic Schedule-Aware Stock & Quantity Stepper

- **Date:** 2026-10-19
- **Author:** Antigravity AI & Rendi Widya Anggita
- **Status:** Approved
- **References:** Supabase Postgres Best Practices (`AGENTS.md`), Convex Best Practices (`SKILL.md`), Prisma ORM (`/prisma/web`), Zustand Store (`/pmndrs/zustand`)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
1. **Customer POV (Katalog Detail)**:
   - Pelanggan yang menyewa produk (misal: *Daypack Eiger Rhinos 35L*) saat ini tidak memiliki kontrol kuantitas (`quantity` di-hardcode bernilai `1` pada tombol `+ Keranjang` dan `Sewa Sekarang`).
   - Informasi ketersediaan bersifat biner/generik (*"Unit siap disewa..."*), tanpa menampilkan jumlah unit fisik yang menganggur pada rentang tanggal sewa yang dipilih (`startDate` s.d. `endDate`).
2. **Admin POV (Dashboard Inventaris & Produk)**:
   - Tabel Produk (`/admin/dashboard/produk`) pada kolom *Variasi / Stok* hanya menampilkan jumlah variasi (misal: *"3 variasi"*), tanpa agregasi total unit fisik toko yang berelasi dengan produk tersebut.
   - Tabel Unit (`/admin/dashboard/unit`) belum memiliki ringkasan agregat status ketersediaan unit sewa toko.

### 1.2 Objective
- Mengimplementasikan **Dynamic Schedule-Aware Stock & Quantity Stepper** yang memungkinkan pelanggan menyewa sejumlah unit fisik sesuai ketersediaan pada tanggal yang dipilih.
- Menyediakan UI counter `[-] [ N ] [+]` yang reaktif, dengan batas maksimum dinamis (*clamped to available count*).
- Menampilkan total fisik unit pada tabel produk Admin menggunakan agregasi terindeks Prisma `_count`.
- Mencegah *race condition* dan *deadlock* saat multi-user memesan unit fisik yang sama di detik yang bersamaan.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------------------------+
|                           CUSTOMER PRODUCT DETAIL                             |
|                                                                               |
|  [Pilih Paket Durasi]  -->  [Pilih Tanggal Mulai]  -->  [Pilih Varian Produk] |
+-------------------------------------------------------------------------------+
                                      |
                     Fetch on Variant / Dates change
                                      v
+-------------------------------------------------------------------------------+
|                       GET /api/availability?params...                         |
|                                                                               |
| - Filter unit fisik (unitStatus: Available, deletedAt: null)                  |
| - Filter anti-overlap terhadap rental_transactions berstatus aktif             |
| - Return: { isAvailable, availableCount, totalCount, statusLevel, message }    |
+-------------------------------------------------------------------------------+
                                      |
                           Client-Side Derivation
                                      v
+-------------------------------------------------------------------------------+
|                            QuantityStepper (Atom)                             |
|                                                                               |
| - min: 1, max: availableCount                                                 |
| - Auto-clamp: setQuantity(q => Math.min(q, availableCount))                  |
| - User click [+] / [-] updates local state INSTANTLY (0ms, no API spam)       |
+-------------------------------------------------------------------------------+
                                      |
                           [+ Keranjang] / [Sewa Sekarang]
                                      v
+-------------------------------------------------------------------------------+
|                             Zustand Cart Store                                |
|                                                                               |
| - item.quantity = userQuantity                                                |
| - subtotal = unitPrice * userQuantity                                         |
+-------------------------------------------------------------------------------+
                                      |
                                  [Checkout]
                                      v
+-------------------------------------------------------------------------------+
|                            POST /api/checkout                                 |
|                                                                               |
| - Anti-Deadlock Protocol: Sort all candidate IDs alphabetically ASCENDING     |
| - Atomic Lock: SELECT id FROM inventory_units WHERE id = ANY($1) FOR UPDATE   |
| - Allocate N free units to rental_transaction_items                           |
+-------------------------------------------------------------------------------+
```

---

## 3. Detailed Specifications

### 3.1 Database & Indexing Optimization (Supabase Best Practices)

#### A. Composite Index on RentalTransaction
Pencarian ketersediaan unit memfilter transaksi rental aktif yang bertabrakan dengan rentang sewa:
```prisma
// prisma/schema.prisma
model RentalTransaction {
  ...
  @@index([transactionStatus, startDate, endDate])
  @@index([userId])
  @@index([transactionCode])
  @@map("rental_transactions")
}
```
*Dampak:* Mengubah operasi *Seq Scan* menjadi *Index Scan*, memangkas waktu eksekusi query ketersediaan dari $O(N)$ menjadi $O(\log N)$ saat transaksi historis bertambah.

#### B. Atomic Lock Query (Rule 5.2 Consistent Lock Order)
Di endpoint [`/api/checkout`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/api/checkout/route.ts), kunci semua unit kandidat secara terurut:
```ts
const sortedCandidateIds = Array.from(allCandidateUnitIdsSet).sort();
if (sortedCandidateIds.length > 0) {
  await tx.$queryRaw`
    SELECT id FROM inventory_units 
    WHERE id = ANY(${sortedCandidateIds}) 
    ORDER BY id ASC 
    FOR UPDATE
  `;
}
```

---

### 3.2 Backend API Specifications

#### A. Refactor `/api/availability`
- **Method:** `GET`
- **Query Params:**
  - `productId: string` (required)
  - `variantId?: string` (optional)
  - `startDate: ISOString` (required for rental)
  - `endDate: ISOString` (required for rental)
- **Response Format:**
  ```json
  {
    "success": true,
    "data": {
      "isAvailable": true,
      "availableCount": 3,
      "totalCount": 3,
      "itemType": "rental_unit",
      "statusLevel": "available",
      "message": "Tersedia 3 unit siap disewa untuk jadwal ini."
    }
  }
  ```
- **Catatan Desain (Convex Rule 5):**
  API tidak lagi mewajibkan parameter `quantity` untuk mengecek ketersediaan dasar. API memberikan angka kapasitas maksimum (`availableCount`), sehingga client dapat mengatur stepper tanpa perlu melakukan request berulang setiap kali tombol `+` ditekan.

---

### 3.3 Frontend Component Specifications

#### A. Komponen `QuantityStepper` (`src/components/atoms/quantity-stepper.tsx`)
- Props:
  ```ts
  interface QuantityStepperProps {
    value: number;
    min?: number;
    max: number;
    disabled?: boolean;
    onChange: (value: number) => void;
    className?: string;
  }
  ```
- Fitur UI:
  - Tombol minus `[-]` disabled jika `value <= min`.
  - Input angka teks yang divalidasi (`min` s.d. `max`).
  - Tombol plus `[+]` disabled jika `value >= max` atau ketersediaan habis (`max === 0`).
  - Label helper di samping stepper: *"Maks. N unit"* atau *"Stok terbatas"*.

#### B. Integrasi pada `ProductInteractivePanel` (`src/app/(main)/katalog/[id]/product-interactive-panel.tsx`)
- State `quantity`: `useState<number>(1)`.
- Reaktif auto-clamp:
  ```ts
  useEffect(() => {
    if (availabilityState.availableCount > 0) {
      setQuantity((prev) => Math.min(Math.max(1, prev), availabilityState.availableCount));
    } else {
      setQuantity(1);
    }
  }, [availabilityState.availableCount]);
  ```
- Parameter ke `addItemToCart`:
  ```ts
  addItemToCart({
    ...productDetails,
    quantity,
    unitPrice: currentUnitPrice,
  });
  ```

---

### 3.4 Admin Dashboard Visibility Specifications

#### A. Tabel Produk (`src/app/admin/dashboard/produk/page.tsx` & `product-table.tsx`)
- Query Prisma dimodifikasi menggunakan `_count`:
  ```ts
  variants: {
    where: { deletedAt: null },
    select: {
      id: true,
      variantName: true,
      size: true,
      color: true,
      _count: {
        select: {
          units: {
            where: { deletedAt: null, isActive: true },
          },
        },
      },
    },
  }
  ```
- Tampilan Kolom *Variasi / Stok*:
  - Untuk produk rental: Menghitung akumulasi unit:
    ```ts
    const totalPhysicalUnits = product.variants.reduce((acc, v) => acc + (v._count?.units ?? 0), 0);
    // Tampilan: "3 Variasi • 9 Unit Fisik"
    ```
  - Untuk consumable: Menampilkan `Stok: X unit`.

---

## 4. Test & Verification Plan

1. **Unit & Clamping Test**:
   - Memilih 1 malam di mana ada 3 unit tas tersedia $\rightarrow$ stepper bisa dipilih 1, 2, atau 3 unit.
   - Mengubah tanggal sewa ke tanggal di mana hanya 1 unit tersisa $\rightarrow$ stepper otomatis terkoreksi ke 1 unit.
2. **Cart & Price Calculation Test**:
   - Memilih 2 unit $\rightarrow$ total tagihan di keranjang dan checkout harus dikalikan 2 (`unitPrice * 2`), DP dihitung 50% dari total baru.
3. **Multi-Unit Atomic Checkout Test**:
   - Checkout 2 unit dalam 1 transaksi $\rightarrow$ 2 baris `RentalTransactionItem` dibuat dengan 2 kode fisik inventaris berbeda (misal: `BAG-001` dan `BAG-002`).
4. **Admin Stock Verification Test**:
   - Buka `/admin/dashboard/produk`, periksa apakah produk menampilkan jumlah fisik unit yang akurat tanpa N+1 query.
5. **Static Analysis**:
   - `npx tsc --noEmit` wajib exit code 0.
