# DTC SYSTEM — REVIEW, STATUS & RENCANA PENGEMBANGAN

> **Dibuat:** 17 March 2026 14:59 WIB
> **Versi Aplikasi:** 1.0.0
> **Repository:** https://github.com/flashmarines-bit/dtc-sys
> **Branch:** main | **Commit terakhir:** d360541
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

---

## 1. STATUS SISTEM REAL-TIME

| Komponen | Status |
|----------|--------|
| DTC API | ✅ Healthy |
| Database | ✅ healthy |
| Ocr | ⚠️ unavailable |

- **API Version:** 1.0.0
- **Timestamp:** 2026-03-17T14:56:44.2118623Z
- **Port API:** 5000
- **Port Frontend Internal:** 3000
- **Port Vendor Portal (planned):** 4000

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

**Daftar Dokumen (20 terbaru):**

| No | Nomor Dokumen | Judul | Status | Pemegang |
|----|--------------|-------|--------|----------|
| 1 | DOC-2026-00003 | Test Email Notifikasi | ? | - |
| 2 | DOC-2026-00002 | Test Email Notification | ? | - |
| 3 | DOC-2026-00001 | SPPP Test | ? | - |
| 4 | PHY-2026-00004 | Standard Operating Procedure - Well | ? | - |
| 5 | PHY-2026-00003 | Dokumen Handover Test | ? | - |
| 6 | PHY-2026-00002 | Surat Penawaran Harga | ? | - |
| 7 | PHY-2026-00001 | Test Surat Masuk Vendor ABC | ? | - |
| 8 | 0002/SP3/PHR14410/2026-S0 | SP3 Repair Compressor | ? | - |
| 9 | 0001/SP3/PHR14410/2026-S0 | SP3 Maintenance Pump A | ? | - |
| 10 | MEMO/2026/0001 | Internal Memo - Q1 Review | ? | - |
| 11 | INV/2026/PROC/00002 | Invoice Vendor B - March 2026 | ? | - |
| 12 | INV/2026/PROC/00001 | Invoice Vendor A - March 2026 | ? | - |

---

## 5. E-LIBRARY — MODUL 2 (5 dokumen)

| No | Nomor | Judul | Tipe Dokumen | Status Library |
|----|-------|-------|-------------|----------------|
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

**Daftar Submission:**

| No | Nomor | Judul | Vendor | Status | AI Score | Resubmisi |
|----|-------|-------|--------|--------|----------|-----------|
| 1 | REQ-2026-00004 | Test Email Notifikasi | PT Email Test | Accepted | 10 | 0/0 |
| 2 | REQ-2026-00003 | Test Email Notification | PT Email Test | Accepted | 10 | 0/0 |
| 3 | REQ-2026-00002 | SPPP Test Reject | PT Reject Test | Rejected | 10 | 0/0 |
| 4 | REQ-2026-00001 | SPPP Test | PT Test | Accepted | 10 | 0/0 |

---

## 7. ANTRIAN VALIDATOR (4 submission)

- **Siap direview:** 0
- **Sedang dianalisis:** 4

| No | Nomor | Vendor | Status | AI Score | DPI |
|----|-------|--------|--------|----------|-----|
| 1 | REQ-2026-00009 | PT Maju Jaya | Pending | None | None ❌ |
| 2 | REQ-2026-00010 | PT Test | Pending | None | None ❌ |
| 3 | REQ-2026-00011 | PT Hack | Pending | None | None ❌ |
| 4 | REQ-2026-00012 | PT Test 14b0e7da | Pending | None | None ❌ |

---

## 8. DASHBOARD RADAR

**Overview Tracking:**

| Metrik | Nilai |
|--------|-------|
| Total Dokumen Aktif | 5 |
| Pre-Arrival | 1 |
| Di Front Desk | 0 |
| Menunggu Konfirmasi | 4 |
| Sedang Direview | 0 |
| Dititip Pending | 0 |
| Menunggu Pickup | 0 |
| SLA Breach | 0 |
| Eskalasi Terkirim | 0 |

**Eskalasi Aktif:** 0

---

## 9. ORGANIZATION FUNCTIONS (0)

*Belum ada org function. Perlu dikonfigurasi untuk penomoran dokumen otomatis.*

---

## 10. SYSTEM SETTINGS (6 pengaturan)

