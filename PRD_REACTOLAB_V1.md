# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# REACTOLAB — Web Pembelajaran Laju Reaksi Berbasis Inkuiri Terbimbing

**Versi:** 1.0  
**Tanggal:** 29 Agustus 2026  
**Status:** Ready for Development  
**Dokumen induk:** BRD ReactoLab v1.0 + Storyboard Teknis ReactoLab  
**Target MVP:** 1 kelas aktif dengan ±30–35 siswa dalam satu sesi  
**Deployment:** Vercel Hobby / Gratis  
**Authentication:** Firebase Authentication — Email/Password  
**Database:** Firebase Realtime Database — Spark / Gratis  
**Primary users:** Student, Teacher, Admin

---

# 1. Product Overview

ReactoLab adalah aplikasi web pembelajaran kimia pada materi **laju reaksi** yang menggabungkan:

- pembelajaran inkuiri terbimbing;
- eksperimen virtual 2D/3D;
- representasi makroskopik;
- representasi submikroskopik;
- representasi simbolik;
- penyimpanan progres siswa;
- monitoring realtime oleh guru;
- forum diskusi ilmiah berbasis Claim–Evidence–Reasoning;
- pengelolaan kelas;
- pengelolaan akun oleh admin.

Produk harus dapat digunakan dalam pembelajaran kelas nyata dengan **sekitar 30–35 siswa yang aktif secara bersamaan** tanpa membutuhkan layanan backend berbayar pada tahap MVP.

---

# 2. Product Goals

## 2.1 Primary Goals

1. Siswa dapat mengikuti seluruh alur pembelajaran ReactoLab dari Modul 0 sampai Modul 7.
2. Progress dan jawaban siswa tersimpan dan tidak hilang setelah refresh/logout.
3. Guru dapat melihat progress dan jawaban siswa kelasnya secara realtime.
4. Guru dapat membuat studi kasus forum melalui link artikel dan pertanyaan sendiri.
5. Siswa dapat berdiskusi menggunakan format CER.
6. Admin dapat mengelola akun pengguna dan role.
7. Produk dapat dipublikasikan pada Vercel dengan Firebase tier gratis.
8. Sistem tetap usable pada desktop, tablet, dan smartphone.

---

# 3. Non-Goals

MVP ReactoLab tidak ditujukan untuk:

- LMS sekolah skala besar;
- ratusan pengguna aktif bersamaan;
- multi-school SaaS;
- video conference;
- chat pribadi;
- mobile native app;
- AI tutor;
- AI grading;
- pembayaran;
- subscription;
- offline-first penuh;
- multiplayer 3D;
- integrasi Google Classroom;
- integrasi Moodle;
- Firebase Storage sebagai requirement utama;
- Cloud Functions sebagai requirement utama.

---

# 4. Target Scale

| Parameter | Target MVP |
|---|---:|
| Siswa aktif | 30–35 |
| Guru aktif | 1–2 |
| Admin aktif | 1 |
| Sesi kelas utama | 1 kelas aktif |
| Browser | Chrome, Edge, Firefox, Safari modern |
| Device | Desktop, laptop, tablet, smartphone |
| Database | Firebase Realtime Database |
| Auth | Firebase Auth |
| Hosting | Vercel |

Sistem harus didesain konservatif terhadap batas Firebase Realtime Database tier gratis.

---

# 5. Product Roles

## 5.1 Student

Student dapat:

- login;
- melihat dashboard;
- join kelas;
- melihat progress;
- menjalankan Modul 0–7;
- menyimpan jawaban;
- melakukan eksperimen;
- mengulang percobaan;
- melihat tabel dan grafik;
- mengisi CER;
- membaca forum setelah submit CER;
- memberi tanggapan;
- melihat kesimpulan guru;
- mengunduh LKPD;
- mengatur profil/settings;
- reset progres dengan konfirmasi.

Student tidak dapat:

- melihat jawaban siswa dari kelas lain;
- melihat jawaban teman sebelum CER sendiri dikirim;
- mengubah role;
- mengelola kelas;
- mengedit jawaban siswa lain;
- mengakses dashboard guru/admin.

---

## 5.2 Teacher

Teacher dapat:

- login;
- membuat kelas;
- memperoleh kode kelas;
- regenerate kode kelas;
- melihat siswa kelas;
- melihat progress siswa;
- melihat jawaban;
- melihat experiment data;
- melihat forum;
- membuat discussion case;
- menginput link artikel;
- menulis pertanyaan;
- menulis decision prompt;
- publish/unpublish discussion case;
- membuat kesimpulan;
- publish kesimpulan.

Teacher tidak dapat:

- mengedit jawaban siswa;
- mengubah role pengguna;
- melihat kelas guru lain;
- mengakses fungsi admin global.

---

## 5.3 Admin

Admin dapat:

- login;
- melihat statistik user;
- mencari user;
- membuat user;
- menonaktifkan user;
- menghapus user bila diperlukan;
- memproses reset password;
- mengubah role student ↔ teacher;
- membaca audit log.

Admin tidak dapat:

- melihat password lama;
- mengubah jawaban akademik siswa melalui UI;
- mengubah role menjadi admin melalui dropdown biasa.

---

# 6. Primary Product Flow

## 6.1 General Authentication Flow

```text
Landing Page
    ↓
Login / Daftar
    ↓
Firebase Authentication
    ↓
Read user role
    ↓
┌───────────────┬────────────────┬───────────────┐
│ student       │ teacher        │ admin         │
↓               ↓                ↓
Student         Teacher          Admin
Dashboard       Dashboard        Dashboard
```

---

## 6.2 Student Learning Flow

```text
Login
↓
Dashboard Siswa
↓
Join kelas jika belum tergabung
↓
Mulai Pembelajaran
↓
Modul 0
↓
Modul 1 — Konsentrasi
↓
Modul 2 — Luas Permukaan
↓
Modul 3 — Suhu
↓
Modul 4 — Katalis
↓
Finalisasi LKPD Modul 1–4
↓
Modul 5 — Konfirmasi Materi
↓
Modul 6 — Forum Diskusi
↓
Menunggu Kesimpulan Guru
↓
Modul 7 — Penutup
↓
100% Completed
```

---

# 7. Information Architecture

## 7.1 Public Routes

```text
/
├── /login
├── /register
├── /forgot-password
└── /reset-request
```

