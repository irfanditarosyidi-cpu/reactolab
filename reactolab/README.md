# ChemSpace v1.2 🧪

**Web Pembelajaran Laju Reaksi Berbasis Inkuiri Terbimbing** — implementasi penuh PRD v1.2 (Revisi Modul Satu Halaman + Save & Resume).

| | |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS — tema putih + biru |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firebase Realtime Database (asia-southeast1, Spark/gratis) |
| Backend privileged | Vercel API Routes + Firebase Admin SDK (khusus admin) |
| Grafik | Recharts (di-render di browser) |
| PDF LKPD | jsPDF (di-generate di browser) |
| Hosting | Vercel Hobby |

---

## ✨ Fitur Utama

**Siswa**
- Modul 0–7, **satu modul = satu halaman**, section terbuka **berurutan** (tidak bisa lompat).
- Workspace eksperimen terpadu: setup → simulasi makroskopik 2D → **kaca pembesar submikroskopik inline** (lensa ikut kursor + panel zoom) → tabel & grafik otomatis → representasi simbolik → explain 3 level.
- 4 eksperimen virtual: Mg+HCl (konsentrasi), CaCO₃+HCl (luas permukaan), Na₂S₂O₃+HCl (suhu, + kurva Maxwell–Boltzmann), penguraian H₂O₂ (katalis, + diagram energi).
- **Simpan & Keluar** kapan saja; **Lanjutkan Pembelajaran** kembali persis ke modul + section terakhir dengan jawaban terisi kembali.
- Setelah modul selesai: **Lanjut ke Modul Selanjutnya** atau **Simpan & Selesai** (kembali ke dashboard, modul berikutnya tetap terbuka).
- Finalisasi LKPD Modul 1–4 (jawaban terkunci) + unduh **PDF LKPD**.
- Forum diskusi **CER** dengan **submit-to-reveal** (ditegakkan oleh security rules), komentar wajib, decision prompt, dan kesimpulan guru realtime.
- Latihan soal dengan pembahasan.

**Guru**
- Buat kelas + kode 6 karakter, regenerate kode (kode lama langsung hangus).
- Dashboard ringkasan + **monitoring matriks M0–M7 realtime** (status, %, posisi section, aktivitas).
- Detail jawaban & data eksperimen siswa (read-only).
- Penyusunan studi kasus diskusi (link artikel + pertanyaan + decision prompt), publish/unpublish, pantau CER & tanggapan, publikasikan kesimpulan.

**Admin**
- Statistik pengguna, pencarian, buat akun, aktif/nonaktifkan, hapus.
- Ubah role **student ↔ teacher** (tidak bisa ke admin dari UI).
- Proses permintaan reset password manual + audit log — semuanya via **API server-side (Admin SDK)**.

---

## 🚀 Setup dari Nol

### 1. Prasyarat
- Node.js 18+ dan npm
- Akun Firebase dengan project **reactolab-496a1** (config web sudah tertanam di `src/lib/firebase/client.ts` — ganti jika memakai project lain)
- Akun Vercel (untuk deploy)

### 2. Instal dependensi
```bash
npm install
```

### 3. Konfigurasi Firebase Console
1. **Authentication** → Sign-in method → aktifkan **Email/Password**.
2. **Realtime Database** → pastikan instance `asia-southeast1` aktif.
3. **Deploy security rules** — pilih salah satu:
   - **Cara cepat:** buka tab *Rules* di Realtime Database, salin-tempel seluruh isi `database.rules.json`, lalu **Publish**.
   - **Via CLI:** `npx firebase-tools deploy --only database` (sudah ada `firebase.json`).

   > ⚠️ Tanpa rules ini aplikasi tidak aman dan sebagian fitur (submit-to-reveal forum) tidak berfungsi benar.

