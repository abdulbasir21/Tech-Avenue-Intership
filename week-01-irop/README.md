# IT Resource & Operations Platform (IROP)

[![CI Pipeline](https://github.com/tech-avenue/irop/actions/workflows/ci.yml/badge.svg)](https://github.com/tech-avenue/irop/actions/workflows/ci.yml)
[![Docker Publish](https://github.com/tech-avenue/irop/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/tech-avenue/irop/actions/workflows/docker-publish.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)

> **IROP (IT Resource & Operations Platform)** is a production-grade internal platform for modern technology organizations to manage HR leave tracking, hardware/software assets, and office supply inventory in a single, high-performance operational portal.

---

## 📑 Project Documentation Index

All primary project artifacts, architectural designs, and software requirements are organized in the [`documents/`](./documents) directory in both GitHub Markdown and export-ready PDF format ([`documents/pdf/`](./documents/pdf)):

1. [**Systems R&D Report (SYSTEMS_RND.md)**](./documents/SYSTEMS_RND.md) ([PDF](./documents/pdf/SYSTEMS_RND.pdf)) — Architectural research and feature analysis for Leave Management, Asset Management, and Inventory Management Systems with tech stack justifications.
2. [**Docker & CI/CD Deployment R&D Report**](./documents/DOCKER_CICD_RND.md) ([PDF](./documents/pdf/DOCKER_CICD_RND.pdf)) — Containerization research, multi-stage Docker build strategies, security, GitHub Actions workflows, GHCR publishing, and deployment options.
3. [**Product Requirements Document (PRD)**](./documents/PRD.md) ([PDF](./documents/pdf/PRD.pdf)) — Problem statement, goals, user personas, MoSCoW feature breakdown, user stories, and measurable success metrics.
4. [**Software Requirements Specification (SRS)**](./documents/SRS.md) ([PDF](./documents/pdf/SRS.pdf)) — Numbered functional requirements (`FR-1` to `FR-28`), non-functional requirements, data schemas, business rules, and constraints.
5. [**REST API Specification (API.md)**](./documents/API.md) ([PDF](./documents/pdf/API.pdf)) — Mongoose schemas, indexes, virtuals, role-based endpoint permissions, request/response contracts, and error structures.
6. [**Architectural Decisions & Assumptions (DECISIONS.md)**](./documents/DECISIONS.md) ([PDF](./documents/pdf/DECISIONS.pdf)) — Trade-offs, design rationale, RBAC enforcement rules, atomic operations, and quota deduction mechanisms.
7. [**Quality Verification & Test Report (TEST_REPORT.md)**](./documents/TEST_REPORT.md) ([PDF](./documents/pdf/TEST_REPORT.pdf)) — Comprehensive scenario walkthrough with verification results covering automated tests, business rules, and walkthrough validation.

---

## 🚀 Key Features by Module

### 1. Leave Management System (LMS)
- **Role-Based Workflows**: Employees submit leave; direct managers review team requests; Administrators maintain company-wide oversight.
- **Dynamic Weekday Calculator**: Automatically computes working days (Mondays through Fridays), excluding weekends.
- **Strict Overlap Prevention**: Rejects overlapping pending or approved leave requests.
- **Atomic Quota Deductions**: Quotas are deducted **only** upon approval atomically via MongoDB `$inc` updates.
- **Quota Balances**: Real-time tracking of Total, Used, and Remaining days for Casual, Sick, Annual, and WFH allowances.

### 2. Asset Management System (AMS)
- **Hardware & Software License Lifecycle**: Track physical hardware (laptops, monitors, headsets) and digital software keys.
- **Status Lifecycle Control**: Transitions between `Available`, `In Use`, and `In Repair`.
- **Assignment Safeguards**: Assets marked `In Repair` cannot be assigned. Assigning sets status to `In Use`; unassigning restores status to `Available`.
- **Search & Filter**: Real-time debounced search by serial number, license key, or item name with status filtering.
- **Role Visibility**: Employees see only their assigned assets; Managers and Admins access full company inventory.

### 3. Inventory Management System (IMS)
- **Consumables & Office Supplies**: Stock management for cables, chargers, peripherals, and stationery.
- **Threshold Alerts**: Visual red **"Low Stock"** badge triggers whenever `quantity <= threshold` (including exact matches).
- **One-Click Quick Controls**: Admins adjust quantities using `+` and `-` buttons with zero-floor enforcement (`quantity >= 0`).
- **Role Permissions**: Full CRUD for Administrators; read-only visibility for Team Managers.

---

## 🛠️ Technology Stack Justification

| Layer | Technology | Justification |
|---|---|---|
| **Language** | TypeScript (Strict) | End-to-end type safety, eliminating runtime null pointer bugs and enforcing strict API request/response contracts. |
| **Backend** | Node.js & Express 5 | High throughput, asynchronous non-blocking I/O, lightweight footprint, and mature ecosystem for RESTful APIs. |
| **Database** | MongoDB & Mongoose | Flexible document model for organizational hierarchies and atomic schema updates (`$inc`). |
| **Validation** | Zod | Runtime validation for every request payload and environment variable, preventing malformed inputs. |
| **Authentication** | JWT + bcrypt | Industry-standard stateless authentication with bcrypt salted hashing (cost factor 10-12). |
| **Frontend** | React 18 & Vite | Blazing-fast HMR, component modularity, declarative state management, and optimized production chunking. |
| **Styling** | Tailwind CSS | Rapid utility-first styling with responsive layouts, accessible color contrast, and zero runtime CSS overhead. |
| **Data Fetching** | TanStack Query | Automatic caching, background refetching, mutation lifecycle, and optimistic UI updates. |
| **Containerization** | Docker & Compose | Multi-stage lightweight Alpine images, unprivileged non-root security (`USER node` & unprivileged Nginx), reproducible runtime. |
| **CI/CD** | GitHub Actions & GHCR | Automated linting, typechecking, testing against containerized MongoDB, and container image publishing to GHCR. |

---

## 🔑 Demo Accounts & Seed Credentials

The database can be seeded with a single command (`npm run seed`), which creates 8 sample users, 7 leave requests, 10 assets, and 8 inventory items.

**Universal Demo Password for All Accounts**: `Demo@1234`

| Role | Name | Email | Reporting Manager | Department |
|---|---|---|---|---|
| **Admin** | Ayesha Khan | `admin@irop.demo` | None | Operations |
| **Manager** | Bilal Ahmed | `bilal@irop.demo` | None | Engineering |
| **Manager** | Sara Malik | `sara@irop.demo` | None | QA & Support |
| **Employee** | Usman Ali | `usman@irop.demo` | Bilal Ahmed | Engineering |
| **Employee** | Hina Raza | `hina@irop.demo` | Bilal Ahmed | Engineering |
| **Employee** | Zain Abbas | `zain@irop.demo` | Bilal Ahmed | Engineering |
| **Employee** | Maryam Noor | `maryam@irop.demo` | Sara Malik | QA & Support |
| **Employee** | Daniyal Shah | `daniyal@irop.demo` | Sara Malik | QA & Support |

---

## 💻 How to Run Locally

### Prerequisites
- Node.js 20+ and npm 10+
- MongoDB instance (or MongoDB Atlas connection string)

### 1. Environment Configuration
Copy the template in `server/.env.example` to `server/.env`:
```bash
cd server
cp .env.example .env
```
Fill in your MongoDB connection string and a secret key:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/irop_dev?retryWrites=true&w=majority
MONGODB_URI_TEST=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/irop_test?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-secret-key-32-chars
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
```

### 2. Seed the Database
```bash
cd server
npm run seed
```

### 3. Start the Backend API Server
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
# Health check: http://localhost:5000/health
```

### 4. Start the Frontend Client
```bash
cd client
npm run dev
# Vite dev server starts on http://localhost:5173
```

---

## 🐳 Running with Docker & Compose

To spin up the complete isolated stack (MongoDB, Backend API, and Nginx Frontend):

```bash
docker compose up --build
```
- **Web Application**: `http://localhost:8080`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`
- **MongoDB**: `localhost:27017`

*Note*: By default, `docker-compose.yml` uses the local containerized MongoDB service. To point Docker Compose at MongoDB Atlas, set `MONGODB_URI` in `server/.env` and update the environment variable in `docker-compose.yml`.

---

## 🧪 Running Automated Tests & Code Quality Checks

### Backend Server (`server/`)
```bash
cd server
npm run lint         # ESLint TypeScript verification
npm run typecheck    # TypeScript strict compiler check
npm run build        # Production compilation
npm test             # Vitest test suite against irop_test
```

### Frontend Client (`client/`)
```bash
cd client
npm run lint         # Oxlint fast verification
npm run typecheck    # TypeScript compiler check
npm test             # Component and logic unit tests
npm run build        # Production bundle build
```

---

## 🌐 Production Deployment Architecture

- **Backend API**: Deployed to containerized platform (e.g. Render, Railway, or AWS ECS) using `server/Dockerfile`.
- **Frontend Client**: Deployed to CDN edge (e.g. Vercel, Netlify, or AWS CloudFront/S3) or served via unprivileged Nginx using `client/Dockerfile`.
- **Database**: Hosted on MongoDB Atlas with dedicated user credentials, network IP allowlists, and automatic daily snapshots.
- **Container Registry**: Automated multi-architecture images published to GitHub Container Registry (`ghcr.io/tech-avenue/irop-server` and `irop-client`).

---

## 📜 License
This project is developed as part of the Tech Avenue Internship Engineering Program under the ISC License.