---

## 7.2 Student Routes

```text
/student
├── /dashboard
├── /modules
├── /modules/0
├── /modules/1
├── /modules/2
├── /modules/3
├── /modules/4
├── /modules/5
├── /modules/6
├── /modules/7
├── /practice
└── /settings
```

`/practice` boleh berupa placeholder pada MVP jika konten latihan belum ditentukan.

---

## 7.3 Teacher Routes

```text
/teacher
├── /dashboard
├── /classes
├── /classes/[classId]
├── /classes/[classId]/students
├── /classes/[classId]/students/[studentId]
├── /classes/[classId]/monitoring
├── /classes/[classId]/discussion
└── /settings
```

---

## 7.4 Admin Routes

```text
/admin
├── /dashboard
├── /users
├── /users/[uid]
├── /password-reset-requests
├── /audit
└── /settings
```

---

# 8. Navigation Requirements

## 8.1 Student Sidebar

- Dashboard Siswa
- Modul Pembelajaran
- Latihan Soal
- Settings

---

## 8.2 Teacher Sidebar

- Dashboard Guru
- Kelas
- Monitoring Siswa
- Forum Diskusi
- Settings

---

## 8.3 Admin Sidebar

- Dashboard Admin
- Pengguna
- Permintaan Reset Password
- Audit Log
- Settings

---

# 9. Authentication Requirements

## PR-AUTH-001 — Email Password Login

**Priority:** P0

User memasukkan:

- email;
- password.

Firebase Auth memvalidasi credential.

### Acceptance Criteria

- invalid email menampilkan error;
- password salah menampilkan error generik;
- user berhasil login diarahkan sesuai role;
- loading auth state ditampilkan;
- halaman protected tidak dirender sebelum auth selesai diverifikasi.

---

## PR-AUTH-002 — Register

**Priority:** P0/P1 tergantung deployment**

Form minimum:

- nama;
- email;
- password;
- konfirmasi password.

Default role:

`student`

Alternatif deployment:
- registrasi publik dapat dimatikan;
- akun dibuat admin.

---

## PR-AUTH-003 — Forgot Password Email

**Priority:** P0

Gunakan Firebase Auth password reset email.

### Acceptance Criteria

- user memasukkan email;
- sistem memberikan feedback generik;
- email reset dikirim bila akun valid;
- tidak mengekspos apakah email tertentu terdaftar secara berlebihan.

---

## PR-AUTH-004 — Admin Reset Request

**Priority:** P1

User dapat memilih:

`Minta Reset ke Admin`

Data request disimpan ke:

```text
/passwordResetRequests/{requestId}
```

---

## PR-AUTH-005 — Role Routing

**Priority:** P0

Role canonical:

```text
student
teacher
admin
```

Setelah login:

```text
student → /student/dashboard
teacher → /teacher/dashboard
admin   → /admin/dashboard
```

---

# 10. Student Dashboard Requirements

## PR-STU-DASH-001 — Student Identity

Tampilkan:

- nama;
- email opsional;
- kelas aktif;
- avatar default/inisial.

---

## PR-STU-DASH-002 — Global Progress

Tampilkan progress:

```text
0–100%
```

Progress dihitung berdasarkan penyelesaian Modul 0–7.

Dashboard bukan modul.

---

## PR-STU-DASH-003 — Module Progress

Setiap modul memiliki:

```ts
type ModuleStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "completed"
```

Data minimum:

```ts
interface ModuleProgress {
  status: ModuleStatus
  currentStep: string | null
  completionPercent: number
  startedAt?: number
  lastOpenedAt?: number
  completedAt?: number
}
```

---

## PR-STU-DASH-004 — Join Class

Form:

```text
[ KODE KELAS ] [ Gabung ]
```

### Validation

- wajib 6 karakter;
- uppercase normalization;
- kode harus ada;
- class status active;
- user belum menjadi anggota kelas;
- bila student sudah memiliki active class, tampilkan informasi sesuai policy.

---

## PR-STU-DASH-005 — Primary CTA

Jika belum pernah memulai:

`Mulai Pembelajaran`

Target:

`/student/modules/0`

Jika sudah memiliki progress:

`Lanjutkan Pembelajaran`

Target:

step terakhir yang belum selesai.

---

# 11. Class Product Requirements

## PR-CLASS-001 — Create Class

Teacher mengisi:

- className.

System generate:

```ts
{
  classId,
  className,
  classCode,
  teacherId,
  status: "active",
  createdAt
}
```

---

## PR-CLASS-002 — Generate Class Code

Format rekomendasi:

```text
A-Z + 0-9
6 characters
```

Contoh:

```text
RX7K2P
```

Sistem harus collision check.

---

## PR-CLASS-003 — Regenerate Code

Saat teacher memilih regenerate:

1. tampilkan confirmation dialog;
2. generate code baru;
3. update class;
4. delete/invalidate code lama;
5. code lama tidak dapat digunakan.

---

## PR-CLASS-004 — Membership

Membership:

```text
/classMemberships/{classId}/{studentId}
```

Data:

```ts
{
  joinedAt: number,
  status: "active"
}
```

---

# 12. Learning Engine

Learning Engine adalah komponen inti yang mengatur:

- step;
- state;
- validation;
- autosave;
- completion;
- unlock.

---

## 12.1 Generic Step State

```ts
interface StepState {
  visited: boolean
  completed: boolean
  startedAt?: number
  completedAt?: number
  attemptCount?: number
}
```

---

## 12.2 Completion Rule

Module **tidak boleh selesai hanya karena route dibuka**.

Module selesai hanya jika seluruh requirement penting step terpenuhi.

---

## 12.3 Unlock Function

Contoh logic:

```ts
canAccessModule(
  userProgress,
  targetModule
)
```

Rule:

```text
M0 = always unlocked
M1 = M0 completed
M2 = M1 completed
M3 = M2 completed
M4 = M3 completed
M5 = M4 completed
M6 = M5 completed
M7 = M6 completed
```

---

## 12.4 Persist Progress

Setiap perubahan penting:

- completion step;
- submit answer;
- finish experiment;
- module complete;

harus memperbarui:

```text
/progress/{classId}/{studentId}
```

---

# 13. Generic Inquiry Module Pattern

Modul 1–4 mengikuti pola:

