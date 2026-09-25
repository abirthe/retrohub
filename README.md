# RETROHUB — Game Keys, Top-ups & Digital Commerce Platform 🎮⚡

**RETROHUB** is an enterprise-grade digital goods e-commerce platform built for instantaneous fulfillment of digital game keys, in-game currency top-ups, verified gaming accounts, digital gift cards, subscription passes, and software services.

Engineered with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL 15+)**, the platform delivers ultra-low latency catalog browsing, real-time merchant margin tracking, local mobile payment workflows, and automated digital delivery pipelines.

> **Developer & Architect:** Abir Hossain

---

## ⚡ Core Capabilities & Highlights

* **Multi-Platform Digital Goods**: Steam, Xbox, PlayStation, Nintendo, Epic Games, GOG, and EA App.
* **Dynamic Ambient UI**: Immersive cyber-neon video backgrounds with HLS streaming (via `hls.js`), real-time color harmonization overlays, and ultra-smooth glassmorphism.
* **Direct Player UID In-Game Top-Ups**: 17+ curated games with automated Player ID / Server / Zone ID input validation (Valorant, MLBB, PUBG Mobile, Genshin Impact, Honkai: Star Rail, Fortnite, Roblox, etc.).
* **Verified Gaming Accounts**: Full-access regional and verified accounts isolated into a dedicated category.
* **Global & Regional Digital Gift Cards**: Apple iTunes, Steam Wallet, PSN, Xbox, Nintendo eShop, Roblox, and Blizzard Battle.net.
* **Gaming & Cloud Subscriptions**: Xbox Game Pass (Ultimate/PC), PlayStation Plus (Essential/Extra/Deluxe), EA Play, Discord Nitro, and YouTube Premium.
* **Software & Digital Services**: Lifetime Microsoft Office/Windows activation licenses, regional PSN/Steam account setup, and Google AI Pro 6-Month plans.
* **On-Demand Custom Orders**: Dedicated custom request portal (`/custom-order`) with admin queue triage.
* **Google OAuth & Passwordless Auth**: Instant Google OAuth 2.0 sign-in, magic-link email authentication, and email/password access with dedicated `/privacy` and `/terms` compliance pages.
* **Streamlined Mobile Payment via bKash**: Integrated bKash checkout (Personal/Merchant) with 1% automated charge calculation. Transaction IDs are strictly validated with an alphanumeric regex (`/^[A-Z0-9]{6,30}$/i`) prior to database storage.
* **Automated Order Fulfillment**: Immediate delivery code revelation in `/orders` alongside automated HTML receipt emails dispatched via Supabase Edge Functions + Resend API.
* **AI-Powered Fulfillment Emails**: Integrated xAI Grok API (`grokApi.ts`) for generating personalised, professional fulfillment emails for every completed transaction.
* **Merchant Back-Office Suite**: Live daily revenue, order counts, and net profit analytics, 8-state order lifecycle management, inline stock/price updates, and custom orders board.

---

## 💼 The "Solo-Merchant" Advantage

RetroHub is purpose-built to enable a **solo entrepreneur** to run a highly profitable digital commerce empire without the overhead of customer support teams, data entry clerks, or logistics staff. 

* **Zero Logistics & Automated Fulfillment**: Operating entirely on digital goods (keys, top-ups, subscriptions) means zero shipping costs, zero warehousing, and 24/7 instant order fulfillment. The `FOR UPDATE SKIP LOCKED` database mechanism guarantees autonomous, error-free digital key delivery while you sleep.
* **AI-Powered Customer Communication**: Integrated xAI Grok automatically generates polished, professional delivery emails, drastically reducing manual customer service workload.
* **Unified Back-Office Command Center**: A single `/admin` dashboard tracks live daily revenue, pending orders, custom requests, and inventory margins. A solo merchant can oversee the entire business health in seconds.
* **Automated Catalog Intelligence**: The comprehensive `scripts/` suite handles the heavy lifting of a massive catalog—automating market price scraping, competitor margin syncing, image mapping, and duplicate cleaning without manual data entry.
* **Streamlined Financial Operations**: Direct integration with local mobile wallets (bKash) bypasses expensive enterprise payment gateways, maximizing profit margins and enabling rapid 1-click transaction validation.

---

## 🛡️ Security Architecture

The platform has undergone a comprehensive security hardening audit with zero-compromise protections implemented across both frontend and database layers:

