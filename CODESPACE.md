# DTC System — Codespace Reference
> Generated: 2026-03-24 03:28
> **Untuk dipakai sebagai context di chat AI baru (Claude / ChatGPT)**

---

## 🖥️ Codespace
| Item | Value |
|------|-------|
| Codespace Name | `cuddly-enigma-69667jq5vvgq24gp9` |
| Repo | https://github.com/flashmarines-bit/dtc-sys |
| Branch | main |
| Last Commit | 8257d26c — chore: update CODESPACE.md with roadmap & targets (2026-03-24) |
| Path | `/workspaces/dtc-sys` |

---

## 🌐 URLs (Public)
| Service | URL |
|---------|-----|
| .NET API | `https://cuddly-enigma-69667jq5vvgq24gp9-5000.app.github.dev` |
| Internal Portal | `https://cuddly-enigma-69667jq5vvgq24gp9-3000.app.github.dev` |
| Vendor Portal | `https://cuddly-enigma-69667jq5vvgq24gp9-4000.app.github.dev` |
| OCR Service | `https://cuddly-enigma-69667jq5vvgq24gp9-8000.app.github.dev` |
| Swagger / API Docs | `https://cuddly-enigma-69667jq5vvgq24gp9-5000.app.github.dev/swagger` |

---

## 🔐 Credentials Dev
| Role | Email | Password |
|------|-------|----------|
| SysAdmin | `sysadmin@dtc.local` | `SysAdmin@123` |
| Vendor | `vendor@majujaya.com` | `Vendor@123` |

---

## 🗄️ Database
| Item | Value |
|------|-------|
| Provider | Supabase PostgreSQL |
| Project ID | `tblxkretjdkvbjdwujof` |
| Dashboard | `https://supabase.com/dashboard/project/tblxkretjdkvbjdwujof` |
| DB URL | `https://supabase.com/dashboard/project/tblxkretjdkvbjdwujof/editor` |
| Storage | `https://supabase.com/dashboard/project/tblxkretjdkvbjdwujof/storage/buckets` |
| Connection string | `src/Dtc.Api/appsettings.json` → `ConnectionStrings:DefaultConnection` |

---

## 📦 Stack & Versions
| Tool | Version |
|------|---------|
| .NET | `10.0.100` |
| Entity Framework | `Entity Framework Core .NET Command-line Tools
10.0.5` |
| Node.js | `v24.11.1` |
| npm | `11.6.2` |
| Python | `Python 3.12.1` |
| Next.js | `16.x (Turbopack)` |

---

## 📁 Struktur Repo
```
dtc-sys/                        ← root repo
├── src/
│   ├── Dtc.Api/                ← .NET 10 Web API (port 5000)
│   ├── Dtc.Application/        ← DTOs, Interfaces (Clean Architecture)
│   ├── Dtc.Domain/             ← Entities, Value Objects
│   └── Dtc.Infrastructure/     ← EF Core, Services, Jobs, Migrations
├── frontend/                   ← Next.js Internal Portal (port 3000) [submodule]
├── frontend-vendor/            ← Next.js Vendor Portal (port 4000) [submodule]
├── dev.sh                      ← Dev CLI (start/stop/migrate/etc)
├── save.sh                     ← Commit & push semua submodule
├── Dtc.slnx                    ← Solution file
└── CONTEXT.md                  ← Session handoff notes
```

---

## 🔧 Scripts
```bash
bash dev.sh all              # Start semua service + publish ports
bash dev.sh stop             # Stop semua service
bash dev.sh restart          # Restart semua
bash dev.sh restart-api      # Restart API only
bash dev.sh restart-frontend # Restart Internal Portal only
bash dev.sh restart-vendor   # Restart Vendor Portal only
bash dev.sh migrate          # Apply pending migrations
bash dev.sh migration [name] # Buat migration baru
bash dev.sh doctor           # Cek environment
bash save.sh "message"       # Commit & push semua (root + submodules)
```

---

## 🏗️ Submodules
| Submodule | Branch | Last Commit |
|-----------|--------|-------------|
| frontend | `main` | a412a7c — feat: redesign login page (forest deep) + IT Support configurable setting |
| frontend-vendor | `main` | 8257d26c — chore: update CODESPACE.md with roadmap & targets |

---