```text
1. Orientasi
2. Merumuskan Masalah
3. Merumuskan Hipotesis
4. Mengumpulkan Data
   4.1 Persiapan
   4.2 Observasi Makroskopik
   4.3 Submikroskopik
   4.4 Tabel & Grafik
   4.5 Simbolik
   4.6 Explain 3 Level
5. Menguji Hipotesis
6. Menyimpulkan
```

Reusable components harus diprioritaskan.

Contoh:

```text
<OrientationCard />
<GuidedProblemForm />
<HypothesisForm />
<ExperimentSetup />
<ExperimentCanvas />
<ParticleView />
<DataTable />
<ExperimentChart />
<EquationInput />
<ThreeLevelExplanation />
<HypothesisEvaluation />
<ConclusionForm />
```

---

# 14. Module 0 Requirements

# Modul 0 — Orientasi Awal

---

## PR-M0-001 — Welcome

Route:

```text
/student/modules/0?step=0.1
```

Tampilkan:

- nama siswa;
- tujuan;
- pengantar ReactoLab;
- stepper `1 dari 3`;
- CTA.

Save:

```text
module0.startedAt
module0.currentStep = "0.1"
```

---

## PR-M0-002 — Apersepsi

Tampilkan dua animasi:

- besi berkarat;
- pembakaran kayu.

Implementation:

- SVG / CSS / Canvas;
- ringan;
- mobile friendly.

Controls:

- play;
- replay;
- skip;
- lanjut.

Complete ketika tayangan pernah dijalankan/diakui.

---

## PR-M0-003 — Mission Map

Tampilkan:

- Konsentrasi;
- Luas Permukaan;
- Suhu;
- Katalis.

Saat klik:

`Masuk ke Misi 1`

System:

```text
module0.status = completed
module0.completionPercent = 100
module0.completedAt = timestamp
module1.status = unlocked
```

---

# 15. Module 1 Requirements

# Modul 1 — Faktor Konsentrasi

Eksperimen:

```text
Mg(s) + HCl(aq)
```

---

## PR-M1-001 — Orientation

Fenomena:

dua kain dengan larutan pemutih berbeda konsentrasi.

Save:

```text
orientasiViewed = true
```

---

## PR-M1-002 — Problem Statement

Prompt:

```text
Bagaimana pengaruh ___ terhadap ___?
```

Validation concept:

- konsentrasi;
- laju/waktu reaksi.

System tidak perlu menggunakan AI NLP.

Gunakan keyword/scaffold validation sederhana.

---

## PR-M1-003 — Hypothesis

Template:

```text
Jika konsentrasi larutan ___,
maka laju reaksi akan ___,
karena ___.
```

Required:

- semua field;
- reason tidak kosong.

---

## PR-M1-004 — Experiment Setup

Student menentukan minimal:

```text
3 concentration values
```

Range:

```text
0.5 M – 3.0 M
```

Rules:

- values unique;
- HCl volume fixed;
- Mg amount fixed.

Warning non-blocking jika:

```text
difference < 0.1 M
```

---

## PR-M1-005 — Experiment Simulation

Visual:

- reaction vessel;
- Mg;
- bubbles;
- reaction completion;
- stopwatch.

Model:

hasil deterministik.

Contoh konsep:

```ts
reactionTime = f(concentration)
```

Constraint:

konsentrasi lebih tinggi → reaction time lebih rendah.

Tidak perlu scientific kinetic engine kompleks.

---

## PR-M1-006 — Particle Zoom

Tampilkan:

- H+ particles;
- Mg surface;
- collision;
- effective collision;
- ineffective collision.

Implementation:

2D Canvas/SVG.

---

## PR-M1-007 — Data Recording

Auto-save:

```ts
{
  concentration,
  observedTime,
  attemptNo
}
```

---

## PR-M1-008 — Graph

Graph:

```text
x = concentration
y = reaction time
```

Responsive.

---

## PR-M1-009 — Symbolic Representation

Equation:

```text
Mg + 2HCl → MgCl2 + H2
```

Student melengkapi koefisien/field.

Rate:

```text
rate = 1 / t
```

---

## PR-M1-010 — 3-Level Explain

3 textarea:

1. makroskopik;
2. submikroskopik;
3. simbolik.

---

## PR-M1-011 — Test Hypothesis

Show:

- initial hypothesis;
- experiment data.

Student chooses:

- diterima;
- ditolak.

Reason wajib menyertakan data.

---

## PR-M1-012 — Conclusion

Kesimpulan harus menghubungkan:

- konsentrasi;
- laju;
- data.

On complete:

```text
module1.completed
module2.unlocked
```

---

# 16. Module 2 Requirements

# Modul 2 — Faktor Luas Permukaan

Experiment:

```text
CaCO3 + HCl
```

Conditions:

- powder;
- granules;
- flakes;
- chunks.

---

## PR-M2-001 — Experiment Setup

Student pilih minimal 3 bentuk.

Fixed variables:

- CaCO3 mass;
- HCl volume;
- HCl concentration.

---

## PR-M2-002 — Macro Simulation

Virtual apparatus:

- Erlenmeyer;
- hose;
- inverted measuring cylinder;
- water;
- CO2.

Output:

```text
volume CO2 vs time
```

---

## PR-M2-003 — Surface Zoom

2D particle visualization.

Concept:

```text
larger surface area
→ more collision sites
→ faster reaction
```

---

## PR-M2-004 — Data

Sampling:

contoh setiap:

```text
10 seconds
```

Stop ketika perubahan volume sangat kecil selama beberapa interval.

---

## PR-M2-005 — Graph

```text
x = time
y = CO2 volume
series = selected forms
```

---

## PR-M2-006 — Symbolic

Equation:

```text
CaCO3 + 2HCl → CaCl2 + H2O + CO2
```

Rate:

```text
ΔV / Δt
```

---

## PR-M2-007 — Completion

Setelah conclusion valid:

```text
module2.completed
module3.unlocked
```

---

# 17. Module 3 Requirements

# Modul 3 — Faktor Suhu

Experiment:

```text
Na2S2O3 + HCl
```

---

## PR-M3-001 — Temperature Selection

Minimal:

```text
3 temperatures
```

Range:

```text
15 °C – 60 °C
```

Unique values.

---

## PR-M3-002 — Macro Experiment

Visual:

- top-view container;
- X below vessel;
- solution becomes opaque.

