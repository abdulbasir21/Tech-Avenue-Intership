# Tech Avenue Internship

This repository houses all weekly project implementations, research & development (R&D) documentation, and deliverables completed during the **Tech Avenue Internship Engineering Program**.

---

## 📁 Internship Modules & Milestones

| Milestone | Project Directory | Core Focus & Systems Covered | Deliverables & Status |
|---|---|---|---|
| **Week 01** | [**`week-01-irop/`**](./week-01-irop) | **IT Resource & Operations Platform (IROP)**<br/>• Leave Management System (LMS)<br/>• Asset Management System (AMS)<br/>• Inventory Management System (IMS) | • [Source Code](./week-01-irop)<br/>• [Systems R&D](./week-01-irop/documents/SYSTEMS_RND.md)<br/>• [Docker & CI/CD R&D](./week-01-irop/documents/DOCKER_CICD_RND.md)<br/>• [Executive PDFs](./week-01-irop/documents/pdf)<br/>✅ **Complete** |
| **Week 02** | [**`inventory-management-system/`**](./inventory-management-system) | **Inventory Management System with Shared Masters**<br/>• Database layer: PostgreSQL (Neon), Prisma ORM, 22 tables, 17 CHECKs & append-only ledger trigger<br/>• Auth & User Management Module: Express + TypeScript JWT cookie auth, RBAC, Admin CRUD APIs<br/>• React + Vite + Tailwind CSS Admin Dashboard & Role-guarded UI | • [Project README](./inventory-management-system/README.md)<br/>• [Backend API & Prisma](./inventory-management-system/server)<br/>• [React Frontend](./inventory-management-system/client)<br/>• [ERD Specification (DBML/PDF/PNG)](./inventory-management-system/docs)<br/>✅ **Complete** |

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
├── inventory-management-system/   <-- Week 2 Full-Stack Auth & Database Layer
│   ├── docs/                      <-- ERD Blueprint (DBML, PDF, PNG)
│   ├── server/                    <-- Express + TypeScript + Prisma + Neon API
│   │   ├── prisma/                <-- Schema, Migrations, Seed & Verify Scripts
│   │   ├── src/                   <-- Auth & User Management Routes/Services
│   │   ├── .env.example           <-- Sanitized Environment Template
│   │   └── package.json           <-- Backend Dependencies & Scripts
│   ├── client/                    <-- React + Vite + TypeScript + Tailwind UI
│   │   ├── src/                   <-- AuthContext, Login, Admin Users Dashboard
│   │   ├── .env.example           <-- Sanitized Frontend Env Template
│   │   └── package.json           <-- Frontend Dependencies & Scripts
│   └── README.md                  <-- Week 2 Setup & Overview
├── README.md                      <-- Master Internship Overview
└── .gitignore                     <-- Repository-wide Exclusions
```

---

## 📜 License
Developed under the ISC License as part of the Tech Avenue Internship Engineering Program.
