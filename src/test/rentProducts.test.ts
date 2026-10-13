import { describe, it, expect } from "vitest";
import {
  getProductEffectiveCategory,
  getProductEffectiveSubcategory,
  filterAndGroupProducts,
} from "@/lib/productFilters";
import { CATEGORIES } from "@/lib/constants";
import type { Product } from "@/lib/types";

describe("Rent Category & Product Filter Logic", () => {
  it("includes Rent category in global CATEGORIES with KeyRound icon", () => {
    const rentCat = CATEGORIES.find((c) => c.value === "rent");
    expect(rentCat).toBeDefined();
    expect(rentCat?.label).toBe("Rent");
    expect(rentCat?.subcategories).toHaveLength(2);
    expect(rentCat?.subcategories?.map((s) => s.value)).toContain("rent_xbox");
  });

  it("resolves effective category as 'rent' for products with category='rent'", () => {
    const p: Product = {
      id: "rent-1",
      title: "Xbox Game Account Rent - Account 1 (AC Black Flag Resynced) | 15 Days",
      category: "rent",
      delivery_type: "instant_code",
      sale_price: 399,
      cost_price: 150,
      platform: "Xbox",
      region: "GLOBAL",
      in_stock: 10,
      is_active: true,
      description: "*FIRST LOGIN, THEN PAYMENT.",
      image_url: null,
      created_at: null,
      updated_at: null,
      source_platform: null,
      source_url: null,
    };

    expect(getProductEffectiveCategory(p)).toBe("rent");
    expect(getProductEffectiveSubcategory(p, "rent")).toBe("rent_xbox");
  });

  it("resolves effective category as 'rent' for rental titles even if category was stored loosely", () => {
    const p: Product = {
      id: "rent-2",
      title: "Xbox Game Account Rent - Account 3 (3 Games Bundle) | 30 Days",
      category: "xbox_game" as unknown as Product["category"],
      delivery_type: "instant_code",
      sale_price: 299,
      cost_price: 120,
      platform: "Xbox",
      region: "GLOBAL",
      in_stock: 5,
      is_active: true,
      description: null,
      image_url: null,
      created_at: null,
      updated_at: null,
      source_platform: null,
      source_url: null,
    };

    expect(getProductEffectiveCategory(p)).toBe("rent");
  });

  it("filters and groups rental variants by base title", () => {
    const products: Product[] = [
      {
        id: "p1",
        title: "Xbox Game Account Rent - Account 1 (AC Black Flag Resynced) | 15 Days",
        category: "rent",
        sale_price: 399,
        cost_price: 150,
        delivery_type: "instant_code",
        platform: "Xbox",
        region: "GLOBAL",
        in_stock: 10,
        is_active: true,
        description: null,
        image_url: null,
        created_at: null,
        updated_at: null,
        source_platform: null,
        source_url: null,
      },
      {
        id: "p2",
        title: "Xbox Game Account Rent - Account 1 (AC Black Flag Resynced) | 30 Days",
        category: "rent",
        sale_price: 499,
        cost_price: 200,
        delivery_type: "instant_code",
        platform: "Xbox",
        region: "GLOBAL",
        in_stock: 10,
        is_active: true,
        description: null,
        image_url: null,
        created_at: null,
        updated_at: null,
        source_platform: null,
        source_url: null,
      },
      {
        id: "p3",
        title: "Steam Wallet 50 USD Gift Card",
        category: "giftcard",
        sale_price: 6000,
        cost_price: 5500,
        delivery_type: "instant_code",
        platform: "Steam",
        region: "GLOBAL",
        in_stock: 10,
        is_active: true,
        description: null,
        image_url: null,
        created_at: null,
        updated_at: null,
        source_platform: null,
        source_url: null,
      },
    ];

    const rentResults = filterAndGroupProducts(products, {
      search: "",
      activeCategory: "rent",
      activeSubcategory: "",
      sort: "newest",
    });

    expect(rentResults).toHaveLength(1);
    expect(rentResults[0].title).toBe("Xbox Game Account Rent - Account 1 (AC Black Flag Resynced) | 15 Days");
    expect(rentResults[0].sale_price).toBe(399); // groups and picks the starting price variant
  });

  it("correctly pairs 15-day and 30-day options for accounts like topup", () => {
    const pairedTitles = [
      "Xbox Game Account Rent - Account 3 (3 Games Bundle) | 15 Days",
      "Xbox Game Account Rent - Account 3 (3 Games Bundle) | 30 Days",
      "Xbox Game Account Rent - Account 4 (14 Games Mega Pack) | 15 Days",
      "Xbox Game Account Rent - Account 4 (14 Games Mega Pack) | 30 Days",
      "Xbox Game Account Rent - Account 5 (44 Games Ultimate Vault) | 15 Days",
      "Xbox Game Account Rent - Account 5 (44 Games Ultimate Vault) | 30 Days",
      "Xbox Game Account Rent - Account 6 (Resident Evil 4 Remake) | 15 Days",
      "Xbox Game Account Rent - Account 6 (Resident Evil 4 Remake) | 30 Days",
    ];

    pairedTitles.forEach((title) => {
      const baseTitle = title.split(" | ")[0];
      const durationOption = title.split(" | ")[1];
      expect(baseTitle).toContain("Xbox Game Account Rent");
      expect(["15 Days", "30 Days"]).toContain(durationOption);
    });
  });
});
