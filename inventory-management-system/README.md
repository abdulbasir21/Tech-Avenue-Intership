# Inventory Management System with Shared Masters

Single-company inventory management system for **office supplies and IT consumables** built with **Node.js, Express, TypeScript, PostgreSQL (Neon), Prisma ORM, React, Vite, and Tailwind CSS**.

---

## Modules Implemented

1. **Database Layer (`server/prisma/`)**
   - 22 normalized tables across 9 modules (`schema.prisma`), 7 PostgreSQL enums, `onDelete: Restrict` on all foreign keys.
   - Raw SQL migration (`migrations/20261112160116_init_inventory_schema/migration.sql`) enforcing 17 named `CHECK` constraints, `num_nonnulls() = 1` single-source ledger rule on `stock_movements`, and an append-only trigger blocking `UPDATE`/`DELETE` on `stock_movements`.
   - Idempotent master seed (`prisma/seed.ts`) and constraint verification (`prisma/verify.ts`).

2. **User Authentication & Management Module (`server/src/` & `client/src/`)**
   - Admin-managed user lifecycle (no self-registration or email reset flows).
   - `httpOnly` cookie JWT authentication (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`) with `bcryptjs`, `helmet`, `cors`, Zod validation, and login rate limiting.
   - Admin-only CRUD APIs (`GET/POST /api/users`, `PATCH/DELETE /api/users/:id`, `GET /api/roles`, `GET /api/departments`) with self-protection and `ON DELETE RESTRICT` deactivation fallback.
   - React + TypeScript + Tailwind UI: Login page, Admin Dashboard with Users table (search, role/status filters, pagination, Add/Edit/Delete modals), and role-guarded Welcome page for non-admin roles.

---

## Running Locally

### 1. Backend (`server/`)
```bash
cd server
npm install
cp .env.example .env   # Fill in DATABASE_URL, DATABASE_URL_UNPOOLED, JWT_SECRET, ADMIN_PASSWORD
npx prisma migrate deploy
npx prisma db seed
npm run dev            # Runs on http://localhost:5000
```

### 2. Frontend (`client/`)
```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm run dev            # Runs on http://localhost:5173
```

---

## Verification Commands
```bash
cd server
npm run typecheck
npm run build
npx tsx prisma/verify.ts
npx tsx prisma/verify-auth.ts
```
