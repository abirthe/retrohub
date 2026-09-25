# RetroHub Catalog & Tooling Scripts Manual 🛠️

Comprehensive operational manual for all catalog management, database maintenance, price synchronization, image mapping, and seeding scripts in RetroHub.

---

## 📁 Directory Overview

```
scripts/
├── database/          # Database migrations, compiled SQL seeds & schema runners
├── images/            # Image mapping, watermarking sanitization & box art sourcing
├── maintenance/       # Catalog deduplication, orphan cleaners & stock auditors
├── pricing/           # Market price scrapers, competitor matching & margin updates
└── seeding/           # Automated catalog seeders across games, gift cards, subs & top-ups
```

---

## 🔐 Environment Configuration

All scripts connect directly to your Supabase project using the Node.js runtime and require environment variables defined in `.env` at the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> [!IMPORTANT]
> The `SUPABASE_SERVICE_ROLE_KEY` bypasses PostgreSQL Row-Level Security (RLS) and is mandatory for bulk maintenance, deduplication, and seeding scripts. Never commit this key to version control.

---

## 🤖 The Solo Merchant's Virtual Data Team

For a solo entrepreneur, managing a catalog of thousands of digital products, game variants, and shifting market prices is impossible manually. This scripting suite acts as a virtual data entry and market research team:

* **Automated Market Research**: Pricing scripts (`match_and_update_prices.mjs`) automatically scrape competitor prices and recalibrate RetroHub's sale prices to guarantee target profit margins.
* **Instant Catalog Expansion**: Seeding scripts instantly spin up entire categories (e.g., 17+ game top-ups or gift card variants) with perfect metadata, bypassing hundreds of hours of manual entry.
* **Self-Healing Database**: Maintenance scripts routinely audit stock levels, purge dead listings, and resolve duplicates, keeping the storefront pristine with zero manual oversight.

---

## 1. Catalog Seeding (`scripts/seeding/`)

Scripts in this module ingest structured catalog items, price tiers, and platform metadata into the Supabase `products` and `inventory_keys` tables.

| Script | Purpose & Catalog Coverage | Execution Command |
| :--- | :--- | :--- |
| `seed_game_topups.mjs` | Ingests 17 curated game top-ups (Valorant, MLBB, PUBG Mobile, Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Marvel Rivals, Fortnite, etc.) with automated Player ID / Server requirements. | `node scripts/seeding/seed_game_topups.mjs` |
| `seed_digital_giftcards.mjs` | Seeds digital gift card tiers for Apple iTunes, Steam Wallet, PlayStation Network, Xbox, Nintendo Switch eShop, Roblox (Robux), and Blizzard Battle.net. | `node scripts/seeding/seed_digital_giftcards.mjs` |
| `seed_plati_accounts.mjs` | Ingests verified full-access accounts across Steam, PSN, Xbox, and PC with regional variants. | `node scripts/seeding/seed_plati_accounts.mjs` |
| `seed_ea_play.mjs` | Seeds EA Play Console (PlayStation/Xbox) memberships. | `node scripts/seeding/seed_ea_play.mjs` |
| `seed_ea_play_pc.mjs` | Seeds EA Play and EA Play Pro PC memberships. | `node scripts/seeding/seed_ea_play_pc.mjs` |
| `insert_google_ai_service.mjs` | Ingests Google AI Pro 6-Month subscription service listing with activation specifications. | `node scripts/seeding/insert_google_ai_service.mjs` |
| `seed_pdf_variants.mjs` | Parses and ingests variant listings from official supplier PDF price documents. | `node scripts/seeding/seed_pdf_variants.mjs` |
| `add_subs.mjs` | Targeted utility to append specific subscription products to the catalog. | `node scripts/seeding/add_subs.mjs` |
| `add_topups.mjs` | Targeted utility to append specific top-up currency packages. | `node scripts/seeding/add_topups.mjs` |
| `add_variants.mjs` | Inserts multi-tier denominations for existing product titles. | `node scripts/seeding/add_variants.mjs` |
| `seed-products.cjs` | General baseline catalog seeder. | `node scripts/seeding/seed-products.cjs` |
| `generate-sql.cjs` | Converts product definitions into raw PostgreSQL `INSERT` statements. | `node scripts/seeding/generate-sql.cjs` |

---

## 2. Maintenance & Catalog Sanitization (`scripts/maintenance/`)

Maintenance tools maintain catalog consistency, eliminate duplicates, audit stock, and clean up orphan records.

> [!TIP]
> **Safety Mode**: All destructive scripts run in **Dry-Run mode by default**. They will report planned changes without touching the database. Pass the `--execute` flag to commit changes.

