import { describe, it, expect, vi } from "vitest";
import { isProtectedSignOutRoute, PROTECTED_AUTH_ROUTES } from "@/lib/authUtils";

describe("Sign Out Routing & Protected Routes", () => {
  it("defines the core protected route basenames", () => {
    expect(PROTECTED_AUTH_ROUTES).toContain("/admin");
    expect(PROTECTED_AUTH_ROUTES).toContain("/orders");
    expect(PROTECTED_AUTH_ROUTES).toContain("/console");
    expect(PROTECTED_AUTH_ROUTES).toContain("/support");
    expect(PROTECTED_AUTH_ROUTES).toContain("/payment");
  });

  describe("isProtectedSignOutRoute", () => {
    it("returns true for exact protected paths", () => {
      expect(isProtectedSignOutRoute("/admin")).toBe(true);
      expect(isProtectedSignOutRoute("/orders")).toBe(true);
      expect(isProtectedSignOutRoute("/console")).toBe(true);
      expect(isProtectedSignOutRoute("/support")).toBe(true);
      expect(isProtectedSignOutRoute("/payment")).toBe(true);
    });

    it("returns true for subpaths of protected routes", () => {
      expect(isProtectedSignOutRoute("/admin/inventory")).toBe(true);
      expect(isProtectedSignOutRoute("/orders/12345")).toBe(true);
      expect(isProtectedSignOutRoute("/payment/callback")).toBe(true);
    });

    it("handles URL search params and hashes correctly", () => {
      expect(isProtectedSignOutRoute("/orders?filter=unpaid")).toBe(true);
      expect(isProtectedSignOutRoute("/payment?order_ids=order-abc-123")).toBe(true);
      expect(isProtectedSignOutRoute("/admin#settings")).toBe(true);
    });

    it("returns false for public storefront and content routes", () => {
      expect(isProtectedSignOutRoute("/")).toBe(false);
      expect(isProtectedSignOutRoute("/product/cyberpunk-2077")).toBe(false);
      expect(isProtectedSignOutRoute("/custom-order")).toBe(false);
      expect(isProtectedSignOutRoute("/checkout")).toBe(false);
      expect(isProtectedSignOutRoute("/privacy")).toBe(false);
      expect(isProtectedSignOutRoute("/terms")).toBe(false);
      expect(isProtectedSignOutRoute("/auth")).toBe(false);
    });
  });
});