## ⚙️ Environment Variables
### Internal Portal (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=https://cuddly-enigma-69667jq5vvgq24gp9-5000.app.github.dev
NEXT_PUBLIC_IT_SUPPORT_EMAIL=itsupport@dtc.local
NEXT_PUBLIC_IT_SUPPORT_URL=
NEXT_PUBLIC_IT_SUPPORT_LABEL=IT Support
```

### Vendor Portal (`frontend-vendor/.env.local`)
```
NEXT_PUBLIC_API_URL=https://cuddly-enigma-69667jq5vvgq24gp9-5000.app.github.dev
```

### API (`src/Dtc.Api/appsettings.json`)
```
ConnectionStrings:DefaultConnection  ← Supabase PostgreSQL
Supabase:Url                         ← https://tblxkretjdkvbjdwujof.supabase.co
Supabase:ServiceKey                  ← via env var
Jwt:Key, Jwt:Issuer, Jwt:Audience
App:VendorPortalUrl                  ← https://cuddly-enigma-69667jq5vvgq24gp9-4000.app.github.dev
Email: Gmail SMTP (ylsusanto@gmail.com)
```

---

## 📋 Modules
### Module 1 — Physical Tracking
- State machine: Draft → Submitted → Received → Assigned → UnderReview → Approved/Returned
- QR code generation, handover OTP, audit trail
- SLA monitoring via Hangfire background job

### Module 2 — Document Library
- Propose → Review → Approve → Archive
- File versioning, tags, category, full-text search
- Expiry monitoring via Hangfire

### Module 3 — Vendor Submission
- Vendor self-register, PDF upload (5MB–100MB)
- PaddleOCR via FastAPI (port 8000) — keyword classification, signatory detection
- Hangfire async analysis jobs
- Validator approve/reject workflow
- Dynamic document numbering: `{SEQ}/{TYPE}/{FUNGSI}/{YEAR}-{SUFFIX}`
- Gmail SMTP email notifications

### Signatory Config (Seeded)
| Nama | Jabatan | Kode Fungsi | Suffix |
|------|---------|-------------|--------|
| Irbabul Lubab | Manager DWI Engineering | PHR14410 | S0 |
| Nanang Lutfi Hamdani | Manager DWI Operation | PHR14430 | S8 |

---

## ✅ Completed Features
- [x] Clean Architecture backend (.NET 10)
- [x] JWT Auth + Refresh Token + BCrypt
- [x] Multi-role user system
- [x] Module 1: Physical Tracking (state machine, QR, OTP, SLA)
- [x] Module 2: Document Library (versioning, tags, search)
- [x] Module 3: Vendor Submission (OCR, numbering, email)
- [x] Org Functions UI (/admin/org-functions)
- [x] Form Builder + ApplicableModules
- [x] Settings page (Email, Status Labels, Master Data, IT Support)
- [x] Login redesign Internal Portal (Forest Deep)
- [x] Login redesign Vendor Portal (Navy Ink)
- [x] Forgot/Reset Password flow (Vendor Portal)
- [x] Middleware fix (proxy.ts → middleware.ts)
- [x] IT Support configurable via Settings page

## 🔲 Pending (Next Steps)
- [ ] **Form Engine Vendor Portal** — `/submissions/new` dinamis dari API
- [ ] **ApplicableModules filter** — vendor hanya lihat form sesuai modul
- [ ] **E-Library forms** — manual input metadata, edit metadata

---


---

## 🎯 Roadmap & Target

### 🔜 Session Berikutnya (Prioritas Tinggi)
| # | Target | Detail |
|---|--------|--------|
| 1 | Form Engine Vendor Portal | `/submissions/new` fetch schema dari `GET /api/forms/{moduleId}`, render fields dinamis (text, select, date, file, textarea, number) |
| 2 | ApplicableModules filter | Vendor hanya lihat form sesuai modul yang di-assign, filter di list `/submissions` |
| 3 | E-Library forms | Manual input metadata, edit metadata setelah upload |

### 📅 Target Jangka Pendek (1–2 Minggu)
| # | Target | Detail |
|---|--------|--------|
| 1 | Vendor Portal fully functional | End-to-end: register → login → submit form → tracking status |
| 2 | Submission tracking | Vendor bisa lihat status real-time: Draft / Submitted / Under Review / Approved / Rejected |
| 3 | Internal Portal — review submission | Validator bisa approve/reject submission dari vendor |
| 4 | Email notification lengkap | Notifikasi ke vendor saat status berubah (approved/rejected/returned) |
| 5 | Profile page vendor | Edit profil, ganti password, info perusahaan |

### 📆 Target Jangka Menengah (2–4 Minggu)
| # | Target | Detail |
|---|--------|--------|
| 1 | Dashboard Internal Portal | Summary stats: total submission, pending review, approved, SLA breach |
| 2 | Dashboard Vendor Portal | Summary: form submitted, status breakdown, history |
| 3 | Notifikasi in-app | Bell icon, unread count, mark as read |
| 4 | Advanced search & filter | Filter submission by date, status, module, vendor |
| 5 | Export laporan | Export data submission ke Excel/PDF |

### 🗓️ Target Jangka Panjang
| # | Target | Detail |
|---|--------|--------|
| 1 | Notifikasi WhatsApp | Integrasi WhatsApp API untuk notifikasi submission |
| 2 | Mobile responsive | Vendor portal fully responsive untuk akses dari mobile |
| 3 | Audit log lengkap | Semua aksi tercatat: siapa, kapan, apa yang diubah |
| 4 | Multi-language | Support Bahasa Indonesia & English |
| 5 | Role tambahan | Reviewer, Approver level 2, Guest |
| 6 | Analytics & reporting | Chart tren submission, SLA compliance rate |

---

## 🔑 Key Files Reference
| File | Fungsi |
|------|--------|
| `src/Dtc.Api/Controllers/AuthController.cs` | Login, register, forgot/reset password |
| `src/Dtc.Infrastructure/Services/AuthService.cs` | Auth business logic |
| `src/Dtc.Infrastructure/Services/EmailService.cs` | Gmail SMTP |
| `src/Dtc.Api/Controllers/SystemSettingsController.cs` | Settings API |
| `src/Dtc.Infrastructure/Persistence/DbSeeder.cs` | Seed data |
| `frontend/src/app/login/page.tsx` | Internal login page |
| `frontend/src/app/admin/settings/page.tsx` | Settings page |
| `frontend-vendor/app/login/page.tsx` | Vendor login page |
| `frontend-vendor/app/forgot-password/page.tsx` | Forgot password |
| `frontend-vendor/app/reset-password/page.tsx` | Reset password |
| `frontend-vendor/middleware.ts` | Route guard (public routes) |
| `dev.sh` | Dev CLI |
| `save.sh` | Git save & push |