| Script | Purpose & Safety Rules | Usage |
| :--- | :--- | :--- |
| `deduplicate_products_strict.mjs` | Multi-factor duplicate cleaner checking Title, Category, Platform, Region, and Details. Retains the highest-margin entry and flags duplicates for deletion. | `node scripts/maintenance/deduplicate_products_strict.mjs`<br>`node scripts/maintenance/deduplicate_products_strict.mjs --execute` |
| `deduplicate_products.mjs` | General title and category deduplication script. | `node scripts/maintenance/deduplicate_products.mjs`<br>`node scripts/maintenance/deduplicate_products.mjs --execute` |
| `sanitize_image_urls.mjs` | Clears vendor-specific and unreliable external CDN image links from product records. | `node scripts/maintenance/sanitize_image_urls.mjs`<br>`node scripts/maintenance/sanitize_image_urls.mjs --execute` |
| `set_instant_code_delivery.mjs` | Updates eligible digital game keys and gift cards to `delivery_type = 'instant_code'`. | `node scripts/maintenance/set_instant_code_delivery.mjs` |
| `check-stock.cjs` | Diagnostic script scanning for zero-stock and inactive products; prints stock health summary. | `node scripts/maintenance/check-stock.cjs` |
| `cleanup-products.cjs` | Identifies and removes miscategorized, malformed, or corrupt catalog rows. | `node scripts/maintenance/cleanup-products.cjs` |
| `update_products.cjs` | Batch-updates metadata attributes across catalog items. | `node scripts/maintenance/update_products.cjs` |
| `delete_spam.cjs` | Removes test records, orphaned keys, and mock listings. | `node scripts/maintenance/delete_spam.cjs` |
| `assign_missing_images.mjs` | Scans catalog and attaches official high-resolution local artwork to unbranded listings. | `node scripts/maintenance/assign_missing_images.mjs` |

---

## 3. Image Processing & Artwork Mapping (`scripts/images/`)

Utilities for managing visual assets, removing supplier watermarks, and ensuring uniform cover art across all listings.

| Script | Description | Usage |
| :--- | :--- | :--- |
| `apply_missing_and_default_images.mjs` | Maps missing product covers to clean SVG and WEBP fallbacks in `public/images/`. | `node scripts/images/apply_missing_and_default_images.mjs` |
| `map_images.mjs` | Direct title-to-artwork mapping tool linking specific games to local static image paths. | `node scripts/images/map_images.mjs` |
| `remove_watermarked_images.mjs` | Scans for external watermark signatures and reverts images to neutral default artwork. | `node scripts/images/remove_watermarked_images.mjs` |
| `search_product_image.mjs` | Automated web scraper that queries official game box art and downloads clean cover images. | `node scripts/images/search_product_image.mjs` |

---

## 4. Market Pricing & Profit Margin Sync (`scripts/pricing/`)

Tools for calculating margins, syncing with regional market data, and keeping sale prices competitive while guaranteeing healthy merchant profit.

| Tool / File | Function |
| :--- | :--- |
| `market_scraped.json` | Snapshot dataset containing current market rates, competitor pricing, and regional exchange values. |
| `match_and_update_prices.mjs` | Compares catalog items against `market_scraped.json`, computes gross margin ($\text{Sale} - \text{Cost}$), and adjusts `sale_price` and `cost_price` to maintain targeted merchant margins. |

```bash
# Analyze price differences and update catalog prices
node scripts/pricing/match_and_update_prices.mjs
```

---

## 5. Database Schema & Migration Utilities (`scripts/database/`)

| File | Purpose |
| :--- | :--- |
| `apply-migration.cjs` | Node.js migration runner that executes versioned SQL scripts against PostgreSQL. |
| `schema-setup.sql` | Master SQL script containing table definitions, enums, triggers, RLS policies, and stored procedures. |
| `products-seed.sql` | Compiled SQL dump containing complete catalog inserts for fast database population. |

```bash
# Execute migration file
node scripts/database/apply-migration.cjs supabase/migrations/20260924000003_set_default_instant_code_delivery.sql
```

---

## 🛡️ Recommended Execution SOP

When performing catalog maintenance or batch operations:
1. **Always run a dry run**: Confirm intended mutations with dry-run output.
2. **Review affected row counts**: Verify that only the targeted categories or platforms will be affected.
3. **Execute with `--execute`**: Commit the changes.
4. **Audit results**: Run `check-stock.cjs` and verify through the Admin Suite at `/admin`.

---

## 📚 Related Documentation
* **[Main Platform README](../README.md)**: Architecture, security protections, tech stack, and setup.
* **[Merchant System Specification](../docs/MERCHANT_SYSTEM_OVERVIEW.md)**: Business logic, payment flows, and operations guide.

---

## 📄 License
Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.  
© 2026 RETROHUB — Engineered by **Abir Hossain**.

