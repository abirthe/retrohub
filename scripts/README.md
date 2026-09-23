# RetroHub Scripts

Utility and tooling scripts for managing the RetroHub product catalog, database, and pricing.

---

## Directory Structure

```
scripts/
├── database/          # Schema, seed SQL, and migration files
├── images/            # Image generation and processing utilities
├── maintenance/       # Database maintenance and cleanup tools
├── pricing/           # Pricing and margin calculators
└── seeding/           # Product catalog seeding scripts
```

---

## Seeding (`scripts/seeding/`)

Scripts that populate the Supabase database with product catalog data.

| Script | Description |
|---|---|
| `seed_game_topups.mjs` | Seeds game top-up products (Fortnite V-Bucks, MLBB Diamonds, Valorant Points, etc.) |
| `seed_digital_giftcards.mjs` | Seeds digital gift card products (PlayStation, Xbox, Steam, Nintendo, Apple, Roblox, Blizzard) |
| `seed_plati_accounts.mjs` | Seeds game account products sourced from Plati.market |
| `seed_ea_play.mjs` | Seeds EA Play (Console) subscription products |
| `seed_ea_play_pc.mjs` | Seeds EA Play (PC) subscription products |
| `seed_pdf_variants.mjs` | Seeds product variants from PDF price lists |
| `insert_google_ai_service.mjs` | Seeds Google AI Pro service product |
| `seed-products.cjs` | Legacy CJS seeder for general products |
| `generate-sql.cjs` | Generates SQL insert statements from product definitions |
| `add_subs.mjs` | Adds subscription product entries |
| `add_topups.mjs` | Adds top-up product entries |
| `add_variants.mjs` | Adds product variant entries |

### Running a seeder

```bash
node scripts/seeding/seed_game_topups.mjs
node scripts/seeding/seed_digital_giftcards.mjs
```

---

## Maintenance (`scripts/maintenance/`)

Tools for keeping the catalog clean and consistent. All destructive scripts support a `--execute` flag — without it they run as a safe dry-run.

| Script | Description |
|---|---|
| `sanitize_image_urls.mjs` | Clears vendor-specific image URLs from product records (dry-run by default) |
| `deduplicate_products.mjs` | Detects and removes duplicate products, keeping highest-margin entry |
| `check-stock.cjs` | Reports out-of-stock and inactive products |
| `cleanup-products.cjs` | Bulk-removes miscategorised or malformed products |
| `update_products.cjs` | Applies bulk field updates to product records |
| `delete_spam.cjs` | Removes known spam or test entries |

### Usage examples

```bash
# Dry-run — preview what would be sanitized
node scripts/maintenance/sanitize_image_urls.mjs

# Execute — apply the changes
node scripts/maintenance/sanitize_image_urls.mjs --execute

# Deduplicate (dry-run)
node scripts/maintenance/deduplicate_products.mjs

# Deduplicate (live)
node scripts/maintenance/deduplicate_products.mjs --execute
```

---

## Database (`scripts/database/`)

SQL schema files and seed data for the Supabase project.

---

## Images (`scripts/images/`)

Utilities for generating and processing product artwork and cover images.

---

## Pricing (`scripts/pricing/`)

Tools for calculating margins, updating cost/sale prices in bulk, and auditing pricing consistency.

---

## Environment Setup

All scripts read credentials from a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Warning**: Never commit `.env` to version control.
