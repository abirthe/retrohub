# RETROHUB — Game Keys, Top-ups & Digital Commerce Platform 🎮⚡

![RetroHub Platform](public/favicon.ico)

**RETROHUB** is an enterprise-grade digital goods e-commerce platform built for instantaneous fulfillment of digital game keys, in-game currency top-ups, verified gaming accounts, digital gift cards, subscription passes, and software services.

Engineered with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL 15+)**, the platform delivers ultra-low latency catalog browsing, real-time merchant margin tracking, local mobile payment workflows, and automated digital delivery pipelines.

---

## ⚡ Core Capabilities & Highlights

* **Multi-Platform Digital Goods**: Steam, Xbox, PlayStation, Nintendo, Epic Games, GOG, and EA App.
* **Direct Player UID In-Game Top-Ups**: 17+ curated games with automated Player ID / Server / Zone ID input validation (Valorant, MLBB, PUBG Mobile, Genshin Impact, Honkai: Star Rail, Fortnite, Roblox, etc.).
* **Verified Gaming Accounts**: Full-access regional and verified accounts isolated into a dedicated category.
* **Global & Regional Digital Gift Cards**: Apple iTunes, Steam Wallet, PSN, Xbox, Nintendo eShop, Roblox, and Blizzard Battle.net.
* **Gaming & Cloud Subscriptions**: Xbox Game Pass (Ultimate/PC), PlayStation Plus (Essential/Extra/Deluxe), EA Play, Discord Nitro, and YouTube Premium.
* **Software & Digital Services**: Lifetime Microsoft Office/Windows activation licenses, regional PSN/Steam account setup, and Google AI Pro 6-Month plans.
* **On-Demand Custom Orders**: Dedicated custom request portal (`/custom-order`) with admin queue triage.
* **Local Payment Channels**: Integrated checkout for Bangladeshi payment workflows: **bKash** (Personal/Merchant with 1% automated charge calculation) and **Bank Wire Transfers** (City Bank, DBBL, BRAC Bank).
* **Automated Order Fulfillment**: Immediate delivery code revelation in `/orders` alongside automated HTML receipt emails dispatched via Supabase Edge Functions + Resend API.
* **Merchant Back-Office Suite**: Live daily revenue, order counts, and net profit analytics, 8-state order lifecycle management, inline stock/price updates, and custom orders board.

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend Core** | React 18.3, TypeScript 5.8 | Functional components, strict typing (zero `any`), custom hooks |
| **Styling & Theme** | Tailwind CSS 3.4, PostCSS, Lucide React | Cyber-neon dark aesthetic, glassmorphism, responsive design |
| **UI Component Primitives**| Radix UI, shadcn/ui, Sonner, Vaul | Accessible dialogs, dropdowns, sheets, modals, and toasts |
| **State & Data Fetching** | TanStack Query v5 (React Query), Context API | Server state caching, optimistic updates, persistent cart |
| **Routing** | React Router DOM v6 | Client-side routing with guarded admin & auth views |
| **Backend & Database** | Supabase (PostgreSQL 15+) | Row-Level Security (RLS), stored procedures, views, auth |
| **Email Delivery** | Supabase Edge Functions, Resend API | Automated order fulfillment email dispatch |
| **Build & Tooling** | Vite 5.4, SWC Plugin, Vitest, ESLint 9 | Lightning-fast HMR, automated testing, modern bundling |

---

## 📁 Repository Structure

```
retrohub/
├── docs/                           # Authoritative platform documentation
│   └── MERCHANT_SYSTEM_OVERVIEW.md # Feature specs, capabilities & merchant SOP
├── public/                         # Static assets & public artwork
│   └── images/                     # Categorized game, gift card, top-up & service assets
├── scripts/                        # Catalog automation, seeding, pricing & maintenance
│   ├── database/                   # Schema DDL, migrations, and compiled seed SQL
│   ├── images/                     # Cover artwork mapping and watermarking cleaners
│   ├── maintenance/                # Deduplication, orphan cleanup, stock audit utilities
│   ├── pricing/                    # Market scrapers and dynamic margin sync algorithms
│   ├── seeding/                    # Multi-source product catalog and variant seeders
│   └── README.md                   # Comprehensive scripts documentation
├── src/                            # Application source code
│   ├── components/                 # Modular React components
│   │   ├── admin/                  # AdminSuite tabs, order dialogs, stats grid, inventory
│   │   ├── checkout/               # Checkout payment triggers & review cards
│   │   ├── home/                   # Hero banner, category pills, product grid, filters
│   │   ├── layout/                 # ShopHeader, Footer, navigation drawers
│   │   ├── orders/                 # Desktop order tables and mobile order cards
│   │   ├── payment/                # bKash and Bank Wire instructions components
│   │   ├── product/                # Product details, purchase cards, variant selectors
│   │   └── ui/                     # Radix UI design tokens & buttons
│   ├── contexts/                   # CartContext with localStorage persistence
│   ├── hooks/                      # Custom hooks (useAuth, useToast, etc.)
│   ├── integrations/               # Supabase client initialization and generated types
│   ├── lib/                        # Business logic, category filters, API helpers
│   │   ├── constants.ts            # Category and subcategory taxonomy definitions
│   │   ├── emailService.ts         # Supabase Edge Function email dispatch client
│   │   ├── productFilters.ts       # 1-to-1 strict category isolation logic
│   │   ├── regions.ts              # 28 supported region codes and flag helpers
│   │   ├── shopApi.ts              # Storefront & Admin data layer and RPC wrappers
│   │   └── utils.ts                # Tailwind class mergers and number formatters
│   ├── pages/                      # Page routes (Index, ProductDetail, Checkout, Payment, Orders, Admin)
│   ├── App.tsx                     # Route hierarchy, query client & error boundary
│   └── main.tsx                    # React client entry point
├── supabase/                       # Supabase migration scripts and edge functions
│   └── migrations/                 # Versioned SQL migrations (RLS, views, RPCs)
├── package.json                    # Dependencies and scripts
├── tailwind.config.ts              # Custom theme tokens, neon colors, animations
└── vite.config.ts                  # Vite build and path aliases configuration
```

