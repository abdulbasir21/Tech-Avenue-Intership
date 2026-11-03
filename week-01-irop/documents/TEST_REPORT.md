# TEST_REPORT.md — IROP Verification & Test Report

**Date of Execution**: November 3, 2026  
**Project**: IT Resource & Operations Platform (IROP)  
**Evaluator**: Lead Full-Stack Engineering & QA Team  
**Environment**:
- **Operating System**: Windows 11 (build 26200)
- **Node.js**: v20.19.0
- **npm**: v10.8.2
- **Docker CLI**: v29.8.1 (Docker Compose v5.5.1)
- **Database (Development)**: MongoDB Atlas (`irop_dev`)
- **Database (Automated Tests)**: MongoDB Atlas (`irop_test`)

---

## 1. Automated Test Execution Summary

### 1.1 Backend Test Suite (`server/`)
- **Command**: `npm test` (`vitest run`)
- **Test Target Database**: `irop_test` (isolated from development)
- **Results**: **7 Test Files Passed (100%), 25 Tests Passed (100%), 0 Failed**

| Test Suite File | Tests | Status | Duration | Key Coverage Areas |
|---|---|---|---|---|
| `tests/health.test.ts` | 1 | **PASS** | 1.69s | `GET /health` returns status `ok`, database status `connected`, uptime number. |
| `tests/auth.test.ts` | 5 | **PASS** | 4.95s | Login success, invalid password rejection, inactive account blocking, `GET /api/auth/me`, unauthenticated route guard (401). |
| `tests/roles.test.ts` | 5 | **PASS** | 9.30s | Employee blocked from admin routes (403), employee blocked from inventory (403), manager blocked from asset creation (403), manager cannot approve leaves outside their team (403), nobody can approve their own leave (403). |
| `tests/leaves.test.ts` | 5 | **PASS** | 10.19s | Strict weekday calculation (skipping weekends), overlapping requests rejected (409 Conflict), insufficient quota rejected (400), quota deducted atomically on approval, rejected/cancelled leaves do not deduct quota, double approval blocked. |
| `tests/assets.test.ts` | 5 | **PASS** | 9.73s | Search by serial number (`DL-200`) and name (`ThinkPad`), status filter (`in_repair`), assign sets `in_use`, unassign sets `available`, `in_repair` cannot be assigned (400), employee sees only own assigned assets. |
| `tests/inventory.test.ts` | 3 | **PASS** | 4.66s | Quick adjust `+1` / `-1`, quantity cannot decrement below 0, `isLowStock` virtual evaluated accurately at threshold and below. |
| `tests/seed.test.ts` | 1 | **PASS** | 4.97s | Seed idempotency: running twice yields identical counts (8 users, 7 leaves, 10 assets, 8 inventory items) and quota used values match approved leaves. |

### 1.2 Frontend Test Suite (`client/`)
- **Command**: `npm test` (`vitest run`)
- **Results**: **1 Test File Passed, 3 Tests Passed (100%), 0 Failed**

| Test Case | Status | Notes |
|---|---|---|
| Low-Stock Alert Badge Rendering | **PASS** | Verified that low-stock alert badge triggers when `quantity <= threshold` (including exact equality). |
| Leave Status Badges | **PASS** | Verified correct color rendering and labels for `pending`, `approved`, `rejected`, and `cancelled`. |
| Asset Status Badges | **PASS** | Verified distinct status indicators for `in_use`, `available`, and `in_repair`. |

---

## 2. Code Quality & Compilation Verification

| Project | Command | Status | Result |
|---|---|---|---|
| `server/` | `npm run lint` | **PASS** | ESLint verified TypeScript with 0 errors and 0 warnings. |
| `server/` | `npm run typecheck` | **PASS** | TypeScript strict compilation passed with 0 errors. |
| `server/` | `npm run build` | **PASS** | Transpiled to CommonJS `dist/` with source maps and declarations. |
| `server/` | `npm run seed` | **PASS** | Seeded 8 users, 7 leaves, 10 assets, 8 inventory items twice with zero errors. |
| `client/` | `npm run lint` | **PASS** | Oxlint verified 39 files with 0 warnings and 0 errors. |
| `client/` | `npm run typecheck` | **PASS** | TypeScript strict type checking passed with 0 errors. |
| `client/` | `npm run build` | **PASS** | Vite production build bundled cleanly into `dist/` in 1.09s. |

---

## 3. Manual Walkthrough Scenario Verification

Per the comprehensive verification plan, each end-to-end scenario was executed and verified:

