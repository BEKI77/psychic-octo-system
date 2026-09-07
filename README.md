# Cylinder Inventory Management System

Implementation of `cylinder_inventory_management_system_design_mobile_first.md`,
built phase by phase per the design's §66 Implementation Order.

## Stack

Next.js (App Router) · NestJS · Drizzle ORM · PostgreSQL · Better Auth · Zod ·
TanStack Query · Tailwind + shadcn/ui — as specified in §3 of the design.

## Layout

```
apps/api   NestJS backend  (REST API under /api/v1, Better Auth under /api/auth)
apps/web   Next.js frontend
```

## Running locally

Requires a reachable PostgreSQL database and Node 20+/pnpm.

```bash
pnpm install

# apps/api/.env — copy from .env.example and fill in DATABASE_URL,
# BETTER_AUTH_SECRET (any random 32-byte hex), WEB_ORIGIN.
cd apps/api
pnpm db:generate   # only after changing src/database/schema/*
pnpm db:migrate    # applies drizzle/*.sql to the database
pnpm db:seed       # seeds RBAC roles/permissions + a bootstrap admin user
pnpm start:dev     # http://localhost:4000

# apps/web/.env.local — copy from .env.example (API_ORIGIN)
cd ../web
pnpm dev           # http://localhost:3000
```

The web app proxies `/api/*` to the API origin (see `next.config.ts`) so the
browser only ever talks to one origin — no CORS configuration needed in dev,
mirroring how the production reverse proxy (§4) will route both services
under one public domain.

The seed script prints the bootstrap admin's email/password — change it after
first login. Its defaults come from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`
in `apps/api/.env`.

## Status

- **Phase 1 (done):** project setup, Postgres, Drizzle, Better Auth, RBAC
  (roles/permissions), users admin.
- **Phase 2 (done):** warehouses + locations, cylinder types, cylinders
  (QR/barcode lookup, filters), suppliers.
- **Phase 3 (done):** receiving (draft receipts → add items → confirm/
  cancel), inventory transactions as an append-only audit log, warehouse
  transfers and manual adjustments (both under `POST /inventory/*`,
  row-locked per §42), a real stock dashboard (§36).
- **Phase 4 (done):** customers (with credit config), sales/issues (draft →
  add items → confirm/cancel, mirroring Receiving), customer holdings and
  transaction history, cash payments recorded at sale-confirm time, credit
  limit enforcement with a manager override (§40/§41), payment void.
- **Phase 5 (done):** returns (adding a cylinder to a return *is* the
  physical receive — no separate endpoint per §31), full/partial returns,
  inspection (GOOD/DAMAGED/NEEDS_REPAIR routing), financial adjustment
  against the original sale, and a maintenance/repair module that a
  NEEDS_REPAIR inspection opens automatically.
- **Phase 6 (done):** customer ledger (append-only, alongside the sales
  table's existing current-state fields), payment allocation (a payment can
  now be recorded unattached to any sale, then split across multiple
  outstanding sales), credit aging (0-30/31-60/61-90/90+ day buckets), and
  financial summary/customer-balance reports.
- **Phase 7 (done):** unified cylinder lookup (`GET /cylinders/lookup/:code`,
  tries QR → barcode → internal code) backing a `/scan` page with the
  design's exact Found/Not Found/Cannot Be Issued states and a camera
  scanner (`html5-qrcode`, lazy-loaded) with manual entry fallback; audit
  logging (`audit_logs`, populated by a global interceptor rather than
  hand-instrumented per service) with a filterable admin screen; two new
  reports (Inventory Report, Cylinder Accountability — a verified 5-bucket
  partition of every cylinder); PWA polish (manifest, a static-asset-only
  service worker, install metadata, an online/offline banner).
- **Phase 8+:** notifications, approvals, multiple warehouses, Telegram,
  analytics — per §66, one phase at a time.

Each phase ships backend + matching Next.js screens together.

## Notable adaptations from the design doc

- **Users table / password storage:** §6.1 sketches a `users.password_hash`
  column. Better Auth's standard architecture instead stores the credential
  hash on its own `accounts` table (provider `credential`) and treats `users`
  as its identity table (extended here with `username`, `firstName`,
  `lastName`, `phone`, `isActive`). This keeps password/session handling
  entirely inside Better Auth per §3's authentication boundary ("do not
  duplicate password/session logic inside domain modules") rather than
  reinventing it to match the literal column name.
- **Auth endpoints:** §26 sketches custom `/auth/login`, `/auth/refresh`,
  `/auth/logout`, `/auth/me` routes. Login/logout/session issuance are handled
  by Better Auth's own endpoints (mounted at `/api/auth/*`) and its React
  client, which is the supported integration path; a NestJS-side `GET
  /api/v1/auth/me` was added on top as the one convenience endpoint the
  frontend needed (current user + resolved RBAC permissions in one call).
- **Customer credit vs. the ledger:** §66 puts Customer Ledger in Phase 6,
  after Phase 4 already needed a working credit check. `CustomersService.
  getCredit()` still computes "current credit used" from `sales.
  outstandingAmount` (its original Phase 4 approach) rather than the
  `customer_ledger` balance — switching it would silently zero out every
  pre-Phase-6 sale's contribution with no backfill. The ledger is additive:
  it powers the new Ledger tab and Credit Aging/financial reports, and every
  transaction from Phase 6 onward writes to both.
