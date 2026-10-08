# 📚 RetroHub Documentation Hub

<p align="center">
  <img src="../public/favicon.png" alt="RetroHub Logo" width="80" height="80" />
</p>

<p align="center">
  <b>Comprehensive Technical, Operational, and Architectural Documentation</b><br>
  <i>Centralized documentation index for RetroHub storefront, backend, edge functions, and tooling.</i>
</p>

---

## 🗂️ Documentation Index

### 1. Platform & Merchant Architecture
- **[Platform Capability & Merchant System Specification](./MERCHANT_SYSTEM_OVERVIEW.md)**
  - Authoritative reference manual for RetroHub's digital commerce architecture.
  - Storefront capabilities, multi-tier catalog (games, gift cards, accounts, top-ups, subscriptions, services).
  - Automated fulfillment pipelines (`instant_code`), local bKash processing, and Admin Suite.

---

### 2. Backend, Database & Edge Functions
- **[Backend Database & Supabase Architecture](./supabase/README.md)**
  - PostgreSQL 15 schema, tables, foreign keys, and indexes.
  - 36+ versioned database migrations and upgrade sequences.
  - Authoritative financial pricing triggers, stock validation, and role-based access control.
  - `SECURITY DEFINER` procedures (`submit_order_payment`, `cancel_unpaid_order`, `expire_stale_orders`).

- **[AI Customer Support Bot (@retrochanbot)](./supabase/functions/customer-bot.md)**
  - 24/7 autonomous Telegram customer service concierge (*Retro Chan*).
  - Three-stage hybrid pipeline (xAI Grok 4.7 + BrainGine Local Fallback).
  - Level-1 triage, instant order tracking, key locker recovery, and bKash payment walkthroughs.
  - Concurrency hardening: row-level locks and update deduplication.

- **[Merchant Admin Operations Bot (@Notifyretro_bot)](./supabase/functions/telegram-webhook.md)**
  - Internal mobile command center and dispatch engine for the merchant desk.
  - Real-time instant push notifications for new orders, bKash TrxID submissions, fraud detection, and low stock warnings.
  - Interactive inline Telegram keyboards for 1-tap fulfillment, sourcing, holding, and refunds.

- **[Stripe Checkout Session Edge Function](./supabase/functions/create-checkout-session.md)**
  - PCI-compliant international payment gateway integration.
  - Dynamic BDT to USD currency conversion with minimum charge safety barriers ($0.50 USD / ৳65 BDT).
  - Secure embedded checkout session creation and customer metadata propagation.

---

### 3. Tooling & Maintenance Scripts
- **[Catalog & Tooling Scripts Operations Manual](./scripts/README.md)**
  - Operational guide for the 25+ automated Node.js catalog and database scripts.
  - Batch price scrapers, margin calculators, and regional exchange rate synchronizers.
  - Automated database seeding (Steam, PlayStation, Xbox, Roblox, Valorant, etc.).
  - Image optimization, asset watermarking, orphan key cleaners, and inventory audits.

---

## 🧭 Navigation Quick Links

| Document | Category | Scope |
| :--- | :--- | :--- |
| [Merchant System Overview](./MERCHANT_SYSTEM_OVERVIEW.md) | Platform | Core e-commerce capabilities, catalog hierarchy, business model |
| [Supabase Architecture](./supabase/README.md) | Backend | PostgreSQL schema, RLS policies, migrations, RPCs |
| [Customer AI Bot](./supabase/functions/customer-bot.md) | Telegram / AI | Customer support bot (@retrochanbot), Grok pipeline |
| [Admin Webhook Bot](./supabase/functions/telegram-webhook.md) | Telegram | Staff dispatch terminal (@Notifyretro_bot), order triage |
| [Stripe Checkout](./supabase/functions/create-checkout-session.md) | Payments | Stripe embedded checkout session handler |
| [Tooling Scripts](./scripts/README.md) | Tooling | Seeding, catalog scripters, stock reconciliation |
| [Main Storefront Readme](../README.md) | Repository | Project overview, quickstart, environment setup, deployment |
