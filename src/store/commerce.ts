"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EnquiryBasketItem = {
  key: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  slug: string;
  imageUrl?: string;
  colour?: string;
  size?: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number | null;
  currency: string;
};

type BasketState = {
  items: EnquiryBasketItem[];
  addItem: (item: Omit<EnquiryBasketItem, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

function makeKey(
  productId: string,
  variantId?: string,
  colour?: string,
  size?: string,
  variant?: string,
) {
  return [productId, variantId ?? "", colour ?? "", size ?? "", variant ?? ""].join(":");
}

export const useEnquiryBasket = create<BasketState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const key = makeKey(item.productId, item.variantId, item.colour, item.size, item.variant);
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, key }] };
        });
      },
      updateQuantity: (key, quantity) => {
        if (quantity < 1) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        }));
      },
      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: "denard-enquiry-basket" },
  ),
);

type WishlistState = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),
      has: (productId) => get().ids.includes(productId),
    }),
    { name: "denard-wishlist" },
  ),
);

type RecentState = {
  productIds: string[];
  push: (productId: string) => void;
};

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set, get) => ({
      productIds: [],
      push: (productId) => {
        const next = [productId, ...get().productIds.filter((id) => id !== productId)].slice(0, 12);
        set({ productIds: next });
      },
    }),
    { name: "denard-recently-viewed" },
  ),
);

type CompareState = {
  ids: string[];
  toggle: (productId: string) => void;
  clear: () => void;
};

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => {
        const ids = get().ids;
        if (ids.includes(productId)) {
          set({ ids: ids.filter((id) => id !== productId) });
          return;
        }
        if (ids.length >= 4) return;
        set({ ids: [...ids, productId] });
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "denard-compare" },
  ),
);
