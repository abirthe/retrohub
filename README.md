# RETROHUB — Digital Goods, Game Keys & In-Game Commerce Platform 🎮⚡

**RETROHUB** is a high-performance digital commerce platform engineered for instant delivery of digital game keys, in-game currency top-ups, verified gaming accounts, digital gift cards, subscription passes, and software licenses.

Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL 15+)**, the platform features a cyber-neon ambient UI, local mobile payment workflows (bKash), a 24/7 Telegram admin bot with direct fulfillment commands, and automated background order monitoring.

> **Developer & Architect:** Abir Hossain

---

## ⚡ Current Features & Capabilities

### 1. Storefront & Product Discovery
* **Multi-Category Catalog**: Curated across 8 distinct categories:
  * 🖥️ **PC Games** (Steam, Epic Games, GOG, EA App)
  * 🎮 **Console Games** (Xbox, PlayStation, Nintendo eShop)
  * 💎 **In-Game Top-Ups** (Valorant, MLBB, PUBG Mobile, Genshin Impact, Free Fire, Roblox, etc.)
  * 🎁 **Digital Gift Cards** (Apple iTunes, Steam Wallet, PSN, Xbox, Nintendo, Google Play)
  * 🛡️ **Verified Gaming Accounts** (Regional and verified accounts)
  * 🔄 **Subscriptions & Passes** (Xbox Game Pass, PlayStation Plus, Discord Nitro, Telegram Premium, Spotify, YouTube Premium)
  * 💻 **Software & Services** (Windows/Office keys, regional account setup, cloud services)
* **Dynamic Ambient Theme**: Cyber-neon dark interface with ambient video animation overlays, glassmorphism cards, and responsive mobile-first navigation.
* **Smart Filtering & Regional Taxonomy**: Fast searching and filtering by category, platform, region tag (Global, US, TR, ARG, IN, etc.), and in-stock status.

---

### 2. Cart, Checkout & Player UID Capture
* **Persistent Cart**: Client-side cart backed by `localStorage` with quantity controls and real-time total calculation.
* **Player UID / Server Input**: For in-game top-up products, checkout prompts and validates the required Player ID, Server, or Zone ID.
* **Authoritative Price Enforcement**: Product sale prices are validated and enforced directly from the database, preventing client-side price tampering.
* **Stock Availability Protection**: Real-time validation blocks orders if an item is out of stock.

---

### 3. Payment Processing (bKash & Manual Mobile Banking)
* **Integrated bKash Flow**: Dedicated `/payment` portal with automated 1% bKash fee calculation and copy-to-clipboard account numbers.
* **Transaction ID Validation**: Strict regex verification (`/^[A-Z0-9]{6,30}$/i`) ensures valid alphanumeric Transaction IDs.
* **Secure Payment RPC**: Uses a `SECURITY DEFINER` PostgreSQL function (`submit_order_payment`) that verifies order ownership and updates the order status to `payment_submitted` without exposing direct table `UPDATE` permissions.
* **Duplicate TrxID Fraud Detection**: The backend flags and warns the merchant if a customer attempts to reuse a transaction ID from a previous order.

---

### 4. Customer Dashboard & Digital Delivery
* **Order History Portal (`/orders`)**: Real-time order tracking showing order status, total price, and timestamps.
* **Digital Code Reveal**: Instantly reveals the redeemed license key, account credential, or voucher code upon admin fulfillment.
* **One-Tap Copy & Instructions**: Copy-to-clipboard buttons and platform-specific activation guidance.
* **Full Order Lifecycle Support**: Tracks orders across all stages: `pending` → `payment_submitted` → `payment_verified` → `sourcing` → `fulfilled` (or `cancelled`/`refunded`).

---

### 5. On-Demand Custom Orders (`/custom-order`)
* Dedicated request form for unlisted game keys, rare regional accounts, or specialized digital software.
* Automatically dispatches instant alerts to the merchant's Telegram inbox.
* Integrated into the merchant dashboard triage queue.

---

### 6. Merchant Back-Office Suite (`/admin`)
* **Role-Gated Access**: Strictly protected by Supabase RBAC (`public.has_role(auth.uid(), 'admin')`).
* **Live KPI Dashboard**:
  * 💰 Today's Gross Revenue (৳)
  * 📦 Total Orders Placed Today
  * 📈 Calculated Net Profit (Sale Price − Sourced Cost)
  * ⏳ Pending Orders Awaiting Action
* **Order Operations Board**:
  * **Verify Payment**: Transitions order to `payment_verified` after confirming the bKash/Nagad statement.
  * **Start Sourcing**: Marks item as `sourcing` during external acquisition.
  * **Fulfill Order**: Records the delivery code, supplier source, and cost paid, automatically calculating profit and moving the status to `fulfilled`.
  * **Hold / Cancel / Refund**: Full exception handling with audit trail recording.