### 4. Service Account (untuk fitur Admin)
1. Firebase Console → ⚙️ *Project settings* → **Service accounts** → **Generate new private key** → unduh JSON.
2. Salin `.env.local.example` → `.env.local`, lalu isi `FIREBASE_SERVICE_ACCOUNT` dengan isi file JSON tersebut (satu baris) **atau** base64-nya:
   ```bash
   base64 -i serviceAccountKey.json | tr -d '\n'
   ```

### 5. Buat akun admin pertama (seed)
```bash
FIREBASE_SERVICE_ACCOUNT_FILE=./serviceAccountKey.json \
node scripts/seed.mjs --email admin@sekolah.sch.id --password rahasia123 --name "Admin ChemSpace" --role admin
```
Script yang sama bisa dipakai membuat akun guru: `--role teacher`.
(Akun siswa cukup lewat halaman **Daftar** di aplikasi.)

### 6. Jalankan lokal
```bash
npm run dev        # http://localhost:3000
npm run build      # verifikasi production build
npm run typecheck  # pemeriksaan TypeScript
```

---

## ☁️ Deploy ke Vercel (Hobby/Gratis)

1. Push repo ini ke GitHub/GitLab.
2. Di Vercel: **Add New Project** → import repo → framework otomatis terdeteksi (Next.js).
3. Di **Settings → Environment Variables**, tambahkan:
   - `FIREBASE_SERVICE_ACCOUNT` = JSON service account satu baris **atau** base64-nya.
4. **Deploy.** Selesai — siswa menulis langsung ke Firebase dari browser; hanya aksi admin yang melewati server Vercel (sesuai strategi free-tier PRD §34).

> Domain Vercel tidak perlu didaftarkan ke Firebase untuk Auth Email/Password.

---

## 🧭 Alur Uji Cepat (Smoke Test)

1. **Admin**: login akun seed → `/admin/dashboard` → buat akun guru (atau pakai seed `--role teacher`).
2. **Guru**: login → *Kelas* → **Buat Kelas** → salin kode 6 karakter.
3. **Siswa**: daftar akun baru → dashboard → **Gabung Kelas** dengan kode → **Mulai Pembelajaran**.
4. Kerjakan Modul 0 → Modul 1: isi orientasi → rumusan masalah → hipotesis → eksperimen (pilih ≥3 konsentrasi, jalankan semua, aktifkan 🔍 kaca pembesar) → uji hipotesis → kesimpulan.
5. Di tengah modul, uji **Simpan & Keluar** → logout → login → **Lanjutkan Pembelajaran** → halaman kembali ke section terakhir dengan jawaban utuh (PAT-08/09).
6. **Guru**: buka *Monitoring* (lihat sel matriks berubah realtime) → *Forum Diskusi* → buat kasus + **Publikasikan**.
7. **Siswa**: Modul 6 → baca artikel → kirim CER (feed teman baru terlihat setelah kirim) → beri tanggapan → decision.
8. **Guru**: tulis & **Publikasikan** kesimpulan → siswa dapat menuntaskan Modul 6 → Modul 7 → **Simpan & Selesai Pembelajaran** (100%).
9. **Siswa/Guru**: unduh **PDF LKPD**.

---

## 🗂️ Struktur Proyek

```
src/
├── app/                       # routes (App Router)
│   ├── (public)  /, /login, /register, /forgot-password, /reset-request
│   ├── student/   dashboard, modules, modules/[moduleId], practice, settings
│   ├── teacher/   dashboard, classes[…], monitoring, discussion, settings
│   ├── admin/     dashboard, users[…], password-reset-requests, audit, settings
│   └── api/admin/ users, users/[uid], reset-password   ← Firebase Admin SDK
├── components/
│   ├── module/    engine.tsx (mesin modul satu-halaman), SectionCard, sections/…
│   ├── experiment/ SimStage, sim-models, ParticleView (magnifier), DataPanel…
│   ├── layout/ ui/ student/ teacher/ admin/ settings/
├── lib/
│   ├── module-defs.ts  # konten Modul 0–7 (satu sumber kebenaran)
│   ├── progress.ts     # skeleton, unlock, persentase, resume target
│   ├── db.ts paths.ts  # operasi & path RTDB
│   ├── firebase/client.ts admin.ts
│   └── format.ts lkpd-pdf.ts
├── scripts/seed.mjs
├── database.rules.json  # security rules RTDB (wajib dideploy)
└── firebase.json
```

