# RETROHUB — Merchant System Overview & Platform Features

> **A Comprehensive Guide for Merchants, Vendors, and Platform Operators**  
> *Everything you need to know about RetroHub's digital commerce engine, automated inventory, order fulfillment, and merchant back-office.*

---

## 1. Executive Summary

**RetroHub** is an enterprise-grade digital goods e-commerce platform purpose-built for selling:
- **Instant Game Keys & Activation Codes** (Steam, Xbox, PlayStation, GOG, Epic Games)
- **Verified Full-Access Gaming Accounts** (Steam, PSN, Xbox, Minecraft, Ubisoft)
- **Digital Gift Cards & Wallet Vouchers** (Apple, Steam, PlayStation, Xbox, Nintendo, Roblox, Blizzard)
- **Gaming & Digital Subscriptions** (Xbox Game Pass, PlayStation Plus, EA Play, Discord Nitro, YouTube Premium)
- **Direct Player ID / UID Game Top-Ups** (Valorant Points, Mobile Legends, PUBG Mobile, Genshin Impact, Fortnite)
- **Digital Services & Software** (Google AI Pro, Microsoft Windows & Office lifetime activations)
- **On-Demand Custom Orders** (Custom requests for unlisted games, regional services, or software)

RetroHub removes physical shipping overhead entirely, replacing it with an automated digital delivery pipeline, real-time margin tracking, local & international payment verification, and an operator-focused admin dashboard.

---

## 2. Platform Architecture & Core Technology

| Platform Layer | Technology | Operational Benefit for Merchant |
| :--- | :--- | :--- |
| **Frontend Storefront** | React 18, TypeScript, Tailwind CSS | Ultra-fast load times, zero downtime, mobile-first responsive layout |
| **UI Design System** | Radix UI + shadcn/ui (Cyber-neon Dark Aesthetic) | High conversion rate, modern gamer-centric interface, frictionless UX |
| **State & Data Engine** | TanStack Query (React Query v5) | Real-time cache invalidation, instant catalog filtering, optimistic updates |
| **Database & Auth** | Supabase (PostgreSQL 15+) | Rock-solid relational integrity, Row-Level Security (RLS), instant backups |
| **Security & Permissions** | PostgreSQL RBAC & Stored Procedures | Admins have full operational control; customer data is cryptographically protected |
| **Email Service** | Supabase Edge Functions + Resend API | Automated order confirmation and delivery code dispatch to customer inbox |

---

## 3. Product Catalog & Category Architecture

The catalog is engineered with **strict 1-to-1 category isolation**, ensuring products never leak into incorrect filters:

### 🎮 Games (`games`)
* **Xbox Games (`games_xbox`)**: Official Xbox One & Xbox Series X|S digital codes.
* **PlayStation Games (`games_ps`)**: PlayStation 4 & PlayStation 5 PSN digital keys.
* **Steam Games (`games_steam`)**: Steam PC global and regional activation keys.
* **GOG Games (`games_gog`)**: DRM-free PC games.
* **Others (`games_others`)**: Epic Games, Ubisoft Connect, EA App, and PC standalone keys.

### 👤 Accounts (`accounts`)
* Dedicated category for verified full-access accounts, regional accounts (e.g. Turkey/Ukraine/Kazakhstan PSN or Steam), and clean login credentials.
* Kept strictly separated from digital keys so buyers always know whether they are purchasing a game key or an account.

### 🎁 Gift Cards (`giftcard`)
* **Apple / iTunes**: Official US App Store & iTunes cards ($2 – $100).
* **Steam Wallet**: Global, USD, INR, and regional Steam recharge cards.
* **PlayStation Store**: Wallet credit across US, UK, and Europe regions.
* **Xbox Gift Cards**: Microsoft balance & Game Pass vouchers.
* **Nintendo Switch**: eShop prepaid wallet vouchers ($10, $20, $50).
* **Roblox**: Robux gift vouchers (275 – 11,000 Robux).
* **Blizzard Battle.net**: Wallet balance for Blizzard games and expansions.

### 🔄 Subscriptions (`subscription`)
* **Xbox Game Pass**: Ultimate and PC Game Pass (1, 3, 6, 12 months).
* **PlayStation Plus**: Essential, Extra, and Deluxe tiers.
* **EA Play**: Standard & Pro memberships across consoles and PC.
* **Entertainment & Utility**: Discord Nitro (+2 Server Boosts), YouTube Premium, streaming passes.

