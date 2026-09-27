import type { Product } from "@/lib/shopApi";

export interface CartItem {
  product: Product;
  quantity: number;
}

export const getCartStorageKey = (userId: string | null): string => {
  return userId ? `cart_${userId}` : "cart_guest";
};

export const loadCartFromStorage = (key: string): CartItem[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
    // Backward compatibility: migrate legacy unpartitioned 'cart' key to 'cart_guest'
    if (key === "cart_guest") {
      const legacy = localStorage.getItem("cart");
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) {
          localStorage.setItem("cart_guest", JSON.stringify(parsed));
          localStorage.removeItem("cart");
          return parsed;
        }
      }
    }
  } catch {
    localStorage.removeItem(key);
  }
  return [];
};
