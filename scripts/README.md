# RetroHub Scripts & Utilities Guide

This directory contains database migrations, product catalog seeders, image scrapers, price matching utilities, and maintenance tools for RetroHub.

---

## 📁 Directory Structure

```
scripts/
├── database/            # Database schema setup, SQL seed files, and migration runners
│   ├── apply-migration.cjs    # Executes SQL migrations against Supabase via REST/Postgres
│   ├── products-seed.sql      # Compiled SQL seed dataset for bulk product insertion
│   └── schema-setup.sql       # Initial Supabase schema, tables, enums, RLS, and functions
│
├── seeding/             # Product catalog import, variant generation, and seeders
│   ├── add_subs.mjs           # Parses subscription CSVs into base products & variants
│   ├── add_topups.mjs         # Parses top-up CSVs into base products & variants
│   ├── add_variants.mjs       # General CSV variant parser for products in Products/
│   ├── generate-sql.cjs       # Generates database/products-seed.sql from Products/*.xlsx
│   ├── seed-products.cjs      # Direct product seeder from Excel sheets into Supabase
│   └── seed_pdf_variants.mjs  # Seeds curated gift cards, currencies, & subscription tiers
│
├── pricing/             # Price scraping datasets and synchronization algorithms
│   ├── market_scraped.json    # Cached scraped catalog dataset from market vendor
│   └── match_and_update_prices.mjs # Matches scraped prices to update empty/zero product prices
│
├── images/              # Product image sourcing, mapping, and cleanup tools
│   ├── apply_missing_and_default_images.mjs # Batch auto-finder & updater for missing & default images
│   ├── fetch_photos.mjs       # Fetches missing cover artwork from Steam & store APIs
│   ├── find_photos.mjs        # Search and match tool for product cover images
│   ├── map_images.mjs         # Maps image URLs from local assets/spreadsheets to Supabase
│   ├── remove_watermarked_images.mjs # Removes watermarked images from products
│   └── search_product_image.mjs # Multi-provider image finder with strict requirement verification
│
├── maintenance/         # Catalog hygiene, category repairs, and stock monitoring
│   ├── check-stock.cjs        # Displays total product counts and out-of-stock statistics
│   ├── cleanup-products.cjs   # Normalizes categories, deduplicates products, & updates stock
│   ├── delete_spam.cjs        # Cleans out duplicate or invalid catalog spam entries
│   ├── fix_software.mjs       # Re-categorizes and fixes software & tool products
│   ├── fix_topups.mjs         # Re-categorizes and fixes in-game top-up products
│   └── update_products.cjs    # Batch product updater from Excel sheets
│
└── testing/             # Diagnostics, API connectivity, and query testers
    ├── analyze_titles.mjs     # Inspects catalog title patterns and variant naming
    ├── test_steam_api.mjs     # Tests Steam Store API connectivity and rate limits
    └── test_variants.mjs      # Tests variant query resolution and product grouping logic
```

---

## 🚀 Quick Execution Guide

