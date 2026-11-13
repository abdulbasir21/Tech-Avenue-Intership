# Implementation Log: Inventory Management System Database Layer

**Stack:** Node.js, Express, TypeScript, PostgreSQL (Neon), Prisma ORM  
**Scope:** Single company, single store, office supplies & IT consumables only (not asset management).

---

## Architecture & Foundational Decisions

1. **Dual Connection Strings (Neon Serverless Postgres):**
   - Application queries run through the connection pooler via `DATABASE_URL`.
   - Migration and DDL tasks (via Prisma Migrate) require session-level locks and advisory locks, which pgBouncer/connection poolers cannot support. Thus, direct connections use `DATABASE_URL_UNPOOLED` as `directUrl` in `schema.prisma`.
2. **Security & Secrets:**
   - `.env` files are explicitly excluded via root `.gitignore`.
   - `server/.env.example` is established with sanitized placeholders.
   - Connection strings and credentials are never printed, logged, or checked in.
3. **Database Model & Naming Conventions:**
   - Database tables and columns strictly follow PostgreSQL `snake_case`.
   - Prisma Client models and fields follow idiomatic TypeScript `camelCase`, using `@@map("table_name")` and `@map("column_name")`.
   - All relational Foreign Keys enforce `onDelete: Restrict` to safeguard audit integrity and prevent cascading accidental deletions. Soft deletion is handled via `is_active boolean` on masters and login accounts.
4. **Data Types:**
   - `bigint` mapped to `BigInt` (for high-volume ledger, notifications, recipient records, and audit logs).
   - `numeric(12,3)`, `numeric(12,2)`, `numeric(14,2)` mapped to `Decimal` with explicit `@db.Decimal(p, s)`.
   - `timestamptz` mapped to `DateTime @db.Timestamptz`.
   - `date` mapped to `DateTime @db.Date`.
   - `inet` mapped to `String? @db.Inet`.

---

## Log Entries

### Step 1: Project Setup & Prisma Initialization
- Initialized Node.js environment in `server/`.
- Installed Prisma 6.19.3 (`prisma` & `@prisma/client`) as the stable, battle-tested release with full support for declarative schema mapping and migrations.
- Configured `server/prisma/schema.prisma` with `provider = "postgresql"`, `url = env("DATABASE_URL")` (pooled connection for high concurrency application traffic) and `directUrl = env("DATABASE_URL_UNPOOLED")` (direct connection for DDL migrations and session locks).
- Secured environment configurations: Root and `server/.gitignore` ignore all `.env` files. Created sanitized `server/.env.example`.
- Verified live PostgreSQL connectivity on Neon without printing or leaking connection strings.
- Added TypeScript and developer tooling (`tsx`, `typescript`, `@types/node`, `bcryptjs`) for subsequent seed and verification steps.


### Step 2: Enums, Authentication & Shared Masters
- **7 Database Enums Defined:**
  - `po_status` (`draft`, `ordered`, `partially_received`, `received`, `cancelled`)
  - `request_status` (`pending`, `approved`, `rejected`, `partially_issued`, `issued`, `cancelled`)
  - `adjustment_type` (`increase`, `decrease`)
  - `adjustment_reason` (`damaged`, `lost`, `count_difference`, `other`)
  - `movement_type` (`goods_receipt`, `stock_issue`, `adjustment_increase`, `adjustment_decrease`)
  - `stock_alert_level` (`normal`, `low`, `critical`, `out_of_stock`)
  - `audit_action` (`create`, `update`, `deactivate`, `reactivate`, `status_change`, `stock_adjustment`)
- **8 Foundation & Master Models:**
  - `roles`: 3 fixed application roles (`admin`, `inventory_manager`, `employee`).
  - `users`: Login credentials with bcrypt hash, 1:1 with `employees`.
  - `departments`: Organizational department master.
  - `employees`: Physical recipients of stock, separate from login users.
  - `categories`: Flat categorization of office supplies and IT consumables.
  - `units`: Unit of measure with `allows_decimal` flag.
  - `suppliers`: Vendors selected on purchase orders.
  - `products`: SKU master holding minimum and critical stock thresholds.

