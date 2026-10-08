import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/shopApi";

const unlimitedDigitalProduct: Product = {
  id: "prod-digital-null-stock",
  title: "Steam Wallet Card",
  category: "giftcard",
  cost_price: 50.0,
  sale_price: 60.0,
  in_stock: null, // Null stock for digital / on-demand products in database
  description: "Digital gift card",
  delivery_type: "instant_code",
  image_url: null,
  platform: "PC",
  region: "GLOBAL",
  source_platform: null,
  source_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("CartContext stock handling for digital products with null stock", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("successfully adds product with in_stock = null to cart", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
    });

    act(() => {
      result.current.addToCart(unlimitedDigitalProduct, 1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe("prod-digital-null-stock");
    expect(result.current.items[0].quantity).toBe(1);
  });

  it("successfully updates quantity for product with in_stock = null", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
    });

    act(() => {
      result.current.addToCart(unlimitedDigitalProduct, 1);
    });

    act(() => {
      result.current.updateQuantity("prod-digital-null-stock", 3);
    });

    expect(result.current.items[0].quantity).toBe(3);
  });
});