| Key | Value | Keterangan |
|-----|-------|------------|
| `Email:AppPassword` | cakdtanhmgpdcmpr | Gmail App Password |
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
| 1 | Frontend | `proxy.ts` | Middleware deprecated di Next.js 16 — nama fungsi salah |
| 2 | Frontend | `api.ts` | window.location.href tanpa SSR guard — crash di Server Component |
| 3 | Frontend | `types/index.ts` | Role FrontDesk tidak terdefinisi di interface User |
| 4 | Frontend | `types/index.ts` | returnNotes tidak ada di VendorSubmission interface |
| 5 | Frontend | `dashboard/page.tsx` | Route /documents/[id]/scan tidak ada — 404 untuk Validator |
| 6 | Frontend | `dashboard/page.tsx` | Role User tidak punya UI section — layar blank |
| 7 | Frontend | `vendor/submissions/[id]` | Stale closure di auto-refresh — status Analysing tidak update |
| 8 | Frontend | `vendor/submissions/[id]` | (sub as any).returnNotes — type unsafe |
| 9 | Frontend | `validator/review/[id]` | Tidak ada pesan saat status Pending/Analysing — UI bisu |
| 10 | Backend | `AuthService.cs` | ExpiresAt hardcode 60 menit — tidak baca dari config |
| 11 | Backend | `Program.cs` | CORS URL Codespace hardcoded — API block setelah restart |
| 12 | Backend | `DocumentTypesController.cs` | Duplicate using directive — build warning |
| 13 | Backend | `VendorController.cs` | File minimum 1KB — harusnya 5MB untuk production |
| 14 | Backend | `ValidatorController.cs` | Approve/Reject tanpa role authorization — siapapun bisa approve |
| 15 | Backend | `TrackingController.cs` | Receive/Assign/Approve tanpa role check spesifik |
| 16 | Backend | `VendorService.cs` | Race condition GenerateSubmissionNumberAsync — nomor duplikat |
| 17 | Backend | `VendorService.cs` | Form tidak auto-fill dari user yang login |
| 18 | Backend | `ValidatorService.cs` | GetQueueAsync hanya UnderReview — counter Analysing selalu 0 |
| 19 | Backend | `ValidatorService.cs` | Race condition GenerateDocumentNumberAsync — nomor duplikat |

### ✅ Fitur Baru yang Diimplementasikan

#### 17 Tema Warna
CSS variables dengan dark/light mode. Tema: Blue, Purple, Green, Orange, Rose, Teal, Slate, Indigo, Cyan, Amber, Lime, Pink, Red, Emerald, Violet, Midnight, Forest. Tersimpan per user di localStorage.

#### Halaman /home (Module Selector)
Landing page setelah login dengan card besar per modul. Filter otomatis berdasarkan role. Greeting personal, quick links admin.

#### Navbar Module Switcher
Modul 1/2/3 dipindah dari sidebar ke navbar atas sebagai segmented control. Highlight aktif, warna berbeda per modul. Sidebar tetap untuk menu dalam modul.

#### Multi-Role Support (Database)
Kolom Role (varchar) diganti Roles (jsonb array). Migration dengan konversi data otomatis. JWT multiple role claims.

#### Multi-Role Support (Frontend)
Interface User dengan roles: string[]. Multi-role checkbox selector di User Management. Role eksklusif tidak bisa dikombinasi.

#### Role Baru: Verificator
Role untuk verifikasi fisik dokumen. Akses Modul 1 + Modul 2. Dapat dikombinasi dengan Validator untuk akses penuh.

#### User Management UI
Tampilan baru dengan multi-role checkbox. Deskripsi tiap role. Dialog lebih lebar tanpa scroll di desktop.

#### Akses Kontrol Berbasis Kombinasi Role
Modul ditampilkan berdasarkan semua roles user. Validator+Verificator = akses 3 modul. Logic di frontend membaca roles array.

### ✅ Infrastruktur & Konfigurasi

- CORS dikonfigurasi dari appsettings (tidak hardcode)
- JWT Key minimal 64 karakter (HS512 requirement)
- appsettings.Development.json template tersedia
- DbSeeder otomatis fix format data Roles lama
- Build 0 error, 0 warning di backend dan frontend
- Semua perubahan di-commit dan di-push ke GitHub

---

## 12. RENCANA PENGEMBANGAN BERIKUTNYA

### 🔲 PRIORITAS 1 — Vendor Portal Terpisah (Port 4000)

**Latar Belakang:** Keputusan arsitektur sudah final — vendor akan mengakses sistem melalui frontend terpisah di port 4000 dengan URL berbeda dari frontend internal.

**Yang perlu dibuat:**

- Inisiasi project Next.js baru di folder `frontend-vendor/`
- Konfigurasi port 4000 di package.json
- Halaman Login khusus vendor (email + password)
- Halaman Register vendor (dengan validasi perusahaan)
- Halaman Daftar Submission — lihat semua pengajuan
- Halaman New Submission — upload PDF, isi form
- Halaman Detail Submission — status, AI result, resubmit
- Halaman Profile vendor
- Update CORS backend: tambah port 4000 ke AllowedOrigins
- Update proxy.ts agar redirect vendor ke /login yang benar
- Set port 4000 public di Codespace
- Nginx config untuk routing subdomain di production

**Potensi masalah yang perlu diantisipasi:**

- Cookie tidak shared antar port/subdomain — perlu konfigurasi domain
- CORS harus diupdate di dua tempat saat URL Codespace berubah
- PWA manifest perlu dikonfigurasi terpisah

