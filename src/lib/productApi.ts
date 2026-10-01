// src/lib/productApi.ts
// All product-related data access: catalog fetching, search, admin CRUD, featured products.

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import type { Product, ProductCategory } from "./types";

const PRODUCT_SELECT =
  "id, title, sale_price, cost_price, image_url, category, platform, region, in_stock, delivery_type, source_url, source_platform, created_at, is_active";
const CONFIG_ROW = "[CONFIG] Featured Products";

// ─── Storefront ───────────────────────────────────────────────────────────────

/** Fetch paginated, filtered, sorted products for the public storefront. */
export async function fetchStoreProducts({
  pageParam = 0,
  search = "",
  activeCategory = "all",
  activeSubcategory = "",
  sort = "newest",
}: {
  pageParam?: number;
  search?: string;
  activeCategory?: string;
  activeSubcategory?: string;
  sort?: string;
}) {
  const PAGE_SIZE = 24;
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("v_grouped_products")
    .select("*", { count: "exact" });

  if (search) {
    // Utilize the universal brain engine for fuzzy search and alias expansion
    const { data: searchResults } = await (supabase.rpc as any)("product_search", {
      search_query: search,
      max_results: 200,
    });
    
    const ids = searchResults ? (searchResults as any[]).map((s: any) => s.id) : [];
    
    if (ids.length === 0) {
      // If no matches found by the engine, return empty
      return { products: [], nextPage: undefined, totalCount: 0 };
    }
    query = query.in("id", ids);
  }

  if (activeCategory === "games") {
    query = query
      .in("category", ["pc_game", "xbox_game", "ps_game"])
      .not("title", "ilike", "%account%");
    if (activeSubcategory === "games_xbox") {
      query = query.or(
        "category.eq.xbox_game,title.ilike.%xbox%,platform.ilike.%xbox%",
      );
    } else if (activeSubcategory === "games_ps") {
      query = query.or(
        "category.eq.ps_game,title.ilike.%playstation%,title.ilike.%ps4%,title.ilike.%ps5%,platform.ilike.%playstation%",
      );
    } else if (activeSubcategory === "games_steam") {
      query = query.or("title.ilike.%steam%,platform.ilike.%steam%");
    } else if (activeSubcategory === "games_gog") {
      query = query.or("title.ilike.%gog%,platform.ilike.%gog%");
    } else if (activeSubcategory === "games_others") {
      query = query
        .eq("category", "pc_game")
        .not("platform", "ilike", "%steam%")
        .not("platform", "ilike", "%gog%")
        .not("platform", "ilike", "%xbox%")
        .not("platform", "ilike", "%playstation%")
        .not("platform", "ilike", "%psn%")
        .not("platform", "ilike", "%ps4%")
        .not("platform", "ilike", "%ps5%")
        .not("title", "ilike", "%steam%")
        .not("title", "ilike", "%gog%")
        .not("title", "ilike", "%xbox%")
        .not("title", "ilike", "%playstation%")
        .not("title", "ilike", "%psn%")
        .not("title", "ilike", "%ps4%")
        .not("title", "ilike", "%ps5%");
    }
  } else if (activeCategory === "giftcard") {
    query = query.eq("category", "giftcard").not("title", "ilike", "%account%");
    if (activeSubcategory === "giftcard_xbox") {
      query = query.or("title.ilike.%xbox%,platform.ilike.%xbox%");
    } else if (activeSubcategory === "giftcard_steam") {
      query = query.or("title.ilike.%steam%,platform.ilike.%steam%");
    } else if (activeSubcategory === "giftcard_ps") {
      query = query.or(
        "title.ilike.%playstation%,title.ilike.%psn%,platform.ilike.%playstation%",
      );
    } else if (activeSubcategory === "giftcard_apple") {
      query = query.or(
        "title.ilike.%apple%,title.ilike.%itunes%,platform.ilike.%apple%",
      );
    } else if (activeSubcategory === "giftcard_nintendo") {
      query = query.or(
        "title.ilike.%nintendo%,title.ilike.%eshop%,platform.ilike.%nintendo%",
      );
    } else if (activeSubcategory === "giftcard_roblox") {
      query = query.or(
        "title.ilike.%roblox%,title.ilike.%robux%,platform.ilike.%roblox%",
      );
    } else if (activeSubcategory === "giftcard_blizzard") {
      query = query.or(
        "title.ilike.%blizzard%,title.ilike.%battle.net%,title.ilike.%battlenet%,platform.ilike.%blizzard%",
      );
    }
  } else if (activeCategory === "subscription") {
    query = query
      .eq("category", "subscription")
      .not("title", "ilike", "%account%");
    if (activeSubcategory === "sub_gamepass") {
      query = query.or("title.ilike.%game pass%,title.ilike.%gamepass%");
    } else if (activeSubcategory === "sub_psn") {
      query = query.or(
        "title.ilike.%psn%,title.ilike.%playstation plus%,title.ilike.%ps plus%",
      );
    } else if (activeSubcategory === "sub_ea") {
      query = query.ilike("title", "%ea play%");
    } else if (activeSubcategory === "sub_others") {
      query = query
        .not("title", "ilike", "%game pass%")
        .not("title", "ilike", "%gamepass%")
        .not("title", "ilike", "%ps plus%")
        .not("title", "ilike", "%playstation plus%")
        .not("title", "ilike", "%ea play%");
    }
  } else if (activeCategory === "accounts") {
    query = query
      .in("category", ["pc_game", "xbox_game", "ps_game"])
      .ilike("title", "%account%");
  } else if (activeCategory === "topup") {
    query = query.eq("category", "topup");
  } else if (activeCategory === "service") {
    query = query.or("category.eq.service,category.eq.software");
  } else if (activeCategory !== "all") {
    query = query
      .eq("category", activeCategory as ProductCategory)
      .not("title", "ilike", "%account%");
  }

  if (sort === "price_asc") {
    query = query.order("sale_price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("sale_price", { ascending: false });
  } else if (sort === "name_asc") {
    query = query.order("title", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;

  return {
    products: (data as unknown as Product[]) ?? [],
    nextPage: data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
    totalCount: count ?? 0,
  };
}

/** Fetch all products for Admin (paginated internally, returns full list). */
export async function fetchProducts(): Promise<Product[]> {
  const PAGE_SIZE = 1000;
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .neq("title", CONFIG_ROW);

  if (countError) throw countError;
  const total = count ?? 0;
  const numPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (numPages === 1) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .neq("title", CONFIG_ROW)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Product[]) ?? [];
  }

  const pagePromises = Array.from({ length: numPages }, (_, i) => {
    const from = i * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    return supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .neq("title", CONFIG_ROW)
      .order("created_at", { ascending: false })
      .range(from, to);
  });

  const results = await Promise.all(pagePromises);
  const allProducts: Product[] = [];
  for (const res of results) {
    if (res.error) throw res.error;
    if (res.data) allProducts.push(...(res.data as Product[]));
  }
  return allProducts;
}

/** Fetch multiple products by their IDs (for featured banner). */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);
  if (error) throw error;
  return data as unknown as Product[];
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function updateProductPrice(
  id: string,
  salePrice: number,
  costPrice: number,
) {
  const { error } = await supabase
    .from("products")
    .update({ sale_price: salePrice, cost_price: costPrice })
    .eq("id", id);
  if (error) throw error;
  return { success: true };
}

export async function updateProductDetails(
  id: string,
  details: Partial<Product>,
) {
  const { error } = await supabase
    .from("products")
    .update(details)
    .eq("id", id);
  if (error) throw error;
  return { success: true };
}

export async function createProduct(
  details: Omit<Product, "id" | "created_at" | "updated_at">,
) {
  const { error } = await supabase.from("products").insert(details);
  if (error) throw error;
  return { success: true };
}

// ─── Featured Products ────────────────────────────────────────────────────────

export async function fetchFeaturedProductIds(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("description")
      .eq("title", CONFIG_ROW)
      .single();
    if (error) {
      if (error.code === "PGRST116") return [];
      throw error;
    }
    return JSON.parse(data.description || "[]");
  } catch (e) {
    logger.error("Error fetching featured products:", { error: String(e) });
    return [];
  }
}

export async function updateFeaturedProductIds(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ description: JSON.stringify(ids) })
    .eq("title", CONFIG_ROW);
  if (error)
    throw new Error("Failed to update featured products: " + error.message);
}