| Protection | Implementation | Operational Guarantee |
| :--- | :--- | :--- |
| **Open Redirect Prevention** | `sanitiseReturnTo()` in `Auth.tsx` & `AuthCallback.tsx` | Validates return targets against window origin; non-same-origin URLs fall back safely to `/`. |
| **Transaction ID Sanitization** | Regex `/^[A-Z0-9]{6,30}$/i` enforced in `Payment.tsx` | Eliminates script injection and malformed references before database submission. |
| **Session JWT for Edge Functions** | Dynamic caller token in `emailService.ts` | Dispatches calls with `Authorization: Bearer <session.access_token>` so Edge Functions verify the user. |
| **Private Error Logging** | Secure internal error routing in `AdminDashboard.tsx` | Query failures log via internal effects (`console.error`); raw Supabase schema hints are never rendered in the UI. |
| **Row-Level Security (RLS)** | PostgreSQL RLS enabled on all tables | Customers strictly query their own orders and keys; data leakage is blocked at the database engine. |
| **RBAC via Stored Procedures** | `has_role(auth.uid(), 'admin')` | Administrative mutations and financial KPIs are guarded by PostgreSQL `SECURITY DEFINER` functions. |
| **Concurrency Lock Protection** | `SELECT ... FOR UPDATE SKIP LOCKED` | High-concurrency key distribution prevents two buyers from ever claiming the same digital key. |
| **Tamper-Proof Audit Trails** | `audit_logs` & `admin_action_logs` | Every order status transition, manual price edit, and stock replenishment is permanently audited. |

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend Core** | React 18.3, TypeScript 5.8 | Functional components, zero `any` strict typing, custom hooks |
| **Styling & Theme** | Tailwind CSS 3.4, PostCSS, Lucide React, hls.js | Cyber-neon dark aesthetic, HLS video backgrounds, glassmorphism, responsive mobile UI |
| **UI Component Primitives**| Radix UI, shadcn/ui, Sonner, Vaul | Accessible dialogs, dropdowns, sheets, modals, and toasts |
| **State & Data Fetching** | TanStack Query v5, Context API | Server state caching, optimistic UI updates, localStorage persistent cart |
| **Routing** | React Router DOM v6 | Client-side routing with guarded admin routes and OAuth callback handlers |
| **Authentication** | Supabase Auth (Google OAuth, Magic Links, Passwords) | Multi-provider authentication with origin-validated redirection |
| **Backend & Database** | Supabase (PostgreSQL 15+) | RLS policies, views, stored procedures, audit tables |
| **Email Delivery** | Supabase Edge Functions, Resend API | Automated fulfillment receipts with session-authenticated caller verification |
| **AI Email Generation** | xAI Grok API (`grokApi.ts`) | Context-aware, personalised customer delivery emails |
| **Build & Tooling** | Vite 5.4, SWC, Vitest, ESLint 9 | Dev server on port 3000, optimized production code-splitting |

---

## 📁 Repository Structure

```
retrohub/
├── docs/
│   └── MERCHANT_SYSTEM_OVERVIEW.md     # Feature specs, capabilities & merchant SOP
├── public/
│   └── images/                         # Game, gift card, top-up & service cover art
├── scripts/                            # Catalog automation, seeding, pricing & maintenance
│   ├── database/                       # Schema DDL, migrations, compiled seed SQL
│   ├── images/                         # Cover artwork mapping & watermark cleaners
│   ├── maintenance/                    # Deduplication, orphan cleanup, stock auditors
│   ├── pricing/                        # Market scrapers & margin sync algorithms
│   ├── seeding/                        # Multi-source product catalog seeders
│   └── README.md                       # Comprehensive tooling & automation guide
├── src/
│   ├── components/
│   │   ├── admin/                      # AdminSuite tabs, order dialogs, stats grid, inventory
│   │   ├── checkout/                   # Checkout review cards & validation
│   │   ├── home/                       # Hero banner, category pills, product grid, filters
│   │   ├── layout/                     # ShopHeader, Footer, navigation drawers
│   │   ├── orders/                     # Order tables & mobile order cards
│   │   ├── payment/                    # bKash payment instructions component
│   │   ├── product/                    # Product details, purchase cards, variant selectors
│   │   └── ui/                         # Radix UI design system primitives
│   ├── contexts/                       # CartContext with localStorage persistence
│   ├── hooks/                          # useAuth, useAdmin, useToast, etc.
│   ├── integrations/                   # Supabase client & generated database types
│   ├── lib/
│   │   ├── constants.ts                # Category & subcategory taxonomy
│   │   ├── emailService.ts             # Edge Function email dispatch (session-JWT auth)
│   │   ├── grokApi.ts                  # xAI Grok API — fulfillment email generation
│   │   ├── productFilters.ts           # Strict 1-to-1 category isolation
│   │   ├── regions.ts                  # 28 region codes & flag helpers
│   │   ├── shopApi.ts                  # Storefront & Admin data layer & RPC wrappers
│   │   └── utils.ts                    # Class mergers & number formatters
│   ├── pages/
│   │   ├── AdminDashboard.tsx          # Merchant back-office (admin-role gated)
│   │   ├── Auth.tsx                    # Sign in / Register (open-redirect hardened)
│   │   ├── AuthCallback.tsx            # Google OAuth & magic-link callback handler
│   │   ├── Checkout.tsx                # Cart review & order creation
│   │   ├── CustomOrder.tsx             # On-demand custom quote request portal
│   │   ├── Index.tsx                   # Storefront homepage & product discovery
│   │   ├── NotFound.tsx                # 404 error page
│   │   ├── Orders.tsx                  # Customer order history & instant code delivery
│   │   ├── Payment.tsx                 # bKash payment portal (TrxID regex validated)
│   │   ├── Privacy.tsx                 # Privacy Policy (OAuth consent compliance)
│   │   ├── ProductDetail.tsx           # Product detail page & UID data collection
│   │   └── Terms.tsx                   # Terms of Service (OAuth consent compliance)
│   ├── App.tsx                         # Route hierarchy, query client & error boundary
│   └── main.tsx                        # React client entry point
├── supabase/migrations/                # Versioned SQL migrations (RLS, views, RPCs)
├── package.json
├── tailwind.config.ts
└── vite.config.ts                      # Port 3000, path aliases, vendor chunking
```