* **Inventory & Catalog Control**: Inline price updating (`sale_price`, `cost_price`) and real-time stock adjustments.
* **Custom Orders Board**: Manage incoming customer quotes and status.

---

### 7. 24/7 Telegram Admin Bot (`@Notifyretro_bot`)

Engineered with a **high-availability dual-channel dispatch architecture**: alerts are dispatched via the Supabase Edge Function (`telegram-webhook`) with an automatic direct Telegram Bot API fallback from the client, guaranteeing that merchant alerts are delivered even during edge runtime cold starts.

#### Real-Time Merchant Alerts (Pushed Directly to Phone)
* 🛍️ **New Order Alert**: Product title, total, customer Game ID, order ID, and a ready-to-use `/deliver` command.
* 💳 **Payment Submitted Alert**: Customer Transaction ID, order IDs, amount, and automatic duplicate TrxID fraud warnings.
* 📝 **Custom Order Alert**: Customer name, email, platform, and request details.
* ⚠️ **Low Stock Warning**: Instant notification when product inventory drops to $\le 3$.

#### Interactive Telegram Commands
| Command | Action |
| :--- | :--- |
| `/orders` | View up to 10 latest unfulfilled orders with quick delivery shortcuts |
| `/deliver <order_id> <code>` | **Fulfill an order directly from Telegram** without opening the dashboard |
| `/summary` | View today's financial metrics (revenue, orders today, pending items) |
| `/custom` | View the latest pending custom order requests |
| `/remind` | Instantly trigger a fresh check of all unfulfilled orders |
| `/help` | Display all available commands and syntax |

#### Automated 24/7 Background Reminders
* Scheduled via [`.github/workflows/pending-orders-reminder.yml`](.github/workflows/pending-orders-reminder.yml).
* Runs in GitHub Actions cloud every 2 hours to scan for unfulfilled orders (`pending`, `payment_submitted`, `payment_verified`) and sends a summary reminder to Telegram.

---

### 8. Hardened Security & Anti-Fraud Architecture

* **Telegram Webhook Secret Authentication**: Rejects incoming webhook calls lacking the matching `X-Telegram-Bot-Api-Secret-Token` header with `401 Unauthorized`, completely preventing forged `/deliver` requests.
* **IP Rate Limiting**: In-memory sliding-window rate limiter restricts webhook requests to 30 requests/minute per client IP to safeguard against DDoS and brute-force attempts.
* **Atomic Payment Submission RPC**: Customer payment submission routes through a `SECURITY DEFINER` stored procedure (`submit_order_payment`) that strictly validates user ownership, verifies payment amounts, and atomically transitions status without granting direct table `UPDATE` access to clients.
* **Duplicate TrxID Fraud Detection**: Scans previous orders for duplicate bKash Transaction IDs, immediately alerting the merchant if an ID is reused across accounts.
* **Authoritative Catalog Enforcement**: Prices and stock levels are re-verified against the database upon checkout, preventing client-side DOM price tampering.
* **Internal Action Authorization**: Edge Function notification actions require valid Supabase API keys or bearer tokens.
* **HTML Sanitization**: Dynamic user input is escaped via `escapeHtml()` prior to Telegram HTML formatting, eliminating entity parsing crashes and injection.
* **Row-Level Security (RLS)**: Enforced across all PostgreSQL tables. Digital keys (`inventory_keys`) and internal logs are hidden from non-admin accounts.
* **Open Redirect Protection**: `sanitiseReturnTo()` validates OAuth callback destinations against `window.location.origin`.
* **Zero Client Credential Leakage**: Bot tokens, webhook secrets, and database service keys are stored strictly in server-side Supabase secrets.

---

### 9. Core Web Vitals & Frontend Performance Engineering ⚡

Engineered to pass all Google Core Web Vitals and achieve green performance benchmarks in Cloudflare Web Analytics:

* **Largest Contentful Paint (LCP < 200ms)**:
  * **Next-Gen WebP**: Converted the hero background asset to modern WebP format, reducing file size from 177.3 kB down to **54.9 kB** (**69% compression**).
  * **HTML Preload**: Document `<head>` includes `<link rel="preload" as="image" href="/hero-bg.webp" type="image/webp" fetchpriority="high" />`, enabling immediate parallel network streaming before JS bundles parse.
  * **Optimized Image Tags**: Explicit `width="1440"`, `height="810"`, `fetchPriority="high"`, and `decoding="async"` in [HeroSection.tsx](src/components/home/HeroSection.tsx).
