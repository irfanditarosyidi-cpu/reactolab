# BUSINESS REQUIREMENTS DOCUMENT (BRD)
# REACTOLAB — Web Pembelajaran Laju Reaksi

**Versi:** 1.0  
**Tanggal:** 29 Agustus 2026  
**Status:** Draft implementasi MVP  
**Basis dokumen:** Storyboard Teknis Media Pembelajaran Web “ReactoLab”  
**Target penggunaan awal:** 1 kelas aktif, ±30–35 siswa dalam satu sesi pembelajaran  
**Hosting:** Vercel Hobby / gratis  
**Backend layanan:** Firebase Authentication + Firebase Realtime Database (Spark / gratis)

---

## 1. Ringkasan Eksekutif

ReactoLab adalah aplikasi web pembelajaran kimia pada materi **laju reaksi** berbasis **inkuiri terbimbing**. Sistem dirancang untuk mendukung pembelajaran siswa melalui modul berurutan, eksperimen virtual 2D/3D, penyimpanan jawaban dan progres, forum diskusi berbasis Claim–Evidence–Reasoning (CER), serta monitoring pembelajaran oleh guru secara realtime.

Aplikasi memiliki tiga role utama:

1. **Siswa**
   - Bergabung ke kelas menggunakan kode kelas.
   - Menjalankan pembelajaran Modul 0–7 secara berurutan.
   - Menyimpan jawaban, data eksperimen, progres, forum CER, dan hasil pembelajaran.
   - Mengunduh hasil LKPD setelah tahap eksperimen selesai.

2. **Guru**
   - Membuat dan mengelola kelas.
   - Mendapatkan kode kelas otomatis.
   - Melihat progres siswa secara realtime.
   - Melihat jawaban dan data eksperimen siswa secara read-only.
   - Membuat studi kasus forum diskusi berbasis artikel.
   - Memantau CER dan diskusi siswa.
   - Menulis serta mempublikasikan kesimpulan guru.

3. **Admin**
   - Memantau jumlah pengguna.
   - Menambah atau menonaktifkan/menghapus pengguna.
   - Menangani permintaan reset password.
   - Mengubah role student ↔ teacher.
   - Melihat audit log tindakan administratif.

Target awal sistem adalah penggunaan oleh **30–35 siswa dan satu guru dalam satu kelas secara bersamaan**. Sistem diprioritaskan sebagai **media pembelajaran/riset skala kelas**, bukan platform LMS skala sekolah besar.

---

## 2. Latar Belakang Bisnis

Pembelajaran laju reaksi membutuhkan pemahaman terhadap hubungan antara fenomena makroskopik, representasi submikroskopik, simbolik, data eksperimen, dan teori tumbukan. Pembelajaran konvensional dapat membatasi kesempatan siswa untuk melakukan eksperimen berulang, melihat representasi partikel, serta mendokumentasikan proses berpikirnya secara terstruktur.

ReactoLab dibangun untuk:

- menyediakan pengalaman eksperimen virtual yang dapat dilakukan melalui browser;
- membantu siswa menjalankan proses inkuiri secara berurutan;
- mengintegrasikan representasi makroskopik, submikroskopik, dan simbolik;
- memungkinkan guru memonitor proses dan jawaban siswa;
- memfasilitasi diskusi ilmiah berbasis CER;
- menyimpan progres pembelajaran lintas refresh/perangkat melalui Firebase;
- tetap dapat digunakan dengan biaya operasional awal **Rp0** selama masih berada dalam batas layanan gratis.

---

## 3. Tujuan Bisnis

### 3.1 Tujuan Utama

Membangun versi operasional ReactoLab yang dapat digunakan dalam satu kelas berisi sekitar **30–35 siswa secara bersamaan** tanpa membutuhkan server berbayar pada tahap awal.

### 3.2 Tujuan Spesifik

Sistem harus:

1. Menyediakan autentikasi berbasis email dan password.
2. Membedakan akses berdasarkan role siswa, guru, dan admin.
3. Menyediakan dashboard terpisah berdasarkan role.
4. Menyimpan progres belajar siswa secara persisten.
5. Menjalankan alur Modul 0–7 dengan mekanisme unlock berurutan.
6. Menyimpan jawaban dan data eksperimen setiap siswa.
7. Menampilkan progres siswa kepada guru secara realtime.
8. Menyediakan forum diskusi kelas dengan struktur CER.
9. Memungkinkan guru membuat studi kasus berbasis artikel.
10. Memungkinkan admin mengelola akun dan role.
11. Dapat dipublikasikan menggunakan Vercel Hobby.
12. Menggunakan Firebase Authentication dan Firebase Realtime Database pada paket gratis.
13. Tetap responsif pada desktop, tablet, dan smartphone.

---

## 4. Sasaran Penggunaan

### 4.1 Target Awal

| Parameter | Target |
|---|---:|
| Siswa aktif dalam satu sesi | 30–35 siswa |
| Guru aktif | 1–2 guru |
| Admin aktif | 1 admin |
| Total koneksi normal satu sesi kelas | ±32–40 perangkat/browser |
| Kelas aktif pada MVP | Diprioritaskan 1 kelas pada satu waktu |
| Platform | Browser modern |
| Perangkat | Laptop, tablet, smartphone |
| Hosting | Vercel Hobby |
| Database | Firebase Realtime Database Spark |
| Authentication | Firebase Authentication |

### 4.2 Batas Kapasitas MVP

Firebase Realtime Database pada Spark memiliki batas **100 koneksi simultan**. Karena target ReactoLab adalah sekitar 30–35 siswa dalam satu sesi, skenario ini masih berada di bawah batas koneksi tersebut.

Namun sistem **tidak boleh dirancang dengan asumsi ratusan siswa aktif secara bersamaan** pada paket Spark.

Untuk menjaga kapasitas:

- pengguna dianjurkan menggunakan satu tab ReactoLab;
- listener realtime hanya dipasang pada data yang sedang dibutuhkan;
- listener harus dilepas ketika halaman/komponen tidak lagi aktif;
- dashboard guru tidak boleh mengunduh seluruh database;
- query harus dibatasi berdasarkan `classId`, `studentId`, dan/atau `moduleId`;
- file besar, video, model 3D, dan gambar tidak disimpan sebagai Base64 di Realtime Database.

---

## 5. Stakeholder

