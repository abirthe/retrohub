# Contributing to RetroHub

Thanks for taking the time to contribute! 🎮

---

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment files
cp .env.example .env
cp wrangler.json.example wrangler.json

# 3. Fill in your own Supabase + Cloudflare + Telegram credentials in .env

# 4. Start the dev server
npm run dev
```

---

## Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/<short-desc>` | `feat/add-paypal-flow` |
| Bug fix | `fix/<short-desc>` | `fix/checkout-crash` |
| Hotfix | `hotfix/<short-desc>` | `hotfix/trxid-validation` |
| Chore | `chore/<short-desc>` | `chore/update-deps` |
| Docs | `docs/<short-desc>` | `docs/api-readme` |

All branches should be cut from `main` and opened as Pull Requests back into `main`.

---

## Commit Message Style (Conventional Commits)

```
<type>(<scope>): <short summary>

[optional body — explain the why, not the what]
[optional footer — closes #<issue>, BREAKING CHANGE: ...]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`

Examples:
```
feat(payment): add duplicate TrxID fraud detection
fix(worker): restore wrangler.json to prevent Vite 6 build error
perf(vite): add manualChunks vendor splitting
```

---

## Pull Request Checklist

Before opening a PR, verify:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` shows no new warnings
- [ ] `npx vitest run` shows all tests passing
- [ ] New business logic has unit tests in `src/test/`
- [ ] No secrets or `.env` values committed
- [ ] `CHANGELOG.md` updated under `[Unreleased]`

---

## Project Structure

```
retrohub/
├── src/
│   ├── lib/               # Service layer (API modules — one concern per file)
│   │   ├── types.ts         # Shared DB types
│   │   ├── productApi.ts    # Product catalog + admin CRUD
│   │   ├── orderApi.ts      # Order lifecycle + stats
│   │   ├── paymentApi.ts    # Payment submission
│   │   ├── customOrderApi.ts# Custom quotes
│   │   └── authApi.ts       # Role checks
│   ├── hooks/             # React hooks (camelCase filenames)
│   ├── contexts/          # React context providers
│   ├── components/        # Feature-scoped component folders + UI primitives
│   ├── pages/             # Route-level pages
│   └── test/              # Unit + integration tests (Vitest)
├── supabase/
│   ├── functions/         # Edge Functions (Telegram webhook)
│   └── migrations/        # Versioned SQL migrations (timestamp prefix)
├── docs/                  # Architecture docs
├── scripts/               # Utility PowerShell + Node scripts
├── worker.js              # Cloudflare Worker edge router
└── wrangler.json          # Cloudflare Workers config
```

---

## Code Style

- **TypeScript strict mode** is enabled — no implicit `any`.
- Use named exports; avoid default exports except for pages.
- Prefer `async/await` over `.then()` chains.
- Use `console.error` only in `catch` blocks; use `logger.ts` for structured logs.
- Hook filenames: `useCamelCase.ts` (not `use-kebab-case.ts`).

---

## Database Migrations

When adding new tables, columns, or policies:

1. Create a new file in `supabase/migrations/` with timestamp prefix:  
   `YYYYMMDDHHMMSS_descriptive_name.sql`
2. Enable RLS on every new table.
3. Use `SECURITY DEFINER` RPCs for any cross-user or privilege-elevated operations.
4. Run `supabase db push` to apply locally, then `supabase db push --linked` for production.

---

## Reporting Issues

Use GitHub Issues with one of the labels:
- `bug` — Something broken in production
- `enhancement` — Feature request
- `question` — Clarification needed

Please include steps to reproduce for all bug reports.