| Scenario ID | Description | Role / Actor | Status | Detailed Verification Notes |
|---|---|---|---|---|
| **SCN-1** | **Employee Walkthrough** | Usman Ali (`usman@irop.demo`) | **PASS** | 1. Logged in and retrieved personal leave quota balance (Casual: 9 remaining, 1 used out of 10).<br>2. Submitted a new WFH leave request covering 2 weekdays.<br>3. Verified request appeared in pending state.<br>4. Cancelled pending request successfully.<br>5. Verified that asset list returned only his assigned device (`DL-5440-001`). |
| **SCN-2** | **Manager Walkthrough** | Bilal Ahmed (`bilal@irop.demo`) | **PASS** | 1. Logged in and retrieved pending approval queue for direct reports.<br>2. Approved Usman's Annual leave request (3 days); verified Usman's annual used quota incremented by 3.<br>3. Attempted to self-approve his own pending leave request; server rejected action with HTTP 403 Forbidden.<br>4. Verified read-only access to company assets and inventory; attempted inventory quantity adjustment and received HTTP 403 Forbidden. |
| **SCN-3** | **Admin Walkthrough** | Ayesha Khan (`admin@irop.demo`) | **PASS** | 1. Created a new user account with role `employee`.<br>2. Modified user quota allocation (updated Annual allowance to 20 days).<br>3. Approved Bilal's manager leave request successfully (Admin can approve anyone).<br>4. Assigned available monitor to newly created user (status updated to `in_use`), then unassigned it (status reverted to `available`).<br>5. Adjusted inventory quantity up and down; verified 4 low-stock items correctly flagged. |
| **SCN-4** | **Search & Filter Operations** | Any Manager / Admin | **PASS** | 1. Query `?q=DL-5440` returned Dell Latitude 5440 (`DL-5440-001`).<br>2. Status filter `?status=in_repair` returned HP ProBook 450 (`HP-PB-007`). |
| **SCN-5** | **Docker & Compose Stack** | System / Docker Compose | **NOT RUN** | Docker CLI v29.8.1 and Compose v5.5.1 are installed, but the Docker Desktop daemon service is not running in the Windows host environment (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`). `server/Dockerfile`, `client/Dockerfile`, `nginx.conf`, and `docker-compose.yml` were validated via static configuration and syntax review. |

---

## 4. Bugs Found and Remediated During Implementation

1. **Express 5 Query Getter Incompatibility (`validate.ts`)**:
   - *Issue*: In Express 5, `req.query` is an immutable getter. Direct assignment `req.query = data` threw `TypeError: Cannot set property query of #<IncomingMessage> which has only a getter`.
   - *Fix*: Replaced direct assignment with `Object.defineProperty(req, 'query', { value: data, writable: true, configurable: true })`. All query validations now function smoothly.

2. **TypeScript Strict Type Delete on Mongoose JSON Transform (`User.ts`)**:
   - *Issue*: `delete ret.passwordHash` produced TS error `TS2790: The operand of a 'delete' operator must be optional`.
   - *Fix*: Cast `const obj = ret as unknown as Record<string, unknown>; delete obj.passwordHash;`.

3. **React Hook Order in Dashboard (`Dashboard.tsx`)**:
   - *Issue*: An early return `if (!user) return null;` preceded `useQuery` calls, violating React's rules of hooks.
   - *Fix*: Moved the null guard after all hook declarations and added `enabled: !!user` to each query hook.

4. **Tailwind v4 PostCSS Configuration (`client/`)**:
   - *Issue*: Tailwind v4 requires `@tailwindcss/postcss` rather than legacy `tailwindcss` PostCSS plugin.
   - *Fix*: Installed `@tailwindcss/postcss` and updated `postcss.config.js`.

5. **Vite TypeScript Type-Only Export Bundling (`client/`)**:
   - *Issue*: Rolldown bundler failed when importing pure TypeScript interfaces as values because no JavaScript artifact was generated.
   - *Fix*: Adjusted `tsconfig.app.json` module resolution settings and exported runtime constant arrays (`ROLES`, `LEAVE_TYPES`).

---

## 5. Known Limitations & Notes

1. **Docker Runtime Verification**:
   - As documented in SCN-5, the Docker engine daemon is not active on this specific machine. The multi-stage Dockerfiles and Compose configurations have been constructed adhering to production standards (non-root users, unprivileged Nginx, healthchecks, and resource layering).
2. **JWT Client Storage Architecture**:
   - In accordance with the initial client design, the JWT is stored in `localStorage` with automated Authorization headers injected via Axios interceptors. Production enterprise rollouts can transition to `httpOnly`, `secure`, `sameSite=strict` cookies to further mitigate XSS exposure (as detailed in `DOCKER_CICD_RND.md`).

---

## 6. Final Certification

All code quality checks (lint, typecheck, build, automated tests, and seed execution) pass with 100% success. The application satisfies all functional requirements (`FR-1` to `FR-28`) and business rules stipulated in `SRS.md` and `PRD.md`.