All scripts can be executed directly from the project root. Environment variables (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are automatically loaded from `.env`.

```bash
# 1. Check current inventory and stock status
node scripts/maintenance/check-stock.cjs

# 2. Re-generate seed SQL from Excel sheets
node scripts/seeding/generate-sql.cjs

# 3. Match and fill zero/null prices from scraped data
node scripts/pricing/match_and_update_prices.mjs

# 4. Clean up duplicate titles and normalize categories
node scripts/maintenance/cleanup-products.cjs

# 5. Test variant grouping logic
node scripts/testing/test_variants.mjs
```

---

## 📖 Script Purpose Details

### 1. Database (`scripts/database/`)
* **`schema-setup.sql`**: Full PostgreSQL schema definition. Sets up tables (`products`, `orders`, `profiles`, `deliveries`, `audit_logs`), custom enums (`product_category`, `region_tag`, `delivery_type`, `order_status`), Row Level Security policies, and trigger functions.
* **`products-seed.sql`**: Bulk `INSERT ... ON CONFLICT (title) DO UPDATE` SQL statements containing thousands of seeded games, subscriptions, gift cards, and top-ups with prices, categories, and region tags.
* **`apply-migration.cjs`**: Programmatic migration runner that executes migration SQL files directly against the Supabase instance using service role credentials.

### 2. Seeding (`scripts/seeding/`)
* **`generate-sql.cjs`**: Reads Excel files (`Catalog 1.xlsx`, `Catalog 2.xlsx`, `ovrok.xlsx`, `Xbox Games.xlsx`, `PS Games.xlsx`, `STEAM GAMES.xlsx`) in `Products/`, cleans titles, detects regions and categories, and compiles `scripts/database/products-seed.sql`.
* **`seed-products.cjs`**: Directly parses the Excel sheets and performs batch upserts into the Supabase `products` table.
* **`seed_pdf_variants.mjs`**: Seeds specific in-game currency tiers (Valorant, Fortnite, PUBG, Roblox, Genshin Impact) and gift card variants into the database.
* **`add_subs.mjs`**: Reads exported CSV files in `Products/subscription/` and generates base products and their associated duration variants (`Product | 1 Month`, etc.).
* **`add_topups.mjs`**: Reads exported CSV files in `Products/top ups/` and creates base products with variant packages.
* **`add_variants.mjs`**: General-purpose variant creator across all directories in `Products/`.

### 3. Pricing (`scripts/pricing/`)
* **`market_scraped.json`**: Cached scraped catalog data from market sources containing parent products, child variant prices, and slugs.
* **`match_and_update_prices.mjs`**: Compares products in Supabase that have zero or null prices against `market_scraped.json` using fuzzy matching, and updates `sale_price` and `cost_price`.

### 4. Images (`scripts/images/`)
* **`apply_missing_and_default_images.mjs`**: Automated batch runner that scans the entire database for products with missing images or generic default console fallback logos (e.g. generic Xbox SVG), resolves official game headers via Steam API, verified logos/wallpapers, and DuckDuckGo Web search, and automatically updates Supabase.
* **`search_product_image.mjs`**: Intelligent multi-provider image finder and validator. Searches images based on product title (using Curated High-Res Registry, Steam Store API, iTunes API, and DuckDuckGo Images) and validates candidates against strict image requirements (minimum resolution, aspect ratio e.g. 16:9 or 3:4 or 1:1, valid formats, reachable HTTP status). Supports single title lookups, batch catalog scans, dry-run previews, and `--apply` mode to commit directly to Supabase.
* **`fetch_photos.mjs`**: Identifies games without cover images and queries public store APIs (Steam, IGDB, Epic) to retrieve and assign official poster images.
* **`find_photos.mjs`**: Utility search script to test and verify image search queries for specific game titles.
* **`map_images.mjs`**: Maps image URLs from local data feeds and spreadsheets into Supabase products based on title matching.
* **`remove_watermarked_images.mjs`**: Clears out image URLs carrying external third-party store watermarks.

### 5. Maintenance (`scripts/maintenance/`)
* **`check-stock.cjs`**: Quick health check script that queries Supabase to output total products count and out-of-stock count.
* **`cleanup-products.cjs`**: Comprehensive catalog cleanup script. Deduplicates products by normalized title, applies category rules, ensures valid platform tags, and sets default stock.
* **`delete_spam.cjs`**: Targeted cleaner that deletes corrupt or spam products from older test runs.
* **`fix_software.mjs`**: Ensures software products (Windows, Office, Antivirus) have the `software` category and appropriate delivery types.
* **`fix_topups.mjs`**: Corrects categorization and metadata for in-game top-up and currency products.
* **`update_products.cjs`**: Bulk updates product attributes (e.g., in_stock, is_active) across existing items.

### 6. Testing (`scripts/testing/`)
* **`analyze_titles.mjs`**: Analyzes title formatting across the catalog to identify inconsistencies before running seeders.
* **`test_steam_api.mjs`**: Verifies Steam Store API responses and rate limit handling for automated image retrieval.
* **`test_variants.mjs`**: Tests variant delimiter queries (`Title | Variant`) to ensure the frontend `ProductPurchaseCard` selector resolves all child options correctly.