| Stakeholder | Kepentingan |
|---|---|
| Siswa | Menggunakan ReactoLab untuk menjalankan pembelajaran dan eksperimen |
| Guru | Mengelola kelas, memonitor siswa, dan memfasilitasi diskusi |
| Admin | Mengelola akun dan role |
| Peneliti/Pengembang | Menjamin sistem berjalan sesuai desain pembelajaran dan kebutuhan penelitian |
| Validator/Ahli | Menilai kelayakan materi dan media |
| Sekolah | Tempat implementasi pembelajaran |

---

## 6. Ruang Lingkup Sistem

### 6.1 In Scope

#### A. Sistem Umum

- Landing page ReactoLab.
- Login.
- Registrasi pengguna sesuai kebijakan sistem.
- Lupa password melalui email.
- Permintaan reset password melalui admin.
- Role-based routing.
- Dashboard siswa.
- Dashboard guru.
- Dashboard admin.
- Settings.
- Responsive design.
- Penyimpanan data menggunakan Firebase Realtime Database.

#### B. Pembelajaran Siswa

- Modul 0 — Orientasi Awal.
- Modul 1 — Faktor Konsentrasi.
- Modul 2 — Faktor Luas Permukaan.
- Modul 3 — Faktor Suhu.
- Modul 4 — Faktor Katalis.
- Modul 5 — Konfirmasi Materi.
- Modul 6 — Forum Diskusi Berbasis Studi Kasus.
- Modul 7 — Penutup.
- Progress tracking.
- Sequential module unlock.
- Penyimpanan jawaban per step.
- Eksperimen virtual.
- Grafik/tabel data.
- Representasi makroskopik–submikroskopik–simbolik.
- Finalisasi LKPD Modul 1–4.
- Unduh LKPD.
- CER.
- Forum tanggapan teman.
- Decision making.
- Konfirmasi guru.

#### C. Dashboard Guru

- Membuat kelas.
- Generate kode kelas unik.
- Regenerate kode kelas.
- Melihat daftar siswa.
- Monitoring progres per siswa/per modul.
- Melihat jawaban siswa.
- Melihat data eksperimen.
- Membuat studi kasus forum.
- Memasukkan link artikel.
- Memasukkan pertanyaan.
- Memasukkan optional decision prompt.
- Publish/unpublish studi kasus.
- Melihat CER.
- Melihat komentar siswa.
- Menulis kesimpulan guru.
- Publish kesimpulan guru.

#### D. Dashboard Admin

- Statistik pengguna.
- Daftar pengguna.
- Pencarian/filter pengguna.
- Membuat akun siswa/guru.
- Menonaktifkan atau menghapus akun.
- Mengelola reset password.
- Mengubah role student ↔ teacher.
- Audit log tindakan admin.

---

## 7. Out of Scope MVP

Fitur berikut **tidak menjadi kebutuhan wajib versi awal**, kecuali ditambahkan pada requirement berikutnya:

- pembayaran;
- subscription;
- Firebase Storage sebagai kebutuhan utama;
- Cloud Functions Firebase berbayar;
- chat pribadi siswa–guru;
- video conference;
- multi-school tenancy;
- integrasi SSO sekolah;
- Google Classroom;
- LMS eksternal;
- push notification;
- offline-first penuh;
- multiplayer 3D sinkron;
- AI tutor;
- auto-grading jawaban esai berbasis AI;
- analitik big data;
- sertifikat digital;
- mobile app native Android/iOS.

**Catatan:** menu **Latihan Soal** dapat tersedia pada navigasi siswa sebagai placeholder, tetapi isi dan business rule latihan soal belum didefinisikan dalam storyboard sehingga tidak menjadi acceptance requirement pada BRD ini.

---

# 8. Business Rules Utama

## BR-01 — Routing Setelah Login

Setelah autentikasi berhasil:

- `student` → Dashboard Siswa.
- `teacher` → Dashboard Guru.
- `admin` → Dashboard Admin.

Siswa **tidak boleh** langsung diarahkan ke Modul 0 setelah login.

Alur normal:

`Landing Page → Login/Daftar → Dashboard berdasarkan role`

Untuk siswa:

`Dashboard Siswa → Mulai/Lanjutkan Pembelajaran → Modul`

---

## BR-02 — Role dan Hak Akses

Terdapat tiga role:

- `student`
- `teacher`
- `admin`

Setiap route harus memiliki proteksi role.

Pengguna yang mencoba membuka halaman di luar role-nya harus diarahkan kembali ke dashboard role masing-masing.

---

## BR-03 — Keanggotaan Kelas

Siswa masuk ke kelas menggunakan kode kelas yang diberikan guru.

Sistem harus memvalidasi:

- kode tersedia;
- kelas aktif;
- kode belum kedaluwarsa/nonaktif;
- siswa belum menjadi anggota kelas yang sama.

Pada MVP, satu siswa direkomendasikan hanya memiliki **satu kelas ReactoLab aktif** untuk satu rangkaian pembelajaran agar data forum dan progres tidak ambigu.

---

## BR-04 — Kode Kelas

Saat guru membuat kelas:

- sistem membuat `classId`;
- sistem membuat `classCode` otomatis;
- kode harus unik;
- format direkomendasikan 6 karakter huruf/angka kapital;
- collision harus dicek sebelum disimpan.

Jika guru melakukan regenerate:

- kode lama dinonaktifkan;
- kode baru menjadi satu-satunya kode aktif.

---

## BR-05 — Unlock Modul

Urutan pembelajaran:

`Dashboard → Modul 0 → Modul 1 → Modul 2 → Modul 3 → Modul 4 → Modul 5 → Modul 6 → Modul 7`

Aturan:

- Modul 0 tersedia sejak awal.
- Modul N+1 hanya terbuka setelah Modul N memenuhi syarat selesai.
- Membuka halaman saja tidak dianggap menyelesaikan modul.
- Modul terkunci tetap terlihat.
- Modul terkunci tidak dapat dibuka.
- UI harus menjelaskan syarat unlock.

---

## BR-06 — Progress Persisten

Progress disimpan ke Firebase sehingga:

- refresh tidak menghapus progres;
- logout/login kembali tidak menghapus progres;
- berpindah perangkat tetap dapat melanjutkan progres setelah login.

State minimum setiap modul:

- `status`
- `currentStep`
- `completionPercent`
- `startedAt`
- `lastOpenedAt`
- `completedAt`