Student:

- Start;
- Stop ketika X hilang.

---

## PR-M3-003 — Maxwell-Boltzmann View

Tampilkan:

- distribution curve;
- activation energy line;
- selected experiment temperatures.

Higher temperature:

- distribution changes;
- particles with E ≥ Ea increase.

---

## PR-M3-004 — Data

Store:

```ts
{
  temperature,
  observedTime,
  rate
}
```

Rate:

```text
1/t
```

---

## PR-M3-005 — Completion

Conclusion valid:

```text
module3.completed
module4.unlocked
```

---

# 18. Module 4 Requirements

# Modul 4 — Faktor Katalis

Experiment:

```text
H2O2 decomposition
```

Conditions:

- no catalyst;
- MnO2;
- FeCl3;
- liver extract.

---

## PR-M4-001 — Setup

Student select:

```text
>= 3 conditions
```

Fixed:

- H2O2 volume;
- concentration;
- catalyst amount where applicable.

---

## PR-M4-002 — Macro Simulation

Display multiple vessels.

Output:

```text
O2 volume vs time
```

Timeline should be synchronized.

---

## PR-M4-003 — Catalyst Model

2D conceptual model:

- interaction;
- lower activation energy pathway.

Diagram:

```text
Ea no catalyst > Ea catalyst
```

Label as:

`Model Konseptual`

---

## PR-M4-004 — Symbolic

Equation:

```text
2H2O2 → 2H2O + O2
```

---

## PR-M4-005 — Finalize LKPD

On valid conclusion:

System:

1. collect module 1–4 final data;
2. create snapshot;
3. set modules 1–4 read-only;
4. set `lkpdFinalizedAt`;
5. enable download;
6. complete Module 4;
7. unlock Module 5.

---

# 19. LKPD Product Requirements

## PR-LKPD-001 — Snapshot

Path:

```text
/lkpdSnapshots/{classId}/{studentId}
```

Store:

- problem statements;
- hypotheses;
- experiment setup;
- experiment result;
- calculations;
- explanations;
- hypothesis verdict;
- conclusions.

---

## PR-LKPD-002 — PDF

Generate PDF client-side.

Suggested libraries:

- `@react-pdf/renderer`
or
- `jsPDF`

Do not store generated PDF in RTDB.

---

## PR-LKPD-003 — Read Only

After finalization:

Modul 1–4 academic response becomes read-only.

System should still allow:

- viewing;
- downloading.

---

# 20. Module 5 Requirements

# Modul 5 — Konfirmasi Materi

---

## PR-M5-001 — Reaction Rate Concept

Show:

```text
v = +Δ[product]/Δt
v = -Δ[reactant]/Δt
```

Interactive:

- time slider;
- reactant curve;
- product curve.

---

## PR-M5-002 — Rate Law

Show:

```text
v = k[A]^m[B]^n
```

Explain:

- k;
- m;
- n.

Graph:

- zero order;
- first order;
- second order.

---

## PR-M5-003 — Collision Theory

Controls:

- particle energy;
- orientation.

Logic:

```ts
effectiveCollision =
  energy >= activationEnergy &&
  orientationValid
```

Student wajib melakukan minimal interaction count tertentu.

---

## PR-M5-004 — Completion

Set:

```text
module5.completed
module6.unlocked
```

---

# 21. Module 6 Requirements

# Modul 6 — Forum Diskusi

---

## PR-M6-001 — Load Discussion Cases

Query:

```text
discussionCases
where classId = student.classId
and published = true
```

Sort by:

```text
order
```

If no case:

`Menunggu Guru`

---

## PR-M6-002 — Article

Display:

- title;
- link;
- teacher question.

Try iframe only if allowed.

Fallback:

`Buka Artikel`

---

## PR-M6-003 — CER Form

Fields:

### Claim
Textarea.

### Evidence
Textarea.

### Reasoning
Textarea.

All required.

Submit button disabled until complete.

---

## PR-M6-004 — Submit-to-Reveal

Before student CER submitted:

```text
forum feed = hidden
```

After submission:

```text
forum feed = visible
```

---

## PR-M6-005 — Forum Feed

Show:

- student name;
- Claim;
- Evidence;
- Reasoning;
- timestamp;
- comments.

Only same:

```text
classId + caseId
```

---

## PR-M6-006 — Comment

Student wajib memberi minimal:

```text
1 comment
```

Comment fields:

```ts
{
  commentId,
  authorId,
  content,
  createdAt
}
```

---

## PR-M6-007 — Decision Making

Display:

teacher `decisionPrompt`.

Fallback default only if template requires.

Student input:

- decision;
- reasoning.

---

## PR-M6-008 — Multiple Cases

Do not hardcode 2.

Use:

```ts
discussionCases[]
```

Loop dynamically.

---

## PR-M6-009 — Teacher Confirmation

When student completes all cases:

status:

```text
waiting_teacher_confirmation
```

Wait for:

```text
teacherConclusion.published = true
```

Then:

```text
module6.completed
module7.unlocked
```

---

# 22. Module 7 Requirements

# Modul 7 — Penutup

Display:

- completion message;
- 100%;
- course completed timestamp;
- button dashboard;
- button download LKPD.

Set:

```text
courseCompletedAt
finalProgress = 100
```

---

# 23. Teacher Dashboard Requirements

## PR-TCH-DASH-001 — Summary

Cards:

- class count;
- active students;
- completion average;
- recent activity.

---

## PR-TCH-DASH-002 — Class Card

Display:

- className;
- classCode;
- number of students;
- progress summary;
- Open Class button.

---

# 24. Monitoring Requirements

## PR-TCH-MON-001 — Matrix

Desktop:

| Student | M0 | M1 | M2 | M3 | M4 | M5 | M6 | M7 |
|---|---|---|---|---|---|---|---|---|

Cell:

- belum mulai;
- aktif;
- selesai;
- percentage.

---

## PR-TCH-MON-002 — Mobile

Use:

```text
Student Card
  └── Module Accordion
```

Avoid horizontal matrix on phone.

---

## PR-TCH-MON-003 — Filters

Filter:

- class;
- module;
- status;
- student search.

---

## PR-TCH-MON-004 — Realtime

Subscribe only:

```text
/progress/{classId}
```

while teacher is viewing class.

---

# 25. Student Detail Requirements

