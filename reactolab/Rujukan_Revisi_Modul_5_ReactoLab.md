# Rujukan Revisi Forum Diskusi Modul 5

Dokumen ini adalah bahan untuk AI agent yang merevisi forum siswa berdasarkan berkas yang diunggah pengguna, STORYBOARD MODUL 5 (APLIKASI KONSEP).docx. Topiknya adalah **laju reaksi dalam persoalan industri dan sosial ekonomi**, dengan bingkai SDG 8 Pekerjaan Layak dan Pertumbuhan Ekonomi.

**Acuan implementasi:** project lokal saat AI agent mulai bekerja. Penomoran forum dan susunan file di project lokal sudah berubah dari versi yang pernah dikaji; inspeksi ulang sebelum mengedit.

## 1. Penomoran dan cakupan

Storyboard dan project lokal sama-sama menempatkan **forum diskusi sebagai Modul 5 (Aplikasi Konsep)**. Adegan 5.1–5.13 menjadi acuan alur. Temukan route dan definisi Modul 5 yang aktual di kode lokal; gunakan penomoran Modul 5 pada tampilan siswa, progres, dan laporan. Jika ada data atau komponen historis dengan penomoran lama, pertahankan kemampuan membacanya sesuai kebutuhan migrasi yang aman.

Sasaran revisi adalah pengalaman forum siswa di Modul 5 dan fasilitas guru untuk mengelola kasus. Pertahankan modul lain, urutan, serta prasyarat sesuai **project lokal**. Jangan menambahkan tahapan SM-PDCA, handout konfigurasi elektron, atau form asesmen baru yang tidak ada di storyboard.

## 2. Peta pemeriksaan kode lokal

Daftar ini adalah **pertanyaan pemeriksaan**, bukan klaim tentang path dan perilaku yang sekarang ada. Jangan menyalin nama file atau field dari versi yang pernah dikaji tanpa memeriksa project lokal.

| Bagian                           | Periksa pada project ini                                       | Hasil yang perlu dipastikan                                                                        |
| -------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Definisi modul dan halaman siswa | Pendaftaran Modul 5, route dan prasyaratnya                    | Forum diskusi benar-benar tampil sebagai Modul 5; navigasi dan pembukaan modul lanjutan konsisten. |
| Komponen siswa                   | Section yang dipakai runtime, bukan hanya ekspor/komponen lama | Tahapan aktif, tampilan kasus, feed, keputusan, dan kesimpulan guru diketahui sebelum diubah.      |
| Progres dan autosave             | Fungsi simpan draft, submit, status kasus dan migrasi          | Jawaban bersarang tidak tertimpa dan progres lama tidak hilang.                                    |
| Dashboard guru                   | Halaman pengelolaan kelas/kasus dan laporan siswa              | CRUD lengkap, publikasi, urutan, respons serta kesimpulan guru terpenuhi.                          |
| Penyimpanan dan keamanan         | Model data, path, query, aturan database dan autentikasi       | Draft hanya untuk guru, jawaban pribadi terlindungi, feed terbuka setelah submit.                  |
| Konten kasus                     | Sumber materi dan template yang sudah ada                      | Kasus berasal dari data kelas yang dapat disunting guru; contoh bukan kewajiban.                   |

Jika project lokal masih memakai Firebase Realtime Database dan nama fungsi/field lama, gunakan hanya bagian yang terkonfirmasi. Pertahankan identitas kelas dan kasus, riwayat CER bila ada, komentar, keputusan, serta penyelesaian siswa.

## 3. Spesifikasi pedagogis dari storyboard

Storyboard memakai dua **contoh** kasus: (1) ledakan debu gula yang mempertemukan luas permukaan, konsentrasi debu, risiko pekerja dan biaya pencegahan; (2) kebocoran amonia dalam konteks proses Haber–Bosch yang mempertemukan suhu, katalis, kesinambungan produksi dan keselamatan. Keduanya adalah bahan awal yang dapat guru buat atau impor sebagai draft untuk kelasnya; aplikasi harus tetap menerima jumlah kasus berapa pun dan kasus lain buatan guru.

