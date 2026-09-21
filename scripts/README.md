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
│   ├── seed_ea_play.mjs       # Seeds EA Play PSN subscriptions (Turkey & Ukraine)
│   ├── seed_ea_play_pc.mjs    # Seeds EA Play & EA Play Pro PC subscriptions (EA App / Origin)
│   ├── seed_pdf_variants.mjs  # Seeds curated gift cards, currencies, & subscription tiers
│   └── seed_plati_accounts.mjs# Scrapes & seeds 300 curated accounts from Plati (100 Games, 100 Apps, 100 Others)
│
├── pricing/             # Price scraping datasets and synchronization algorithms
│   ├── market_scraped.json    # Cached scraped catalog dataset from market vendor
│   └── match_and_update_prices.mjs # Matches scraped prices to update empty/zero product prices
│
├── images/              # Product image sourcing, mapping, and cleanup tools
│   ├── apply_missing_and_default_images.mjs # Batch auto-finder & updater for missing & default images
│   ├── map_images.mjs         # Maps image URLs from local assets/spreadsheets to Supabase
│   ├── remove_watermarked_images.mjs # Removes watermarked images from products
│   └── search_product_image.mjs # Multi-provider image finder with strict requirement verification
│
├── maintenance/         # Catalog hygiene, category repairs, and stock monitoring
│   ├── check-stock.cjs        # Displays total product counts and out-of-stock statistics
│   ├── cleanup-products.cjs   # Normalizes categories, deduplicates products, & updates stock
│   ├── deduplicate_products.mjs # Deduplicates items based on title/desc, keeping highest profit margin
│   ├── delete_spam.cjs        # Cleans out duplicate or invalid catalog spam entries
│   ├── fix_accounts_subcategories.mjs # Audits & repairs Accounts subcategories (100 Games, 100 Apps, 100 Others)
│   └── update_products.cjs    # Batch product updater from Excel sheets
│
└── testing/             # Diagnostics, API connectivity, and query testers
    ├── analyze_titles.mjs     # Inspects catalog title patterns and variant naming
    ├── test_steam_api.mjs     # Tests Steam Store API connectivity and rate limits
    ├── test_variants.mjs      # Tests variant query resolution and product grouping logic
    └── verify_accounts.mjs    # Validates accounts catalog counts (100 Games, 100 Apps, 100 Others)
```

---

## 🚀 Quick Execution Guide

All scripts can be executed directly from the project root. Environment variables (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are automatically loaded from `.env`.

```bash
# 1. Check current inventory and stock status
node scripts/maintenance/check-stock.cjs

# 2. Verify account catalog balance (100 Games, 100 Apps, 100 Others)
node scripts/testing/verify_accounts.mjs

# 3. Match and fill zero/null prices from scraped data
node scripts/pricing/match_and_update_prices.mjs

# 4. Clean up duplicate titles and normalize categories
node scripts/maintenance/cleanup-products.cjs

# 5. Test variant grouping logic
node scripts/testing/test_variants.mjs

# 6. Run Plati accounts seeder / updater
node scripts/seeding/seed_plati_accounts.mjs
```

---

## 📖 Script Purpose Details

### 1. Database (`scripts/database/`)
* **`schema-setup.sql`**: Full PostgreSQL schema definition. Sets up tables (`products`, `orders`, `profiles`, `deliveries`, `audit_logs`), custom enums (`product_category`, `region_tag`, `delivery_type`, `order_status`), Row Level Security policies, and trigger functions.
* **`products-seed.sql`**: Bulk `INSERT ... ON CONFLICT (title) DO UPDATE` SQL statements containing seeded games, subscriptions, gift cards, and top-ups with prices, categories, and region tags.
* **`apply-migration.cjs`**: Programmatic migration runner that executes migration SQL files directly against the Supabase instance using service role credentials.

### 2. Seeding (`scripts/seeding/`)
* **`seed_plati_accounts.mjs`**: Automated scraper & ingestion tool for Plati.market accounts. Filters for best-selling items, verified seller reputation ($\ge 95\%$), lowest price among duplicates, converts prices with 127 Tk USD rate + 400 Tk markup, and balances exactly 100 products per subcategory (Games, Application, Others).
* **`seed-products.cjs`**: Directly parses the Excel sheets and performs batch upserts into the Supabase `products` table.
* **`generate-sql.cjs`**: Reads Excel files in `Products/`, cleans titles, detects regions and categories, and compiles SQL seed files.
* **`seed_ea_play.mjs`**: Seeds EA Play PSN subscriptions (Turkey & Ukraine) with custom descriptions and local assets.
* **`seed_ea_play_pc.mjs`**: Seeds EA Play & EA Play Pro PC subscriptions (EA App / Origin).
* **`seed_pdf_variants.mjs`**: Seeds specific in-game currency tiers and gift card variants into the database.
* **`add_subs.mjs`**: Reads exported CSV files in `Products/subscription/` and generates base products and duration variants.
* **`add_topups.mjs`**: Reads exported CSV files in `Products/top ups/` and creates base products with variant packages.
* **`add_variants.mjs`**: General-purpose variant creator across all directories in `Products/`.

### 3. Pricing (`scripts/pricing/`)
* **`market_scraped.json`**: Cached scraped catalog data containing parent products, child variant prices, and slugs.
* **`match_and_update_prices.mjs`**: Compares products in Supabase that have zero or null prices against scraped market data using fuzzy matching, updating `sale_price` and `cost_price`.

### 4. Images (`scripts/images/`)
* **`apply_missing_and_default_images.mjs`**: Automated batch runner that scans the entire database for products with missing images or generic default fallback logos, resolves official game headers via Steam API, verified logos/wallpapers, and DuckDuckGo search, and commits updates to Supabase.
* **`search_product_image.mjs`**: Intelligent multi-provider image finder and validator. Searches images based on product title (using Curated High-Res Registry, Steam Store API, iTunes API, and DuckDuckGo Images) and validates candidates against strict resolution and aspect ratio requirements.
* **`map_images.mjs`**: Maps image URLs from local assets/spreadsheets to Supabase products.
* **`remove_watermarked_images.mjs`**: Cleans and resets watermarked or bad image URLs.

### 5. Maintenance (`scripts/maintenance/`)
* **`check-stock.cjs`**: Displays total product counts and out-of-stock statistics.
* **`cleanup-products.cjs`**: Normalizes categories, deduplicates products, & updates stock.
* **`deduplicate_products.mjs`**: Compares products by title, clean title, and description similarity to remove exact duplicates while retaining the highest profit-making item (`sale_price - cost_price`).
* **`delete_spam.cjs`**: Cleans out duplicate or invalid catalog spam entries.
* **`fix_accounts_subcategories.mjs`**: Audits, categorizes, and balances the Accounts subcategories (`accounts_games`, `accounts_app`, `accounts_others`), ensuring exactly 100 products per subcategory and reassigning misplaced application products.
* **`update_products.cjs`**: Batch product updater from Excel sheets.

### 6. Testing (`scripts/testing/`)
* **`verify_accounts.mjs`**: Validates the 300 account products in Supabase and confirms exact distribution (100 Games, 100 Apps, 100 Others).
* **`analyze_titles.mjs`**: Inspects catalog title patterns and variant naming conventions.
* **`test_steam_api.mjs`**: Tests Steam Store API connectivity and rate limits.
* **`test_variants.mjs`**: Tests variant query resolution and product grouping logic.
