# DTC System — Context & Status
> Last updated: 2026-03-19

## Codespace & Repo
- Codespace: cuddly-enigma-69667jq5vvgq24gp9
- Repo: flashmarines-bit/dtc-sys (branch: main)
- Path: /workspaces/dtc-sys

## Stack
- .NET 10 API (port 5000) → src/Dtc.Api
- Next.js Internal Portal (port 3000) → frontend/
- Next.js Vendor Portal (port 4000) → frontend-vendor/
- PostgreSQL via Supabase (project: dtc-db, ID: tblxkretjdkvbjdwujof)
- Supabase Storage, Hangfire, PaddleOCR FastAPI (port 8000)

## Credentials Dev
- SysAdmin: sysadmin@dtc.local / SysAdmin@123
- Vendor: vendor@majujaya.com / Vendor@123

## Scripts
- bash dev.sh all              → start semua service + publish ports
- bash dev.sh stop             → stop semua
- bash dev.sh restart-api      → restart API only
- bash dev.sh restart-vendor   → restart Vendor Portal only
- bash dev.sh restart-frontend → restart Internal Portal only
- bash dev.sh migrate          → apply pending migrations
- bash dev.sh migration [name] → create new migration
- bash save.sh "message"       → commit & push semua (root + submodules)

## Modules Overview
### Module 1 — Physical Tracking
State machine: Draft→Submitted→Received→Assigned→UnderReview→Approved/Returned
QR code, handover OTP, audit trail, SLA monitoring, dashboard

### Module 2 — Document Library
Propose/review/approve/archive, file versioning, tags/category/search

### Module 3 — Vendor Submission
Vendor registration, PDF upload (5MB-100MB), PaddleOCR OCR,
keyword classification, signatory detection, Hangfire async jobs,
validator approve/reject, dynamic document numbering, Gmail SMTP notifications

## Signatory Config
- Irbabul Lubab — Manager DWI Engineering, PHR14410, suffix S0
- Nanang Lutfi Hamdani — Manager DWI Operation, PHR14430, suffix S8
- Format: {SEQ}/{TYPE}/{FUNGSI}/{YEAR}-{SUFFIX}, 4-digit padding

## Frontend Structure
### Internal Portal (frontend/)
- Framework: Next.js 16, TypeScript, Tailwind, shadcn/ui
- Auth: JWT via useAuthStore (zustand)
- Key pages: /login, /dashboard, /admin/settings, /admin/org-functions

### Vendor Portal (frontend-vendor/)
- Framework: Next.js 16, TypeScript
- Auth: JWT via cookie vendor_token, middleware.ts untuk route guard
- Public routes: /login, /register, /forgot-password, /reset-password
- Key pages: /submissions, /submissions/new, /tracking, /profile

## Completed (2026-03-19)
- Login page redesign Internal Portal (Forest Deep theme, card layout)
- Login page redesign Vendor Portal (Navy Ink theme, card layout)
- Forgot Password page Vendor Portal (/forgot-password)
- Reset Password page Vendor Portal (/reset-password?token=...)
- Backend: ForgotPasswordAsync + ResetPasswordAsync, migration AddPasswordResetToken
- IT Support URL & Label configurable dari Settings page → SystemSettings DB
- proxy.ts renamed ke middleware.ts + public routes updated
- save.sh — script push semua submodule sekaligus

## Pending (Next Steps)
1. Form Engine Vendor Portal — /submissions/new masih hardcode
   - Fetch form definition dari GET /api/forms/{moduleId}
   - Render fields dinamis (text, select, date, file, dll)
   - Submit ke POST /api/submissions
2. ApplicableModules filter — vendor hanya lihat form sesuai modul assigned
3. E-Library forms — manual input metadata, edit metadata

## Key Files
- Backend auth: src/Dtc.Api/Controllers/AuthController.cs
- Auth service: src/Dtc.Infrastructure/Services/AuthService.cs
- Settings: src/Dtc.Api/Controllers/SystemSettingsController.cs
- Vendor login: frontend-vendor/app/login/page.tsx
- Internal login: frontend/src/app/login/page.tsx
- Vendor middleware: frontend-vendor/middleware.ts
- Dev script: dev.sh
- Save script: save.sh
