"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CartItem } from "@/lib/types";

interface AddItemPayload {
  slug: string;
  title_ua: string;
  price_uah: number;
  crm_id: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: AddItemPayload) => void;
  incrementItem: (slug: string) => void;
  decrementItem: (slug: string) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
}

export function calcTotalQty(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function calcTotalPrice(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price_uah * item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (payload) =>
        set((state) => {
          const existing = state.items.find((item) => item.slug === payload.slug);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.slug === payload.slug ? { ...item, quantity: item.quantity + 1 } : item,
              ),
            };
          }

          return {
            items: [...state.items, { ...payload, quantity: 1 }],
          };
        }),
      incrementItem: (slug) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.slug === slug ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        })),
      decrementItem: (slug) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.slug === slug ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      removeItem: (slug) =>
        set((state) => ({
          items: state.items.filter((item) => item.slug !== slug),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "fm-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