Status:

- `locked`
- `unlocked`
- `in_progress`
- `completed`

---

## BR-07 — Penyimpanan Jawaban

Jawaban siswa harus disimpan per:

- `studentId`
- `classId`
- `moduleId`
- `stepId`

Autosave dapat digunakan pada textarea untuk mengurangi kehilangan data, tetapi penyimpanan harus menggunakan debounce agar tidak menghasilkan write berlebihan.

---

## BR-08 — Monitoring Guru

Guru hanya dapat mengakses siswa yang tergabung pada kelas miliknya.

Guru dapat:

- melihat progress;
- melihat step terakhir;
- melihat jawaban;
- melihat data eksperimen;
- melihat forum.

Guru **tidak boleh mengubah** jawaban akademik siswa.

---

## BR-09 — Realtime Monitoring

Perubahan berikut harus dapat terlihat pada dashboard guru tanpa refresh manual:

- progress siswa;
- current module;
- current step;
- completion percentage;
- jawaban yang sudah disimpan;
- status eksperimen;
- post forum;
- komentar forum.

Untuk efisiensi paket gratis, realtime subscription hanya dipasang untuk **kelas yang sedang dibuka guru**, bukan seluruh data aplikasi.

---

## BR-10 — Finalisasi LKPD

Setelah siswa menyelesaikan Modul 4:

1. validasi kesimpulan Modul 4;
2. finalisasi data LKPD Modul 1–4;
3. simpan snapshot data final;
4. tandai `lkpdFinalizedAt`;
5. Modul 1–4 menjadi read-only untuk siswa;
6. data final dapat dibaca guru;
7. siswa dapat mengunduh LKPD;
8. Modul 5 terbuka.

PDF sebaiknya dihasilkan di sisi client/browser agar tidak menambah beban serverless secara tidak perlu.

---

## BR-11 — Forum Submit-to-Reveal

Pada setiap studi kasus Modul 6:

1. siswa membaca artikel;
2. siswa menjawab **Claim**;
3. siswa menjawab **Evidence**;
4. siswa menjawab **Reasoning**;
5. ketiganya wajib terisi;
6. siswa submit;
7. barulah feed jawaban teman terbuka.

Siswa hanya dapat melihat forum dari kelas yang sama.

---

## BR-12 — Tanggapan Forum

Sebelum satu kasus dianggap selesai, siswa wajib:

- telah mengirim CER;
- membaca forum;
- memberikan minimal satu tanggapan kepada jawaban teman;
- menyelesaikan decision prompt jika tersedia/wajib.

---

## BR-13 — Konten Forum Data-Driven

Studi kasus tidak boleh di-hardcode menjadi selalu dua kasus.

Guru dapat membuat satu atau lebih kasus.

Field minimum:

- `caseId`
- `classId`
- `articleTitle`
- `articleUrl`
- `questionPrompt`
- `decisionPrompt`
- `order`
- `published`
- `createdBy`
- `createdAt`

---

## BR-14 — Embed Artikel

Sistem dapat mencoba menampilkan artikel di iframe hanya jika situs sumber mengizinkan.

Jika diblokir oleh CSP/X-Frame-Options:

- ReactoLab tetap harus berjalan;
- tampilkan judul/preview;
- sediakan tombol **Buka Artikel** ke tab baru.

---

## BR-15 — Penyelesaian Modul 6

Modul 6 hanya dianggap selesai apabila:

- seluruh studi kasus aktif telah diselesaikan siswa;
- syarat komentar terpenuhi;
- decision response tersimpan;
- guru telah mempublikasikan kesimpulan kelas.

Setelah itu Modul 7 terbuka.

---

## BR-16 — Reset Progress

Reset progress di Settings harus menggunakan konfirmasi dua tahap.

Reset menghapus/menginisialisasi ulang:

- progress;
- responses;
- experiment data;
- retry;
- forum response siswa bila reset total dipilih.

Reset **tidak menghapus**:

- akun;
- role;
- membership kelas.

Setelah reset:

- siswa kembali ke Dashboard;
- Modul 0 tersedia;
- Modul 1–7 terkunci.

---

## BR-17 — Reset Password Mandiri

Pengguna dapat menekan **Lupa Password** dan menerima reset password melalui email menggunakan mekanisme Firebase Authentication.

---

## BR-18 — Reset Password via Admin

Pengguna dapat membuat permintaan reset kepada admin.

Data request minimum:

- `requestId`
- `userId`
- `status`
- `requestedAt`
- `resolvedAt`
- `resolvedBy`

Admin dapat memproses permintaan melalui endpoint server-side.

Admin **tidak pernah dapat melihat password lama pengguna**.

Jika mekanisme password sementara digunakan:

- password sementara dibuat secara acak;
- hanya digunakan sebagai credential transisi;
- profile user diberi flag `forcePasswordChange=true`;
- setelah berhasil login, user wajib membuat password baru;
- flag dihapus setelah password berhasil diubah.

---

## BR-19 — Perubahan Role

Admin hanya dapat mengubah:

- `student → teacher`
- `teacher → student`

Role `admin` tidak boleh tersedia pada dropdown umum.

Perubahan role harus:

- dicatat pada audit log;
- diterapkan pada authorization server-side;
- diikuti refresh/revalidasi token/session.

---

## BR-20 — Audit Log

Aksi admin yang wajib dicatat:

- create user;
- deactivate/delete user;
- reset password via admin;
- change role;
- regenerate credential administratif jika tersedia.

Audit log bersifat read-only dari UI admin.

---

# 9. Functional Requirements — Siswa

## FR-S-01 — Dashboard Siswa

Dashboard harus menampilkan:

- nama siswa;
- identitas siswa yang relevan;
- kelas aktif;
- progres total;
- progres per modul;
- input kode kelas;
- kartu/list Modul 0–7;
- CTA `Mulai Pembelajaran` jika belum mulai;
- CTA `Lanjutkan Pembelajaran` jika sudah memiliki progres.

---

## FR-S-02 — Daftar Modul

Setiap kartu modul harus menampilkan:

- nama modul;
- status;
- persentase;
- current step jika sedang dikerjakan;
- lock indicator bila terkunci.

---

## FR-S-03 — Modul 0

### 0.1 Orientasi Awal
- welcome card;
- nama siswa;
- tujuan pembelajaran;
- stepper 1/3;
- CTA mulai.

