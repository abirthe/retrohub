# RETROHUB — Digital Goods, Game Keys & In-Game Commerce Platform 🎮⚡

**RETROHUB** is a high-performance digital commerce platform engineered for instant delivery of digital game keys, in-game currency top-ups, verified gaming accounts, digital gift cards, subscription passes, and software licenses.

Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL 15+)**, the platform features a cyber-neon ambient UI, local mobile payment workflows (bKash), a 24/7 Telegram admin bot with interactive inline buttons and direct mobile fulfillment commands, edge-native Cloudflare Worker asset routing with DDoS rate limiting, and automated background order monitoring.

> **Developer & Architect:** Abir Hossain  
> **Repository:** [https://github.com/abirthe/retrohub.git](https://github.com/abirthe/retrohub.git)  
> **Release Branches:** `main` (Production), `Production` (Cloudflare), `Dev` (Development)

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
* **Frictionless Guest Cart Review**: Unauthenticated guests can view their cart, modify quantities, remove items, input game UIDs, and calculate totals without full-page login barriers.
* **Contextual Authentication State**: Shows an ambient guest notification badge and changes the primary action button to `"Sign In to Complete Order"` (with safe return redirection back to `/checkout`), while logged-in users smoothly transition directly to `"Proceed to Payment"` with zero clutter.
* **Player UID / Server Input**: For in-game top-up products, checkout prompts and validates the required Player ID, Server, or Zone ID.
* **Authoritative Price Enforcement**: Product sale prices are validated and enforced directly from the database on every `createOrder` call, preventing client-side price tampering.
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
  * **Fulfill Order**: Records the delivery code, supplier source, and cost paid, automatically calculating profit and moving the status to `fulfilled`.
  * **Hold / Cancel / Refund**: Full exception handling with audit trail recording in `admin_action_logs`.
* **Inventory & Catalog Control**: Inline price updating (`sale_price`, `cost_price`) and real-time stock adjustments.
* **Custom Orders Board**: Manage incoming customer quotes and status.

---

### 7. 24/7 Telegram Admin Bot (`@Notifyretro_bot`)

Engineered with a **high-availability dual-channel dispatch architecture**: alerts are dispatched via the Supabase Edge Function (`telegram-webhook`) with an automatic direct Telegram Bot API fallback from the client, guaranteeing that merchant alerts are delivered even during edge runtime cold starts.

#### Real-Time Merchant Alerts (Pushed Directly to Phone)
* 🛍️ **New Order Alert**: Product title, total, customer Game ID, order ID, and interactive inline buttons.
* 💳 **Payment Submitted Alert**: Customer Transaction ID, order IDs, amount, and automatic duplicate TrxID fraud warnings.
* 📝 **Custom Order Alert**: Customer name, email, platform, and request details.
* ⚠️ **Low Stock Warning**: Instant notification when product inventory drops to ≤ 3.

#### Interactive Telegram Commands & Inline Keyboards
The bot has all 12 operational commands registered via Telegram's `setMyCommands` API, complete with `callback_query` webhook support for touch-friendly mobile fulfillment:

| Command | Action & Syntax | Description |
| :--- | :--- | :--- |
| **[Inline Button]** | Touch buttons | Instantly **Cancel** or **Verify** orders directly from push notifications without typing commands |
| `/orders` | `/orders` | View up to 10 latest unfulfilled orders with quick action shortcuts |
| `/order <id>` | `/order <order_id>` | **Inspect full order details** (Player UID, Server, TrxID, timestamps, status) |
| `/inspect <id>` | `/inspect <order_id>` | Alias for `/order` with full order inspection card and quick action shortcuts |
| `/verify <id>` | `/verify <order_id>` | **Verify customer payment** directly from chat (`status = 'payment_verified'`) |
| `/deliver <id> <code>` | `/deliver <order_id> <code>` | **Fulfill an order** with digital key or account credentials |
| `/cancel <id> [reason]` | `/cancel <order_id> [reason]` | **Cancel an order** from phone, release reserved inventory keys, and log reason |
| `/hold <id> [reason]` | `/hold <order_id> [reason]` | Place order on hold (e.g. incorrect server or player UID) |
| `/refund <id> [reason]` | `/refund <order_id> [reason]` | Mark order as refunded (`status = 'refunded'`) |
| `/summary` | `/summary` | View today's financial metrics (gross revenue, net profit, orders, pending items) |
| `/stock [search]` | `/stock [search_query]` | Check current inventory health or search specific product stock |
| `/custom` | `/custom` | View the latest pending custom order requests |
| `/remind` | `/remind` | Instantly trigger a fresh scan of all unfulfilled orders |
| `/help` | `/help` | Display interactive command cheat sheet and operational syntax |

> 💡 **Short ID Support**: All order commands accept short prefixes (first 6–8 characters, e.g. `/verify 8f4b12` or `/deliver 8f4b12 RA-9921`) in addition to full 36-character UUIDs for friction-free mobile operation.

#### Automated 24/7 Background Reminders
* Scheduled via [`.github/workflows/pending-orders-reminder.yml`](.github/workflows/pending-orders-reminder.yml).
* Runs in GitHub Actions cloud every 2 hours to scan for unfulfilled orders (`pending`, `payment_submitted`, `payment_verified`) and sends a summary reminder to Telegram.

---

### 8. 24/7 AI Customer Support Bot (`@retrochanbot` / `customer-bot`)

A dedicated customer-facing Telegram support agent powered by **xAI Grok** and deployed as a Supabase Edge Function (`customer-bot`). It handles customer inquiries, real-time order status lookups, bKash payment walkthroughs, and automated troubleshooting with high emotional intelligence and gaming fluency.

```
┌─────────────────────────────────────────────────────────────┐
│                 RETRO CHAN (@retrochanbot)                  │
├─────────────────────────────────────────────────────────────┤
│  ⚡ "Hey! I'm Retro Chan, your Retro Hub Support AI!"        │
│                                                             │
│  [ 📦 Check Order Status ]      [ 💳 bKash Payment Guide ]  │
│  [ ❓ Top-Up FAQ ]              [ 👨‍💼 Contact Merchant ]    │
└─────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Architecture
* **Intelligent Conversational Agent (xAI Grok)**: Powered by `grok-beta` / xAI chat completions API. Understands natural language queries, explains regional key activation, clarifies server UID requirements, and answers buyer questions contextually.
* **Instant Order Tracking**: Customers can check any order by sending their 6–8 character short ID, full 36-character UUID, or account email. The bot fetches order status, items, amounts, verification stage, and revealed digital keys instantly.
* **Interactive bKash Payment Guidance**: Explains exact steps for personal and merchant wallet transfers, details the 1.0% bKash transaction charge calculation, and reminds buyers where to find and copy their TrxID.
* **Multi-Turn Session Tracking**: Persists conversation history and customer context in the PostgreSQL `customer_support_sessions` table, enabling natural back-and-forth dialogue without losing context.
* **Graceful Degradation**: If AI API quotas or network latencies occur, the bot seamlessly falls back to interactive Telegram inline keyboard menus, ensuring 100% uptime.

---

### 9. Hardened Security & Anti-Fraud Architecture

* **Role-Gated Bot Commands**: Edge function verifies incoming Telegram chat IDs against `ADMIN_CHAT_ID`, rejecting unauthorized attempts with a `401/403` guard.
* **Edge Rate Limiting**: Cloudflare Worker binding (`RATE_LIMITER`) throttles aggressive scrapers and DDoS bots by client IP (150 req / 60 sec) directly at Cloudflare's edge before hitting Supabase.
* **Per-User Cart Isolation**: Carts are scoped per user session (`cart_${userId}` for authenticated users, `cart_guest` for visitors), preventing cross-account cart pollution when switching logins.
* **Atomic Payment Submission RPC**: Customer payment submission routes through a `SECURITY DEFINER` stored procedure (`submit_order_payment`) that strictly validates user ownership, verifies payment amounts, and atomically transitions status without granting direct table `UPDATE` access to clients.
* **Duplicate TrxID Fraud Detection**: Scans previous orders for duplicate bKash Transaction IDs, immediately alerting the merchant if an ID is reused across accounts.
* **Authoritative Catalog Enforcement**: Prices and stock levels are re-verified against the database upon every `createOrder` call in [`src/lib/orderApi.ts`](src/lib/orderApi.ts), preventing client-side DOM price tampering.
* **HTML Sanitization**: Dynamic user input is escaped via `escapeHtml()` prior to Telegram HTML formatting, eliminating entity parsing crashes and injection attacks.
* **Row-Level Security (RLS)**: Enforced across all PostgreSQL tables. Digital keys (`inventory_keys`), support sessions, and internal logs are hidden from non-admin accounts.
* **Zero Client Credential Leakage**: Bot tokens, webhook secrets, and database service keys are stored strictly in server-side Supabase secrets and Cloudflare encrypted variables.
* **Comprehensive `.gitignore` Hardening**: Blocks accidental commits of `.env`, `supabase/.env`, `.wrangler/`, `.dev.vars`, `.npmrc`, keystores, build caches, and all catalog data files (`*.xlsx`, `*.ods`, `*.csv`).
* **Open Redirect Prevention**: `AuthCallback.tsx` validates the `returnTo` param against the current origin before redirecting, blocking external redirect abuse.

---

### 10. Universal Cross-Device Animated Engine & Core Web Vitals ⚡

Engineered to pass all Google Core Web Vitals and provide a unified cyber-neon atmosphere across desktop, tablet, and mobile devices:

* **Universal Cross-Device Background Video Engine**:
  * **HLS.js MSE with Web Worker Offloading**: Delegates video transmuxing to a dedicated Web Worker (`enableWorker: true`), leaving 100% of the UI thread free for input handling.
  * **Universal Mobile Playback with Gesture Recovery**: Native HLS playback on iOS/Safari and MSE HLS on Android/Desktop with `playsinline`, `muted`, and silent loop. If browser power-saver or strict autoplay policy defers playback, a global passive gesture listener smoothly recovers playback on the first touch or scroll.
  * **Hardware-Accelerated Layering**: Replaced heavy CPU filters with GPU-accelerated CSS radial and linear gradient overlays.
  * **Ambient Controls**: Integrated ambient animation toggle in the navigation header, allowing users to customize background intensity.
* **Largest Contentful Paint (LCP < 300ms)**:
  * **Zero-Blocking Architecture**: Replaced decorative background image element in [HeroSection.tsx](src/components/home/HeroSection.tsx) with GPU-accelerated CSS radial and linear gradient overlays.
  * **Instant DOM Text LCP**: Eliminates 8.4s network image decode bottlenecks identified in Cloudflare Web Analytics, allowing the viewport's primary `<h1>` heading to paint instantaneously without waiting for network assets.
  * **Network Bandwidth Optimization**: Eliminated 55 KB of critical head preload bandwidth from `index.html`, prioritizing viewport JavaScript chunks and fonts.
* **Interaction to Next Paint (INP < 50ms)**:
  * **Vite Chunk Splitting**: `vite.config.ts` splits vendor libraries into 8 isolated bundles (`vendor-react`, `vendor-ui`, `vendor-supabase`, `vendor-tanstack`, `vendor-charts`, `vendor-forms`, `vendor-carousel`, `vendor-video`), cutting initial JS parse times drastically.
  * **Touch Responsiveness**: Added `touch-action: manipulation` across all interactive elements, eliminating the 300ms mobile tap delay.
  * **Concurrent React 18 `startTransition`**: Wrapped category filters, sort selectors, and admin tab triggers in `startTransition`, ensuring click animations and borders render in frame 1 (<16ms) while list mutations happen non-blockingly.
* **Cumulative Layout Shift (CLS = 0.00)**:
  * **Geometric Skeleton Grid**: Replaced generic loading spinners in [Index.tsx](src/pages/Index.tsx) with an 8-card responsive skeleton matching the exact card dimensions.
  * **Layout Height Pre-Allocation**: Fixed aspect-ratio containers and `min-h` wrappers on catalog sections.

---

## 🛠️ Technology Stack

| Layer | Technologies | Role in Platform |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3, TypeScript 5.8, Vite 5.4 | Single Page Application with strict type safety |
| **Styling & Icons** | Tailwind CSS 3.4, Lucide React, PostCSS | Cyber-neon design system, glassmorphism, responsive UI |
| **UI Primitives** | Radix UI, shadcn/ui, Sonner | Accessible dialogs, drawers, dropdowns, and toast notifications |
| **State & Caching** | TanStack Query v5, React Context | Server state management, cache invalidation, isolated user carts |
| **Routing** | React Router DOM v6 | SPA navigation with guarded admin routes and OAuth handlers |
| **Authentication** | Supabase Auth (Google OAuth 2.0) | One-click Google login, session persistence, open-redirect protection |
| **Database & Storage** | Supabase (PostgreSQL 15+) | 29 versioned migrations, RLS, views, triggers, and `SECURITY DEFINER` RPCs |
| **Serverless Functions** | Supabase Edge Functions (Deno) | Telegram Admin Bot, AI Customer Support Bot (xAI Grok), Email dispatch |
| **Edge Router & Security** | Cloudflare Workers (`worker.js`) | Global static asset serving, SPA 404 rewrite, and edge IP rate limiting |
| **Automation & Cron** | GitHub Actions | 24/7 background pending order check every 2 hours, automated CI/CD |
| **Testing** | Vitest 3.2, Testing Library | 27 unit tests across 3 test suites for payment, cart, routing, and security |
| **Deployment Targets** | Cloudflare Workers, Vercel, GitHub Pages | Production SPA build with client fallback routing |

---

## 📁 Repository Structure

```
retrohub/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml              # Vite build & deployment to GitHub Pages
│       └── pending-orders-reminder.yml   # 24/7 automated 2-hour Telegram reminder cron
├── docs/
│   └── MERCHANT_SYSTEM_OVERVIEW.md       # Authoritative merchant specification & operational guide
├── public/
│   ├── .assetsignore                     # Directs Wrangler to exclude redirect rules during upload
│   ├── favicon.png                       # Storefront favicon
│   ├── hero-bg.webp                      # Next-gen WebP fallback asset
│   └── robots.txt                        # SEO crawler guidelines
├── scripts/                              # Catalog automation, seeding & pricing tools
│   ├── database/                         # Migration runner & compiled SQL seeds
│   ├── images/                           # Image mapping, watermark removal & box art sourcing
│   ├── maintenance/                      # Deduplication, stock audit & orphan cleanup
│   ├── pricing/                          # Market scraper & margin sync
│   ├── seeding/                          # Gift cards, game top-ups, accounts & sub seeders
│   └── README_SCRIPT.md                  # Full script toolchain documentation
├── src/
│   ├── components/
│   │   ├── admin/                        # Dashboard tabs, order dialogs, stats grid, catalog editor
│   │   ├── checkout/                     # Order review cards and stock feedback
│   │   ├── home/                         # Hero banner, category pills, product grid, filters
│   │   ├── layout/                       # ShopHeader, Footer, navigation drawers, ambient controls
│   │   ├── orders/                       # Customer order table, status badges, code reveal
│   │   ├── payment/                      # bKash payment instructions and account display
│   │   ├── product/                      # Product cards, detail modals, variant selectors
│   │   └── ui/                           # Radix / shadcn accessible component primitives
│   ├── contexts/                         # CartContext (persisted & isolated per user session)
│   ├── hooks/                            # useAdmin, useAuth, useMobile, useToast
│   ├── integrations/
│   │   └── supabase/                     # Supabase client with production fallbacks & types
│   ├── lib/
│   │   ├── types.ts                      # Centralized DB type aliases & shared interfaces
│   │   ├── productApi.ts                 # Product catalog CRUD, storefront fetch, featured banner
│   │   ├── orderApi.ts                   # Order creation, admin state transitions, KPI stats
│   │   ├── paymentApi.ts                 # bKash TrxID submission with RPC + fallback
│   │   ├── customOrderApi.ts             # Custom quote submission & admin management
│   │   ├── authApi.ts                    # Admin role check (has_role RPC)
│   │   ├── shopApi.ts                    # Backwards-compatible barrel re-export
│   │   ├── constants.ts                  # Category and subcategory taxonomy
│   │   ├── productFilters.ts             # Strict category isolation query builder
│   │   ├── regions.ts                    # 28 region codes and country flags
│   │   ├── telegramService.ts            # Client dispatch to Supabase Edge Function
│   │   ├── emailService.ts               # Order confirmation email via Resend
│   │   ├── grokApi.ts                    # AI-powered product description helper
│   │   ├── logger.ts                     # Structured logging utility
│   │   └── utils.ts                      # Classname merging and currency formatters
│   ├── pages/
│   │   ├── AdminDashboard.tsx            # Merchant back-office (admin-role gated)
│   │   ├── Auth.tsx                      # Login and registration portal (Google OAuth 2.0)
│   │   ├── AuthCallback.tsx              # OAuth callback handler (open-redirect secured)
│   │   ├── Checkout.tsx                  # Cart checkout & Player ID collection
│   │   ├── CustomOrder.tsx               # Custom quote request form
│   │   ├── Index.tsx                     # Storefront homepage & product catalog
│   │   ├── NotFound.tsx                  # 404 handler
│   │   ├── Orders.tsx                    # Customer order history & code reveal
│   │   ├── Payment.tsx                   # bKash transaction ID submission
│   │   ├── Privacy.tsx                   # Privacy policy (OAuth compliance)
│   │   ├── ProductDetail.tsx             # Full product details page
│   │   └── Terms.tsx                     # Terms of service (OAuth compliance)
│   ├── test/
│   │   ├── setup.ts                      # Vitest global test setup
│   │   ├── cartContext.test.ts           # Cart isolation, storage persistence, and calculations
│   │   ├── example.test.ts               # Unit tests: TrxID validation, price tamper, open redirect
│   │   └── pages.test.tsx                # Page component rendering & routing tests
│   ├── App.tsx                           # Root router, query client, and error boundary
│   ├── index.css                         # Tailwind directives and cyber-neon design tokens
│   └── main.tsx                          # React entrypoint
├── supabase/
│   ├── functions/
│   │   ├── customer-bot/                 # AI Customer Support Bot (xAI Grok NLP, order tracking, FAQ)
│   │   ├── telegram-webhook/             # Merchant Admin Bot (all 12 commands & inline buttons)
│   │   └── send-order-email/             # Resend email notification edge function
│   ├── migrations/                       # 29 versioned PostgreSQL migrations (RLS, RPCs, indexes)
│   └── README.md                         # Backend & Edge Functions documentation
├── CHANGELOG.md                          # Version history (Keep a Changelog format)
├── CONTRIBUTING.md                       # Branch naming, commit style, PR checklist
├── .assetsignore                         # Root-level Cloudflare asset upload ignore rules
├── .env.example                          # Environment variable template
├── .gitignore                            # Security & cache protection (incl. catalog data files)
├── .nvmrc                                # Pinned Node.js version (22)
├── components.json                       # shadcn/ui component registry config
├── eslint.config.js                      # ESLint flat config (TypeScript + React hooks rules)
├── package.json                          # Dependencies, npm scripts & postinstall build hook
├── tailwind.config.ts                    # Tailwind theme, animations & cyber-neon tokens
├── tsconfig.json / tsconfig.app.json     # TypeScript strict config
├── vercel.json                           # Vercel SPA routing (/* → /index.html)
├── vite.config.ts                        # Vite build: 8-chunk vendor splitting, 200.html plugin
├── vitest.config.ts                      # Vitest test runner config (jsdom environment)
├── worker.js                             # Cloudflare Worker: rate limiting + SPA 404 rewrite
├── wrangler.json                         # Cloudflare Workers build & asset binding config
└── wrangler.json.example                 # Safe template for Wrangler configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v22.0.0+`
* **npm**: `v9.0.0+`
* **Supabase Project** (PostgreSQL 15+)

### 1. Clone & Install
```bash
git clone https://github.com/abirthe/retrohub.git
cd retrohub
npm install
```

### 2. Environment Configuration
Copy the template and fill in your credentials:
```bash
cp .env.example .env
cp wrangler.json.example wrangler.json
```

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_anon_key"

# Server / Script Variables (Keep Private — Never Commit)
SUPABASE_URL="https://your_project_id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
VITE_XAI_API_KEY="your_xai_api_key"

# Telegram Bots (Optional for local dev, configured in Supabase secrets in production)
VITE_TELEGRAM_CHAT_ID="your_admin_chat_id"
VITE_TELEGRAM_BOT_TOKEN="your_admin_bot_token"
CUSTOMER_BOT_TOKEN="your_customer_bot_token"

# Cloudflare Worker Bindings
CLOUD_FLARE_ASSET="ASSETS"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Validate & Build
```bash
npm run lint          # ESLint validation (0 errors)
npx tsc --noEmit      # TypeScript type check (0 errors)
npm test              # Run Vitest test suite (27 unit tests across 3 suites)
npm run build         # Production bundle compilation
```

---

## ☁️ Deployment

### Cloudflare Workers (Primary)
Static assets compiled to `./dist` are bound via `env.ASSETS` (or `env.CLOUD_FLARE_ASSET` fallback). The `worker.js` edge router handles:
- **IP Rate Limiting** (`env.RATE_LIMITER` — 150 req/60s per IP)
- **SPA Fallback** — 404 responses on extensionless paths rewritten to `/index.html`
- **Dual Binding** — `env.ASSETS || env.CLOUD_FLARE_ASSET` for local and production compatibility

Key deployment notes:
- `wrangler.json` includes explicit `"build": { "command": "npm run build" }` to prevent Vite auto-detection errors on Vite < 6.
- `vite.config.ts` post-build plugin generates `dist/200.html` (Cloudflare SPA standard) and writes `dist/.assetsignore` to block `_redirects` from uploading.
- `postinstall` hook purges stale redirect artifacts and runs `vite build` fresh — ensures clean builds even when Cloudflare runs `npm install` only.

```bash
npx wrangler deploy
```

### Vercel
Push to your repository; `vercel.json` automatically manages client-side SPA rewrites.

### GitHub Pages
Handled automatically on `push` to `main` via `.github/workflows/deploy-pages.yml` (Node 22, `npm ci`, `npm run build`).

### Supabase Edge Functions
```bash
npx supabase functions deploy telegram-webhook --no-verify-jwt
npx supabase functions deploy customer-bot --no-verify-jwt
npx supabase functions deploy send-order-email --no-verify-jwt
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit style, PR checklist, and the full project map.

---

## 📄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full version history.

---

## 📄 License
Private & Proprietary — Developed for RetroHub E-Commerce. All rights reserved.  
© 2026 RETROHUB — Engineered by **Abir Hossain**.