| Adegan storyboard                        | Interaksi yang diminta                                                                                                                                                                                                                                                                                                                                                    | Data yang perlu disimpan                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 Pembuka                              | Judul Forum Diskusi Berbasis Studi Kasus, konteks penerapan pengetahuan yang telah dipelajari, tombol Mulai Studi Kasus.                                                                                                                                                                                                                                                  | Waktu mulai atau status bagian pembuka.                                                                                         |
| 5.2 dan 5.8 Orientasi                    | Gambar dan narasi kasus, pemantik ilmiah, contoh perspektif pemangku kepentingan, pertanyaan tentang pihak lain.                                                                                                                                                                                                                                                          | Respons siswa tentang pemangku kepentingan tambahan jika diisi.                                                                 |
| 5.3 dan 5.9 Merumuskan masalah           | Siswa menulis pertanyaan sendiri yang memuat faktor kimia, dampak/risiko, serta pertimbangan sosial ekonomi atau pemangku kepentingan pilihannya. Kerangka kalimat menjadi panduan, bukan pilihan jawaban tertutup.                                                                                                                                                       | Tiga komponen bebas dan pertanyaan utuh yang dirumuskan siswa.                                                                  |
| 5.4 dan 5.10 Hipotesis                   | Siswa menulis dugaan/posisi awal dan alasan dengan bahasanya sendiri.                                                                                                                                                                                                                                                                                                     | Posisi dan alasan awal, terkait rumusan masalah miliknya.                                                                       |
| 5.5 dan 5.11 Mengumpulkan data           | Data ilmiah dan data/perspektif sosial ekonomi pada dua tab. Siswa memilih atau mencatat bukti spesifik, boleh memasukkan bukti lain, serta menjelaskan mengapa bukti itu relevan. Tahap ini belum menguji hipotesis.                                                                                                                                                     | Referensi bukti pilihan, teks bukti lain beserta asalnya, alasan memilihnya.                                                    |
| 5.6 dan 5.12 Menguji hipotesis dan forum | Tampilkan hipotesis dan bukti milik siswa berdampingan. Siswa memilih Didukung/Tidak Didukung dan menulis alasan bebas yang mengaitkan data dengan konsep sebelumnya. Setelah argumennya benar-benar tersimpan, tampilkan forum. Siswa memilih **dua argumen dari dua teman berbeda** yang menurutnya berbeda sudut pandang, lalu menanggapi masing-masing dengan alasan. | Putusan hipotesis, alasan/argumen awal, waktu submit, ID dua post teman, alasan memilih perbedaan sudut pandang, dua tanggapan. |
| 5.7 dan 5.13 Menyimpulkan                | Siswa menjawab rumusan masalahnya sendiri, lalu menulis solusi/kebijakan berbasis bukti. Simpan Keputusan menyelesaikan kasus dan membuka berikutnya.                                                                                                                                                                                                                     | Kesimpulan, solusi/keputusan, referensi bukti pendukung, waktu selesai.                                                         |

Keterkaitan literasi kimia menurut storyboard: konteks kimia dan sains dalam masyarakat pada orientasi/keputusan; pengetahuan konten ilmiah dan kimia pada orientasi/hipotesis/uji; pengetahuan epistemik saat memilih bukti; keterampilan menafsirkan bukti, menjelaskan fenomena dan membuat keputusan pada tahap analisis/penutup. Ini adalah maksud pemetaan storyboard untuk guru, bukan skor otomatis bagi siswa.

### Bentuk validasi yang sesuai maksud storyboard

Storyboard meminta bantuan otomatis tanpa memaksa kata atau contoh jawaban tertentu. Wujudkan kelengkapan melalui struktur input, bukan klaim sistem sudah menilai kebenaran makna:

- Rumusan masalah: sediakan isian bebas untuk faktor kimia, dampak/risiko, dan pertimbangan pihak/sosial ekonomi; rangkai atau pratinjau pertanyaan utuh yang boleh diedit siswa. Umpan balik hanya menunjuk komponen yang belum terisi. Jangan membatasi perspektif pada tiga contoh pemangku kepentingan.
- Hipotesis: isian posisi/dugaan dan alasan awal, keduanya bebas. Pemeriksaan otomatis bisa memastikan keduanya ada dan menampilkan pertanyaan refleksi kesesuaian dengan rumusan masalah. Jangan menyebut alasan sudah “logis” berdasarkan panjang teks atau kata kunci.
- Pengumpulan data: bukti dapat dipilih dari data kasus dengan metadata sumber atau ditulis sendiri dalam kolom “Bukti lain” dan “Asal bukti”. Keberadaan bukti spesifik diperiksa melalui pilihan/struktur tersebut. Alasan pemilihan tetap ditulis bebas. Jangan cocokkan teks terhadap enam frasa tetap.
- Kesimpulan: siswa memilih bukti yang mendasari jawaban dari data yang dicatat, forum atau bukti lain dengan asal yang jelas. Jika belum ada bukti, minta siswa menambahkan rujukan. Jangan memblokir jawaban sah hanya karena tidak memuat angka atau kata tertentu.
- Ketepatan argumentasi dan penilaian ilmiah memerlukan guru atau metode evaluasi yang benar-benar divalidasi. Jangan menambahkan API AI, pemeriksa kata wajib, atau mengklaim validator non-AI memahami semua variasi semantik.

## 4. Paket contoh kasus yang dapat dibuat guru

Kedua paket ini merangkum berkas storyboard. Simpan sebagai template opsional atau fasilitas impor draft per kelas melalui Dashboard Guru. Jangan memasukkan kasus otomatis ke setiap kelas, menanamnya sebagai satu-satunya konten, atau mengunci jumlah kasus menjadi dua.

### 4.1 Kasus Imperial Sugar — luas permukaan dan konsentrasi

**Judul untuk form guru:** Ledakan Debu di Pabrik Gula.  
**Bingkai:** SDG 8, keselamatan pekerja dan kelangsungan industri.  
**Pemantik:** Mengapa debu gula dapat memicu ledakan besar?  
**Materi kimia:** Debu sukrosa yang halus dan tersuspensi di udara memberi luas kontak lebih besar dengan oksigen. Konsentrasi debu yang cukup, oksigen dan sumber penyalaan semuanya relevan; jangan menyajikan luas permukaan/konsentrasi sebagai penyebab tunggal. Reaksi setara: C₁₂H₂₂O₁₁(s) + 12 O₂(g) → 12 CO₂(g) + 11 H₂O(g) + energi.

**Narasi ringkas yang boleh disunting guru:** Pada 7 Februari 2008 terjadi ledakan debu gula di pabrik Imperial Sugar di Port Wentworth, Georgia. Investigasi CSB mengaitkan ledakan awal dengan debu dalam konveyor tertutup di bawah silo serta ledakan susulan dengan akumulasi debu di bangunan. Laporan akhir mencatat 14 pekerja meninggal dan 36 pekerja yang terluka bertahan hidup. Jangan menyatakan seluruh 36 mengalami luka bakar parah. Siswa menilai bagaimana sifat debu dan pengendalian proses berkaitan dengan keselamatan dan biaya operasional.

**Data ilmiah panel A:**