### 🔲 PRIORITAS 2 — Penyempurnaan Modul 3 (Vendor Submission)

- Multi-file upload (saat ini hanya 1 PDF per submission)
- Preview PDF langsung di browser tanpa download
- Template dokumen yang bisa diisi vendor secara online
- Draft submission — vendor bisa simpan sebelum final submit
- Notifikasi real-time via WebSocket saat status berubah
- History timeline submission yang lebih detail

### 🔲 PRIORITAS 3 — Penyempurnaan UI/UX

- Tema warna disimpan di database (bukan hanya localStorage) agar sync antar browser
- Mobile responsiveness lebih baik untuk halaman tracking
- Loading skeleton untuk semua halaman (saat ini hanya spinner)
- Error boundary yang lebih informatif
- Perbaikan tampilan halaman Documents (masih hardcode warna slate)
- Tambah konfirmasi dialog sebelum aksi destruktif (hapus, tolak)

### 🔲 PRIORITAS 4 — Keamanan

- Rate limiting lebih ketat untuk endpoint vendor
- Audit log setiap aksi penting (approve, reject, delete)
- Session timeout lebih pendek untuk Vendor (30 menit vs 60 menit internal)
- 2FA opsional untuk SysAdmin dan Admin
- IP whitelist opsional untuk akses admin panel

### 🔲 MODUL BARU (Jangka Panjang)

| Modul | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Modul 4 — Outgoing Documents | Surat keluar internal ke pihak luar, penomoran otomatis | Medium |
| Modul 5 — Retention & Compliance | Manajemen masa retensi sesuai regulasi | Low |
| Modul 6 — Analytics & Reporting | Dashboard laporan dan visualisasi semua modul | Medium |
| Modul 7 — Incoming Registry | Pencatatan surat masuk umum dengan disposisi | Low |

---

## 13. ARSITEKTUR & KEPUTUSAN TEKNIS

### Stack Teknologi

| Layer | Teknologi | Versi | Port |
|-------|-----------|-------|------|
| Backend API | .NET / ASP.NET Core | 10.0 | 5000 |
| Frontend Internal | Next.js + React + TypeScript | 16.1.6 | 3000 |
| Frontend Vendor (planned) | Next.js terpisah | 16.x | 4000 |
| Database | PostgreSQL via Supabase | Latest | 5432 |
| ORM | Entity Framework Core | 10.x | - |
| Background Jobs | Hangfire + PostgreSQL | 1.8x | - |
| OCR Service | Python FastAPI | - | 8000 |
| Auth | JWT Bearer HS512 | - | - |
| CSS | Tailwind CSS v4 + shadcn/ui | 4.x | - |
| State | Zustand + React Query | 5.x | - |

### Keputusan Arsitektur yang Sudah Final

| Keputusan | Detail |
|-----------|--------|
| Multi-role support | JSONB array di database (Opsi A) — sudah implemented |
| Vendor portal | Frontend terpisah port 4000, backend & DB sama |
| Database | Tetap satu instance — tidak dipisah untuk simplisitas |
| Role Verificator | Sudah ada, bisa dikombinasi dengan Validator |
| 3 modul utama | Dipertahankan, modul baru dikembangkan bertahap |
| Tema warna | 17 tema, tersimpan per user di localStorage |

### Akses Modul Per Role

| Role | Modul 1 (Tracking) | Modul 2 (Library) | Modul 3 (Vendor) |
|------|--------------------|-------------------|-----------------|
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
# 1. Update CORS dengan URL Codespace baru
# Edit: src/Dtc.Api/appsettings.Development.json

# 2. Jalankan Backend
pkill -f dotnet 2>/dev/null
cd /workspaces/dtc-sys && dotnet run --project src/Dtc.Api --urls "http://localhost:5000" > /tmp/api.log 2>&1 &

# 3. Jalankan Frontend Internal
cd /workspaces/dtc-sys/frontend && npm run dev > /tmp/next.log 2>&1 &

# 4. Set Port Public
gh codespace ports visibility 3000:public -c $CODESPACE_NAME
gh codespace ports visibility 5000:public -c $CODESPACE_NAME

# 5. Health Check
curl -s http://localhost:5000/health | python3 -m json.tool
```

### Credentials Development

| User | Email | Password | Role |
|------|-------|----------|------|
| System Administrator | sysadmin@dtc.local | SysAdmin@123 | SysAdmin |
| Ahmad Validator | validator@dtc.local | Validator@123 | Validator |
| Budi Verificator | verificator@dtc.local | Verif@123 | Verificator |
| Siti Val+Verif | valverif@dtc.local | ValVerif@123 | Validator + Verificator |

> ⚠️ **WAJIB diganti sebelum production deployment!**

---

*Dokumen ini dibuat otomatis dari data real-time DTC System pada 17 March 2026 14:59 WIB*
*Generator: Claude AI — berdasarkan data API dan histori pengembangan*