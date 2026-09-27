# Changelog

All notable changes to RetroHub are documented in this file.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [1.3.0] — 2026-09-28

### Added
- **24/7 AI Customer Support Bot** (`@retrochanbot`): Full `customer-bot` Supabase Edge Function powered by **xAI Grok** (`grok-beta`).
  - Natural language understanding for order inquiries, game top-up help, bKash payment walkthroughs, and product questions.
  - Instant order lookup by 6–8 char short ID, full UUID, or customer email — reveals status, items, amounts, and delivered codes.
  - Multi-turn session persistence via new `customer_support_sessions` PostgreSQL table.
  - Graceful AI-to-interactive-menu fallback when API quotas or network issues occur.
  - Deployed as `supabase/functions/customer-bot` (no JWT verification required for public customer access).
  - Automated Telegram command registration via `setMyCommands` (`/start`, `/track`, `/faq`, `/help`).
- **Bidirectional Live Support Relay**: Seamlessly connects customers in `@retrochanbot` requesting human assistance directly into the Merchant Admin Bot (`@Notifyretro_bot`). The merchant receives real-time escalation alerts, replies directly to the customer using `/reply <chat_id> <message>` or tap-to-reply inline buttons, reviews open tickets via `/tickets`, and resolves tickets with `/resolve <chat_id>` to transition the customer back to Retro Chan.
- **Per-User Cart Isolation**: `CartContext` now scopes each cart to `cart_${userId}` (authenticated) vs `cart_guest` (anonymous), eliminating cross-account cart leakage when multiple Google accounts are used on the same device.
- **Universal Cross-Device Background Video Engine**: Complete overhaul of `BackgroundAnimation.tsx`.
  - HLS.js MSE engine with dedicated Web Worker offloading (`enableWorker: true`) — main UI thread fully free.
  - Native HLS on iOS/Safari, MSE HLS on Android/Desktop. Autoplay recovery via passive gesture listener on first touch/scroll.
  - User-controlled ambient animation intensity toggle in `ShopHeader`.
  - `touch-action: manipulation` applied globally to eliminate the 300ms mobile tap delay.
- **Expanded Test Suite**: 27 unit tests across 3 suites — `cartContext.test.ts` (5 tests), `example.test.ts` (15 tests), `pages.test.tsx` (7 tests).
- **`/inspect` Admin Bot Command**: Registered as an alias for `/order`; `🔍 Inspect` inline button callback now works seamlessly.
- **Google OAuth-Only Auth**: `Auth.tsx` simplified to one-click Google sign-in, removing legacy email/password UI.
- **Deployment Chunk Self-Healing**: `vite:preloadError` listener + `lazyWithRetry` + `ErrorBoundary.tsx` prevents infinite reload loops on hashed-chunk deployment.
- **`supabase/README.md`**: Comprehensive backend reference documenting Edge Functions, security RPCs, migration series, and required secrets.
- **`docs/MERCHANT_SYSTEM_OVERVIEW.md`**: Updated to document Dual Telegram Bot Architecture (Section 8) and expanded Solo Merchant Operational Playbook (Section 10).
- `supabase/migrations/20260927000002_customer_support_sessions.sql` — Multi-turn support session tracking table with RLS.
- `supabase/migrations/20260927000003_fix_security_linter_warnings.sql` — Resolved `SECURITY DEFINER` and RLS linter findings.
- `supabase/migrations/20260927000004_fix_database_linter_performance_warnings.sql` — Added missing FK indexes.
- `supabase/migrations/20260927000005_drop_safe_unused_indexes.sql` — Dropped redundant indexes.
- `supabase/migrations/20260927000006_drop_obsolete_stock_validation.sql` — Removed deprecated stock trigger.

### Changed
- `package.json`: Version bumped to `1.3.0` with Node engine requirement `>=22.0.0`.
- `README.md`: Updated all feature sections (Sections 7–10), tech stack, repository structure, and deployment instructions to reflect v1.3.0.
- `scripts/README_SCRIPT.md`: Updated test count to 27 tests across 3 suites.
- `.env.example`: Added `CUSTOMER_BOT_TOKEN` and `VITE_XAI_API_KEY` to the environment template.