1. Dalam artikel Büschgens & Pikhard (2017), pada ukuran partikel sekitar 0,063 mm ditulis konsentrasi debu gula 60 g/m³, sedangkan ukuran 0,4 mm ditulis 750 g/m³ untuk kondisi yang dibahas. Ini angka dari literatur sifat debu, **bukan hasil pengukuran di Imperial Sugar**. Jika dibuat grafik, tampilkan hanya dua titik perbandingan berlabel ukuran, satuan, dan sumber; jangan tarik kurva prediksi universal.
2. Temuan CSB: desain/penutupan konveyor, akumulasi debu dan pemeliharaan/pembersihan tidak memadai memengaruhi bahaya ledakan.
3. Catatan housekeeping 1/32 inci debu pada 5% permukaan yang tersedia adalah **indikator akumulasi lapisan debu yang dianggap berbahaya**, bukan “konsentrasi debu untuk memicu ledakan” dan bukan “hanya 5% luas permukaan ruangan sudah pasti meledak”.

**Perspektif contoh panel B:** Industri mempertimbangkan biaya pengendalian debu dan kelangsungan usaha; pekerja mengutamakan keselamatan dan pelatihan; regulator menuntut kepatuhan keselamatan. Teks itu adalah **argumen contoh untuk dianalisis**, bukan kutipan pernyataan nyata tiga pihak dalam peristiwa tersebut. Siswa boleh menambahkan konsumen, investor, warga sekitar, atau pihak lain.

**Rumusan masalah berpandu:** “Bagaimana pengaruh [faktor kimia pilihan siswa] terhadap [risiko/dampak pilihan siswa], dibandingkan dengan [pertimbangan pemangku kepentingan yang dipilih sendiri]?”  
**Hipotesis:** posisi awal dan alasan bebas; jangan tampilkan contoh jawaban model sebelum siswa mengerjakan.  
**Telaah bukti:** siswa boleh memilih data partikel, temuan investigasi, satu atau lebih perspektif, dan/atau bukti lain yang diberi asal.  
**Uji:** bandingkan hipotesisnya dengan bukti pilihannya, tentukan didukung/tidak didukung, jelaskan hubungan dengan konsep luas permukaan/konsentrasi jika menurut siswa relevan.  
**Prompt keputusan guru yang direkomendasikan:** “Berdasarkan penjelasan kimia dan pertimbangan pemangku kepentingan, solusi atau kebijakan apa yang kamu tawarkan untuk mengurangi risiko ledakan debu di industri gula? Gunakan bukti dan jelaskan dampaknya.”  
**Tindak lanjut alur:** setelah keputusan disimpan, kasus berikutnya terbuka.

**Sumber rujukan untuk guru/agent:** [Laporan akhir CSB](https://www.csb.gov/assets/1/20/imperial_sugar_report_final_updated.pdf?13902=), [halaman investigasi CSB](https://www.csb.gov/imperial-sugar-company-dust-explosion-and-fire/), [artikel Büschgens dan Pikhard](https://www.rhewum.com/downloadFile/RG93bmxvYWQvUkhFV1VNX0R1c3RfZXhwbG9zaW9uc19pbl90aGVfc3VnYXJfaW5kdXN0cnktNWY5YWJkZmRjZmRlOS5wZGY=), [penjelasan kriteria lapisan debu oleh CSB](https://www.csb.gov/csb-chairman-john-bresland-calls-on-osha-to-adopt-csb-recommendation-on-comprehensive-combustible-dust-standard-says-imperial-sugar-explosion-shows-urgency-for-action-is-greater-than-ever/).

### 4.2 Kasus Pupuk Kaltim — suhu, katalis dan keandalan peralatan

**Judul untuk form guru:** Kebocoran Amonia dalam Produksi Pupuk.  
**Bingkai:** SDG 8, keselamatan pekerja, pasokan pupuk dan keberlanjutan operasi.  
**Pemantik:** Mengapa sintesis amonia industri memakai kondisi operasi yang menuntut?  
**Materi kimia:** Proses Haber–Bosch mensintesis amonia menurut N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g). Katalis berbasis besi membantu laju reaksi, suhu memengaruhi kinetika dan kesetimbangan, sedangkan tekanan tinggi terkait kesetimbangan dan proses industri. Jangan menyamakan tekanan, suhu, dan katalis sebagai satu mekanisme atau mengklaim besaran operasi umum adalah pengukuran spesifik pada alat saat insiden.