### ⚡ Game Top-ups (`topup`)
* Direct in-game currency recharge with automated **Player ID / UID input validation**:
  * **Valorant Points**: Bangladesh (BDT), Philippines (PHP), Malaysia (MYR).
  * **PUBG Mobile**: Unknown Cash (UC) direct player ID recharge.
  * **Mobile Legends (MLBB)**: Diamonds & Weekly Diamond Passes (User ID + Zone ID).
  * **Genshin Impact & Honkai: Star Rail**: Genesis Crystals, Oneiric Shards, Welkin Moon.
  * **Fortnite**: V-Bucks across consoles and PC.
  * **Free Fire, Brawl Stars, Clash of Clans, eFootball PES, Apex Legends**.

### 🛠️ Services & Software (`service` / `software`)
* Lifetime Windows 10/11 Pro & Office 365 activations.
* Regional account registration services.
* Premium AI packages (e.g. Google AI Pro with Gemini Advanced & cloud storage).

### 📋 Custom Orders (`custom_orders`)
* Integrated portal where customers can request unlisted games, bulk top-ups, or specialized software.
* Merchant can review, price, and fulfill custom orders directly in the admin panel.

---

## 4. Delivery & Fulfillment Models

RetroHub accommodates multiple digital fulfillment workflows:

| Delivery Type | Label | How It Works |
| :--- | :--- | :--- |
| `instant_code` | **Instant - 30min Delivery** | The platform checks the `inventory_keys` database table. Upon payment verification, available keys are automatically bound to the order and instantly displayed on the customer's `/orders` screen and emailed. |
| `api_h2h` | **Direct Sourcing / API** | Designed for external provider APIs or automated wholesale supplier bridges. |
| `automation` | **Automated Bot Delivery** | For automated direct-to-account top-ups and UID injection. |
| `manual` | **Operator Sourcing** | The merchant sources the item on demand, inputs the code or credentials into the Admin Dialog, and clicks "Fulfill Order". |

---

## 5. Merchant Admin Dashboard Operations

Merchants access a password-protected, role-verified Admin Suite at `/admin`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          RETROHUB ADMIN SUITE                          │
├──────────────┬──────────────┬──────────────┬───────────────────────────┤
│ Revenue Today│ Orders Today │ Profit Today │ Pending Action Required   │
│  ৳ 45,200    │      38      │   ৳ 8,450    │        3 Orders           │
└──────────────┴──────────────┴──────────────┴───────────────────────────┘
 [ Orders Queue ]    [ Inventory Status ]    [ Custom Orders Board ]
```

### 1. Real-Time Financial Analytics
* **Revenue Today**: Live total gross transaction volume in BDT (৳).
* **Orders Today**: Number of successfully completed transactions.
* **Profit Today**: True net margin calculated dynamically: `Sale Price - Cost Price`.
* **Pending Actions**: Instant badge count of orders awaiting payment validation or fulfillment.

### 2. Full Order Management Lifecycle
Every incoming order follows a safe, verifiable state machine:
```
[ Pending ]
    │
    ▼ (Customer submits Transaction ID)
[ Payment Submitted ]
    │
    ▼ (Merchant checks bKash/Nagad/Bank and clicks "Validate")
[ Payment Verified ]
    │
    ├─► [ Sourcing ] (Optional: When sourcing from external vendor)
    │
    ▼ (Merchant inputs digital key or automated key assigns)
[ Fulfilled / Completed ] ──► Code revealed on customer screen + Email sent
    │
    ├─► [ On Hold ] (If customer supplied invalid UID or credentials)
    ├─► [ Cancelled ] (Key released back to stock, reason logged)
    └─► [ Refunded ] (Transaction reversed, key released)
