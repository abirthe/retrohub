# RETROHUB — Platform Features & Working Capability Specification

> **Comprehensive Technical & Operational Reference Manual**  
> *Authoritative specification of RetroHub's digital commerce architecture, storefront capabilities, multi-tier catalog, automated delivery pipelines, local payment processing, and merchant administration suite.*

---

## 1. Platform Executive Summary

**RetroHub** is a high-performance, full-stack digital goods e-commerce platform engineered specifically for instantaneous fulfillment of digital gaming and software products. It eliminates physical logistics entirely by operating an end-to-end digital delivery lifecycle with real-time margin tracking, automated stock locking, and local payment verification.

### Core Product Capabilities
* **Instant Digital Game Keys**: PC (Steam, GOG, Epic Games, Ubisoft, EA App), Xbox (One, Series X|S), and PlayStation (PS4, PS5).
* **Verified Gaming Accounts**: Full-access and regional accounts (Steam, PSN, Xbox, Minecraft, Ubisoft) strictly isolated from code listings.
* **Global & Regional Gift Cards**: Official digital wallet top-up cards for Apple iTunes, Steam Wallet, PlayStation Store, Xbox, Nintendo Switch eShop, Roblox (Robux), and Blizzard Battle.net.
* **Gaming & Digital Subscriptions**: Xbox Game Pass (Ultimate & PC), PlayStation Plus (Essential, Extra, Deluxe), EA Play / EA Play Pro, Discord Nitro, and YouTube Premium.
* **Direct Player UID Game Top-Ups**: 17+ curated games featuring client-side and backend player validation (Valorant Points, PUBG Mobile UC, Mobile Legends Diamonds, Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Marvel Rivals, and more).
* **Software & Digital Services**: Lifetime Microsoft Windows & Office activation keys, regional account setup, and premium Google AI Pro 6-Month subscriptions (Gemini 3.1 Pro, Antigravity 2.0, Veo 3.1, Nano Banana 2, 5TB Google One).
* **On-Demand Custom Orders**: Dedicated portal (`/custom-order`) for unlisted titles, specialized software, or enterprise requests with back-office tracking.

---

## 2. Storefront Architecture & Customer Experience

RetroHub's customer interface is built with **React 18**, **TypeScript**, and **Tailwind CSS**, styled around a cyber-neon dark gamer aesthetic with glassmorphism and micro-animations.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  RETROHUB   [ Search products... ]   [ All | Games | Accounts | Gift Cards ] │
├──────────────────────────────────────────────────────────────────────────────┤
│  ⚡ HERO BANNER: Featured Digital Drops & Top-Ups                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  Category Pills: [🎮 Games] [👤 Accounts] [🎁 Gift Card] [🔄 Subs] [⚡ Topup]  │
│  Subcategory Filters: [Steam] [Xbox] [PlayStation] [GOG] [Others]            │
├──────────────────────────────────────────────────────────────────────────────┤
│  Catalog Grid:                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐ │
│  │ Steam Wallet $50     │  │ Valorant 1150 VP     │  │ Xbox Game Pass Ult  │ │
│  │ Instant Delivery     │  │ Player ID Required   │  │ 1 Month Global      │ │
│  │ ৳ 5,850              │  │ ৳ 1,250              │  │ ৳ 1,450             │ │
│  │ [ Add to Cart ]      │  │ [ Select Server/UID] │  │ [ Add to Cart ]     │ │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Storefront Features
1. **Dynamic Category & Subcategory Filtering**:
   - Strict 1-to-1 category isolation guarantees products never leak across mismatched filters.
   - Dynamic subcategory pill navigation for deep-diving into platforms (e.g., Games -> Xbox, PlayStation, Steam, GOG, Others; Gift Cards -> Apple, Steam, PlayStation, Xbox, Nintendo, Roblox, Blizzard).
2. **Real-Time Catalog Search & Sorting**:
   - Debounced search bar with instant query matching across title, platform, and category.
   - Dynamic sorting: **Newest**, **Price: Low to High**, **Price: High to Low**, and **Name: A to Z**.
3. **Cart Management with Persistence**:
   - `CartContext` backed by browser `localStorage` ensures items persist across sessions and page refreshes.
   - Dynamic quantity adjustments, variant switching, real-time total recalculation, and stock limits.
