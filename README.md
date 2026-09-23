# RETROHUB — Game Keys, Top-ups & Digital Services Platform

![RetroHub Platform](public/favicon.ico)

**RETROHUB** is a high-performance e-commerce platform specialized in instant game keys, in-game currency top-ups, digital gift cards, gaming subscriptions, and verified online services. Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

---

## ⚡ Key Highlights & Catalog Structure

RetroHub features an automated catalog with multi-region support, instant fulfillment, and 1-to-1 category isolation:

### 🎮 1. Games (`games`)
* **Xbox Games (`games_xbox`)**: Official Xbox One & Xbox Series X\|S digital game codes.
* **PlayStation Games (`games_ps`)**: PlayStation 4 & PlayStation 5 PSN digital keys.
* **Steam Games (`games_steam`)**: Steam PC activation keys with instant code delivery.
* **GOG Games (`games_gog`)**: DRM-free PC games on the GOG platform.
* **Others (`games_others`)**: Epic Games, Ubisoft Connect, EA App, and standalone PC digital keys.

### 👤 2. Accounts (`accounts`)
* Verified full-access and personal regional game accounts across Steam, PlayStation, Xbox, Minecraft, and Ubisoft.

### 🎁 3. Gift Cards (`giftcard`)
* **XBOX (`giftcard_xbox`)**: Xbox Store & Game Pass wallet gift cards.
* **STEAM (`giftcard_steam`)**: Global, USD, INR, and regional Steam Wallet codes.
* **PlayStation (`giftcard_ps`)**: PlayStation Store wallet recharge cards (USD, GBP, TL, etc.).
* **Apple (`giftcard_apple`)**: Official US iTunes & Apple App Store gift cards ($2 – $100).
* **Nintendo (`giftcard_nintendo`)**: Nintendo Switch eShop prepaid cards ($10, $20, $50).
* **Roblox (`giftcard_roblox`)**: Official Roblox US cards (275 – 11,000 Robux).
* **Blizzard (`giftcard_blizzard`)**: Blizzard Battle.net wallet balance cards ($10 – $100).

### 🔄 4. Subscriptions (`subscription`)
* **Game Pass (`sub_gamepass`)**: Xbox Game Pass Ultimate & PC Game Pass memberships.
* **PSN (`sub_psn`)**: PlayStation Plus Essential, Extra, and Deluxe tiers.
* **EA (`sub_ea`)**: EA Play & EA Play Pro memberships across PC and consoles.
* **Others (`sub_others`)**: Discord Nitro (+2 Server Boosts), YouTube Premium, and entertainment streaming passes.

### ⚡ 5. Game Top-ups (`topup`)
* 17 curated top-up services with automated Player ID (UID) recharge:
  - **Valorant Points**: BD, Philippines (PHP), Malaysia (MY) regions.
  - **Wuthering Waves**: Lunites and Lunite Subscription pass.
  - **Fortnite**: V-Bucks across PC, Xbox, and PlayStation.
  - **PUBG Mobile**: Unknown Cash (UC) direct UID recharge.
  - **Genshin Impact**: Genesis Crystals & Blessing of the Welkin Moon.
  - **Honkai: Star Rail**: Oneiric Shards & Express Supply Pass.
  - **Zenless Zone Zero**: Monochrome Film & Inter-Knot Membership.
  - **Mobile Legends (MLBB)**: Diamonds and Weekly Diamond Pass.
  - **Marvel Rivals**: Lattices and Battle Pass recharge.
  - **Roblox, Apex Legends, eFootball PES, Delta Force, Neverness to Everness (NTE)**.

### 🛠️ 6. Services & Software (`service`)
* **Google AI Pro (6 Months)**: Official Google activation link for Gemini 3.1 Pro, Antigravity 2.0 (4× limits), Veo 3.1, Nano Banana 2, and 5TB Google One Cloud storage.
* **Registration & Digital Services**: Regional Steam & PSN account setup, Microsoft Office lifetime activation keys.

