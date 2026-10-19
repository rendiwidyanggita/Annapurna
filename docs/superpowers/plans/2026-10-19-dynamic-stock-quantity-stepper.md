# Implementation Plan: Dynamic Schedule-Aware Stock & Quantity Stepper

- **Specification:** [`docs/superpowers/specs/2026-10-19-dynamic-stock-quantity-stepper-design.md`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/docs/superpowers/specs/2026-10-19-dynamic-stock-quantity-stepper-design.md)
- **Guidelines Applied:** Supabase Postgres Best Practices (`AGENTS.md`) & Convex Best Practices (`SKILL.md`)
- **Status:** Ready for Execution

---

## Proposed Changes

### Phase 1: Database Schema & Query Optimization (Supabase Rule 1.3 Composite Index)

#### [MODIFY] [`prisma/schema.prisma`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/prisma/schema.prisma)
- Add composite index on `RentalTransaction` table:
  ```prisma
  @@index([transactionStatus, startDate, endDate])
  ```
- Run `npx prisma generate` to refresh the Prisma Client types.
- Run `npx prisma db push` to apply the index to the PostgreSQL database safely.

---

### Phase 2: Backend Availability API Refinement (Convex Rule: Clear Separation of Concerns)

#### [MODIFY] [`src/app/api/availability/route.ts`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/api/availability/route.ts)
- Update availability checking logic so that `availableCount` represents the true non-overlapping physical unit count on `[startDate, endDate]`.
- Refactor the response message formatting:
  - If `availableCount > 2`: `"Tersedia ${availableCount} unit siap disewa untuk jadwal ini."`
  - If `availableCount > 0 && availableCount <= 2`: `"Stok terbatas! Hanya tersisa ${availableCount} unit untuk jadwal ini."`
  - If `availableCount === 0`: `"Seluruh unit telah dipesan untuk rentang tanggal tersebut."`
- Ensure the API handles requests when `quantity` is omitted (defaults to 1).

---

### Phase 3: Frontend Quantity Stepper & Catalog Interactive Panel

#### [NEW] [`src/components/atoms/quantity-stepper.tsx`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/components/atoms/quantity-stepper.tsx)
- Create accessible, polished atomic quantity counter:
  - Minus button `[-]`: disabled when `value <= min || disabled`.
  - Number display / input: styled with tabular figures (`font-mono`) and clean border.
  - Plus button `[+]`: disabled when `value >= max || disabled`.
  - Max label / helper: displaying `"Maks. N unit"` or badge indicating limits.

#### [MODIFY] [`src/components/atoms/index.ts`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/components/atoms/index.ts)
- Export `QuantityStepper` and `QuantityStepperProps`.

#### [MODIFY] [`src/app/(main)/katalog/[id]/product-interactive-panel.tsx`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/%28main%29/katalog/%5Bid%5D/product-interactive-panel.tsx)
- Add state: `const [quantity, setQuantity] = useState<number>(1);`
- Implement Convex-style reactive auto-clamp:
  ```tsx
  useEffect(() => {
    if (availabilityState.availableCount > 0) {
      setQuantity((prev) => Math.min(Math.max(1, prev), availabilityState.availableCount));
    } else {
      setQuantity(1);
    }
  }, [availabilityState.availableCount]);
  ```
- Render `QuantityStepper` above the CTA buttons.
- Update `handleAddToCart(redirectAfter)` to pass the dynamic `quantity` instead of hardcoded `1`.
- Update the prefilled WhatsApp message generator to specify quantity.

---

### Phase 4: Cart Store & Multi-Unit Atomic Checkout (Supabase Rule 5.2 Consistent Lock Ordering)

#### [VERIFY] [`src/store/cart-store.ts`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/store/cart-store.ts)
- Verify `addItem` increments existing item quantity properly and saves to `localStorage`.

#### [MODIFY] [`src/app/api/checkout/route.ts`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/api/checkout/route.ts)
- Verify multi-unit allocation: When `item.quantity > 1`, checkout allocates $N$ distinct physical units (`freeUnits.length === item.quantity`).
- Optimize lock query using `ANY($1)` batch syntax with ascending order:
  ```sql
  SELECT id FROM inventory_units WHERE id = ANY(${sortedCandidateIds}) ORDER BY id ASC FOR UPDATE
  ```

---

### Phase 5: Admin Dashboard Inventory Visibility (Supabase Rule 6.2 Eliminate N+1)

#### [MODIFY] [`src/app/admin/dashboard/produk/page.tsx`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/admin/dashboard/produk/page.tsx)
- Include `_count: { select: { units: { where: { deletedAt: null, isActive: true } } } }` on the variants query.

#### [MODIFY] [`src/app/admin/dashboard/produk/product-table.tsx`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/admin/dashboard/produk/product-table.tsx)
- Update `ProductItem` type interface to reflect `_count?: { units: number }`.
- Update the **Variasi / Stok** table column:
  - Rental items: display badge `3 Variasi • 9 Unit Fisik`.
  - Consumable items: display badge `Stok: X unit`.

#### [MODIFY] [`src/app/admin/dashboard/unit/page.tsx`](file:///d:/Kuliah/Semester%206/Penulisan%20Proposal/Project/Annapurna/src/app/admin/dashboard/unit/page.tsx)
- Add quick summary metrics banner above the table:
  - Total Unit Fisik
  - Unit Available (Siap Sewa)
  - Unit Rented (Sedang Disewa)
  - Unit Maintenance / Lost

---

## Verification Plan

### Automated Tests & Type Checking
- Run `npx tsc --noEmit` to verify type safety across all components and API routes.

### Manual / Script Verification
1. **Quantity Stepper Interaction**:
   - Navigate to `/katalog/[id]` (e.g. Daypack Eiger Rhinos 35L).
   - Check that `QuantityStepper` is visible and default is 1.
   - Click `[+]` up to available unit count (e.g. 3) and verify `[+]` becomes disabled at max.
   - Switch dates to an overlapping range with fewer available units and observe auto-clamping.
2. **Cart & Price Accuracy**:
   - Add 2 units of the daypack to cart.
   - Verify cart modal shows Quantity: 2 and subtotal = `unitPrice * 2`.
3. **Admin Visibility**:
   - Navigate to `/admin/dashboard/produk`.
   - Verify "Variasi / Stok" shows both variant count and physical unit count.