4. **Player ID & Data Capture for Top-Ups**:
   - For top-up products, checkout prompts buyers for required metadata: **Player ID (UID)**, **Zone ID / Server ID**, and **Region**.
   - Input metadata is validated and attached directly to the order's `customer_input` JSON field.
5. **Mobile-First Responsive Layout**:
   - Tailored interfaces for both desktop workstations and mobile screens, including mobile swipeable order cards and sticky bottom navigation.
6. **Authentication & Identity Hardening**:
   - Multi-mode sign-in: Google OAuth 2.0, passwordless magic links, and standard credentials.
   - Open redirect protection (`sanitiseReturnTo()`) validates callback targets strictly against the same origin, mitigating phishing vulnerabilities.
   - Legal compliance pages (`/privacy` and `/terms`) are published for OAuth consent compliance.

---

## 3. Product Catalog & Category Specification

The catalog enforces strict data integrity via PostgreSQL enums and application-level filters:

| Category Key | Display Label | Subcategories / Platforms | Key Fulfillment Characteristics |
| :--- | :--- | :--- | :--- |
| `games` | **Games** | `games_xbox`, `games_ps`, `games_steam`, `games_gog`, `games_others` | Instant 25-character digital keys, license codes, or store vouchers. |
| `accounts` | **Accounts** | Steam, PlayStation, Xbox, Minecraft, Ubisoft | Full-access email + password login credentials with complete ownership transfer. |
| `giftcard` | **Gift Cards** | `giftcard_xbox`, `giftcard_steam`, `giftcard_ps`, `giftcard_apple`, `giftcard_nintendo`, `giftcard_roblox`, `giftcard_blizzard` | Prepaid digital pin codes and redemption vouchers with multi-currency support (USD, EUR, GBP, TRY, INR, BDT). |
| `subscription`| **Subscriptions** | `sub_gamepass`, `sub_psn`, `sub_ea`, `sub_others` (Discord Nitro, YouTube) | Membership activation codes or direct subscription upgrade links (1, 3, 6, 12 months). |
| `topup` | **Top Up** | 17+ Game Titles (Valorant, MLBB, PUBG, Genshin, Honkai, Fortnite, etc.) | Direct account injection via Player ID, Server Zone, or User ID. |
| `service` | **Services & Software** | Google AI Pro, Windows 10/11 Pro, Office 365, Account Sourcing | Direct activation links, OEM product licenses, and enterprise service provisioning. |
| `custom_orders`| **Custom Requests**| Unlisted Games, Bulk Orders, Specialized Services | Dedicated customer quote request form routed directly to the merchant queue. |

---

## 4. Delivery & Fulfillment Models

RetroHub supports 4 distinct fulfillment mechanisms configured per product in `delivery_type`:

```
                    ┌─────────────────────────┐
                    │   Verified Paid Order   │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  `instant_code`  │    │    `api_h2h`     │    │     `manual`     │
│  Automated Key   │    │ Wholesale Bridge │    │ Admin Sourced    │
│  from Inventory  │    │ Automated Top-Up │    │ Code / Account   │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Order Marked Fulfilled│
                     │  - Key in /orders     │
                     │  - Email sent via API │
                     └───────────────────────┘
```

1. **Instant Digital Code (`instant_code`)** — *Default Model*:
   - Assigned directly from the `inventory_keys` table.
   - Upon payment verification, available keys are locked using `FOR UPDATE SKIP LOCKED` to prevent duplicate assignment.
   - Code is immediately revealed on the user's `/orders` dashboard and dispatched via email.
2. **API Head-to-Head (`api_h2h`)**:
   - Automated bridge for wholesale suppliers or automated provider APIs.
3. **Automated Bot Top-up (`automation`)**:
   - Direct-to-UID automated injection pipelines for supported game titles.
4. **Manual Operator Fulfillment (`manual`)**:
   - Operator sources custom credentials, paste-delivers into the Admin Order Action Dialog, and confirms fulfillment.

---

## 5. Local Payment Processing Engine

RetroHub implements a streamlined mobile payment workflow tailored for the local gaming community:

