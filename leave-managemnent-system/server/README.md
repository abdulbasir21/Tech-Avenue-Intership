# Leave Management System — Backend API

Express + TypeScript + Prisma 6 + PostgreSQL (Neon) backend server for the Leave Management System.

## Tech Stack

- **Runtime & Framework:** Node.js, Express, TypeScript (`strict: true`)
- **Database & ORM:** PostgreSQL (Neon), Prisma `6.x`
- **Validation & Security:** Zod, `bcrypt` (cost 12), `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`
- **Email:** Nodemailer (SMTP) / Brevo Transactional Email HTTPS API / Console transport (logged in `email_logs`)
- **API Docs:** OpenAPI 3.0 via `swagger-jsdoc` + `swagger-ui-express`, exported to OpenAPI JSON and Postman collection
- **Testing:** Vitest + Supertest

---

## Setup & Installation

```bash
cd server
npm install
```

### Environment Variables

Copy `.env.example` to `.env` (never commit `.env`):

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: Neon pooled connection string (`-pooler` host) for runtime queries
- `DIRECT_URL`: Neon unpooled connection string (without `-pooler`) for Prisma migrations
- `PORT`: Server port (default `5000`)
- `CORS_ORIGINS`: Comma-separated allowed origins (default `http://localhost:3000`)
- `PUBLIC_API_URL`: Optional public Render URL added to Swagger servers
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: 64-character random secrets
- `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_REMEMBER_EXPIRES_IN`, `JWT_RESET_EXPIRES_IN`
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_SAMPLE_PASSWORD`, `SEED_ORG_NAME`
- `EMAIL_PROVIDER`: `console` (default), `smtp`, or `brevo_api`
- `EMAIL_FROM`, and `SMTP_*` (when `smtp`) or `BREVO_API_KEY` (when `brevo_api`)

---

## Database Migrations & Seeding

```bash
# Validate Prisma schema
npx prisma validate

# Create/apply migrations locally
npm run db:migrate

# Apply existing migrations (production / CI)
npm run db:deploy

# Seed initial data (idempotent)
npm run db:seed

# Verify tables, enums, CHECK constraints, and row counts
npm run db:verify

# Open Prisma Studio
npm run db:studio
```

### Seeded Test Accounts

All seeded passwords are stored in `server/.env` (`SEED_ADMIN_PASSWORD` and `SEED_SAMPLE_PASSWORD`) and are never printed in logs or documentation.

| Role | Email | Employee Code | Notes |
| --- | --- | --- | --- |
| `ADMIN` | `admin@example.com` (or `SEED_ADMIN_EMAIL`) | `EMP-0001` | Must change password on first login |
| `MANAGER` | `manager@example.com` | `EMP-0002` | Sample manager in `IT` department |
| `EMPLOYEE` | `employee@example.com` | `EMP-0003` | Sample employee reporting to `EMP-0002` |

### Cleaning Up Sample Seed Data

Before going live (or when you want to remove the sample manager, sample employee, and empty sample departments `IT`, `HR`, `Accounts` without touching the Admin or Organization):

```bash
npm run db:seed:cleanup-samples
```

---

## Running the Server

```bash
# Development (watch mode)
npm run dev

# Production build & start
npm run build
npm start
```

### Swagger / OpenAPI Documentation

Once the server is running (default port `5000`):
- **Swagger UI:** `http://localhost:5000/api-docs`
- **Raw OpenAPI JSON:** `http://localhost:5000/api-docs.json`

### Exporting OpenAPI & Postman Collection

```bash
# Write docs/openapi.json
npm run docs:export

# Convert docs/openapi.json -> docs/leave-management.postman_collection.json
npm run docs:postman
```

---

## Running Tests

```bash
npm test
```

---

## Deploying to Render

1. Create a Web Service pointing to the `server` root directory.
2. **Build Command:**
   ```bash
   npm install && npx prisma generate && npm run build
   ```
3. **Start Command:**
   ```bash
   npx prisma migrate deploy && npm start
   ```
4. **Environment Variables on Render:**
   - Set `DATABASE_URL` (pooled Neon URL) and `DIRECT_URL` (unpooled Neon URL).
   - Set `EMAIL_PROVIDER=brevo_api`, `BREVO_API_KEY`, and `EMAIL_FROM` (Render free tier blocks outbound SMTP ports, so `brevo_api` uses HTTPS).
   - Set `PUBLIC_API_URL` to your Render service URL (e.g., `https://your-service.onrender.com`) so Swagger UI targets the deployed server.
   - Set `CORS_ORIGINS`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `NODE_ENV=production`.