### Fixed
- **Chromium / Mobile Video Playback Stalls**: Resolved video engine freeze and black screen on mobile devices by prioritizing MSE worker pipeline before falling back to native media players.
- **300ms Mobile Click Delay**: Eradicated mobile tap latency across buttons and navigation menus via global viewport touch handling.
- **Cross-Account Session Bleed**: Prevented cart item collision when different users log in from the same shared client browser.
- **Vite Chunk Deployment Errors**: Fixed `ChunkLoadError` crashes following CDN deployments through automatic error-boundary reload retry interception.
- **Database Schema Linter Warnings**: Fixed 12 database warnings regarding unindexed foreign keys, mutable function search paths, and storage bucket RLS.
- **Mobile Video Play Button Overlay**: Completely suppressed native browser/WebKit play button icons on mobile and iOS Safari by decoupling poster thumbnails from the `<video>` element, enforcing strict WebKit media control suppression in CSS, and smoothly crossfading video once frames begin rendering.
- **Order Tracking Redundancy**: Removed non-functional manual order search input in `Orders.tsx` and streamlined direct Telegram bot deep links.

### Removed
- Removed legacy email/password authentication form in favor of frictionless, secure Google OAuth 2.0.
- Removed deprecated database triggers for manual stock verification in favor of transactional relational locks.
- Removed heavy 8.4s uncompressed raster hero graphic in favor of zero-weight GPU gradients.

### Performance & Core Web Vitals
- **LCP < 300ms**: Eliminated 8.4s hero image decode bottleneck; replaced decorative `<img>` with GPU-accelerated CSS gradients in `HeroSection.tsx`.
- **INP < 50ms**: Removed CPU-intensive `feGaussianBlur` SVG filter; decoupled `toast()` from `CartContext` via `queueMicrotask`; wrapped interactions in `startTransition`.
- **CLS = 0.00**: Introduced 8-card skeleton grid with exact card dimensions; pre-allocated layout heights on catalog sections.
- **Font Delivery**: Removed render-blocking `@import` from `index.css`; added preconnect and async font stylesheet.
- **Edge Caching**: `Cache-Control: public, max-age=31536000, immutable` for hashed static assets; `stale-while-revalidate` for media.
- **Favicon**: Compressed from 463 KB → 16.8 KB (96% reduction).

### Security
- `customer_support_sessions` table gated by RLS — customers only see their own session history.
- `CUSTOMER_BOT_TOKEN` stored exclusively in Supabase secrets; never exposed client-side or committed to Git.
- Per-user cart isolation prevents cross-account session data bleed.
- Cloudflare rate limiter upgraded documentation: 150 req/60s per client IP.

---

## [1.2.0] — 2026-09-26

### Added
- Vite `manualChunks` vendor splitting: `react-vendor`, `supabase-vendor`, `ui-vendor`, `icons-vendor`
- Telegram inline keyboard buttons (Cancel / Verify) on new order notifications
- Short ID resolver (6–8 char prefix matching across 100 most recent orders)
- `supabase/migrations/20260927000001_secure_order_payment_and_pricing.sql`

### Security
- `submit_order_payment` SECURITY DEFINER RPC enforces ownership and prevents table-level UPDATE access
- Duplicate TrxID fraud detection across payment submissions
- HTML `escapeHtml()` applied to all Telegram message dynamic inputs

---

## [1.1.0] — 2026-09-24

### Added
- `Accounts` and `Service` product categories
- Instant code delivery flag on eligible products
- Admin action audit log (`admin_action_logs` table)
- Custom orders board in Admin dashboard

---

## [1.0.0] — 2026-09-21

### Added
- Initial production release
- React 18 + TypeScript + Vite 5 SPA
- Supabase PostgreSQL with RLS and SECURITY DEFINER RPCs
- bKash payment flow with TrxID validation
- Customer order dashboard with digital code reveal
- 24/7 Telegram admin bot (`@Notifyretro_bot`) with order fulfillment commands
- GitHub Actions: automated 2-hour pending order reminder cron
- Cloudflare Workers deployment with `worker.js` SPA 404 rewrite
- Google OAuth 2.0 authentication with open-redirect protection
- WebP hero asset (69% compression, `<link rel="preload">`)

[Unreleased]: https://github.com/abirthe/retrohub/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/abirthe/retrohub/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/abirthe/retrohub/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/abirthe/retrohub/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/abirthe/retrohub/releases/tag/v1.0.0