### Supported Payment Channels
1. **bKash Personal & Merchant (Active)**:
   - Streamlined single-channel mobile wallet checkout.
   - Prominently displays the merchant bKash wallet number with one-click copy.
   - Automatic dynamic **1.0% bKash transaction charge** calculation:
     $$\text{Total Payable} = \text{Order Total} \times 1.01$$
   - Strict format validation via regex `/^[A-Z0-9]{6,30}$/i` on customer-submitted Transaction IDs (TrxID) eliminates invalid submissions and injection attempts before reaching the database.
2. **Bank Wire Transfer (Roadmap / Standby)**:
   - Temporarily deactivated on the storefront to minimize manual reconciliation delays and deliver an ultra-fast checkout flow.
   - Architecture retains multi-bank routing specifications (City Bank, DBBL, BRAC Bank) for high-value wholesale accounts.

### Payment Submission & Verification Pipeline
1. **Order Initiation**: Order is created in `orders` with `status: 'pending'`.
2. **Transaction Submission**: Customer submits their bKash Transaction ID on `/payment`. Input is strictly regex-validated on client and sanitised.
3. **State Transition**: Order transitions to `status: 'payment_submitted'`.
4. **Merchant Verification**: Merchant checks the incoming transaction in their bKash statement and clicks **Validate** in the Admin Suite. Order transitions to `status: 'payment_verified'`.

---

## 6. Customer Order Tracking & Delivery Portal (`/orders`)

Customers access their personal order history at `/orders`:
* **Live Status Progression**:
  - `pending` (Awaiting payment submission)
  - `payment_submitted` (Payment received, awaiting validation)
  - `payment_verified` (Payment approved by merchant)
  - `sourcing` (Product being acquired or generated)
  - `fulfilled` (Completed — codes and credentials delivered)
  - `cancelled` (Cancelled with reason recorded)
  - `refunded` (Payment refunded to customer)
  - `failed` (Transaction error)
* **One-Click Delivery Code Retrieval**:
  - Fulfilled keys and accounts are displayed in a highlighted, monospace code block with one-click copy.
  - Multi-key orders display separate line items with individual copy handles.
* **AI-Powered Automated Email Dispatch**:
  - Integrated with Supabase Edge Functions (`send-order-email`) and Resend API.
  - Caller verification via active session JWT (`Authorization: Bearer <session.access_token>`).
  - Powered by **xAI Grok API** (`grokApi.ts`) for intelligent, personalised customer delivery emails containing order summary, redemption steps, and support guidelines.

---

## 7. Merchant Admin Dashboard Suite (`/admin`)

Merchants with the `admin` role in `user_roles` have access to an enterprise back-office suite:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RETROHUB ADMIN SUITE                               │
├──────────────────┬──────────────────┬──────────────────┬────────────────────────┤
│  Revenue Today   │   Orders Today   │   Profit Today   │ Pending Action Items   │
│    ৳ 48,920      │        42        │     ৳ 9,140      │       4 Orders         │
└──────────────────┴──────────────────┴──────────────────┴────────────────────────┘
 [ Orders Queue ]         [ Inventory & Pricing ]         [ Custom Orders Board ]