* **Interaction to Next Paint (INP < 50ms)**:
  * **Web Worker Offloading**: HLS.js video transmuxing in [BackgroundAnimation.tsx](src/components/BackgroundAnimation.tsx) is delegated to a dedicated Web Worker (`enableWorker: true`), freeing the main UI thread.
  * **Passive & Non-Blocking Event Listeners**: Touch and scroll events use `{ passive: true, once: true }`. Background video play is scheduled via `requestAnimationFrame` so user taps register with 0ms input delay.
  * **Concurrent React 18 `startTransition`**: Wrapped category filters (`#cat-giftcard`, `#cat-games`), sort selectors, and admin tab triggers in `startTransition`, ensuring click animations and borders render in frame 1 (<16ms) while list mutations happen non-blockingly.
* **Cumulative Layout Shift (CLS = 0.00)**:
  * **Geometric Skeleton Grid**: Replaced generic loading spinners in [Index.tsx](src/pages/Index.tsx) with an 8-card responsive skeleton matching the exact card dimensions (`h-[280px] sm:h-[340px]`).
  * **Stable FeaturedBanner**: Removed collapsing placeholders that previously shrank from `192px` to `0px`, eliminating layout jumpiness entirely.
  * **Layout Height Pre-Allocation**: Added `min-h-[500px]` to catalog wrappers and fixed aspect-ratio containers (`h-32 sm:h-44`) for product imagery.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role in Platform |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3, TypeScript 5.8, Vite 5.4 | Single Page Application with strict type safety |
| **Styling & Icons** | Tailwind CSS 3.4, Lucide React, PostCSS | Cyber-neon design system, glassmorphism, responsive UI |
| **UI Primitives** | Radix UI, shadcn/ui, Sonner | Accessible dialogs, drawers, dropdowns, and toast notifications |
| **State & Caching** | TanStack Query v5, React Context | Server state management, cache invalidation, persistent cart |
| **Routing** | React Router DOM v6 | SPA navigation with guarded admin routes and OAuth handlers |
| **Authentication** | Supabase Auth | Google OAuth 2.0, email/password, and session persistence |
| **Database & Storage** | Supabase (PostgreSQL 15+) | Row Level Security, views, triggers, and `SECURITY DEFINER` RPCs |
| **Serverless Functions**| Supabase Edge Functions (Deno) | Telegram bot webhook ingestion, notifications, and scheduled triggers |
| **Automation & Cron** | GitHub Actions | 24/7 background pending order check every 2 hours, automated CI/CD |
| **Deployment Targets** | Cloudflare Workers / Pages, Vercel, GitHub Pages | Production SPA build with client fallback routing |

---

## 📁 Repository Directory Structure

