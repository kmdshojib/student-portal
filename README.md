# Student Portal

> Next.js + TypeScript application for managing students, attendance, payments, exams, and guardian reporting.

## Overview

This repository implements a school/student portal web application with an admin-facing dashboard and APIs for core operations: student registration, attendance tracking, payments, exam marks, guardian reports, and notifications. It uses the Next.js App Router (app/), TypeScript, and a component-driven UI located under `components/`.

## Key Features

- **Authentication & Admin**: admin login and protected admin flows under `app/admin` and server routes in `app/api/auth`.
- **Student Management**: registration, summary, and update flows for students (`app/student-registration`, `app/student-summary`).
- **Attendance**: record and view attendance via UI pages and APIs (`app/attendance`, `app/api/attendance`).
- **Exam Marks**: add, list, and edit exam marks (`app/exam-marks`, `app/api/exam-marks`).
- **Payments & Billing**: manage payments and batch payments with APIs under `app/api/payments` and pages in `app/payments` and `app/batch-payments`.
- **Guardian Reports**: generate guardian summaries and reports (`app/guardian-report`, `app/api/guardian-summary`).
- **Notifications**: notification system scaffolding in `app/notify` and `app/api/notify`.
- **APIs**: server routes for most features under `app/api/*` for REST-like operations.
- **Reusable UI**: many UI primitives and patterns in `components/ui/` (buttons, tables, forms, dialogs, toasts, etc.).

## Tech Stack

- Next.js (App Router)
- TypeScript
- Node / pnpm
- Server routes (app/api)
- Plain CSS in `app/globals.css` (project may use a design system in `components/ui`)

## Project Structure (highlight)

- `app/` — Next.js pages, layouts, and API routes (main application)
- `components/` — shared components and UI primitives (`components/ui/`)
- `db/` — database configuration (`db/db.config.ts`)
- `model/` — data models and database helpers
- `lib/` — utilities and mock data
- `hooks/` — custom hooks (e.g., `use-toast`, `use-mobile`)
- `public/` — static assets

## Setup & Run

1. Install dependencies:

```
pnpm install
```

2. Run the dev server:

```
pnpm dev
```

3. Open http://localhost:3000 (or the port shown in console).

Note: Review `db/db.config.ts` for database connection details and set any required environment variables before running in production.


## Files of Interest

- [db/db.config.ts](db/db.config.ts) — database configuration
- [app/page.tsx](app/page.tsx) — main landing page
- [app/admin/login/page.tsx](app/admin/login/page.tsx) — admin login
- [components/navbar.tsx](components/navbar.tsx) — top navigation

---

If you want, I can (choose one):

- run the project locally and verify startup,
- expand the README with environment variables and sample `.env` values,