### 0.2 Apersepsi
- animasi 2D besi berkarat;
- animasi 2D pembakaran kayu;
- play/replay/skip;
- prompt pengantar.

### 0.3 Gerbang Laboratorium
- roadmap empat misi;
- Konsentrasi;
- Luas Permukaan;
- Suhu;
- Katalis;
- CTA membuka Modul 1.

---

## FR-S-04 — Modul 1 Faktor Konsentrasi

Sistem harus mendukung:

- fenomena pemutih;
- rumusan masalah;
- hipotesis;
- pemilihan ≥3 konsentrasi HCl;
- rentang 0,5–3,0 M;
- jumlah Mg dan volume HCl tetap;
- simulasi reaksi Mg + HCl;
- stopwatch;
- zoom partikel;
- tabel hasil;
- grafik konsentrasi–waktu;
- persamaan reaksi;
- perhitungan `1/t`;
- explain makro–submikro–simbolik;
- uji hipotesis;
- kesimpulan;
- unlock Modul 2.

---

## FR-S-05 — Modul 2 Faktor Luas Permukaan

Sistem harus mendukung:

- konteks tablet/kapur;
- rumusan masalah;
- hipotesis;
- pemilihan ≥3 bentuk CaCO3;
- kontrol massa/konsentrasi/volume;
- simulasi pembentukan CO2;
- data volume terhadap waktu;
- zoom area kontak;
- grafik volume–waktu;
- persamaan reaksi;
- perhitungan ΔV/Δt;
- explain tiga level;
- uji hipotesis;
- kesimpulan;
- unlock Modul 3.

---

## FR-S-06 — Modul 3 Faktor Suhu

Sistem harus mendukung:

- fenomena suhu ruang vs freezer;
- rumusan masalah;
- hipotesis;
- pemilihan ≥3 suhu;
- rentang 15–60 °C;
- simulasi tanda X;
- stopwatch;
- opacity/kekeruhan;
- Maxwell–Boltzmann;
- Ea;
- data suhu–waktu;
- perhitungan 1/t;
- explain;
- uji hipotesis;
- kesimpulan;
- unlock Modul 4.

---

## FR-S-07 — Modul 4 Faktor Katalis

Sistem harus mendukung:

- konteks dengan/tanpa ragi;
- rumusan masalah;
- hipotesis;
- ≥3 kondisi eksperimen;
- tanpa katalis;
- MnO2;
- FeCl3;
- ekstrak hati;
- simulasi pembentukan O2;
- volume vs waktu;
- zoom katalisis;
- diagram energi;
- persamaan dekomposisi H2O2;
- perhitungan laju;
- explain;
- uji hipotesis;
- kesimpulan;
- finalisasi LKPD;
- unduh LKPD;
- unlock Modul 5.

---

## FR-S-08 — Modul 5 Konfirmasi Materi

### Konsep Dasar
- definisi laju;
- grafik konsentrasi–waktu;
- slider waktu.

### Hukum Laju
- `v = k[A]^m[B]^n`;
- penjelasan k, m, n;
- grafik orde 0, 1, 2;
- contoh interaktif.

### Teori Tumbukan
- partikel 2D;
- energi;
- Ea;
- orientasi;
- indikator effective collision.

Setelah interaksi minimum dipenuhi:
- Modul 5 selesai;
- Modul 6 terbuka.

---

## FR-S-09 — Modul 6 Forum Diskusi

Sistem harus:

- mengambil kasus berdasarkan kelas siswa;
- hanya mengambil kasus `published=true`;
- mengurutkan berdasarkan `order`;
- menampilkan status `Menunggu Guru` bila belum ada kasus;
- menyediakan tiga input CER terpisah;
- menggunakan submit-to-reveal;
- menampilkan forum realtime;
- mewajibkan minimal satu tanggapan;
- mendukung decision prompt;
- mengiterasi jumlah kasus secara dinamis;
- menunggu publikasi kesimpulan guru;
- unlock Modul 7 jika seluruh syarat terpenuhi.

---

## FR-S-10 — Modul 7 Penutup

Menampilkan:

- pesan selesai;
- progress 100%;
- tanggal penyelesaian;
- kembali ke dashboard;
- download LKPD bila tersedia.

---

# 10. Functional Requirements — Guru

## FR-G-01 — Dashboard Guru

Guru melihat:

- daftar kelas miliknya;
- jumlah siswa;
- ringkasan progres;
- aktivitas terakhir;
- tombol buka kelas.

---

## FR-G-02 — Membuat Kelas

Input minimum:

- nama kelas.

Output:

- class ID;
- class code otomatis;
- created at;
- status active.

---

## FR-G-03 — Detail Kelas

Menampilkan:

- nama kelas;
- kode kelas;
- jumlah siswa;
- daftar siswa;
- search siswa;
- progress total;
- tombol detail siswa.

---

## FR-G-04 — Monitoring Realtime

Tampilan desktop:

- matriks siswa × Modul 0–7.

Tampilan mobile:

- card siswa;
- accordion modul.

Filter:

- kelas;
- siswa;
- modul;
- status.

---

## FR-G-05 — Detail Jawaban Siswa

Guru dapat membaca:

- rumusan masalah;
- hipotesis;
- parameter eksperimen;
- hasil eksperimen;
- tabel;
- grafik;
- explain;
- uji hipotesis;
- kesimpulan;
- CER;
- komentar relevan.

Semua bersifat read-only.

---

## FR-G-06 — Kelola Studi Kasus

Guru dapat:

- membuat kasus;
- mengubah kasus;
- menghapus draft;
- mengatur urutan;
- menambah URL artikel;
- menambah question prompt;
- menambah decision prompt;
- preview;
- publish/unpublish.

---

## FR-G-07 — Pantau Forum

Guru dapat melihat:

- seluruh CER;
- komentar;
- timestamp;
- siswa yang belum submit;
- siswa yang belum memberi tanggapan.

---

## FR-G-08 — Kesimpulan Guru

Guru dapat:

- menulis kesimpulan;
- menyimpan draft;
- preview;
- publish.

Setelah publish, siswa yang memenuhi syarat pribadi dapat menyelesaikan Modul 6.

---

# 11. Functional Requirements — Admin

## FR-A-01 — Dashboard Admin

Menampilkan:

- total akun;
- jumlah siswa;
- jumlah guru;
- akun aktif/nonaktif.

---

## FR-A-02 — Daftar Pengguna

Kolom:

- nama;
- email;
- role;
- status;
- created at.

Filter:

- role;
- status.

Search:

- nama;
- email.

---

## FR-A-03 — Tambah Pengguna

Admin dapat membuat akun:

- nama;
- email;
- role student/teacher.

Aksi create user harus dilakukan melalui **server-side endpoint**, bukan Firebase Admin SDK di browser.

---

## FR-A-04 — Nonaktif/Hapus Pengguna

Sebelum eksekusi:

- tampilkan nama;
- email;
- konfirmasi.

Prioritas MVP adalah **soft delete/deactivate** agar relasi data pembelajaran tetap konsisten.

---

## FR-A-05 — Reset Password

Admin melihat daftar request:

- pending;
- resolved;
- rejected/cancelled jika digunakan.

Admin dapat memproses reset melalui server-side endpoint.

---

## FR-A-06 — Ubah Role

Admin dapat mengubah student ↔ teacher dengan dialog konfirmasi.

---

## FR-A-07 — Audit

Admin dapat membaca daftar:

- action;
- actor;
- target;
- time;
- metadata non-sensitif.

---

# 12. Kebutuhan Authentication

## 12.1 Provider

MVP menggunakan:

- Firebase Authentication;
- Email/Password.

Tidak wajib:

- Google OAuth;
- phone auth;
- anonymous auth.

---

## 12.2 Session

Sistem harus:

- mendeteksi `auth.currentUser`;
- menampilkan loading state saat auth sedang dipulihkan;
- tidak melakukan redirect prematur sebelum status auth diketahui;
- menyegarkan role setelah role diubah admin.

---

## 12.3 Authorization

Role tidak cukup hanya disembunyikan melalui UI.

Authorization harus diverifikasi pada:

1. route/application layer;
2. Firebase Realtime Database Security Rules;
3. endpoint server-side Vercel untuk aksi admin.

Direkomendasikan:

- role canonical disimpan pada `/users/{uid}/role`;
- custom claims Firebase digunakan untuk aksi berprivilege tinggi bila diperlukan;
- perubahan role dilakukan server-side;
- user diminta refresh token setelah perubahan.

---

# 13. Arsitektur Solusi

## 13.1 Arsitektur Tingkat Tinggi

```text
Browser Siswa/Guru/Admin
        │
        ▼
Next.js / React Web App
Hosted on Vercel Hobby
        │
        ├──────────────► Firebase Authentication
        │
        ├──────────────► Firebase Realtime Database
        │
        └──────────────► Vercel Server-side Endpoints
                             │
                             ▼
                       Firebase Admin SDK
                       - create user
                       - disable/delete user
                       - update role
                       - admin reset
                       - protected admin actions
```

---

## 13.2 Frontend

Direkomendasikan:

- Next.js;
- TypeScript;
- responsive CSS;
- Canvas/SVG untuk simulasi 2D;
- Three.js / React Three Fiber bila simulasi 3D digunakan;
- chart library ringan;
- KaTeX/MathJax untuk persamaan;
- client-side PDF generation.

---

## 13.3 Hosting

Frontend dan endpoint ringan dipublikasikan pada:

**Vercel Hobby**

Prinsip desain agar cocok untuk paket gratis:

- mayoritas interaksi dilakukan di client;
- realtime langsung browser ↔ Firebase;
- Vercel Functions hanya untuk aksi admin yang membutuhkan Firebase Admin SDK;
- tidak menggunakan Vercel Function untuk menyimpan setiap progress/jawaban siswa;
- aset statis dikompresi;
- model 3D dibuat ringan;
- video besar sebaiknya tidak di-host sebagai payload aplikasi jika tidak diperlukan.

---

## 13.4 Firebase

Layanan wajib:

- Firebase Authentication;
- Firebase Realtime Database.

Tidak wajib pada MVP:

- Firestore;
- Firebase Storage;
- Cloud Functions;
- App Hosting.

---

# 14. Struktur Data Realtime Database

Struktur berikut merupakan model logis awal, bukan schema final kode.