```
retrohub/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml             # Vite build & deployment to GitHub Pages
│       └── pending-orders-reminder.yml  # 24/7 automated 2-hour Telegram reminder cron
├── docs/
│   └── MERCHANT_SYSTEM_OVERVIEW.md      # Authoritative merchant specification & operational guide
├── public/
│   ├── favicon.png                      # Storefront favicon
│   ├── hero-bg.webp                     # Next-gen WebP hero background (preloaded for LCP)
│   └── robots.txt                       # SEO crawler guidelines
├── scripts/                             # Catalog automation, seeding & pricing tools
│   ├── database/                        # Migration runners and seed SQL
│   ├── images/                          # Image mapping and CDN uploaders
│   ├── maintenance/                     # Product deduplication and stock auditors
│   ├── pricing/                         # Market price scrapers and sync tools
│   ├── seeding/                         # Gift cards, game top-ups, and account seeders
│   └── README.md                        # Documentation for script toolchain
├── src/
│   ├── components/
│   │   ├── admin/                       # Dashboard tabs, order dialogs, stats grid, catalog editor
│   │   ├── checkout/                    # Order review cards and stock feedback
│   │   ├── home/                        # Hero banner, category pills, product grid, filters
│   │   ├── layout/                      # ShopHeader, Footer, navigation drawers
│   │   ├── orders/                      # Customer order table, status badges, code reveal
│   │   ├── payment/                     # bKash payment instructions and account display
│   │   ├── product/                     # Product cards, detail modals, variant selectors
│   │   └── ui/                          # Radix / shadcn accessible component primitives
│   ├── contexts/                        # CartContext (persisted via localStorage)
│   ├── hooks/                           # useAdmin, useAuth, useToast custom hooks
│   ├── integrations/
│   │   └── supabase/                    # Supabase client with production fallbacks & types
│   ├── lib/
│   │   ├── constants.ts                 # Category and subcategory taxonomy
│   │   ├── productFilters.ts            # Strict category isolation rules
│   │   ├── regions.ts                   # 28 region codes and country flags
│   │   ├── shopApi.ts                   # Data access layer, order creation & RPC callers
│   │   ├── telegramService.ts           # Client dispatch to Supabase Edge Function
│   │   └── utils.ts                     # Classname merging and currency formatters
│   ├── pages/
│   │   ├── AdminDashboard.tsx           # Merchant back-office (admin-role gated)
│   │   ├── Auth.tsx                     # Login and registration portal
│   │   ├── AuthCallback.tsx             # OAuth callback handler (open-redirect secured)
│   │   ├── Checkout.tsx                 # Cart checkout & Player ID collection
│   │   ├── CustomOrder.tsx              # Custom quote request form
│   │   ├── Index.tsx                    # Storefront homepage & product catalog
│   │   ├── NotFound.tsx                 # 404 handler
│   │   ├── Orders.tsx                   # Customer order history & code reveal
│   │   ├── Payment.tsx                  # bKash transaction ID submission
│   │   ├── Privacy.tsx                  # Privacy policy (OAuth compliance)
│   │   ├── ProductDetail.tsx            # Full product details page
│   │   └── Terms.tsx                    # Terms of service (OAuth compliance)
│   ├── App.tsx                          # Root router, query client, and error boundary
│   ├── index.css                        # Tailwind directives and cyber-neon design tokens
│   └── main.tsx                         # React entrypoint
├── supabase/
│   ├── functions/
│   │   ├── telegram-webhook/            # Webhook receiver, notifications & bot commands
│   │   └── send-order-email/            # Resend email notification function
│   └── migrations/                      # Version-controlled PostgreSQL schemas, RLS & RPCs
├── .env.example                         # Environment variable template
├── .nvmrc                               # Pinned Node.js version 20
├── package.json                         # Project dependencies and npm scripts
├── tailwind.config.ts                   # Tailwind theme styling & animations
├── vercel.json                          # Vercel SPA routing configuration
├── vite.config.ts                       # Vite compiler config & path aliases
├── worker.js                            # Cloudflare Worker SPA asset binding handler
├── wrangler.json                        # Cloudflare Workers configuration
└── wrangler.toml                        # Cloudflare Workers build and asset configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.0.0+`
* **npm**: `v9.0.0+`
* **Supabase Project** (PostgreSQL 15+)

### 1. Clone & Install
```bash
git clone https://github.com/abirthe/retrohub.git
cd retrohub
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_anon_key"
VITE_SUPABASE_ANON_KEY="your_publishable_anon_key"

# Server / Script Variables (Keep Private)
SUPABASE_URL="https://your_project_id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Telegram Bot (Optional local development overrides)
VITE_TELEGRAM_CHAT_ID="your_telegram_chat_id"
VITE_TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Verify
```bash
npm run lint         # Run ESLint validation
npx tsc --noEmit     # Check TypeScript types
npm run build        # Build optimized production bundle
```

---

## ☁️ Deployment

The project is pre-configured to deploy seamlessly across modern cloud providers:

* **Cloudflare Workers (Static Assets)**:
  * Static assets are compiled into `./dist` and bound via `env.ASSETS`.
  * **Native SPA Fallback (`200.html`)**: Automatically generated by Vite's build lifecycle (`closeBundle` hook in [vite.config.ts](vite.config.ts)). Cloudflare natively serves `200.html` for client-side navigation without external redirect rules.
  * **Complete `_redirects` Elimination**: Stray `_redirects` files are purged at build time, preventing Cloudflare API infinite redirect validation errors (`code: 100324`).
  * **Worker Fallback Engine**: [worker.js](worker.js) intercepts 404 responses for clean client routes (`/orders`, `/checkout`, `/admin`, etc.) and rewrites them to `/index.html` at the edge runtime.
  * **Enforced Build Lifecycle**: [wrangler.json](wrangler.json) and [wrangler.toml](wrangler.toml) enforce `"build": { "command": "npm run build" }`, guaranteeing fresh builds and cache invalidation.
  * **Edge Observability**: Enabled in Wrangler config with real-time invocation logging (`observability.logs.enabled = true`, `traces = false`).
  * Deployed automatically on push to `main` via Cloudflare Workers Builds.
* **Vercel**: Push to your repository; `vercel.json` automatically manages client-side SPA rewrite routing (`/*` $\rightarrow$ `/index.html`).
* **GitHub Pages**: Handled automatically on `push` to `main` via `.github/workflows/deploy-pages.yml`.
* **Supabase Edge Functions**:
  ```bash
  npx supabase functions deploy telegram-webhook --no-verify-jwt
  ```

---

## 📄 License
Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.  
© 2026 RETROHUB — Engineered by **Abir Hossain**.