---

## 🔄 End-to-End Order & Delivery Flow

```
[ Customer Storefront ]
        │
        ▼ (Selects Product & enters Player ID / Server if Top-up)
[ Cart & Checkout ]
        │
        ▼ (Selects bKash or Bank Transfer)
[ Payment Portal (/payment) ]
        │
        ▼ (Submits Transaction ID / Slip Reference)
[ Order Status: payment_submitted ]
        │
        ▼
[ Admin Dashboard (/admin) ]
        │
        ├─► Merchant checks statement & clicks "Validate" (Status: payment_verified)
        │
        ▼
[ Fulfillment Execution ]
        ├─► Automated Key Assigned (`instant_code` with SKIP LOCKED)
        │    OR
        └─► Merchant inputs code/credentials (`fulfill_order` RPC)
        │
        ▼ (Status: fulfilled)
┌────────────────────────────────────────────────────────┐
│  - Code unlocked & displayed in Customer /orders page   │
│  - Delivery email dispatched via Resend Edge Function  │
│  - Margin logged & financial analytics updated         │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture & Key Views

### Core Relational Tables
* **`products`**: Catalog items (`title`, `sale_price`, `cost_price`, `category`, `platform`, `region`, `delivery_type`, `in_stock`, `is_active`, `description`).
* **`inventory_keys`**: Digital keys and serials (`pin_code`, `serial_number`, `status: available | sold | expired`).
* **`orders`**: Customer transactions (`user_id`, `product_id`, `total`, `status`, `customer_input`).
* **`deliveries`**: Order fulfillment records (`order_id`, `delivery_code`, `cost_paid`, `sourced_from`, `notes`).
* **`custom_orders`**: On-demand user requests (`name`, `email`, `product_name`, `platform`, `details`, `status`).
* **`user_roles`**: Administrative RBAC (`role: admin | user`).
* **`audit_logs` & `admin_action_logs`**: Tamper-proof system audit logs.

### Real-Time Financial Views
* **`v_revenue_today`**: Aggregated gross sales completed in the current calendar day.
* **`v_orders_today`**: Count of successfully completed orders today.
* **`v_profit_today`**: Net margin dynamically calculated as $\text{Total Sale} - \text{Total Cost}$.
* **`v_pending_action_count`**: Real-time counter of orders awaiting verification or fulfillment.

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **Supabase Project**: Linked Supabase database instance

### 2. Environment Configuration
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Required only for maintenance & seed scripts
```

### 3. Local Installation & Development
```bash
# Install dependencies
npm install

# Start local development server (http://localhost:8080 or port shown)
npm run dev

# Run TypeScript type verification
npx tsc --noEmit

# Run unit tests
npm run test

# Build production bundle
npm run build
```

---

## 🧰 Catalog Scripts & Automation Toolchain

RetroHub features a dedicated suite of Node.js scripts for catalog management, maintenance, seeding, and margin calculations located in [`scripts/`](scripts/README.md):

```bash
# Seed curated digital gift cards (Apple, Steam, PlayStation, Nintendo, Roblox, Blizzard)
node scripts/seeding/seed_digital_giftcards.mjs

# Seed 17+ game top-up products and denominations
node scripts/seeding/seed_game_topups.mjs

# Seed verified gaming accounts
node scripts/seeding/seed_plati_accounts.mjs

# Preview catalog deduplication (safe dry-run)
node scripts/maintenance/deduplicate_products_strict.mjs

# Execute catalog deduplication (live mode)
node scripts/maintenance/deduplicate_products_strict.mjs --execute

# Audit out-of-stock and inactive products
node scripts/maintenance/check-stock.cjs
```

For full documentation of all available scripts, execution flags, and data flows, see **[scripts/README.md](scripts/README.md)**.

---

## 📚 Documentation
* **[Platform & Merchant System Specification](docs/MERCHANT_SYSTEM_OVERVIEW.md)**: Exhaustive reference covering all website features, category taxonomy, payment handling, admin operations, and merchant standard operating procedures.
* **[Tooling & Scripts Manual](scripts/README.md)**: Developer documentation for seeding, maintenance, database migration, and pricing sync tools.

---

## 📄 License
Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.
