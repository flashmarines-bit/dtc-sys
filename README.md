# dtc-sys
document-trackaction-control

ketik ini di terminal untuk running aplikasi
bash dev.sh all

Ketik ini di terminal untuk simpan perubahan
bash save.sh "feat: ganti dengan nama statusnya"

Semua port sudah public! Langsung buka di browser:
🖥️ Internal → https://cuddly-enigma-69667jq5vvgq24gp9-3000.app.github.dev
🏪 Vendor → https://cuddly-enigma-69667jq5vvgq24gp9-4000.app.github.dev
🔌 API → https://cuddly-enigma-69667jq5vvgq24gp9-5000.app.github.dev

Login dengan:

Internal/Admin → sysadmin@dtc.local / SysAdmin@123
Vendor → vendor@majujaya.com / Vendor@123

---

## 📋 Tata Cara Penggunaan CODESPACE.md

`CODESPACE.md` berisi referensi lengkap project ini — status fitur, roadmap, environment variables, dan key files.

### Update & simpan status pekerjaan terbaru:
```bash
bash save.sh "feat: deskripsi perubahan"
```
Script ini otomatis:
1. Update `CODESPACE.md` (timestamp, last commit, status submodule)
2. Commit & push `frontend` (Internal Portal)
3. Commit & push `frontend-vendor` (Vendor Portal)
4. Commit & push root repo `dtc-sys`

### Untuk melanjutkan pekerjaan di sesi / chat baru:
1. Buka `CODESPACE.md` di repo
2. Copy seluruh isinya
3. Paste ke chat AI baru sebagai konteks awal