## PR-TCH-STU-001 — Student Header

Show:

- name;
- class;
- overall progress;
- current module;
- last activity.

---

## PR-TCH-STU-002 — Module Detail

Teacher selects module.

Fetch only:

```text
responses/{classId}/{studentId}/{moduleId}
experimentData/{classId}/{studentId}/{moduleId}
```

---

## PR-TCH-STU-003 — Read Only

No edit field.

Teacher cannot change academic content.

---

# 26. Teacher Discussion Management

## PR-TCH-DISC-001 — Create Case

Fields:

```ts
{
  articleTitle: string
  articleUrl: string
  questionPrompt: string
  decisionPrompt?: string
  order: number
}
```

---

## PR-TCH-DISC-002 — Status

```text
draft
published
```

UI:

- Save Draft
- Preview
- Publish

---

## PR-TCH-DISC-003 — Publish

On publish:

```text
published = true
publishedAt = timestamp
```

Students see case immediately.

---

## PR-TCH-DISC-004 — Forum Monitoring

Teacher can see:

- submitted count;
- pending count;
- comments count;
- each CER.

---

## PR-TCH-DISC-005 — Teacher Conclusion

Fields:

- conclusion text;
- draft state;
- published.

On publish:

students with complete discussion requirement may complete M6.

---

# 27. Admin Product Requirements

## PR-ADM-001 — Dashboard

Cards:

- total users;
- students;
- teachers;
- active;
- inactive.

---

## PR-ADM-002 — User Table

Columns:

- Name
- Email
- Role
- Status
- Created At
- Actions

---

## PR-ADM-003 — Search

Search by:

- name;
- email.

---

## PR-ADM-004 — Filter

Filter:

- student;
- teacher;
- active;
- inactive.

---

## PR-ADM-005 — Create User

Admin form:

- name;
- email;
- initial role.

Call:

```text
POST /api/admin/users
```

---

## PR-ADM-006 — Deactivate User

Preferred MVP:

```text
status = inactive
```

and Firebase Auth disabled server-side.

---

## PR-ADM-007 — Delete User

Permanent delete is secondary.

Require explicit high-risk confirmation.

---

## PR-ADM-008 — Change Role

Endpoint:

```text
PATCH /api/admin/users/{uid}/role
```

Allowed:

```text
student ↔ teacher
```

---

## PR-ADM-009 — Reset Password

Admin processes pending request.

Recommended implementation:

1. verify request;
2. create temporary password server-side;
3. update Firebase Auth;
4. set:

```text
forcePasswordChange = true
```

5. resolve request;
6. create audit.

Alternative safe implementation:
generate Firebase password reset link and send/share through defined admin workflow.

---

# 28. Admin API Requirements

Firebase Admin SDK is **server-side only**.

---

## POST /api/admin/users

Request:

```json
{
  "name": "Student Name",
  "email": "student@example.com",
  "role": "student"
}
```

Response:

```json
{
  "success": true,
  "uid": "firebase_uid"
}
```

---

## PATCH /api/admin/users/:uid/role

Request:

```json
{
  "role": "teacher"
}
```

---

## PATCH /api/admin/users/:uid/status

```json
{
  "status": "inactive"
}
```

---

## POST /api/admin/users/:uid/reset-password

Purpose:

admin-assisted reset.

---

## DELETE /api/admin/users/:uid

Optional permanent delete.

---

# 29. API Security

Every admin endpoint must:

1. read Authorization Bearer token;
2. verify Firebase ID token;
3. verify admin role;
4. validate payload;
5. execute admin action;
6. create audit log;
7. sanitize response.

Never return:

- Firebase private key;
- password;
- service credential;
- raw ID token.

---

# 30. Firebase Data Model

Recommended RTDB structure:

```text
/
├── users
│   └── {uid}
│       ├── name
│       ├── email
│       ├── role
│       ├── status
│       ├── forcePasswordChange
│       ├── activeClassId
│       └── createdAt
│
├── classes
│   └── {classId}
│       ├── className
│       ├── classCode
│       ├── teacherId
│       ├── status
│       └── createdAt
│
├── classCodes
│   └── {classCode}
│       └── classId
│
├── classMemberships
│   └── {classId}
│       └── {studentId}
│           ├── joinedAt
│           └── status
│
├── progress
│   └── {classId}
│       └── {studentId}
│           ├── currentModule
│           ├── currentStep
│           ├── overallPercent
│           ├── lastActivityAt
│           └── modules
│               └── module0
│               └── module1
│               └── module2
│               └── module3
│               └── module4
│               └── module5
│               └── module6
│               └── module7
│
├── responses
│   └── {classId}
│       └── {studentId}
│           └── {moduleId}
│               └── {stepId}
│
├── experimentData
│   └── {classId}
│       └── {studentId}
│           └── {moduleId}
│               ├── setup
│               ├── trials
│               ├── selectedResult
│               └── calculations
│
├── lkpdSnapshots
│   └── {classId}
│       └── {studentId}
│
├── discussionCases
│   └── {classId}
│       └── {caseId}
│
├── forumPosts
│   └── {classId}
│       └── {caseId}
│           └── {postId}
│
├── forumComments
│   └── {classId}
│       └── {caseId}
│           └── {postId}
│               └── {commentId}
│
├── discussionProgress
│   └── {classId}
│       └── {studentId}
│           └── {caseId}
│
├── teacherConclusions
│   └── {classId}
│
├── passwordResetRequests
│   └── {requestId}
│
└── auditLogs
    └── {logId}
```

---

# 31. Example User Data

```json
{
  "users": {
    "UID123": {
      "name": "Budi",
      "email": "budi@example.com",
      "role": "student",
      "status": "active",
      "forcePasswordChange": false,
      "activeClassId": "CLASS001",
      "createdAt": 1788012000000
    }
  }
}
```

---

# 32. Example Progress Data

```json
{
  "currentModule": 2,
  "currentStep": "2.4.2",
  "overallPercent": 31,
  "lastActivityAt": 1788012000000,
  "modules": {
    "0": {
      "status": "completed",
      "completionPercent": 100
    },
    "1": {
      "status": "completed",
      "completionPercent": 100
    },
    "2": {
      "status": "in_progress",
      "currentStep": "2.4.2",
      "completionPercent": 45
    },
    "3": {
      "status": "locked",
      "completionPercent": 0
    }
  }
}
```