```

### 3. Inventory Status & Margin Analysis
* **Full Category Breakdown**: Real-time stock counts for every category:
  * `Giftcard` • `Service` • `Topup` • `PC Game` • `Subscription` • `Software` • `Xbox Game` • `PS Game` • `Accounts`
* **Per-Product Metrics**:
  * Product Name & Platform
  * Delivery Mechanism
  * Current In-Stock Units
  * Cost Price vs Sale Price
  * Net Profit Margin (Tk & %)
* **Inline Price & Stock Updates**: Adjust prices and stock counts on the fly to react to market changes.
* **Zero-Inventory Alerting**: Out-of-stock items automatically display badges on the storefront and prevent checkout.

### 4. Custom Orders Management Board
* Live feed of customer requests containing Customer Name, Email, Product Name, Platform, and Request Details.
* Status toggles (`pending` → `quoted` → `fulfilled` → `closed`).
* Direct customer email contact channel.

---

## 6. Customer Checkout & Payment Processing

### Local Payment Gateways Supported
RetroHub is optimized for Bangladeshi and regional merchant payment methods:
1. **bKash Personal & Merchant** (Send Money / Payment)
2. **Nagad Personal** (Send Money)
3. **Rocket** (Mobile Banking)
4. **Bank Wire Transfer** (City Bank, Dutch-Bangla Bank, Brac Bank)
5. **Crypto / USDT** (Optional manual or gateway integration)

### Customer Checkout Flow
1. **Cart Selection**: Customer adds games, subscriptions, or top-ups. Quantity selector and variant picker available.
2. **Player Data Collection**: For top-up products, customer enters Player ID, Server Region, or Zone ID.
3. **Payment Instructions**: Clear step-by-step instructions showing the merchant's bKash/Nagad/Bank numbers with one-click copy buttons.
4. **Transaction Verification**: Customer enters their transaction reference (TrxID / Bank Slip).
5. **Instant Order Tracking**: Customer is redirected to their personal `/orders` portal. Once fulfilled, keys and codes are copyable with one click.

---

## 7. Security, Reliability & Data Integrity

* **Row-Level Security (RLS)**: Customers can **only** read their own orders and profile data. Under no circumstances can a customer view another user's deliveries or keys.
* **Role-Based Access Control (RBAC)**: All administrative functions (`verify_payment`, `fulfill_order`, `hold_order`, `refund_order`) execute through PostgreSQL `SECURITY DEFINER` stored procedures that verify the caller holds the `admin` role in `user_roles`.
* **Concurrency Lock Prevention**: When automated fulfillment pulls keys from `inventory_keys`, it uses PostgreSQL's `FOR UPDATE SKIP LOCKED`. Two simultaneous orders will **never** be assigned the same code.
* **Audit Trail**: Every administrative action, status update, refund, or stock mutation is permanently written to `audit_logs` and `admin_action_logs` with admin timestamps and IP/metadata.
* **Sanitized Data & Zero Console Leaks**: Production builds have zero console statements, and all client-side inputs are validated via TypeScript and backend constraints.

---

## 8. Catalog Maintenance & Automation Scripts

RetroHub includes pre-built maintenance utilities located in `scripts/maintenance/`:

| Script | Purpose |
| :--- | :--- |
| `deduplicate_products_strict.mjs` | Multi-factor duplicate cleaner checking Title, Category, Platform, Region, and Details while preserving high-profit items. |
| `check-stock.cjs` | Audits inventory tables and syncs stock counts across the catalog. |
| `assign_missing_images.mjs` | Scans catalog and attaches official high-resolution artworks to unbranded listings. |
| `sanitize_image_urls.mjs` | Resolves broken image links and validates CDN uptime. |

---

## 9. Merchant Quick Reference Checklist

| Task | Where to do it | Time Required |
| :--- | :--- | :--- |
| **Check new orders** | `/admin` → Orders Tab | Real-time |
| **Validate customer payment** | Click `Validate` on pending order | 5 seconds |
| **Fulfill order with code** | Click `Fulfill` → Paste delivery key/credentials | 5 seconds |
| **Add new product** | Admin Panel / Database migration | 1 minute |
| **Change product prices** | `/admin` → Inventory Tab → Edit Price | Instant |
| **Review daily profits** | `/admin` → Stats Grid at the top | Real-time |
| **Process custom request** | `/admin` → Custom Orders Tab | 1 minute |

---

*Documentation maintained by RetroHub Engineering.*  
*For technical support, database migrations, or custom API integration, consult `docs/DEPLOYMENT.md` and `docs/DATABASE_SETUP.md`.*
