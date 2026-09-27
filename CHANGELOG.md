# Changelog

All notable changes to RetroHub are documented in this file.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Optimized (Core Web Vitals & Performance)
- **HLS Background Video**: Decoupled `hls.js` (~595 KB) from initial critical path; lazy-loaded `BackgroundAnimation` on idle and prioritized native HLS on iOS/Safari.
- **Font Delivery**: Removed render-blocking `@import` from `index.css`; added preconnect and asynchronous font stylesheet in `index.html`.
- **Edge Caching**: Configured `Cache-Control: public, max-age=31536000, immutable` for hashed assets in `worker.js` and stale-while-revalidate for static media.
- **Favicon**: Compressed and properly sized `favicon.png` from 463 KB down to 16.8 KB (96% bandwidth reduction).
- **Product Detail CWV**: Added layout skeleton to eliminate Cumulative Layout Shift (CLS) and set `fetchPriority="high"` on product hero images for LCP.

### Added
- `src/lib/productApi.ts` — Product catalog CRUD, featured banner, storefront search
- `src/lib/orderApi.ts` — Order creation, admin state transitions, stats
- `src/lib/paymentApi.ts` — bKash TrxID submission with RPC security
- `src/lib/customOrderApi.ts` — Custom quote submission and admin management
- `src/lib/authApi.ts` — Role-based admin check
- `src/lib/types.ts` — Centralized shared type definitions
- Real unit tests for TrxID validation, price tamper detection, stock helpers, and open redirect protection
- Cloudflare `RATE_LIMITER` edge binding with 150 req/60s per client IP
- Cloudflare `ASSETS`/`CLOUD_FLARE_ASSET` dual-binding fallback in `worker.js`
- Telegram bot: all 12 commands registered via `setMyCommands`; `callback_query` webhook for inline button fulfillment
- Comprehensive `.gitignore` covering wrangler configs, IDE metadata, test coverage, npm auth tokens

### Changed
- `src/lib/shopApi.ts` refactored into a backwards-compatible barrel re-export
- `wrangler.json` restored to Git to prevent Cloudflare Vite 6 auto-detection build error
- `wrangler.toml` removed (superseded by `wrangler.json`)
- `scripts/README.md` renamed to `scripts/README_SCRIPT.md`

### Removed
- `Products/` catalog Excel/CSV files untracked from Git (stored locally only)
- `src/components/ProductCard.tsx` dead re-export file deleted
- Hook naming inconsistency fixed: standardized to camelCase (`useMobile`)

### Security
- `Products/` and `*.xlsx`, `*.ods`, `*.csv` added to `.gitignore`
- Cloudflare edge rate limiting protecting all routes from bot abuse
- `TELEGRAM_WEBHOOK_SECRET` stale key removed from Supabase secrets

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