---

# 33. Experiment Data Shape

Example Module 1:

```json
{
  "setup": {
    "mgAmount": 0.1,
    "hclVolume": 20,
    "selectedConcentrations": [0.5, 1.5, 3.0]
  },
  "trials": [
    {
      "concentration": 0.5,
      "observedTime": 55.2,
      "attempt": 1
    },
    {
      "concentration": 1.5,
      "observedTime": 31.4,
      "attempt": 1
    },
    {
      "concentration": 3.0,
      "observedTime": 17.9,
      "attempt": 1
    }
  ]
}
```

---

# 34. Autosave Strategy

Autosave used on:

- problem statement;
- hypothesis;
- explain;
- conclusion;
- forum draft if desired.

Use debounce:

```text
1000–3000 ms
```

Recommended:

```ts
saveOn:
- blur
- debounced input
- explicit Next button
```

Critical submit uses explicit button.

---

# 35. Realtime Strategy

## Student

Realtime listeners:

```text
users/{uid}
progress/{classId}/{uid}
teacherConclusions/{classId}
```

Do not realtime-listen entire responses tree.

---

## Teacher

When opening a class:

```text
classMemberships/{classId}
progress/{classId}
```

When selecting student:

fetch:

```text
responses/{classId}/{studentId}/{moduleId}
experimentData/{classId}/{studentId}/{moduleId}
```

---

## Forum

Listener:

```text
forumPosts/{classId}/{caseId}
forumComments/{classId}/{caseId}
```

Only while case forum page is active.

---

# 36. Firebase Security Rule Requirements

Exact JSON rules will be implemented during development, but must enforce:

---

## Student Access

Student can:

```text
read own user
read/write own progress
read/write own response
read/write own experiment
read published discussion cases in own class
create own forum post
create own comment
read same-class forum according to app eligibility
```

Cannot:

```text
edit role
edit other student's response
edit classes
publish teacher conclusion
read audit
```

---

## Teacher Access

Teacher can:

```text
read classes where teacherId == auth.uid
write own classes
read memberships for own class
read student progress for own class
read responses for own class
read experiment data for own class
manage discussionCases for own class
manage teacherConclusion for own class
```

Cannot:

```text
write student academic response
change user roles
read classes owned by other teachers
```

---

## Admin

Sensitive admin writes are executed server-side.

---

# 37. UI Design Requirements

Product visual direction:

- clean;
- modern;
- educational;
- not childish;
- chemistry identity;
- responsive;
- readable;
- card-based;
- spacious.

---

# 38. Responsive Breakpoints

Suggested:

```text
mobile: < 640px
tablet: 640–1023px
desktop: >= 1024px
```

---

# 39. Mobile Rules

On mobile:

- sidebar → drawer;
- teacher matrix → cards;
- tables → horizontal scroll;
- charts → 100% card width;
- controls → minimum 44px tap area;
- 3D can fallback 2D;
- multi-column form → stacked.

---

# 40. Loading States

Every async screen must have:

- skeleton/loading;
- empty;
- error;
- success where relevant.

Never show blank page while Firebase resolves.

---

# 41. Error Handling

Common messages:

```text
Tidak dapat terhubung. Periksa koneksi internet.
Data gagal disimpan. Coba lagi.
Kode kelas tidak ditemukan.
Modul masih terkunci.
Anda tidak memiliki akses ke halaman ini.
Artikel tidak dapat ditampilkan di dalam ReactoLab.
```

---

# 42. Simulation Architecture

Each simulation should be isolated.

Example:

```text
/features/simulations/
├── module1-concentration/
├── module2-surface-area/
├── module3-temperature/
├── module4-catalyst/
└── collision-theory/
```

---

# 43. 2D vs 3D Rules

Use 3D only where spatial understanding improves experience.

### 3D recommended:
- Module 1 reaction apparatus;
- Module 2 gas collection apparatus;
- Module 4 multiple vessels.

### 2D recommended:
- apersepsi;
- particle view;
- Maxwell-Boltzmann;
- graph;
- collision theory;
- energy diagram;
- temperature X experiment.

---

# 44. Simulation Determinism

MVP simulations do not need full chemistry engine.

They should be deterministic and pedagogically consistent.

Example:

```ts
higherConcentration → shorterReactionTime
higherTemperature → shorterReactionTime
largerSurfaceArea → fasterGasFormation
catalyst → fasterGasFormation
```

Student-selected parameters influence generated result.

---

# 45. Suggested Frontend Stack

```text
Next.js
TypeScript
React
Tailwind CSS
Firebase JS SDK
React Hook Form
Zod
Recharts or Chart.js
KaTeX
Three.js / React Three Fiber
Zustand optional
React PDF / jsPDF
```

Avoid adding dependencies without clear purpose.

---

# 46. Suggested Folder Structure

```text
src/
├── app/
│   ├── login/
│   ├── student/
│   ├── teacher/
│   ├── admin/
│   └── api/
│       └── admin/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── charts/
│   ├── forms/
│   └── learning/
│
├── features/
│   ├── auth/
│   ├── classroom/
│   ├── progress/
│   ├── modules/
│   ├── simulations/
│   ├── discussion/
│   ├── teacher/
│   └── admin/
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   └── admin.ts
│   ├── validation/
│   └── utils/
│
├── hooks/
├── types/
└── constants/
```

---

# 47. Firebase Client Config

Environment variables:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

# 48. Firebase Admin Config

Vercel server environment:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Never:

```text
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY
```

---

# 49. Performance Requirements

## P0

- do not load all modules initially;
- lazy-load each module;
- lazy-load 3D;
- optimize GLB;
- use WebP/AVIF;
- unsubscribe Firebase listeners;
- query by class/student/module;
- avoid whole database reads.

---

# 50. Free Tier Optimization

Important product constraints:

1. Do not store Base64 images.
2. Do not store PDF.
3. Do not store video.
4. Store only structured JSON.
5. Generate graph in browser.
6. Generate PDF in browser.
7. Student writes directly to Firebase.
8. Do not proxy student progress via Vercel API.
9. Use admin API only for privileged actions.
10. Keep concurrent class use around target scale.

---

# 51. Analytics Stored by Product

Minimum product analytics stored:

```text
lastActivityAt
startedAt
completedAt
attemptCount
retryCount
timeOnStep
interactionCount
```

