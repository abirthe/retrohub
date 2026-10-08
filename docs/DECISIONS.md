# Architecture Decision Records (ADR)

This log records major non-obvious engineering decisions and rationale to preserve context across development sessions.

---

## ADR-001: Centralized AuthProvider for Unified Authentication & Role State
* **Date:** 2026-10-09
* **Context:** Previously, `useAuth`, `useAdmin`, and `CartContext` each created independent Supabase `onAuthStateChange` subscriptions, resulting in redundant network round-trips and potential race conditions on session expiry.
* **Decision:** Extracted a top-level `AuthProvider` in `src/contexts/AuthContext.tsx` that acts as the single source of truth for auth state and role resolution. `useAuth` and `useAdmin` now consume this context without subscribing independently.
* **Impact:** Reduced redundant listeners from 3 to 1; eliminated session-restore race conditions during checkout and payment.

---

## ADR-002: Decomposition of Payment & Orders Monoliths
* **Date:** 2026-10-09
* **Context:** `Payment.tsx` (>800 lines) and `Orders.tsx` (>540 lines) concentrated heavy layout, validation, and API logic in single files, violating the ~300 lines token-efficiency rule and complicating targeted testing.
* **Decision:**
  - Extracted `PaymentMethodSelector`, `BkashForm`, `PaymentExpiredCard`, and `PaymentOrderSummary` into `src/components/payment/`.
  - Extracted `ConsoleFeatureCards`, `OrdersGuestBanner`, and `OrderFilterTabs` into `src/components/orders/`.
* **Impact:** Main page components reduced to <390 lines; improved modularity and component-level reusability.

---

## ADR-003: Deprecation and Removal of `shopApi.ts` Barrel
* **Date:** 2026-10-09
* **Context:** `shopApi.ts` served as a legacy catch-all re-export barrel for products, orders, payments, custom orders, and auth.
* **Decision:** Migrated all 28 referencing components to import directly from domain modules (`@/lib/productApi`, `@/lib/orderApi`, `@/lib/paymentApi`, `@/lib/customOrderApi`, `@/lib/authApi`, `@/lib/types`).
* **Impact:** Clear boundary separation, improved bundle tree-shaking, and explicit dependencies per feature.

---

## ADR-004: Cloudflare Workers SPA Routing & Asset Caching
* **Date:** 2026-10-09
* **Context:** RetroHub is deployed on Cloudflare Workers using static asset bindings. Direct browser navigation to client routes (e.g., `/orders`, `/checkout`, `/admin`) required seamless SPA fallbacks.
* **Decision:** Configured `worker.js` with sliding-window client IP rate limiting (150 req/60s), asset serving via `env.ASSETS`, non-extension pathname rewriting to `/index.html`, and granular HTTP caching headers (`immutable` for hashed assets, `must-revalidate` for HTML).
* **Impact:** Fast global edge routing, resilience against client reload traps, and sub-20ms edge response times.

---

## ADR-005: Multi-Tier Weighted Relevance Algorithm for Product Search
* **Date:** 2026-10-09
* **Context:** The legacy `product_search` RPC relied solely on raw unweighted `pg_trgm` and `ILIKE`. Multi-word queries often failed, in-stock products did not take precedence over sold-out items, and exact title matches were diluted.
* **Decision:**
  - Implemented a composite weighted scoring formula (0–100+ pts) across exact match (+50), prefix (+35), substring (+25), platform intent (+20), category match (+15), trigram fuzzy similarity (up to 15), and stock boost (+10 if `in_stock > 0`).
  - Added [supabase/migrations/20261009000000_upgrade_product_search_scoring.sql](file:///d:/retrohub/supabase/migrations/20261009000000_upgrade_product_search_scoring.sql).
  - Updated `@/lib/productApi.ts` to preserve RPC relevance ranks across storefront pagination and filters.
* **Impact:** High-precision search across the storefront and both Telegram bots (`@retrochanbot`, `@Notifyretro_bot`); in-stock items always rank above out-of-stock items on equal relevance.
