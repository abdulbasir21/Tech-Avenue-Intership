# Tech Avenue Internship

This repository houses all weekly project implementations, research & development (R&D) documentation, and deliverables completed during the **Tech Avenue Internship Engineering Program**.

---

## 📁 Internship Modules & Milestones

| Milestone | Project Directory | Core Focus & Systems Covered | Deliverables & Status |
|---|---|---|---|
| **Week 01** | [**`week-01-irop/`**](./week-01-irop) | **IT Resource & Operations Platform (IROP)**<br/>• Leave Management System (LMS)<br/>• Asset Management System (AMS)<br/>• Inventory Management System (IMS) | • [Source Code](./week-01-irop)<br/>• [Systems R&D](./week-01-irop/documents/SYSTEMS_RND.md)<br/>• [Docker & CI/CD R&D](./week-01-irop/documents/DOCKER_CICD_RND.md)<br/>• [Executive PDFs](./week-01-irop/documents/pdf)<br/>✅ **Complete** |
| **Week 02** | [**`inventory-management-system/`**](./inventory-management-system) | **Inventory Management System with Shared Masters**<br/>• Single-company office supplies & IT consumables<br/>• Database layer with PostgreSQL (Neon Serverless) & Prisma ORM<br/>• Financial-grade append-only stock movement ledger | • [Database Schema & Migrations](./inventory-management-system/server/prisma)<br/>• [ERD Specification (DBML)](./inventory-management-system/docs/inventory-management-erd.dbml)<br/>• [ERD Diagrams (PDF & PNG)](./inventory-management-system/docs/inventory-management-erd.pdf)<br/>• [Master Seed Script](./inventory-management-system/server/prisma/seed.ts)<br/>• [Automated Constraint Verification](./inventory-management-system/server/prisma/verify.ts)<br/>✅ **Complete** |

---

## 🛠️ Repository Architecture

Each week's deliverable is organized into its own self-contained module directory:

```
Tech-Avenue-Intership/
├── week-01-irop/                   <-- Week 1 Full-Stack Platform & R&D
│   ├── client/                    <-- React 18 + Vite + Tailwind CSS Frontend
│   ├── server/                    <-- Express 5 + Node 20 + MongoDB API
│   ├── documents/                 <-- Systems R&D, Docker R&D, PRD, SRS
│   │   └── pdf/                   <-- Publication-Ready PDF Documents
│   ├── .github/                   <-- CI/CD Workflows
│   ├── docker-compose.yml         <-- Local Orchestration
│   └── README.md                  <-- Week 1 Detailed Documentation
├── inventory-management-system/   <-- Week 2 Enterprise Database Layer
│   ├── docs/                      <-- ERD Blueprint (DBML, PDF, PNG)
│   └── server/                    <-- Node.js + TypeScript + Prisma ORM + Neon
│       ├── prisma/
│       │   ├── schema.prisma      <-- 22 Models, 7 Enums, camelCase to snake_case
│       │   ├── migrations/        <-- DDL Migration + 17 CHECKs + Ledger Trigger
│       │   ├── seed.ts            <-- Roles, Depts, Units, Categories, Admin Seed
│       │   └── verify.ts          <-- Live Automated Constraint Verification Suite
│       ├── .env.example           <-- Sanitized Database Connection Template
│       ├── package.json           <-- Prisma 6.19.3 & TypeScript Dependencies
│       └── tsconfig.json          <-- Strict TypeScript Config
├── README.md                      <-- Master Internship Overview
└── .gitignore                     <-- Repository-wide Exclusions
```

---

## 📜 License
Developed under the ISC License as part of the Tech Avenue Internship Engineering Program.