Do not create unnecessary tracking outside learning needs.

---

# 52. Audit Log

Data:

```ts
interface AuditLog {
  actionType: string
  adminId: string
  targetUserId?: string
  timestamp: number
  metadata?: Record<string, string | number | boolean>
}
```

Never include password/token.

---

# 53. Reset Progress

Settings:

`Reset Progres Pembelajaran`

Dialog 1:

```text
Reset progres akan menghapus jawaban dan hasil eksperimen.
```

Dialog 2:

```text
Ketik RESET untuk melanjutkan.
```

On complete:

- delete/reinitialize progress;
- responses;
- experiments;
- retry;
- discussion response if total reset.

Preserve:

- account;
- role;
- class membership.

---

# 54. Empty States

Examples:

## Student no class

```text
Kamu belum bergabung ke kelas.
Masukkan kode kelas dari guru.
```

## Teacher no class

```text
Belum ada kelas.
Buat kelas pertama.
```

## Forum no case

```text
Studi kasus belum dipublikasikan guru.
```

## Admin no reset requests

```text
Tidak ada permintaan reset password.
```

---

# 55. Product Acceptance Test

## PAT-01 Student Auth

- student login successful;
- redirected dashboard;
- cannot access teacher route.

---

## PAT-02 Teacher Auth

- teacher login;
- opens teacher dashboard;
- cannot access admin.

---

## PAT-03 Join Class

- teacher creates class;
- class code generated;
- student enters code;
- student membership created.

---

## PAT-04 Module Unlock

- Module 0 unlocked;
- Module 1 locked before M0 completion;
- after M0 completion M1 opens;
- direct URL to locked module denied.

---

## PAT-05 Persistence

Student:

- fills answer;
- refreshes;
- answer remains.

---

## PAT-06 Experiment

Module 1:

- selects 3 concentrations;
- runs 3 trials;
- data table appears;
- graph appears;
- calculations save.

Repeat for M2–M4 core flows.

---

## PAT-07 Teacher Realtime

Teacher opens monitoring.

Student completes step.

Teacher dashboard updates without manual refresh.

---

## PAT-08 Teacher Read Only

Teacher opens response.

No edit control exists.

Backend rules reject unauthorized response write.

---

## PAT-09 Forum Submit-to-Reveal

Before CER submission:

forum hidden.

After CER submission:

forum visible.

---

## PAT-10 Forum Comments

Student submits >=1 valid comment.

Case completion requirement updates.

---

## PAT-11 Teacher Conclusion

Teacher publishes conclusion.

Eligible students can complete M6.

---

## PAT-12 Final Completion

Student completes M6.

M7 opens.

M7 sets:

```text
finalProgress=100
```

---

## PAT-13 Admin Create User

Admin creates new user via server API.

Firebase Auth user exists.

User profile exists.

Audit exists.

---

## PAT-14 Admin Role

Admin changes student → teacher.

User receives new route permission after auth refresh.

---

## PAT-15 Load Test

Test:

- 35 student accounts;
- 1 teacher;
- same class;
- simultaneous progress updates;
- monitoring active.

No architecture-induced failure.

---

# 56. Development Priorities

## P0 — Required Before Classroom Trial

### Foundation
- project setup;
- Firebase Auth;
- Firebase RTDB;
- role system;
- route guards;
- responsive layout.

### Class
- teacher create class;
- class code;
- student join.

### Student
- dashboard;
- module engine;
- progress.

### Learning
- Module 0;
- Module 1;
- Module 2;
- Module 3;
- Module 4;
- LKPD finalization;
- Module 5;
- Module 6;
- Module 7.

### Teacher
- monitoring;
- student responses;
- discussion management;
- conclusion.

### Security
- Firebase Rules;
- server admin config.

---

## P1

- full admin dashboard;
- reset admin;
- audit;
- sophisticated filters;
- PDF styling;
- progress analytics.

---

## P2

- enhanced 3D;
- richer animations;
- export research data;
- practice questions;
- additional teacher analytics.

---

# 57. Recommended Development Sequence for AI Agent

AI agent should execute in this exact order.

---

## Sprint 0 — Initialize

1. create Next.js TypeScript project;
2. install dependencies;
3. setup Tailwind;
4. setup environment validation;
5. setup Firebase client;
6. setup Firebase admin;
7. create base types;
8. create responsive role layout.

**Do not build simulations yet.**

---

## Sprint 1 — Authentication

1. login;
2. register;
3. forgot password;
4. auth context;
5. role fetch;
6. protected route;
7. role routing.

Exit criteria:

all three roles can reach correct dashboard shell.

---

## Sprint 2 — Classroom

1. class model;
2. create class;
3. class code generation;
4. classCodes index;
5. student join;
6. membership;
7. teacher class list.

Exit criteria:

teacher creates class and 1 student joins successfully.

---

## Sprint 3 — Progress Engine

1. progress model;
2. module statuses;
3. step statuses;
4. unlock function;
5. save progress;
6. resume learning;
7. dashboard progress.

Exit criteria:

mock modules can progress sequentially and persist.

---

## Sprint 4 — Generic Inquiry Components

Build reusable components:

- Orientation;
- Problem;
- Hypothesis;
- Experiment shell;
- Data table;
- Chart;
- Explanation;
- Test hypothesis;
- Conclusion.

Exit criteria:

one demo module can use all generic components.

---

## Sprint 5 — Module 0

Implement complete.

---

## Sprint 6 — Module 1

Implement fully and use it as reference architecture for Modules 2–4.

Do not proceed before:

- persistence works;
- retry works;
- table works;
- graph works;
- teacher can read result.

---

## Sprint 7 — Module 2

Reuse architecture.

---

## Sprint 8 — Module 3

Reuse architecture.

---

## Sprint 9 — Module 4 + LKPD

Finish:

- catalyst;
- finalization;
- read-only;
- PDF.

---

## Sprint 10 — Module 5

Interactive conceptual learning.

---

## Sprint 11 — Teacher Monitoring

1. progress matrix;
2. filters;
3. student details;
4. realtime.

---

## Sprint 12 — Discussion

1. teacher case CRUD;
2. article rendering;
3. student CER;
4. submit-to-reveal;
5. forum;
6. comments;
7. decision;
8. conclusion.

---

## Sprint 13 — Module 7

