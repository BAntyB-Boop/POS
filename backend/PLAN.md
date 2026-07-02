# POS Backend Plan — Bun + ElysiaJS + Drizzle ORM + SQLite

Backend for the Meow Mart POS, built in `D:\POS\backend\`. Features: sell goods with barcode-scanner lookup, stock management with an auditable movement log, and report endpoints for a dashboard. Scope is **backend only** — the existing `pos-web/` React frontend stays untouched (its `ReportsScreen.tsx` metrics and `data.ts` seed products define the contract the backend serves later).

---

## TODO Checklist

### 1. Scaffold
- [x] `bun init -y` in `backend/`, add deps: `elysia @elysiajs/jwt @elysiajs/cors @elysiajs/swagger drizzle-orm` + dev `drizzle-kit @types/bun typescript`
- [x] `tsconfig.json` (strict, ESNext, bundler resolution, types: ["bun"])
- [x] `.env` + `.env.example` (`PORT=3000`, `JWT_SECRET`, `DB_FILE=./data/pos.db`), `.gitignore` (`data/`, `.env`, `node_modules/`)
- [x] `src/env.ts` — typed env access; throw at startup if `JWT_SECRET` missing
- [x] package.json scripts: `dev`, `start`, `db:generate`, `db:migrate`, `db:seed`, `test`

### 2. Database (Drizzle + bun:sqlite)
- [x] `src/db/schema.ts` — all 6 tables (users, categories, products, stock_movements, orders, order_items) with barcode unique index
- [x] `drizzle.config.ts` → `bun run db:generate` (committed migrations in `drizzle/`)
- [x] `src/db/index.ts` — bun:sqlite connection + PRAGMAs (WAL, foreign_keys ON, busy_timeout 5000)
- [x] `src/db/migrate.ts` — creates `data/` dir, runs migrator; run it successfully

### 3. App skeleton + cross-cutting
- [x] `src/plugins/error.ts` — `AppError(status, code, message, details?)` + global `onError` → consistent `{ error: { code, message, details? } }`
- [x] `src/index.ts` — CORS (localhost:5173), Swagger at `/swagger`, `GET /api/health`; verify server boots

### 4. Auth
- [x] `src/plugins/auth.ts` — JWT plugin (12h exp) + `auth` macro (`{ auth: true }` / `{ auth: 'admin' }`) injecting `user` into context
- [x] `src/modules/auth.ts` — `POST /api/auth/login` (Bun.password.verify), `GET /api/auth/me`

### 5. Seed
- [x] `src/db/seed.ts` — admin/cashier users, 6 Thai categories + ~26 Meow Mart products from `pos-web/src/data.ts` (satang prices, EAN-13 barcodes), opening-stock movements; idempotent + `--force`
- [x] Run seed; verify login via curl

### 6. Users & Categories modules
- [x] `src/modules/users.ts` — admin CRUD (409 on duplicate username / self-delete / FK restrict)
- [x] `src/modules/categories.ts` — GET with productCount; admin create/update/delete (409 if referenced)

### 7. Products module
- [x] `GET /api/products` — search (name LIKE / exact barcode), category_id, low_stock, pagination
- [x] `GET /api/products/barcode/:barcode` — indexed scanner lookup (declared before `/:id`)
- [x] `GET /api/products/:id`
- [x] `POST /api/products` — admin; 409 BARCODE_TAKEN; initial stock creates an `'in'` movement in same transaction
- [x] `PATCH /api/products/:id` — admin; excludes quantity_in_stock (stock only via `/stock/*`); bumps updatedAt
- [x] `DELETE /api/products/:id` — admin; 409 PRODUCT_IN_USE

### 8. Stock module (admin)
- [x] Shared guarded-update helper (atomic check-and-decrement, 409 INSUFFICIENT_STOCK)
- [x] `POST /api/stock/restock` (type `in`, +q) / `POST /api/stock/adjust` (signed, reason required) / `POST /api/stock/damaged` (stored −q)
- [x] `GET /api/stock/movements` — filters (product_id, type, from/to), paginated, joined product + user names

### 9. Orders / checkout
- [x] `POST /api/orders` — resolve items by product_id or barcode, one SQLite transaction: guarded stock decrement + price/cost snapshots + `'out'` movements; cash change calculation; rollback on insufficient stock
- [x] `GET /api/orders` — date/payment filters, paginated, items_count + cashier name
- [x] `GET /api/orders/:id` — order + items joined to products

### 10. Reports (dashboard)
- [x] `src/lib/dates.ts` — `YYYY-MM-DD` (Asia/Bangkok) → epoch-ms range
- [x] `GET /api/reports/summary` — revenue, order_count, items_sold, avg_per_order
- [x] `GET /api/reports/sales-over-time` — daily series (default current month)
- [x] `GET /api/reports/top-products?limit=5`
- [x] `GET /api/reports/sales-by-category`
- [x] `GET /api/reports/low-stock?limit=8` — `quantity_in_stock <= reorder_level`
- [x] `GET /api/reports/profit` — **admin only**; revenue/cost/profit/margin + by_day from order_items snapshots
- [x] `GET /api/reports/recent-orders?limit=6`

### 11. Tests & verification
- [x] `tests/api.test.ts` — bun test with `DB_FILE=:memory:` via `app.handle()`: login, barcode lookup, checkout happy path, insufficient-stock rollback, role guards
- [x] Full curl smoke run (see Verification section below)

---

## Fixed decisions

- **Money = integer satang** (1 THB = 100). All price/amount fields are integers end-to-end — no floats. (SQLite has no decimal type; the frontend divides by 100 for display later.)
- **Timestamps = epoch milliseconds** (`integer(..., { mode: 'timestamp_ms' })`); report grouping uses `strftime(..., '+07:00')` (Asia/Bangkok).
- **API prefix `/api`**; JWT bearer auth (`@elysiajs/jwt`), `Bun.password` (argon2id) hashing; roles `admin` | `cashier`.
- Payment methods: `'cash' | 'promptpay' | 'card'`.
- FKs `ON DELETE RESTRICT` — deleting referenced products/categories/users returns 409; sales history is immutable.

## Folder structure

```
backend/
├── .env / .env.example        # PORT=3000, JWT_SECRET=..., DB_FILE=./data/pos.db
├── .gitignore                  # data/, .env, node_modules/
├── drizzle.config.ts
├── drizzle/                    # committed SQL migrations
├── data/                       # pos.db (gitignored)
├── src/
│   ├── index.ts                # app composition: error, cors, swagger, modules, listen
│   ├── env.ts
│   ├── db/{schema.ts, index.ts, migrate.ts, seed.ts}
│   ├── plugins/{auth.ts, error.ts}
│   ├── lib/dates.ts
│   └── modules/{auth,users,categories,products,stock,orders,reports}.ts
└── tests/api.test.ts
```

Each module is an Elysia feature plugin (`new Elysia({ prefix: '/products' })`) mounted under a parent `{ prefix: '/api' }`.

## Database schema (from the DBML)

| Table | Columns (all PKs = integer autoincrement) |
|---|---|
| `users` | username (unique), password_hash, name, role `'admin'\|'cashier'`, created_at |
| `categories` | name |
| `products` | category_id FK, **barcode (unique index — scanner fast path)**, name, description, cost_price, sale_price, quantity_in_stock (default 0), reorder_level (default 5), image_url, created_at, updated_at; index on category_id |
| `stock_movements` | product_id FK, user_id FK, type `'in'\|'out'\|'adjustment'\|'damaged'`, quantity (**signed**), reason, created_at; index (product_id, created_at) |
| `orders` | user_id FK (cashier), total_amount, payment_method `'cash'\|'promptpay'\|'card'`, received_amount, change_amount, discount (default 0), description, created_at; index on created_at |
| `order_items` | order_id FK, product_id FK, quantity, cost_price_at_sale, unit_price, subtotal (snapshots for historical profit); indexes on order_id, product_id |

Connection (`src/db/index.ts`): `new Database(env.DB_FILE, { create: true })` + PRAGMAs `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`, wrapped with `drizzle(sqlite, { schema })`. Migration workflow: `drizzle-kit generate` → `migrate(db, { migrationsFolder: './drizzle' })` (generate+migrate, not `push`, so migrations are committed and reproducible).

## Auth & role matrix

`plugins/auth.ts` registers JWT (payload `{ sub, role, name }`, 12h exp) and an Elysia **macro** so routes declare `{ auth: true }` or `{ auth: 'admin' }`; the macro verifies the Bearer token, returns 401/403, and injects `user` into route context.

| Area | cashier | admin |
|---|---|---|
| `POST /api/auth/login` | public | public |
| `GET /api/auth/me` | ✅ | ✅ |
| users CRUD | — | ✅ |
| categories/products **read** + barcode lookup | ✅ | ✅ |
| categories/products **create/update/delete** | — | ✅ |
| stock mutations + movement history | — | ✅ |
| checkout, order list/detail | ✅ | ✅ |
| reports (except profit) | ✅ | ✅ |
| `GET /api/reports/profit` (exposes cost data) | — | ✅ |

Seed users: `admin`/`admin123`, `cashier`/`cashier123`.

## API conventions

- TypeBox (`t.`) validation on every body/query/params.
- List endpoints return `{ items, total, page, limit }` (limit max 200).
- Errors return `{ error: { code, message, details? } }` — codes include `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION`, `PRODUCT_NOT_FOUND`, `BARCODE_TAKEN`, `PRODUCT_IN_USE`, `INSUFFICIENT_STOCK`, `INTERNAL`.
- Date filters `from`/`to` as `YYYY-MM-DD`, interpreted in Asia/Bangkok.

## Checkout transaction pattern (core correctness piece)

Drizzle's bun-sqlite driver is synchronous; a throw rolls back everything:

```ts
db.transaction((tx) => {
  const created = tx.insert(orders).values({...}).returning().get();
  for (const line of lines) {
    const res = tx.update(products)
      .set({ quantityInStock: sql`${products.quantityInStock} - ${line.qty}`, updatedAt: new Date() })
      .where(and(eq(products.id, line.id), gte(products.quantityInStock, line.qty)))
      .run();
    if (res.changes === 0) throw new AppError(409, 'INSUFFICIENT_STOCK', ...);
    tx.insert(orderItems).values({ ...priceAndCostSnapshots }).run();
    tx.insert(stockMovements).values({ type: 'out', quantity: -line.qty, reason: `order #${created.id}`, ... }).run();
  }
  return created;
});
```

The `WHERE quantity_in_stock >= qty` guard + `changes === 0` check makes check-and-decrement atomic (no read-then-write race). The same guarded-update helper is reused by `/stock/*`.

Checkout rules: resolve each line by `product_id` or `barcode` (400 if neither, 404 if unknown, merge duplicate lines); `total = Σ(sale_price·qty) − discount` (reject discount > sum); cash requires `received_amount ≥ total` → `change = received − total` (non-cash: received = total, change 0).

## Verification

```
cd backend
bun run db:migrate && bun run db:seed
bun run dev        # http://localhost:3000, Swagger at /swagger
```

Smoke sequence (curl):
1. Login as admin → capture token.
2. `POST /api/products` (barcode `8850000000015`, stock 10) → 201.
3. `GET /api/products/barcode/8850000000015` → 200; unknown barcode → 404.
4. `POST /api/orders` `{ items: [{ barcode, quantity: 3 }], payment_method: "cash", received_amount: total+1000 }` → 201 with correct change.
5. Product stock now 7; `GET /api/stock/movements?product_id=…` shows `'out'` −3.
6. Order with quantity 999 → 409 and stock still 7 (rollback proven).
7. `/api/reports/summary` matches step-4 total; `/reports/profit` with cashier token → 403.
8. Cashier on `POST /api/products` → 403; no token → 401.