**Narasi ringkas yang boleh disunting guru:** Pada 29 November 2016 terjadi kebocoran amonia di unit Pabrik Amoniak 2 PT Pupuk Kalimantan Timur. Keterangan perusahaan menyebut gasket flange 10 inci di bagian atas Top 120-C pecah. Tiga pekerja menjadi korban dan seorang meninggal. Hubungkan persoalan menjaga produksi dengan kebutuhan inspeksi, pemeliharaan, dan kesiapan tanggap darurat. Pisahkan **fakta kegagalan gasket** dari **hipotesis tentang penyebab keausan**: berkas storyboard mengaitkannya dengan kondisi ekstrem, tetapi sumber insiden yang tersedia tidak membuktikan hubungan kausal khusus tersebut.

**Data ilmiah panel A:**

1. Rujukan storyboard memberi ilustrasi kisaran kondisi proses Haber–Bosch 400–500 °C, 150–350 atm, dan katalis besi. Tandai sebagai **kondisi umum proses dalam bahan pembelajaran**, bukan data sensor unit Pupuk Kaltim pada 29 November 2016. Kisaran aktual bergantung desain fasilitas.
2. Kronologi insiden: tanggal, unit, Top 120-C, gasket flange 10 inci dan korban, dengan atribusi kepada keterangan perusahaan.
3. Penelitian Pratiwi (2017) di Pupuk Kaltim melaporkan faktor yang berpotensi pada kecelakaan kebocoran amonia termasuk pemeliharaan yang kurang memadai, keausan peralatan, dan sistem peringatan. Jelaskan bahwa temuan umum penelitian ini tidak menetapkan penyebab mekanis spesifik dari gasket pada insiden tertentu tanpa bukti tambahan.

**Perspektif contoh panel B:** Perusahaan mempertimbangkan kesinambungan pasokan pupuk dan biaya/jeda pemeliharaan; pekerja dan warga sekitar mengutamakan keselamatan, informasi, serta evakuasi; regulator menilai inspeksi dan pemenuhan standar. Ketiganya argumen contoh, bukan kutipan pejabat/korban. Perspektif lain tetap diterima.

**Rumusan masalah berpandu:** faktor kimia, dampak terhadap laju/risiko, dan satu pertimbangan pihak terkait yang dipilih siswa.  
**Hipotesis:** posisi dan alasan bebas, kemudian disimpan sebagai versi awal.  
**Telaah bukti:** pilih data operasi umum, kronologi mekanis, faktor pemeliharaan, perspektif sosial ekonomi, atau bukti lain dengan sumber.  
**Uji:** tampilkan hipotesis bersama bukti; siswa menilai dukungan data dan mengaitkan dengan teori yang menurutnya relevan dari modul sebelumnya tanpa disodori jawaban yang benar.  
**Prompt keputusan guru yang direkomendasikan:** “Kebijakan apa yang kamu usulkan agar produksi amonia tetap berjalan dengan memperhatikan keselamatan pekerja dan warga? Jelaskan dasar ilmiah, bukti, dan dampaknya bagi pihak terkait.”