Completion state.

---

## Sprint 14 — Admin

1. server auth;
2. user management;
3. roles;
4. reset;
5. audit.

---

## Sprint 15 — Security

1. Firebase Rules;
2. unauthorized read tests;
3. unauthorized write tests;
4. admin API token validation.

---

## Sprint 16 — Load & Device Test

Test:

- 35 students;
- teacher;
- mobile;
- desktop;
- Firebase usage;
- Vercel usage.

---

# 58. AI Agent Coding Rules

The AI coding agent MUST:

1. implement one feature group at a time;
2. run typecheck after major changes;
3. run lint;
4. run build;
5. avoid placeholder logic for completed feature;
6. avoid rewriting working architecture unnecessarily;
7. reuse generic module components;
8. protect routes;
9. enforce database rules;
10. keep Firebase Admin server-only;
11. lazy-load simulations;
12. not store large binary data in RTDB.

---

# 59. Definition of Done Per Feature

A feature is done only when:

- UI exists;
- loading state exists;
- error state exists;
- validation exists;
- Firebase read/write works;
- security is respected;
- responsive layout works;
- typecheck passes;
- build passes;
- acceptance criteria passes.

---

# 60. Definition of Done Product

ReactoLab MVP is complete when:

1. deployed on Vercel;
2. Firebase Auth works;
3. role routing works;
4. teacher can create class;
5. 30–35 students can join;
6. student progress persists;
7. Modul 0–7 flow works;
8. experiments Module 1–4 work;
9. LKPD is finalized;
10. Module 5 works;
11. teacher creates forum case;
12. CER works;
13. submit-to-reveal works;
14. comments work;
15. teacher conclusion works;
16. teacher realtime monitoring works;
17. admin functions work;
18. Security Rules tested;
19. responsive mobile flow works;
20. 35-user classroom test passes.

---

# 61. Product Constraints

The implementation must preserve these constraints:

```text
TARGET:
30–35 concurrent students

HOST:
Vercel free tier

AUTH:
Firebase Authentication free tier

DATABASE:
Firebase Realtime Database free tier

NO PRIMARY PAID BACKEND

NO LARGE FILE STORAGE IN RTDB

NO ADMIN SECRET IN CLIENT

NO DIRECT MODULE SKIPPING

NO TEACHER EDIT OF STUDENT ANSWERS

NO STUDENT VIEW OF PEER CER BEFORE OWN SUBMISSION
```

---

# 62. Core Product Invariants

These rules must never be violated.

### INV-01
After student login:

```text
first page = Student Dashboard
```

not Module 0.

### INV-02

```text
Dashboard != learning module
```

### INV-03

Modules unlock sequentially.

### INV-04

Teacher reads but does not edit academic answers.

### INV-05

Forum is scoped by:

```text
classId + caseId
```

### INV-06

CER uses exactly separate:

```text
Claim
Evidence
Reasoning
```

### INV-07

Peer feed is locked before own CER submit.

### INV-08

Admin role cannot be granted via normal client dropdown.

### INV-09

Firebase Admin SDK is never bundled client-side.

### INV-10

Student academic data is persistent.

---

# 63. Final Implementation Summary

```text
PRODUCT:
ReactoLab

DOMAIN:
Chemistry education — Reaction Rate

LEARNING MODEL:
Guided Inquiry

USERS:
Student
Teacher
Admin

STUDENT SCALE:
30–35 simultaneous students

FRONTEND:
Next.js + React + TypeScript

HOST:
Vercel Hobby

AUTH:
Firebase Authentication

DATABASE:
Firebase Realtime Database

SERVER:
Vercel server-side endpoints only for privileged admin operations

LEARNING:
Dashboard
M0 Orientation
M1 Concentration
M2 Surface Area
M3 Temperature
M4 Catalyst
LKPD Finalization
M5 Concept Confirmation
M6 CER Forum
M7 Completion

TEACHER:
Classes
Codes
Realtime Monitoring
Student Answers
Discussion Case Authoring
Teacher Conclusion

ADMIN:
Users
Roles
Reset Password
Audit

OPTIMIZATION:
Scoped RTDB listener
Lazy-loading
2D-first
Selective 3D
Client-side graph
Client-side PDF
Structured JSON only
```

---

# 64. Handoff Prompt for AI Coding Agent

Gunakan prompt berikut ketika PRD ini diberikan kepada AI coding agent:

```text
You are the lead full-stack engineer for ReactoLab.

Implement the application strictly according to this PRD.

Important constraints:
- ReactoLab is a chemistry learning website for 30–35 students per classroom session.
- Deploy using Vercel Hobby/free tier.
- Use Firebase Authentication Email/Password.
- Use Firebase Realtime Database Spark/free tier.
- Use Next.js + TypeScript.
- Use Firebase Admin SDK only on server-side Vercel endpoints.
- Never expose Firebase Admin credentials to the browser.
- Normal student progress, answers, experiment data, and forum interactions should communicate directly between the client and Firebase RTDB.
- Optimize realtime listeners carefully for free-tier limits.
- Do not store images, videos, PDFs, or 3D assets as Base64 in RTDB.
- Build responsive mobile/tablet/desktop UI.
- Student must always land on Student Dashboard after login.
- Modules 0–7 unlock sequentially.
- Teacher has read-only access to student academic answers.
- Module 6 must use separate Claim, Evidence, Reasoning fields and submit-to-reveal.
- Teacher discussion content must be data-driven and class-specific.
- Admin account management must be server-side protected.
- Build reusable components for Modules 1–4.
- Use 2D simulations where 3D is unnecessary.
- Lazy-load all heavy simulation assets.

Development workflow:
1. Follow the sprint sequence in this PRD.
2. Do not jump ahead to later modules before the core learning/progress architecture is stable.
3. After every major feature:
   - run lint,
   - run typecheck,
   - run tests where available,
   - run production build.
4. Fix all errors before moving to the next sprint.
5. Never silently change product requirements.
6. When a requirement is ambiguous, choose the simplest implementation that preserves the stated product invariant.
7. Keep a DEVELOPMENT_STATUS.md file that tracks:
   - completed items,
   - current sprint,
   - pending items,
   - known issues.
8. Keep implementation production-readable and modular.
```

---

**END OF PRODUCT REQUIREMENTS DOCUMENT — REACTOLAB v1.0**