```

### 1. Real-Time Financial Analytics
* **Revenue Today (`v_revenue_today`)**: Aggregates all gross transactions completed within the current calendar day.
* **Orders Today (`v_orders_today`)**: Total count of completed orders today.
* **Net Profit Today (`v_profit_today`)**: Calculated in real time across fulfilled orders:
  $$\text{Net Profit} = \sum (\text{Sale Price} - \text{Cost Price})$$
* **Pending Actions (`v_pending_action_count`)**: Real-time counter of orders needing immediate operator action (`pending`, `payment_submitted`, `sourcing`).

### 2. Full Order Lifecycle Control (`OrdersTab`)
Merchants execute state transitions through secure PostgreSQL stored procedures:
* **Validate Payment**: Approves submitted TrxID (`verify_payment` RPC).
* **Start Sourcing**: Marks order as in-process when acquiring from external vendors (`start_sourcing` RPC).
* **Fulfill Order**: Opens dialog to input delivery code/credentials, vendor cost paid, and vendor source (`fulfill_order` RPC).
* **Hold Order**: Pauses order when customer supplies incorrect UID or server info (`hold_order` RPC).
* **Cancel & Refund**: Releases reserved inventory keys and logs customer explanation (`cancel_order`, `refund_order` RPCs).
* **Search & Filters**: Instant filtering by status badge, search by Order ID, customer email, or Transaction ID.

### 3. Inventory & Dynamic Margin Management (`InventoryTab`)
* **Live Catalog Overview**: Paginated catalog table displaying product title, category, platform, region, stock, cost price, sale price, and net margin.
* **Margin Calculations**: Live percentage ($(\text{Sale} - \text{Cost}) / \text{Sale} \times 100$) and BDT profit indicators.
* **Inline Updates & Edit Dialog**:
  - Quick inline updates for stock quantity and sale price.
  - Comprehensive `EditProductDialog` to modify title, category, delivery type, source URLs, and markdown descriptions.

### 4. Custom Orders Management (`CustomOrdersTab`)
* Dedicated kanban-style management for customer quote requests submitted on `/custom-order`.
* Shows customer name, email, requested product, target platform, and detailed notes.
* Status tracking pipeline: `pending` $\rightarrow$ `quoted` $\rightarrow$ `fulfilled` $\rightarrow$ `closed`.
* Direct mailto button to contact the buyer with custom pricing.

---

## 8. Security, Data Isolation & Concurrency

| Security Layer | Technical Implementation | Operational Guarantee |
| :--- | :--- | :--- |
| **Open Redirect Hardening** | `sanitiseReturnTo()` origin checks in `Auth.tsx` & `AuthCallback.tsx` | All post-login targets are constrained to same-origin URLs; external phishing URLs fall back to `/`. |
| **Transaction ID Sanitization** | Client and server regex validation `/^[A-Z0-9]{6,30}$/i` | Injection payloads and malformed references are rejected prior to database mutation. |
| **Session JWT Authorization** | Bearer token passed in `emailService.ts` via Supabase session | Edge Functions authenticate the caller identity instead of relying solely on anon keys. |
| **Private Error Masking** | Internal `useEffect` error logging in `AdminDashboard.tsx` | Raw PostgreSQL error payloads and schema hints are shielded from end users and never rendered into the DOM. |
| **Row Level Security (RLS)** | PostgreSQL RLS enabled on all tables (`orders`, `deliveries`, `profiles`, `custom_orders`). | Customers can strictly only view their own orders and keys. Data leaks are mathematically blocked at the database engine. |
| **Role-Based Access Control** | `has_role(auth.uid(), 'admin')` verified in PostgreSQL `SECURITY DEFINER` functions. | Storefront users cannot invoke admin state changes or access financial KPIs. |
| **Concurrency Lock Protection**| `SELECT ... FOR UPDATE SKIP LOCKED` during key assignment. | Two concurrent customer orders can never be assigned the same digital code. |
| **Complete Audit Trails** | `audit_logs` & `admin_action_logs` tables. | Every price mutation, role change, stock adjustment, and refund is logged with timestamp and admin ID. |

---

## 9. Merchant Operational Standard Operating Procedures (SOP)

| Daily Task | Administrative Action | Response Time Target |
| :--- | :--- | :--- |
| **New Payment Received** | Check bKash merchant app $\rightarrow$ Go to `/admin` $\rightarrow$ Find Order $\rightarrow$ Click **Validate**. | Under 5 minutes |
| **Fulfill Digital Key** | Click **Fulfill** $\rightarrow$ Paste Key/Credentials $\rightarrow$ Confirm. System assigns code and emails customer. | Instant (Automatic) / Under 15m (Manual) |
| **Invalid Customer UID** | Click **Hold Order** $\rightarrow$ Enter reason ("Invalid Server ID") $\rightarrow$ Contact customer. | Under 10 minutes |
| **Restock Digital Inventory**| Go to `/admin` $\rightarrow$ Inventory $\rightarrow$ Adjust stock or run seeding toolchain. | As stock depletes |
| **Review Custom Inquiries** | Go to `/admin` $\rightarrow$ Custom Orders tab $\rightarrow$ Quote buyer via email $\rightarrow$ Update status to `quoted`. | Within 2 hours |

---

*Documentation maintained by RetroHub Engineering.*