**Sumber rujukan untuk guru/agent:** [Keterangan Pupuk Kaltim tentang insiden 2016](https://pupukkaltim.com/id/r/kecelakaan-industri-pupuk-kaltim-telan-korban-jiwa), [abstrak penelitian lapangan Pratiwi 2017](https://repository.unair.ac.id/62091/), dan sumber teknis proses industri yang harus dicek sebelum guru menerbitkan angka kondisi operasi.

### Gambar storyboard

DOCX memuat dua gambar, masing-masing untuk dua kasus. Foto dalam berkas adalah visual referensi. Jika agent menyalin asetnya ke aplikasi, simpan atribusi, teks alternatif, dan periksa izin pakai sumbernya; guru harus dapat mengganti atau menghapus gambar. Jangan gunakan foto tahap darurat/simulasi lain sebagai “bukti peristiwa” tanpa verifikasi foto asal.

## 5. Perancangan layar dan perilaku

Setiap kasus menggunakan tahapan orientasi → rumusan masalah → hipotesis → telaah data → uji hipotesis dan forum → kesimpulan/keputusan. Gunakan bagian kasus **Modul 5** yang aktif di project lokal untuk urutan sublangkah, status dan autosave pada setiap langkah. Ringkasan kasus, hipotesis, dan data pilihan tetap terlihat saat diperlukan sehingga siswa tidak perlu mengetik ulang.

Forum saat ini menyimpan CER dalam tiga isian Claim–Evidence–Reasoning. Storyboard meminta **putusan hipotesis dan argumen bebas tanpa kerangka CER**. Buat bentuk post baru dengan putusan dan argumentasi utuh serta referensi bukti, lalu tampilkan post lama CER dengan formatnya semula. Jangan memaksa siswa baru mengisi tiga kolom CER hanya untuk memenuhi schema lama. Perbarui tipe, helper, rules, tampilan feed, dan tampilan guru secara konsisten.

Setelah post uji hipotesis sukses tersimpan, hanya siswa yang sudah mengirim post untuk kasus tersebut boleh melihat feed. Dalam feed siswa memilih dua post dari **dua UID teman yang berbeda**, keduanya bukan miliknya. Minta siswa menjelaskan perbedaan perspektif yang ia lihat, lalu tulis satu tanggapan beralasan untuk masing-masing. Syarat teknis jumlah post teman dan ID unik bisa diverifikasi otomatis; perbedaan maknanya hanya dapat dinilai dari alasan siswa/guru. Komentar umum boleh ada, tetapi tidak dihitung sebagai salah satu dari dua tanggapan wajib.

Jika belum ada dua post teman, tampilkan “Menunggu dua argumen teman” sambil mempertahankan draft. Untuk kelas sangat kecil, rancang jalur pengecualian guru yang eksplisit dan tercatat atau kebijakan pembelajaran yang dipilih guru; jangan diam-diam mengurangi syarat menjadi satu atau membiarkan kasus terkunci selamanya.

Kesimpulan memuat **dua jawaban** yang dapat dibedakan: (a) jawaban terhadap rumusan masalah sendiri berdasar hasil uji; (b) solusi/kebijakan beserta pertimbangan dampak dan bukti. Simpan setelah bukti rujukan dicantumkan. Setelah kasus selesai, berikutnya terbuka. Setelah seluruh kasus wajib selesai, pertahankan bagian kesimpulan guru kelas bila masih menjadi syarat untuk membuka modul berikutnya di project lokal.

Analytics minimal untuk guru: status per tahap, waktu submit, data apa yang dipilih, ID dua post yang ditanggapi, dan progres kasus. Analytics bukan nilai kebenaran otomatis. Jangan menampilkan jawaban contoh storyboard sebagai bocoran jawaban pada layar siswa.

## 6. Pengelolaan kasus guru tetap CRUD

Guru mengelola kasus melalui **Dashboard Guru untuk kelas terkait**, sesuai route yang benar-benar dipakai project lokal. Seluruh konten orientasi dan data kasus harus berasal dari records kelas, bukan hardcode dari dua kasus contoh.

| Aksi   | Ketentuan                                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create | Guru dapat membuat kasus baru atau memilih template contoh. Template selalu menjadi draft yang dapat diedit.                                                                                                        |
| Read   | Guru dapat melihat daftar, pratinjau sebagaimana siswa, status publikasi, jumlah respons dan arsip; siswa hanya melihat yang published dan aktif.                                                                   |
| Update | Guru mengubah urutan, gambar, narasi, sumber/link, label faktor, pemantik, perspektif contoh, entri data ilmiah dan sosial ekonomi beserta sumber/satuan, panduan rumusan masalah, prompt keputusan, dan publikasi. |
| Delete | Tambahkan hapus dari UI. Setelah kasus mendapat respons, gunakan arsip/soft delete untuk menjaga konteks jawaban. Jangan cascade delete post/komentar atau menghapus progres siswa.                                 |

Model konten usulan per kasus: title, body/narrative, imageUrl/alt/attribution, sourceLinks, phenomenonQuestion, stakeholderPrompts (array dinamis), otherStakeholderQuestion, scientificEvidence (array item dengan nilai, satuan, sumber dan status “data literatur”, “kronologi insiden”, atau “data kasus”), socioeconomicEvidence (array argumen contoh dengan label dan asal), problemGuide, conclusionPrompt, published, order, version, archivedAt. Field artikel dan decisionPrompt lama tetap terbaca. Hindari schema yang mewajibkan tautan bila guru memasukkan narasi dan sumber internal yang memadai.

Guru dapat menulis materi untuk kasus baru tanpa memodifikasi kode. Jumlah perspektif contoh tidak harus tiga. Dua tab data menampilkan ulang butir yang tersimpan untuk kasus itu, bukan konten dari kasus lain. Pratinjau dan validasi mengingatkan guru tentang atribusi, unit, dan perbedaan fakta dengan argumen contoh.

Jika isi kasus dipublikasikan lalu diubah ketika siswa mengerjakan, simpan versi/snapshot minimal judul, pertanyaan, data, dan prompt terkait pada respons siswa. Jaga progres kasus yang sedang berjalan dan urutan yang telah diambil siswa. Kasus yang disembunyikan/diarsipkan tidak boleh mengunci penyelesaian. Kasus baru terbit setelah siswa selesai tidak boleh membatalkan status selesai lama diam-diam.

## 7. Data, keamanan, kompatibilitas

Petakan path penyimpanan **Modul 5 saat ini** di project lokal. Bila masih memakai Firebase Realtime Database, pastikan letak dan aturan untuk: konten kasus guru, jawaban pribadi per siswa dan kasus, argumen awal publik, tanggapan yang menargetkan post teman, status forum, kesimpulan guru, serta progres modul keseluruhan. Jangan membuat path baru berdasarkan asumsi dari kode lama sebelum membaca data dan migrasi yang berlaku.

Tambahkan tipe bertahap yang eksplisit untuk rumusan masalah, hipotesis, bukti pilihan/bukti lain, uji, pilihan post lawan, dua tanggapan, kesimpulan, dan keputusan. Pertahankan kemampuan membaca post CER, field kasus, dan respons historis **yang memang ditemukan** di project lokal. Siswa yang telah menyelesaikan forum sebelumnya tidak boleh dipaksa mengulang atau diberi data jawaban fiktif. Migrasi bersifat idempoten.

Autentikasi dan pembatasan kelas harus ditegakkan pada aturan database/server, bukan hanya pada UI. Periksa query/rules pembacaan kasus terbit: jangan sampai siswa dapat mengambil draft atau arsip dengan membaca node induk meskipun UI menyaringnya. Gunakan query/rules yang benar atau proyeksi terpisah. Jaga submit-to-reveal untuk schema argumen baru dan buat pengiriman post satu kali tetap atomik/idempoten. Tanggapan wajib harus menargetkan dua post berbeda dari siswa lain di kelas dan kasus yang sama; validasi server/rules perlu melindungi identitas penulis dan target. Catatan pribadi hanya dapat ditulis siswa sendiri dan dibaca guru kelasnya; guru tetap tidak dapat mengubah jawaban akademik siswa.

Pastikan mekanisme update draft, antrean autosave dan submit langsung tidak saling menimpa jawaban bertingkat. Simpan draft saat keluar dan pulihkan saat refresh. Jika write gagal, jangan membuka feed atau kasus berikutnya; berikan retry yang jelas.

Periksa formatter dan detail siswa di Dashboard Guru pada **project lokal**. Pastikan laporan membaca respons kasus Modul 5 yang aktif, bukan hanya field historis. Tampilkan rumusan masalah, hipotesis, bukti, uji, tanggapan, kesimpulan dan keputusan per kasus, dengan fallback untuk data lama. PDF LKPD dari modul lain tidak otomatis menjadi target revisi ini.

## 8. Kriteria penerimaan

1. Guru dapat membuat, membaca/pratinjau, mengedit, menyusun urutan, mempublikasikan, menyembunyikan dan mengarsipkan kasus di kelasnya; guru lain ditolak.
2. Contoh Imperial Sugar dan Pupuk Kaltim hanya muncul jika guru sengaja membuatnya sebagai draft lalu menerbitkannya. Kasus ketiga buatan guru menjalankan alur yang sama.
3. Siswa membuat rumusan masalahnya sendiri dengan faktor, dampak dan pertimbangan pemangku kepentingan bebas; tiga perspektif contoh bukan pilihan wajib.
4. Hipotesis awal, pilihan data ilmiah/sosial ekonomi, dan bukti orisinal memiliki tempat simpan terpisah; telaah data tidak menampilkan verifikasi hipotesis terlalu dini.
5. Pada uji hipotesis, hipotesis dan bukti yang sudah dicatat muncul otomatis. Siswa memilih didukung/tidak didukung dan menulis alasan bebas; post gagal kirim tidak membuka feed.
6. Siswa tidak dapat membaca post teman sebelum mengirim argumen sendiri. Sesudahnya ia menanggapi dua post dari dua siswa lain yang berbeda, mencatat perbedaan perspektif, dan tidak bisa memakai post sendiri/komentar umum sebagai pemenuhan syarat.
7. Kesimpulan menjawab rumusan masalah dan memuat solusi/kebijakan berbasis bukti; “Simpan Keputusan” membuka kasus berikutnya tanpa menghapus yang lama.
8. Guru memantau jawaban tiap tahap dan riwayat forum dalam mode baca; kesimpulan guru tetap dapat diterbitkan. Modul berikutnya terbuka sesuai prasyarat lokal.
9. Refresh, dua tab, kegagalan jaringan, urutan kasus yang berubah dan kelas tanpa cukup post teman ditangani dengan pesan/status yang jelas tanpa kehilangan data.
10. Akses langsung ke draft/arsip guru, catatan pribadi siswa lain, atau feed sebelum submit ditolak di rules, bukan hanya tersembunyi di UI.
11. Angka debu dari literatur tidak dilabeli pengukuran di lokasi insiden; kriteria lapisan debu 5% tidak ditafsir sebagai ambang konsentrasi; penyebab insiden gasket tidak disamakan dengan bukti spesifik akibat suhu tinggi.
12. Tampilan responsif, gambar mempunyai teks alternatif dan atribusi, angka/grafik disertai unit dan sumber, bahasa Indonesia mudah dipahami.

## 9. Urutan kerja AI agent

Baca instruksi **project ini**, storyboard, dan implementasi lokal terkini. Rancang schema kompatibel, kemudian kerjakan CRUD guru, rules/query, alur siswa, penyimpanan/progres, dan tampilan guru. Jalankan script typecheck, lint, dan build yang tersedia dari direktori aplikasi yang benar, serta tes relevan pada emulator bila tersedia. Jangan mengubah database produksi atau mengklaim tes yang belum dijalankan. Laporkan perubahan, hasil verifikasi, batasan, dan kebijakan kelas kecil secara jelas. Jangan commit, push, atau deploy tanpa instruksi pengguna.