---

## 🔄 End-to-End Order & Delivery Flow

```
[ Customer Storefront ]
        │
        ▼ (Selects Product & enters Player ID / Server if Top-up)
[ Cart & Checkout ]
        │
        ▼ (bKash — primary payment method)
[ Payment Portal (/payment) ]
        │  TrxID validated: /^[A-Z0-9]{6,30}$/i
        ▼ (Submits validated Transaction ID)
[ Order Status: payment_submitted ]
        │
        ▼
[ Admin Dashboard (/admin) ]
        │
        ├─► Merchant checks bKash statement → clicks "Validate" (Status: payment_verified)
        │
        ▼
[ Fulfillment Execution ]
        ├─► Automated Key Assigned (instant_code with SKIP LOCKED)
        │    OR
        └─► Merchant pastes code/credentials (fulfill_order RPC)
        │
        ▼ (Status: fulfilled)
┌────────────────────────────────────────────────────────┐
│  - Code displayed on Customer /orders page             │
│  - AI-generated delivery email sent via Resend API     │
│    (Authorization: Bearer <session JWT>)               │
│  - Margin logged & financial analytics updated         │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture & Key Views

### Core Relational Tables
* **`products`**: Catalog items (`title`, `sale_price`, `cost_price`, `category`, `platform`, `region`, `delivery_type`, `in_stock`, `is_active`).
* **`inventory_keys`**: Digital keys (`pin_code`, `serial_number`, `status: available | sold | expired`).
* **`orders`**: Customer transactions (`user_id`, `product_id`, `total`, `status`, `customer_input`).
* **`deliveries`**: Fulfillment records (`order_id`, `delivery_code`, `cost_paid`, `sourced_from`, `notes`).
* **`custom_orders`**: On-demand requests (`name`, `email`, `product_name`, `platform`, `details`, `status`).
* **`user_roles`**: RBAC (`role: admin | user`).
* **`audit_logs` & `admin_action_logs`**: Tamper-proof audit trails.

### Real-Time Financial Views
* **`v_revenue_today`**: Aggregated gross sales for the current calendar day.
* **`v_orders_today`**: Count of successfully completed orders today.
* **`v_profit_today`**: Net margin — $\text{Total Sale} - \text{Total Cost}$.
* **`v_pending_action_count`**: Orders awaiting verification or fulfillment.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** `v18.0.0+`
* **npm** `v9.0.0+`
* **Supabase Project** (PostgreSQL 15+)

### Environment Configuration
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_XAI_API_KEY=your-xai-grok-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # seed & maintenance scripts only
```

### Installation & Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npx tsc --noEmit     # TypeScript type verification
npm run test         # Run unit tests
npm run build        # Build optimized production bundle
```

---

## 🧰 Catalog Scripts & Automation Toolchain

RetroHub features an automated Node.js toolchain located in [`scripts/`](scripts/README.md):

```bash
# Seed curated digital gift cards (Apple, Steam, PlayStation, Xbox, Nintendo, Roblox, Blizzard)
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

See **[scripts/README.md](scripts/README.md)** for full documentation.

---

## 📚 Documentation
* **[Platform & Merchant System Specification](docs/MERCHANT_SYSTEM_OVERVIEW.md)**: Exhaustive reference covering all website features, category taxonomy, payment handling, admin operations, and merchant standard operating procedures.
* **[Tooling & Scripts Manual](scripts/README.md)**: Developer documentation for seeding, maintenance, database migration, and pricing sync tools.

---

## 📄 License
Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.  
© 2026 RETROHUB — Engineered by **Abir Hossain**.