```text
/
├── users
│   └── {uid}
│       ├── name
│       ├── email
│       ├── role
│       ├── status
│       ├── forcePasswordChange
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
│   └── {classCode}: {classId}
│
├── classMemberships
│   └── {classId}
│       └── {studentId}
│           ├── joinedAt
│           └── status
│
├── studentActiveClass
│   └── {studentId}: {classId}
│
├── progress
│   └── {classId}
│       └── {studentId}
│           ├── currentModule
│           ├── currentStep
│           ├── overallPercent
│           ├── lastActivityAt
│           └── modules
│               └── {moduleId}
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

# 15. Strategi Data untuk Paket Gratis

Realtime Database harus menyimpan **data terstruktur**, bukan file besar.

## Wajib dihindari

Jangan menyimpan:

- video Base64;
- gambar Base64;
- PDF Base64;
- model `.glb/.gltf` sebagai string;
- audio besar;
- snapshot grafik berupa gambar untuk setiap percobaan.

## Simpan sebagai data

Contoh:

```json
{
  "temperature": 40,
  "observedTime": 18.7,
  "rate": 0.0535,
  "timestamp": 1788012000000
}
```

Grafik dibuat ulang dari data tersebut pada browser.

---

# 16. Realtime Strategy

## 16.1 Dashboard Siswa

Listener realtime hanya untuk:

- profil;
- active class;
- progress;
- status publikasi kesimpulan guru jika berada di Modul 6.

Jawaban form tidak perlu dilisten realtime bila hanya siswa tersebut yang mengedit.

---

## 16.2 Dashboard Guru

Guru membuka satu kelas → sistem subscribe pada:

- membership kelas;
- progress kelas;
- data detail siswa hanya ketika siswa dipilih;
- forum hanya ketika tab forum dibuka.

Hindari satu dashboard memasang listener ke semua:

- classes;
- responses;
- experiments;
- forum;
- audit;
- users

secara sekaligus.

---

## 16.3 Forum

Forum dapat menggunakan listener realtime berdasarkan:

`classId + caseId`

Tidak perlu subscribe ke forum seluruh kelas lain.

---

# 17. Kebutuhan Non-Fungsional

## NFR-01 — Responsiveness

Website harus usable pada:

- smartphone;
- tablet;
- laptop;
- desktop.

Minimum target touch area sekitar **44 × 44 px**.

---

## NFR-02 — Performance

Target:

- halaman dashboard tetap terasa responsif pada koneksi sekolah umum;
- initial bundle tidak memuat seluruh aset simulasi Modul 0–7 sekaligus;
- setiap modul melakukan lazy load aset yang dibutuhkan;
- model 3D dimuat hanya pada step yang menggunakan 3D;
- mobile low-end mendapat fallback 2D bila perlu.

---

## NFR-03 — Reliability

- progress tidak hilang setelah refresh;
- state eksperimen yang sudah disubmit tersimpan;
- error network menampilkan feedback;
- write yang gagal dapat dicoba ulang;
- submit penting menampilkan success state.

---

## NFR-04 — Security

- Firebase API key client boleh berada pada frontend sesuai mekanisme Firebase, tetapi **service account/private key tidak boleh** berada di client;
- Firebase Admin SDK hanya server-side;
- service account disimpan sebagai Vercel Environment Variable;
- RTDB Rules menerapkan least privilege;
- password tidak disimpan di database ReactoLab;
- token tidak ditampilkan pada UI;
- audit log tidak menyimpan password.

---

## NFR-05 — Privacy

Guru hanya dapat membaca data kelas miliknya.

Siswa:

- hanya dapat mengubah data miliknya;
- hanya dapat melihat forum kelas sendiri;
- tidak dapat membaca profil administratif user lain.

Admin:

- dapat mengelola metadata akun;
- tidak diperkenankan mengedit jawaban akademik siswa melalui UI admin.

---

## NFR-06 — Compatibility

Target minimum:

- Chrome modern;
- Edge modern;
- Firefox modern;
- Safari modern.

WebGL harus dideteksi sebelum memuat simulasi 3D.

---

## NFR-07 — Accessibility

Minimum:

- label form jelas;
- keyboard navigation untuk input utama;
- contrast teks memadai;
- state tidak disampaikan hanya melalui warna;
- ikon lock disertai teks/tooltip;
- grafik memiliki label dan data tabular pendamping.

---

# 18. Firebase Realtime Database Security Requirements

Security Rules harus menerapkan prinsip berikut.

## Student

Student boleh:

- membaca profil sendiri;
- mengubah field profil non-role yang diizinkan;
- membaca kelas yang diikutinya;
- membaca/write progress sendiri;
- membaca/write response sendiri;
- membaca/write experiment sendiri;
- membaca discussionCases kelas sendiri jika published;
- write CER sendiri;
- membaca forum setelah syarat aplikasi dipenuhi;
- write comment dengan author UID sendiri.

Student tidak boleh:

- mengubah role;
- mengubah teacherId;
- membuat audit log;
- mengubah jawaban siswa lain;
- mempublikasikan teacher conclusion.

---

## Teacher

Teacher boleh:

- membuat kelas miliknya;
- membaca/mengelola kelas miliknya;
- membaca membership kelas miliknya;
- membaca progress dan response siswa kelas miliknya;
- membuat/mengubah discussion case kelas miliknya;
- membaca forum kelas miliknya;
- membuat/publish conclusion kelas miliknya.

Teacher tidak boleh:

- mengubah jawaban siswa;
- mengelola user secara global;
- mengubah role.

---

## Admin

Aksi sensitif admin sebaiknya dilakukan melalui server-side endpoint.

Client admin tidak diberikan akses database global yang tidak perlu.

---

# 19. Vercel Server-Side Requirements

Endpoint server-side hanya digunakan untuk operasi yang membutuhkan hak Firebase Admin.

Contoh:

```text
POST /api/admin/users
PATCH /api/admin/users/{uid}/role
PATCH /api/admin/users/{uid}/status
POST /api/admin/users/{uid}/reset-password
DELETE /api/admin/users/{uid}
```

Setiap endpoint harus:

1. memverifikasi Firebase ID token;
2. memastikan caller adalah admin;
3. memvalidasi body;
4. menjalankan Firebase Admin SDK;
5. menulis audit log;
6. mengembalikan response aman tanpa credential sensitif.

---

# 20. Environmental Configuration

Contoh environment variable frontend:

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Server-only:

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`FIREBASE_PRIVATE_KEY` **tidak boleh** menggunakan prefix `NEXT_PUBLIC_`.

---

# 21. Acceptance Criteria Bisnis

## AC-01 — Kelas 35 Siswa

Sistem dinyatakan memenuhi target kapasitas awal apabila:

- minimal 35 akun siswa dapat login;
- seluruhnya dapat bergabung ke kelas yang sama;
- seluruhnya dapat membuka dashboard;
- progress masing-masing tersimpan;
- guru dapat melihat perubahan progress tanpa refresh;
- tidak terjadi kegagalan sistem akibat desain query aplikasi.

---

## AC-02 — Auth

- student login → dashboard siswa;
- teacher login → dashboard guru;
- admin login → dashboard admin;
- route role lain ditolak.

---

## AC-03 — Progress

- refresh tidak menghapus progress;
- logout/login kembali melanjutkan state;
- modul terkunci tidak dapat dilompati.

---

## AC-04 — Eksperimen

Untuk Modul 1–4:

- parameter dapat dipilih sesuai aturan;
- hasil dapat dijalankan;
- data masuk tabel;
- grafik terbentuk;
- jawaban tersimpan;
- kesimpulan wajib sebelum completion.

---

## AC-05 — Guru

Guru dapat:

- membuat kelas;
- mendapat class code;
- siswa dapat join dengan kode;
- melihat 35 siswa;
- melihat status Modul 0–7;
- membuka detail salah satu siswa;
- melihat jawaban tanpa hak edit.

---

## AC-06 — Forum

- guru dapat membuat artikel dan pertanyaan;
- siswa kelas yang sesuai dapat melihatnya;
- siswa harus submit Claim + Evidence + Reasoning;
- sebelum submit siswa tidak melihat jawaban teman;
- setelah submit forum terbuka;
- siswa dapat memberi komentar;
- guru melihat forum realtime.

---

## AC-07 — Admin

Admin dapat:

- melihat pengguna;
- membuat student/teacher;
- menonaktifkan user;
- memproses reset;
- mengubah student ↔ teacher;
- melihat audit log.

---

## AC-08 — Responsive

Seluruh alur inti dapat diselesaikan dari smartphone tanpa membutuhkan desktop.

---

# 22. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Batas 100 koneksi simultan RTDB Spark | User tambahan dapat ditolak jika melewati limit | Batasi implementasi awal 1 kelas aktif, hindari banyak tab, pantau usage |
| Banyak listener realtime | Download data dan load meningkat | Subscribe hanya node yang sedang digunakan |
| Autosave terlalu agresif | Write meningkat | Debounce 1–3 detik / save on blur untuk field tertentu |
| Model 3D terlalu berat | Mobile lambat | Lazy load, kompres GLB, fallback 2D |
| Aset video besar di Vercel | Transfer tinggi | Gunakan aset pendek/terkompres atau sumber eksternal yang sesuai |
| Seluruh data guru di-load sekaligus | Dashboard lambat | Scope query per classId dan load detail on demand |
| RTDB rules terlalu longgar | Kebocoran data | Rules role + ownership + class membership |
| Admin SDK bocor ke frontend | Kompromi proyek Firebase | Simpan credential hanya pada server environment |
| Hard delete user merusak relasi | Data penelitian rusak | Gunakan soft delete sebagai default |
| Link artikel menolak iframe | Artikel tidak tampil embedded | Fallback Open Article |
| Vercel Hobby berubah limit/kebijakan | Deployment dapat terpengaruh | Pantau usage dan terms sebelum implementasi lapangan |
| Penggunaan berkembang ke banyak kelas bersamaan | Mendekati batas Spark | Evaluasi upgrade atau perubahan arsitektur |

---

# 23. Batasan Paket Gratis dan Keputusan Desain

## 23.1 Firebase Realtime Database Spark

Batas koneksi simultan Spark saat ini adalah **100 koneksi**.

Dengan:

- 35 siswa;
- 1 guru;
- 1 admin;
- beberapa koneksi tambahan;

target ReactoLab masih realistis untuk skenario satu kelas.

Namun margin kapasitas harus dijaga.

---

## 23.2 Firebase Authentication

Email/password sesuai dengan kebutuhan ReactoLab.

Untuk reset password mandiri, gunakan mekanisme resmi Firebase.

Aksi administratif terhadap akun dilakukan melalui Firebase Admin SDK di server-side.

---

## 23.3 Vercel Hobby

Vercel Hobby dapat digunakan sebagai tempat deployment awal ReactoLab dengan arsitektur client-heavy.

Karena batas dan ketentuan Vercel dapat berubah, usage harus diperiksa sebelum implementasi lapangan.

**Penting:** berdasarkan Terms of Service Vercel saat ini, Hobby ditujukan untuk penggunaan **personal/non-commercial**. Jika ReactoLab nantinya menjadi layanan institusional, komersial, atau digunakan pada skala produksi yang lebih luas, plan dan terms harus dievaluasi kembali.

---

# 24. Strategi Optimasi agar Tetap Gratis

1. Gunakan Firebase SDK langsung dari browser untuk:
   - auth;
   - progress;
   - responses;
   - eksperimen;
   - forum.

2. Jangan proxy seluruh request database melalui Vercel Functions.

3. Gunakan Vercel Functions hanya untuk:
   - create user oleh admin;
   - disable/delete;
   - role change;
   - admin reset password;
   - tindakan yang membutuhkan Admin SDK.

4. Gunakan client-side:
   - chart rendering;
   - simulasi;
   - kalkulasi;
   - PDF LKPD.

5. Simpan angka/data mentah, bukan screenshot grafik.

6. Gunakan debounce pada autosave.

7. Lazy load simulasi per module/step.

8. Kompres:
   - SVG;
   - WebP/AVIF;
   - GLB;
   - audio.

9. Hindari polling setiap beberapa detik; gunakan realtime listener yang scoped.

10. Dashboard guru hanya mendengarkan kelas yang sedang dibuka.

---

# 25. Prioritas MVP

## P0 — Wajib Sebelum Uji Kelas

- Auth email/password.
- Role.
- Dashboard siswa.
- Dashboard guru.
- Buat/join kelas.
- Modul 0–7.
- Progress.
- Response storage.
- Eksperimen Modul 1–4.
- Finalisasi LKPD.
- Forum CER.
- Teacher conclusion.
- Monitoring realtime.
- Firebase Rules.
- Responsive mobile.
- Deployment Vercel.

## P1 — Penting

- Dashboard admin.
- Admin create/deactivate user.
- Role change.
- Reset via admin.
- Audit log.
- PDF LKPD yang rapi.
- Retry history.
- Filter monitoring.

## P2 — Enhancement

- Animasi lebih kompleks.
- 3D lebih detail.
- Analytics tambahan.
- Export data penelitian.
- Grafik kelas.
- Bulk user import.
- Notifikasi.
- Latihan soal jika requirement sudah ditentukan.

---

# 26. Tahapan Implementasi yang Disarankan

## Phase 1 — Foundation

- Next.js project.
- responsive layout.
- Firebase project.
- Authentication.
- RTDB connection.
- users.
- roles.
- route protection.

## Phase 2 — Classroom

- teacher dashboard;
- create class;
- generate code;
- student join;
- membership;
- student dashboard.

## Phase 3 — Learning Engine

- module state;
- step state;
- unlock rules;
- progress;
- response autosave.

## Phase 4 — Modul 0–4

Bangun satu per satu:

1. Modul 0.
2. Modul 1.
3. Modul 2.
4. Modul 3.
5. Modul 4.
6. finalisasi LKPD.

Jangan membangun semua simulasi sekaligus sebelum engine progress stabil.

## Phase 5 — Modul 5

- materi interaktif;
- teori tumbukan;
- chart.

## Phase 6 — Modul 6

- discussion cases;
- teacher editor;
- CER;
- submit-to-reveal;
- comments;
- conclusion.

## Phase 7 — Modul 7

- completion;
- final progress.

## Phase 8 — Admin

- user management;
- reset;
- roles;
- audit.

## Phase 9 — Hardening

- Security Rules;
- mobile testing;
- 35-user load test;
- Firebase usage monitoring;
- Vercel usage monitoring;
- error state;
- recovery.

---

# 27. Load Test Minimum Sebelum Digunakan di Kelas

Sebelum implementasi pembelajaran nyata, lakukan simulasi minimal:

### Scenario A — Login Bersamaan
35 siswa login dalam rentang beberapa menit.

### Scenario B — Join Kelas
35 siswa memasukkan kode kelas yang sama.

### Scenario C — Progress
35 siswa membuka modul dan menyimpan progres.

### Scenario D — Eksperimen
35 siswa menjalankan simulasi dan menyimpan trial.

### Scenario E — Monitoring
1 guru membuka matriks progres ketika siswa aktif.

### Scenario F — Forum
35 siswa mengirim CER dan membuka feed.

### Scenario G — Komentar
35 siswa memberi minimal satu tanggapan.

Yang diamati:

- Firebase concurrent connections;
- RTDB bandwidth/download;
- failed write;
- latency;
- rendering mobile;
- Vercel bandwidth;
- Vercel function invocation hanya untuk admin.

---

# 28. Definition of Done MVP

ReactoLab MVP dianggap selesai ketika:

- dapat diakses melalui domain Vercel;
- autentikasi bekerja;
- ketiga role bekerja;
- siswa dapat join kelas;
- 35 siswa dapat memiliki progres independen;
- Modul 0–7 dapat diselesaikan sesuai business rule;
- Modul 1–4 menghasilkan data dan LKPD;
- guru dapat memonitor siswa secara realtime;
- guru dapat membuat forum berbasis artikel;
- CER dan komentar berjalan;
- guru dapat mempublikasikan conclusion;
- admin dapat melakukan fungsi inti akun;
- Firebase Rules telah diuji;
- aplikasi responsive;
- tidak ada secret Firebase Admin pada bundle client;
- pengujian satu kelas 30–35 siswa berhasil.

---

# 29. Kriteria Eskalasi dari Paket Gratis

ReactoLab harus dievaluasi untuk upgrade/perubahan arsitektur jika salah satu kondisi berikut terjadi:

- penggunaan mendekati 100 koneksi simultan;
- lebih dari satu/dua kelas besar rutin menggunakan sistem pada saat yang sama;
- database download mendekati limit bulanan;
- aset menyebabkan transfer Vercel mendekati limit;
- serverless usage meningkat signifikan;
- sistem digunakan lintas sekolah secara reguler;
- dibutuhkan SLA/availability production;
- sistem digunakan untuk kebutuhan komersial;
- diperlukan penyimpanan file besar;
- diperlukan backup terkelola tingkat produksi.

---

# 30. Asumsi

BRD ini menggunakan asumsi berikut:

1. Target utama awal adalah penggunaan kelas terbatas, bukan penggunaan publik masif.
2. Sekitar 30–35 siswa aktif dalam satu pembelajaran.
3. Mayoritas siswa menggunakan satu perangkat/satu tab.
4. Guru mengelola kelas miliknya sendiri.
5. Admin jumlahnya sangat terbatas.
6. Email siswa/guru tersedia untuk autentikasi.
7. Aset simulasi dapat disediakan sebagai static asset.
8. Data pembelajaran disimpan sebagai JSON terstruktur.
9. Firebase Realtime Database digunakan sebagai database utama.
10. Firebase Authentication digunakan sebagai sistem login utama.
11. Vercel digunakan sebagai hosting web dan endpoint administratif ringan.
12. Tidak ada kewajiban menggunakan Firebase Storage pada MVP.

---

# 31. Keputusan Arsitektur Final untuk MVP

| Area | Keputusan |
|---|---|
| Frontend | Next.js + TypeScript |
| Hosting | Vercel Hobby |
| Authentication | Firebase Authentication Email/Password |
| Database | Firebase Realtime Database |
| Admin backend | Vercel server-side endpoints + Firebase Admin SDK |
| Realtime | Firebase RTDB listeners |
| 2D | SVG / Canvas |
| 3D | Three.js / React Three Fiber secukupnya |
| Graph | Client-side chart library |
| Equation | KaTeX/MathJax |
| PDF | Client-side generation |
| File besar | Tidak disimpan di RTDB |
| State utama | Firebase + local component state |
| Role | student / teacher / admin |
| Scale awal | 30–35 siswa per sesi |

---

# 32. Referensi Platform dan Batas Layanan

Diperiksa untuk penyusunan BRD pada 29 Agustus 2026:

1. Firebase — Realtime Database Limits  
   https://firebase.google.com/docs/database/usage/limits

2. Firebase — Realtime Database FAQ / simultaneous connections  
   https://firebase.google.com/docs/database/faq-and-troubleshooting

3. Firebase — Authentication Limits  
   https://firebase.google.com/docs/auth/limits

4. Firebase — Pricing  
   https://firebase.google.com/pricing

5. Vercel — Terms of Service / Hobby Plan  
   https://vercel.com/legal/terms

> **Catatan:** kuota dan ketentuan layanan pihak ketiga dapat berubah. Sebelum pelaksanaan penelitian/pembelajaran, cek kembali dashboard usage dan dokumentasi resmi Firebase/Vercel.

---

# 33. Ringkasan untuk AI Coding Agent

```text
PROJECT: ReactoLab
TYPE: Educational web app — reaction rate guided inquiry
INITIAL SCALE: 30–35 concurrent students + teacher
DEPLOY: Vercel Hobby
AUTH: Firebase Authentication Email/Password
DATABASE: Firebase Realtime Database Spark
ROLES: student, teacher, admin

CRITICAL ARCHITECTURE:
- Browser talks directly to Firebase for normal learning data.
- Do NOT route every student write through Vercel API.
- Use Vercel server-side endpoints only for privileged admin actions.
- Firebase Admin credentials must never be shipped to browser.
- Optimize for <100 simultaneous RTDB connections on free Spark.
- Scope realtime listeners by class/module/student.
- Store structured JSON, not large files/Base64.
- Lazy-load 2D/3D simulations.
- Generate LKPD PDF client-side when possible.

STUDENT FLOW:
Landing → Login → Student Dashboard → Module 0 → 1 → 2 → 3 → 4
→ finalize LKPD → 5 → 6 Forum → teacher confirmation → 7.

TEACHER:
Dashboard → classes → realtime student monitoring → response detail
→ discussion case management → CER monitoring → publish conclusion.

ADMIN:
Dashboard → users → create/deactivate → reset requests
→ student/teacher role changes → audit logs.
```

---

**End of BRD — ReactoLab v1.0**
