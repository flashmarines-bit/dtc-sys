# DTC SYSTEM — REVIEW, STATUS & RENCANA PENGEMBANGAN

> **Dibuat:** 17 March 2026 20:15 WIB
> **Versi Aplikasi:** 1.0.0
> **Repository:** https://github.com/flashmarines-bit/dtc-sys
> **Branch:** main | **Commit terakhir:** 07e0799
> **Environment:** GitHub Codespace (Development)

---

## DAFTAR ISI

1. [Status Sistem Real-Time](#1-status-sistem-real-time)
2. [Data Pengguna](#2-data-pengguna)
3. [Jenis Dokumen](#3-jenis-dokumen)
4. [Dokumen Tracking (Modul 1)](#4-dokumen-tracking-modul-1)
5. [E-Library (Modul 2)](#5-e-library-modul-2)
6. [Vendor Submissions (Modul 3)](#6-vendor-submissions-modul-3)
7. [Antrian Validator](#7-antrian-validator)
8. [Dashboard Radar](#8-dashboard-radar)
9. [Organization Functions](#9-organization-functions)
10. [System Settings](#10-system-settings)
11. [Status Pengembangan — Apa yang Sudah Selesai](#11-status-pengembangan--apa-yang-sudah-selesai)
12. [Rencana Pengembangan Berikutnya](#12-rencana-pengembangan-berikutnya)
13. [Arsitektur & Keputusan Teknis](#13-arsitektur--keputusan-teknis)
14. [Panduan Menjalankan Aplikasi](#14-panduan-menjalankan-aplikasi)
15. [Status Vendor Portal (frontend-vendor)](#15-status-vendor-portal-frontend-vendor)

---

## 1. STATUS SISTEM REAL-TIME

| Komponen | Status |
|----------|--------|
| DTC API | ✅ Healthy |
| Database | ✅ healthy |
| Ocr | ⚠️ unavailable |

- **API Version:** 1.0.0
- **Port API:** 5000 | **Frontend Internal:** 3000 | **Vendor Portal:** 4000

---

## 2. DATA PENGGUNA (9 user)

| No | Nama Lengkap | Email | Role(s) | Status |
|----|-------------|-------|---------|--------|
| 1 | Admin DTC | admin@dtc.local | SysAdmin | ✅ Aktif |
| 2 | Ahmad Validator | validator@dtc.local | Validator | ✅ Aktif |
| 3 | Budi Verificator | verificator@dtc.local | Verificator | ✅ Aktif |
| 4 | Direktur Baru | vendor5909@newco.com | Vendor | ✅ Aktif |
| 5 | John Doe | john@dtc.local | User | ✅ Aktif |
| 6 | PT Maju Jaya | vendor@majujaya.com | Vendor | ✅ Aktif |
| 7 | Siti Validator Verificator | valverif@dtc.local | Validator + Verificator | ✅ Aktif |
| 8 | System Administrator | sysadmin@dtc.local | SysAdmin | ✅ Aktif |
| 9 | Vendor Test 14b0e7da | vendor.test.14b0e7da@test.com | Vendor | ✅ Aktif |

**Ringkasan:** 9 total | 9 aktif | 0 nonaktif

**Distribusi Role:**

- **SysAdmin:** 2 user
- **User:** 1 user
- **Validator:** 2 user
- **Vendor:** 3 user
- **Verificator:** 2 user

---

## 3. JENIS DOKUMEN (6 tipe)

| No | Nama | Kode | Format Penomoran | Deskripsi |
|----|------|------|-----------------|-----------|
| 1 | Contract | `CTR` | `CTR/{YEAR}/{DEPT}/{SEQ}` | Contract agreements |
| 2 | Internal Memo | `MEMO` | `MEMO/{YEAR}/{SEQ}` | Internal memorandum |
| 3 | Invoice | `INV` | `INV/{YEAR}/{DEPT}/{SEQ}` | Invoice documents |
| 4 | Invoice Vendor | `INV2` | `INV/{YYYY}/{SEQ:5}` | Invoice dokumen vendor |
| 5 | Physical Document | `PHY` | `{TYPE}-{YEAR}-{SEQ}` | Module 1 physical tracking |
| 6 | Surat Permintaan Proses Pembayaran | `SP3` | `{SEQ}/{TYPE}/{FUNGSI}/{YEAR}-{SUFFIX}` | Surat Permintaan Proses Pembayaran |

---

## 4. DOKUMEN TRACKING — MODUL 1 (12 dokumen)

**Distribusi Status:**

- 0: 7 dokumen
- 2: 1 dokumen
- 5: 4 dokumen

| No | Nomor Dokumen | Judul | Status |
|----|--------------|-------|--------|
| 1 | DOC-2026-00003 | Test Email Notifikasi | ? |
| 2 | DOC-2026-00002 | Test Email Notification | ? |
| 3 | DOC-2026-00001 | SPPP Test | ? |
| 4 | PHY-2026-00004 | Standard Operating Procedure - Well Dril | ? |
| 5 | PHY-2026-00003 | Dokumen Handover Test | ? |
| 6 | PHY-2026-00002 | Surat Penawaran Harga | ? |
| 7 | PHY-2026-00001 | Test Surat Masuk Vendor ABC | ? |
| 8 | 0002/SP3/PHR14410/2026-S0 | SP3 Repair Compressor | ? |
| 9 | 0001/SP3/PHR14410/2026-S0 | SP3 Maintenance Pump A | ? |
| 10 | MEMO/2026/0001 | Internal Memo - Q1 Review | ? |
| 11 | INV/2026/PROC/00002 | Invoice Vendor B - March 2026 | ? |
| 12 | INV/2026/PROC/00001 | Invoice Vendor A - March 2026 | ? |

---

## 5. E-LIBRARY — MODUL 2 (5 dokumen)

| No | Nomor | Judul | Tipe | Status |
|----|-------|-------|------|--------|
| 1 | DOC-2026-00003 | Test Email Notifikasi | Surat Permintaan Proses Pembayaran | Approved |
| 2 | DOC-2026-00002 | Test Email Notification | Surat Permintaan Proses Pembayaran | Approved |
| 3 | DOC-2026-00001 | SPPP Test | Surat Permintaan Proses Pembayaran | Approved |
| 4 | PHY-2026-00004 | Standard Operating Procedure - Well | Physical Document | Archived |
| 5 | PHY-2026-00002 | Surat Penawaran Harga | Physical Document | Proposed |

---

## 6. VENDOR SUBMISSIONS — MODUL 3 (4 submission)

**Distribusi Status:**

- Accepted: 3
- Rejected: 1

| No | Nomor | Judul | Vendor | Status | AI Score |
|----|-------|-------|--------|--------|----------|
| 1 | REQ-2026-00004 | Test Email Notifikasi | PT Email Test | Accepted | 10 |
| 2 | REQ-2026-00003 | Test Email Notification | PT Email Test | Accepted | 10 |
| 3 | REQ-2026-00002 | SPPP Test Reject | PT Reject Test | Rejected | 10 |
| 4 | REQ-2026-00001 | SPPP Test | PT Test | Accepted | 10 |

---

## 7. ANTRIAN VALIDATOR (4 submission)

| No | Nomor | Vendor | Status | AI Score |
|----|-------|--------|--------|----------|
| 1 | REQ-2026-00009 | PT Maju Jaya | Pending | None |
| 2 | REQ-2026-00010 | PT Test | Pending | None |
| 3 | REQ-2026-00011 | PT Hack | Pending | None |
| 4 | REQ-2026-00012 | PT Test 14b0e7da | Pending | None |

---

## 8. DASHBOARD RADAR

| Metrik | Nilai |
|--------|-------|
| Total Aktif | 5 |
| Pre-Arrival | 1 |
| Di Front Desk | 0 |
| Menunggu Konfirmasi | 4 |
| Sedang Direview | 0 |
| droppedPendingAck | 0 |
| waitingPickup | 0 |
| SLA Breach | 0 |
| Eskalasi | 0 |

---

## 9. ORGANIZATION FUNCTIONS (0)

*Belum ada org function — perlu dikonfigurasi untuk penomoran otomatis.*

---

## 10. SYSTEM SETTINGS (6 pengaturan)

| Key | Value | Keterangan |
|-----|-------|------------|
| `Email:AppPassword` | ****** (disembunyikan) | Gmail App Password |
| `Email:SenderEmail` | ylsusanto@gmail.com | Sender email address |
| `Email:SenderName` | DTC System | Display name |
| `Email:SmtpPort` | 587 | SMTP Port |
| `Email:SmtpServer` | smtp.gmail.com | SMTP Server |
| `Email:ValidatorEmail` | ylsusanto@gmail.com | Validator notification email |

---

## 11. STATUS PENGEMBANGAN — APA YANG SUDAH SELESAI

### ✅ Bug Fixes (19 bugs diperbaiki)

| # | Layer | File | Bug |
|---|-------|------|-----|
| 1 | Frontend | `proxy.ts` | Middleware deprecated di Next.js 16 |
| 2 | Frontend | `api.ts` | window.location.href tanpa SSR guard |
| 3 | Frontend | `types/index.ts` | Role FrontDesk tidak terdefinisi |
| 4 | Frontend | `types/index.ts` | returnNotes tidak ada di VendorSubmission |
| 5 | Frontend | `dashboard/page.tsx` | Route /documents/[id]/scan → 404 |
| 6 | Frontend | `dashboard/page.tsx` | Role User layar blank |
| 7 | Frontend | `vendor/submissions/[id]` | Stale closure auto-refresh |
| 8 | Frontend | `vendor/submissions/[id]` | (sub as any).returnNotes type unsafe |
| 9 | Frontend | `validator/review/[id]` | UI bisu saat Pending/Analysing |
| 10 | Backend | `AuthService.cs` | ExpiresAt hardcode 60 menit |
| 11 | Backend | `Program.cs` | CORS URL hardcoded |
| 12 | Backend | `DocumentTypesController.cs` | Duplicate using directive |
| 13 | Backend | `VendorController.cs` | File minimum 1KB harusnya 5MB |
| 14 | Backend | `ValidatorController.cs` | Approve/Reject tanpa role check |
| 15 | Backend | `TrackingController.cs` | Receive/Assign/Approve tanpa role check |
| 16 | Backend | `VendorService.cs` | Race condition nomor submission |
| 17 | Backend | `VendorService.cs` | Form tidak auto-fill dari user login |
| 18 | Backend | `ValidatorService.cs` | GetQueueAsync hanya UnderReview |
| 19 | Backend | `ValidatorService.cs` | Race condition nomor dokumen |

### ✅ Fitur Baru yang Diimplementasikan

#### 17 Tema Warna
CSS variables dark/light mode. Blue, Purple, Green, Orange, Rose, Teal, Slate, Indigo, Cyan, Amber, Lime, Pink, Red, Emerald, Violet, Midnight, Forest. Tersimpan per user di localStorage dengan key `dtc-color-theme-{userId}`.

#### Halaman /home (Module Selector)
Landing page setelah login. Card besar per modul, filter berdasarkan role, greeting personal, quick links admin.

#### Navbar Module Switcher
Modul 1/2/3 di navbar atas sebagai segmented control rata kanan. Sidebar tetap untuk menu dalam modul aktif.

#### Multi-Role Support (Database)
Kolom `Roles` bertipe JSONB array. Migration `AddMultiRoleSupport` dengan konversi data otomatis. JWT multiple role claims.

#### Multi-Role Support (Frontend)
`roles: string[]` di interface User. Multi-role checkbox selector di User Management. Role eksklusif (SysAdmin, Vendor) tidak bisa dikombinasi.

#### Role Baru: Verificator
Akses Modul 1 + Modul 2. Dapat dikombinasi dengan Validator untuk akses penuh 3 modul.

#### User Management UI
Multi-role checkbox dengan deskripsi tiap role. Dialog 2-kolom lebih lebar tanpa scroll di desktop.

#### Akses Kontrol Multi-Role
Frontend membaca `roles` array. Validator+Verificator = 3 modul. Setiap kombinasi role menghasilkan akses modul yang tepat.

### ✅ Infrastruktur

- CORS dikonfigurasi dari appsettings — tidak hardcode
- JWT Key minimal 64 karakter (HS512)
- DbSeeder otomatis fix format data Roles lama (jsonb)
- Build 0 error, 0 warning backend dan frontend
- Semua perubahan di-commit dan push ke GitHub (commit: 07e0799)

---

## 12. RENCANA PENGEMBANGAN BERIKUTNYA

### 🔲 PRIORITAS 1 — Vendor Portal (Port 4000) — SEDANG DIKERJAKAN

**Status saat ini:** File-file project sudah dibuat manual, npm install sedang berjalan.

**File yang sudah dibuat di `frontend-vendor/`:**

- `package.json` — port 4000, dependency sama dengan frontend internal
- `tsconfig.json` — konfigurasi TypeScript
- `next.config.ts` — rewrite proxy ke port 5000
- `.env.local` — NEXT_PUBLIC_API_URL=http://localhost:5000
- `postcss.config.mjs` — Tailwind CSS v4
- `middleware.ts` — proteksi route, redirect vendor_token
- `app/globals.css` — CSS variables (light/dark mode)
- `app/layout.tsx` — root layout dengan PWA metadata
- `app/page.tsx` — redirect ke /login
- `app/login/page.tsx` — halaman login khusus vendor
- `app/register/page.tsx` — halaman register vendor
- `app/submissions/page.tsx` — daftar submission + stats
- `app/submissions/new/page.tsx` — form pengajuan baru + upload PDF
- `app/submissions/[id]/page.tsx` — detail + AI result + resubmit
- `app/profile/page.tsx` — profil + ganti password + logout
- `components/layout/Shell.tsx` — navbar + mobile bottom nav
- `lib/api.ts` — axios client dengan vendor_token cookie
- `lib/utils.ts` — cn, formatDate, formatFileSize, getStatusColor
- `store/auth.ts` — zustand auth store (vendor_token)
- `types/index.ts` — User, VendorSubmission, DocumentType interfaces
- `public/manifest.json` — PWA manifest

**Yang masih perlu dikerjakan:**

- npm install selesai dan verifikasi
- npm run dev — jalankan di port 4000
- Set port 4000 public di Codespace
- Test login vendor di browser
- Test register vendor baru
- Test submit dokumen PDF
- Test detail dan resubmit
- Commit dan push ke GitHub

### 🔲 PRIORITAS 2 — Penyempurnaan Modul 3

- Multi-file upload
- Preview PDF di browser
- Draft submission
- Notifikasi WebSocket

### 🔲 PRIORITAS 3 — UI/UX

- Tema warna ke database
- Loading skeleton
- Error boundary
- Fix halaman Documents (hardcode slate)

### 🔲 PRIORITAS 4 — Keamanan

- Rate limiting vendor
- Audit log
- Session timeout berbeda vendor vs internal
- 2FA admin

### 🔲 MODUL BARU (Jangka Panjang)

| Modul | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Modul 4 — Outgoing Documents | Surat keluar internal | Medium |
| Modul 5 — Retention & Compliance | Manajemen retensi | Low |
| Modul 6 — Analytics & Reporting | Dashboard laporan | Medium |
| Modul 7 — Incoming Registry | Surat masuk + disposisi | Low |

---

## 13. ARSITEKTUR & KEPUTUSAN TEKNIS

### Stack Teknologi

| Layer | Teknologi | Versi | Port |
|-------|-----------|-------|------|
| Backend API | .NET / ASP.NET Core | 10.0 | 5000 |
| Frontend Internal | Next.js + React + TypeScript | 16.1.6 | 3000 |
| **Frontend Vendor** | **Next.js terpisah** | **16.1.6** | **4000** |
| Database | PostgreSQL via Supabase | Latest | 5432 |
| ORM | Entity Framework Core + JSONB | 10.x | - |
| Background Jobs | Hangfire | 1.8x | - |
| OCR Service | Python FastAPI | - | 8000 ⚠️ |
| Auth | JWT Bearer HS512 | - | - |
| CSS | Tailwind CSS v4 + CSS variables | 4.x | - |
| State | Zustand v5 | 5.x | - |

### Keputusan Arsitektur yang Sudah Final

| Keputusan | Detail |
|-----------|--------|
| Multi-role | JSONB array — sudah implemented dan production-ready |
| Vendor portal | Frontend terpisah port 4000, backend & DB sama |
| Database | Satu instance Supabase — tidak dipisah |
| Cookie auth | `vendor_token` untuk vendor, `dtc_token` untuk internal |
| Role Verificator | Sudah ada, kombinasi Validator+Verificator = akses penuh |

### Akses Modul Per Role

| Role | Modul 1 Tracking | Modul 2 Library | Modul 3 Vendor |
|------|-----------------|----------------|----------------|
| SysAdmin | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |
| Validator | ❌ | ✅ | ✅ |
| Verificator | ✅ | ✅ | ❌ |
| Validator + Verificator | ✅ | ✅ | ✅ |
| User | ❌ | ✅ | ❌ |
| Vendor | ✅ | ❌ | ✅ |

---

## 14. PANDUAN MENJALANKAN APLIKASI

### Di GitHub Codespace

```bash
# Kill semua proses lama
pkill -f dotnet 2>/dev/null && pkill -f next 2>/dev/null && sleep 3

# Backend API
cd /workspaces/dtc-sys && dotnet run --project src/Dtc.Api --urls "http://localhost:5000" > /tmp/api.log 2>&1 &

# Frontend Internal (port 3000)
cd /workspaces/dtc-sys/frontend && npm run dev > /tmp/next.log 2>&1 &

# Frontend Vendor (port 4000)
cd /workspaces/dtc-sys/frontend-vendor && npm run dev > /tmp/vendor.log 2>&1 &

# Set semua port public
gh codespace ports visibility 3000:public 5000:public 4000:public -c $CODESPACE_NAME

# Health check
curl -s http://localhost:5000/health | python3 -m json.tool
```

### URL Akses

| Aplikasi | URL |
|----------|-----|
| Frontend Internal | https://{CODESPACE}-3000.app.github.dev |
| Vendor Portal | https://{CODESPACE}-4000.app.github.dev |
| Backend API | https://{CODESPACE}-5000.app.github.dev |
| Swagger | https://{CODESPACE}-5000.app.github.dev/swagger |

### Credentials Development

| User | Email | Password | Role |
|------|-------|----------|------|
| System Administrator | sysadmin@dtc.local | SysAdmin@123 | SysAdmin |
| Ahmad Validator | validator@dtc.local | Validator@123 | Validator |
| Budi Verificator | verificator@dtc.local | Verif@123 | Verificator |
| Siti Val+Verif | valverif@dtc.local | ValVerif@123 | Validator + Verificator |
| PT Maju Jaya (Vendor) | vendor@majujaya.com | (cek database) | Vendor |

> ⚠️ **WAJIB diganti sebelum production deployment!**

---

## 15. STATUS VENDOR PORTAL (frontend-vendor)


### Struktur File yang Sudah Dibuat

```
frontend-vendor/
├── package.json              ✅ port 4000
├── tsconfig.json             ✅
├── next.config.ts            ✅ rewrite proxy ke :5000
├── postcss.config.mjs        ✅ Tailwind v4
├── middleware.ts              ✅ proteksi route vendor_token
├── .env.local                 ✅ NEXT_PUBLIC_API_URL
├── public/
│   └── manifest.json         ✅ PWA config
├── app/
│   ├── globals.css           ✅ CSS variables light/dark
│   ├── layout.tsx            ✅ root layout
│   ├── page.tsx              ✅ redirect /login
│   ├── login/page.tsx        ✅ login vendor
│   ├── register/page.tsx     ✅ register vendor baru
│   ├── submissions/
│   │   ├── page.tsx          ✅ dashboard + daftar submission
│   │   ├── new/page.tsx      ✅ form + upload PDF
│   │   └── [id]/page.tsx     ✅ detail + AI result + resubmit
│   └── profile/page.tsx      ✅ profil + ganti password
├── components/
│   └── layout/Shell.tsx      ✅ navbar + mobile bottom nav
├── lib/
│   ├── api.ts                ✅ axios + vendor_token
│   └── utils.ts              ✅ helpers
├── store/
│   └── auth.ts               ✅ zustand auth
└── types/
    └── index.ts              ✅ TypeScript interfaces
```

### Langkah Berikutnya (Sesi Selanjutnya)

```bash
# 1. Verifikasi npm install selesai
ls /workspaces/dtc-sys/frontend-vendor/node_modules | head -5

# 2. Jalankan dev server
cd /workspaces/dtc-sys/frontend-vendor && npm run dev > /tmp/vendor.log 2>&1 &
sleep 15 && curl -s http://localhost:4000 | head -3

# 3. Set port 4000 public
gh codespace ports visibility 4000:public -c $CODESPACE_NAME

# 4. Test di browser
# https://{CODESPACE}-4000.app.github.dev/login
```

---

*Dokumen ini dibuat otomatis dari data real-time DTC System pada 17 March 2026 20:15 WIB*
*Generator: Claude AI — data API + histori pengembangan sesi ini*