## 🔐 Model Data (RTDB)

```
users/{uid}                      role, status, activeClassId
classes/{classId}                className, classCode, teacherId, status
classCodes/{code}                → { classId }
classMemberships/{classId}/{uid} joinedAt, name, email
progress/{classId}/{uid}         currentModule, currentSection, overallPercent,
                                 lastSavedAt, lkpdFinalizedAt, modules{0..7}.sections{}
responses/{classId}/{uid}/m{n}/{sectionId}   draft & jawaban per section
experimentData/{classId}/{uid}/m{n}/runs/{param}
lkpdSnapshots/{classId}/{uid}    snapshot final LKPD 1–4
discussionCases/{classId}/{caseId}
forumPosts/{classId}/{caseId}/{uid}          CER (immutable)
forumComments/{classId}/{caseId}/{commentId}
discussionProgress/{classId}/{uid}
teacherConclusions/{classId}
passwordResetRequests/{reqId}
auditLogs/{logId}                (tulis: hanya server)
```

**Poin keamanan pada rules:**
- Registrasi klien dipaksa `role: student`; role/status tidak bisa diubah sendiri.
- Guru hanya bisa membaca progress/jawaban kelas miliknya; **tidak bisa menulis** jawaban siswa (INV-08).
- **Submit-to-reveal** forum ditegakkan di rules: feed `forumPosts` sebuah kasus hanya terbaca bila node CER milik pembaca sudah ada.
- CER immutable (tidak bisa ditulis ulang), komentar hanya atas nama sendiri.
- `auditLogs` hanya bisa ditulis Admin SDK (server).

## 📝 Catatan & Batasan MVP

- **Draft kasus diskusi**: siswa (anggota kelas) secara teknis dapat membaca node kasus yang belum dipublikasikan lewat API RTDB langsung (UI memfilternya). Jangan menaruh materi sensitif di draft, atau publikasikan saat siap saja.
- **Metadata kelas** (`classes`) terbaca oleh semua pengguna login — diperlukan siswa untuk join/lihat nama kelas; jawaban tetap terlindungi per-kelas.
- Analytics (`measurementId`) tidak diinisialisasi (tidak diperlukan; menjaga bundle kecil).
- Siswa aktif pada **satu kelas** pada satu waktu (`activeClassId`); bergabung ke kelas lain memindahkan konteks aktif tanpa menghapus data lama.
- Waktu simulasi dipercepat dan diberi label "waktu simulasi"; kecepatan 1×/3×/6×.
- Reset progres siswa menghapus data belajarnya sendiri di kelas aktif (dengan konfirmasi ketik `RESET`).

## 🧯 Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `PERMISSION_DENIED` di console | Rules belum dideploy | Deploy `database.rules.json` (langkah 3) |
| Fitur admin error "FIREBASE_SERVICE_ACCOUNT belum di-set" | Env var kosong | Isi `.env.local` / env Vercel lalu redeploy |
| Login berhasil tapi diarahkan keluar | Profil `users/{uid}` tidak ada | Buat via seed script / register ulang |
| Forum "Menunggu Guru" terus | Kasus belum dipublikasikan | Guru → Forum Diskusi → Publikasikan |
| Modul 6 tidak bisa selesai | Kesimpulan guru belum publish | Guru → Publikasikan kesimpulan |

---

Dibangun sesuai **PRD ChemSpace v1.2** — 29 Agustus 2026. Selamat mengajar & bereksperimen! 🚀
