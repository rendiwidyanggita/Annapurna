"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DurationScheme } from "@/components/molecules/rental-date-group";

export interface CartItem {
  id: string; // unique identifier: `${productId}-${variantId || 'none'}-${startDate}-${durationScheme}`
  productId: string;
  productName: string;
  imageUrl?: string | null;
  itemType: "rental_unit" | "consumable";
  variantId?: string;
  variantName?: string;
  durationScheme: DurationScheme;
  durationDays: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  unitPrice: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getDpAmount: () => number;
  getRemainingAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const id = `${newItem.productId}-${newItem.variantId || "none"}-${newItem.startDate.slice(0, 10)}-${newItem.durationScheme}`;
        const existingIndex = get().items.findIndex((i) => i.id === id);

        if (existingIndex > -1) {
          const updatedItems = [...get().items];
          updatedItems[existingIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...get().items, { ...newItem, id }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (acc, item) => acc + item.unitPrice * item.quantity,
          0
        );
      },

      getDpAmount: () => {
        // 50% Down Payment (PRD Section 17 & OQ-01)
        const total = get().getTotalPrice();
        return Math.ceil(total * 0.5);
      },

      getRemainingAmount: () => {
        return get().getTotalPrice() - get().getDpAmount();
      },
    }),
    {
      name: "annapurna-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