### 📋 7. Custom Orders (`custom_orders`)
* Interactive request portal for custom game titles, unlisted subscriptions, or specific software requests.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 (Functional Components & React Hooks) |
| **Language & Type System** | TypeScript (Strict mode, zero `any`) |
| **Styling & Design System** | Tailwind CSS with custom cyber-neon dark aesthetic |
| **UI Primitives** | shadcn/ui + Radix UI Primitives |
| **State & Data Fetching** | TanStack Query (React Query v5) + React Context API |
| **Routing** | React Router v6 |
| **Icons & Media** | Lucide React + High-Resolution Clean Visual Assets |
| **Backend & Database** | Supabase (PostgreSQL with RLS & Stored Procedures) |
| **Build & Tooling** | Vite v5 + PostCSS + Vitest |

---

## 📁 Repository Architecture

```
retrohub/
├── public/                    # Static assets & public media
│   └── images/
│       ├── giftcards/         # Clean giftcard artworks (Apple, Nintendo, Roblox, Blizzard)
│       ├── services/          # Services visual assets (Google AI Pro, etc.)
│       └── topups/            # Clean unbranded game topup artworks
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── home/              # Hero, CategoryFilter, ProductGrid, Featured
│   │   ├── layout/            # ShopHeader, Footer, Navigation
│   │   ├── product/           # ProductPurchaseCard, ProductDetail, ProductFeatures
│   │   ├── orders/            # Order tables, status badges, mobile order cards
│   │   └── ui/                # Radix-based accessible UI design tokens
│   ├── contexts/              # CartContext (persisted cart state with localStorage)
│   ├── hooks/                 # Custom React hooks (useAuth, useToast, etc.)
│   ├── integrations/          # Supabase client wrapper and database types
│   ├── lib/                   # Category resolvers, API interfaces, utility helpers
│   │   ├── constants.ts       # Central category & subcategory definitions
│   │   ├── productFilters.ts  # Semantic 1-to-1 category and subcategory filtering
│   │   ├── shopApi.ts         # High-level Supabase storefront and admin query engine
│   │   └── utils.ts           # Styling and formatting utilities
│   ├── pages/                 # Route components (Index, ProductDetail, Checkout, Orders, Admin)
│   ├── App.tsx                # Application routing and ErrorBoundary setup
│   └── main.tsx               # Client entry point
├── scripts/                   # Seeding, maintenance, database migrations, and testing tools
│   ├── database/              # Schema setup and compiled SQL seeds
│   ├── images/                # Image mapping and cleanup scripts
│   ├── maintenance/           # Catalog deduplication and orphan cleanup tools
│   ├── pricing/               # Market price scrapers and sync algorithms
│   ├── seeding/               # Automated product and variant seeders
│   └── testing/               # Catalog diagnostics and validation tests
├── supabase/                  # Supabase migrations and Edge Functions
└── package.json               # Dependencies and build scripts
```

---

## 🗄️ Database Architecture & Views

### Core Tables
* **`products`**: Product entries containing `title`, `sale_price`, `cost_price`, `category`, `platform`, `region`, `delivery_type`, `in_stock`, `is_active`, and structured markdown `description`.
* **`orders`**: Customer transactions containing `status`, `total`, `cost`, `profit`, `customer_input`, and user linkage.
* **`deliveries`**: Order fulfillment logs and credentials issued to customers.
* **`profiles`**: User account profile information and contact details.
* **`user_roles`**: Role-based access control (`admin`, `user`).
* **`audit_logs` & `admin_action_logs`**: System audit trails.

### Optimized PostgreSQL Views
* **`v_grouped_products`**: Groups catalog variants by base title, deduplicating listings and presenting the lowest entry price.
* **`v_revenue_today`**, **`v_orders_today`**, **`v_profit_today`**: Real-time sales and revenue KPIs for the Admin Dashboard.
* **`v_pending_action_count`**: Real-time count of orders awaiting fulfillment.

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Supabase Project**: PostgreSQL database instance

### 2. Environment Setup
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 🔧 Maintenance & Seeding Toolchain

All catalog utilities are executed from the project root using Node.js:

```bash
# Seed 17 curated game top-ups (152 variants) from ArektaCoinStore
node scripts/seeding/scrape_arektacoin_topups.mjs

# Seed Apple, Nintendo, Roblox, and Blizzard gift cards (27 variants)
node scripts/seeding/seed_arektacoin_giftcards.mjs

# Ingest Google AI Pro 6-month subscription service
node scripts/seeding/insert_google_ai_service.mjs

# Audit inventory and stock
node scripts/maintenance/check-stock.cjs
```

---

## 📄 License
Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.