### Step 3: Transactional Document Models
- `purchase_orders` & `purchase_order_items`: PO headers and line items. Line total computed and locked to `quantity_ordered * unit_price`.
- `goods_receipts` & `goods_receipt_items`: Deliveries against a PO line. Enables partial delivery tracking.
- `stock_requests` & `stock_request_items`: Internal employee requests and line approval quantities.
- `stock_issues` & `stock_issue_items`: Physical handover of approved items to employees.
- `stock_adjustments`: Discrete manual corrections with mandatory textual justifications and categorized reasons.

### Step 4: Inventory, Ledger & Audit Logs
- `inventory_balances`: 1:1 with products (`product_id` is PK and FK). Acts as a derived query cache of the ledger.
- `stock_movements`: Append-only single source of truth ledger. Carries signed `quantity_change`, `balance_after`, and exactly one of three unique source foreign keys.
- `notifications`: Alert events emitted only upon alert-tier worsening.
- `notification_recipients`: M:N delivery tracker per user with read state consistency.
- `audit_logs`: Polymorphic system-wide audit trail with snapshot `jsonb` old/new values and client IP address.

### Step 5: Raw SQL Migration with Advanced Constraints & Triggers
- Generated baseline migration using `prisma migrate dev --create-only`.
- Appended database-level business logic that PSL cannot natively express:
  - 17 DBML-defined `CHECK` constraints (e.g., `chk_products_min_stock`, `chk_products_critical_stock`, `chk_po_dates`, `chk_poi_qty_positive`, `chk_poi_line_total`, `chk_sr_rejection`, `chk_sa_reason_matches_type`, `chk_bal_no_negative_stock`, `chk_mov_nonzero`, `chk_mov_balance_nonneg`, `chk_mov_single_source`, `chk_mov_type_sign_source`, `chk_nr_read_consistency`).
  - Single-source rule on `stock_movements`: `num_nonnulls(goods_receipt_item_id, stock_issue_item_id, stock_adjustment_id) = 1`.
  - Enforced append-only immutability on `stock_movements` using PostgreSQL trigger function `trg_prevent_stock_movements_mutation()` blocking any `UPDATE` or `DELETE`.
- Successfully applied migration `20261112160116_init_inventory_schema` to Neon Postgres.

### Step 6: Database Seeding
- Created `server/prisma/seed.ts` and configured `package.json` seed runner.
- Seeded standard 3 roles (`admin`, `inventory_manager`, `employee`).
- Seeded base departments (`Information Technology`, `Human Resources`, `Finance & Accounts`, `Operations`).
- Seeded units of measure (`pcs`, `box`, `ream`, `pack`).
- Seeded initial categories (`IT Consumables`, `Office Supplies`, `Paper & Printing`).
- Seeded initial employee (`EMP-001`, `System Administrator`) and admin user account with bcrypt-hashed credentials.

### Step 7: Comprehensive Verification & Defense Evidence
- Executed `prisma validate` and `prisma migrate status`: Confirmed schema valid and migrations in sync.
- Queried PostgreSQL `information_schema.tables`: Confirmed exactly 22 application tables + `_prisma_migrations`.
- Verification Script Executed (`server/prisma/verify.ts`) with live assertions:
  1. Negative `quantity_on_hand` in `inventory_balances` was **REJECTED** by `chk_bal_no_negative_stock`. Valid balance accepted.
  2. `quantity_ordered = 0` in `purchase_order_items` was **REJECTED** by `chk_poi_qty_positive`. Valid ordered quantity accepted.
  3. `stock_movements` row with two source links was **REJECTED** by `chk_mov_single_source`. Single source movement accepted.
  4. `UPDATE` on `stock_movements` was **REJECTED** by `trg_stock_movements_no_update_delete`.
  5. `DELETE` on `stock_movements` was **REJECTED** by `trg_stock_movements_no_update_delete`.
  6. Damaged adjustment with type `increase` was **REJECTED** by `chk_sa_reason_matches_type`. Valid damaged decrease adjustment accepted.
