// ===== ChemSpace module & learning-content definitions (PRD §16–§25) =====
// Every student module is ONE single page composed of sequential sections.

export type SectionType =
  | "orientation"
  | "problem"
  | "hypothesis"
  | "experiment"
  | "hypotest"
  | "conclusion"
  | "m6intro"
  | "m6cases"
  | "m6articles"
  | "m6cer"
  | "m6forum"
  | "m6decision"
  | "m6conclusion"
  | "m7closing";

export interface SectionDef {
  id: string; // "section1"…"section6"
  title: string;
  type: SectionType;
}

export interface ExperimentOption {
  value: string; // stored key
  label: string; // display label
  factor: number; // physical factor driving the simulation model
}

export interface ExperimentConfig {
  kind: "concentration" | "surface" | "temperature" | "catalyst";
  title: string;
  paramName: string;
  paramUnit?: string;
  minSelections: number;
  options: ExperimentOption[];
  reaction: string; // full balanced equation for display after validation
  reactionLeft: string; // left side shown as the prompt
  symbolicPrompt: string;
  symbolicTokens: string[]; // accepted product tokens; at least one must appear
  symbolicSolution: string; // right side solution
  rateKind: "inverseTime" | "gasRate";
  rateLabel: string;
  rateUnit: string;
  timeLabel: string;
  gas?: { vmax: number; sampleEvery: number; duration: number };
  chartX: string;
  numericParam: boolean;
  stageNote: string; // note under the macroscopic stage
  /**
   * When present, students define their own parameter values inside this
   * range (Module 1: free HCl concentrations) instead of picking presets.
   * `minGapWarn` triggers a short warning when two values are closer than this.
   */
  customRange?: {
    min: number;
    max: number;
    step: number;
    maxSelections: number;
    minGapWarn: number;
  };
}

export interface ModuleDef {
  id: number;
  title: string;
  short: string;
  emoji: string;
  description: string;
  sections: SectionDef[];
  experiment?: ExperimentConfig;
  orientation?: { story: string; caption: string; question: string };
  problem?: { hintBebas: string; hintTerikat: string };
  hypothesis?: {
    subject: string;
    directions: string[];
    effects: string[];
  };
}

const INQUIRY_SECTIONS = (lastTitle = "Kesimpulan"): SectionDef[] => [
  { id: "section1", title: "Orientasi", type: "orientation" },
  { id: "section2", title: "Rumusan Masalah", type: "problem" },
  { id: "section3", title: "Hipotesis", type: "hypothesis" },
  { id: "section4", title: "Eksperimen Virtual Terintegrasi", type: "experiment" },
  { id: "section5", title: "Uji Hipotesis", type: "hypotest" },
  { id: "section6", title: lastTitle, type: "conclusion" },
];

export const MODULES: ModuleDef[] = [
  {
    id: 1,
    title: "Faktor Konsentrasi",
    short: "Konsentrasi",
    emoji: "🧪",
    description:
      "Menyelidiki pengaruh konsentrasi larutan terhadap laju reaksi melalui eksperimen virtual Mg + HCl.",
    sections: INQUIRY_SECTIONS(),
    orientation: {
      story:
        "Bu Rina sedang membersihkan noda membandel di kamar mandi. Saat ia menuangkan larutan pembersih yang masih pekat, noda dan kerak larut dengan cepat disertai gelembung. Namun ketika larutan pembersih itu sudah diencerkan dengan banyak air, noda yang sama membutuhkan waktu jauh lebih lama untuk hilang.",
      caption:
        "Larutan pekat bekerja cepat, larutan encer bekerja lambat — mengapa bisa begitu?",
      question:
        "Berdasarkan fenomena di atas, apa yang kamu amati tentang hubungan kepekatan (konsentrasi) larutan dengan cepat-lambatnya reaksi?",
    },
    problem: {
      hintBebas: "contoh: konsentrasi larutan HCl",
      hintTerikat: "contoh: laju reaksi antara logam Mg dan larutan HCl",
    },
    hypothesis: {
      subject: "Jika konsentrasi larutan",
      directions: ["semakin besar", "semakin kecil"],
      effects: ["semakin cepat", "semakin lambat", "tidak berubah"],
    },
    experiment: {
      kind: "concentration",
      title: "Reaksi Pita Magnesium dengan Larutan HCl",
      paramName: "Konsentrasi HCl",
      paramUnit: "M",
      minSelections: 3,
      options: [
        { value: "0.5", label: "0,5 M", factor: 0.5 },
        { value: "1.0", label: "1,0 M", factor: 1.0 },
        { value: "1.5", label: "1,5 M", factor: 1.5 },
        { value: "2.0", label: "2,0 M", factor: 2.0 },
        { value: "2.5", label: "2,5 M", factor: 2.5 },
        { value: "3.0", label: "3,0 M", factor: 3.0 },
      ],
      reaction: "Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)",
      reactionLeft: "Mg(s) + 2HCl(aq) →",
      symbolicPrompt:
        "Tuliskan zat hasil reaksi (produk) pada persamaan berikut.",
      symbolicTokens: ["mgcl2", "h2"],
      symbolicSolution: "MgCl₂(aq) + H₂(g)",
      rateKind: "inverseTime",
      rateLabel: "v = 1/t",
      rateUnit: "s⁻¹",
      timeLabel: "Waktu pita Mg habis (s)",
      chartX: "Konsentrasi (M)",
      numericParam: true,
      stageNote:
        "Volume HCl 20 mL, suhu, dan pita Mg dibuat sama pada setiap percobaan; hanya konsentrasi HCl yang diubah. Masukkan pita Mg ke tabung reaksi, jalankan stopwatch saat gelembung H₂ mulai muncul, dan hentikan saat pita Mg habis.",
      // Students choose their own concentrations (PRD revisi simulasi 3D §1–2).
      customRange: { min: 0.5, max: 3.0, step: 0.05, maxSelections: 6, minGapWarn: 0.3 },
    },
  },
  {
    id: 2,
    title: "Faktor Luas Permukaan",
    short: "Luas Permukaan",
    emoji: "🪨",
    description:
      "Menyelidiki pengaruh luas permukaan sentuh zat padat terhadap laju reaksi melalui eksperimen virtual CaCO₃ + HCl.",
    sections: INQUIRY_SECTIONS(),
    orientation: {
      story:
        "Dua tablet effervescent dimasukkan ke dua gelas air. Tablet pertama dimasukkan utuh, sedangkan tablet kedua digerus halus menjadi serbuk terlebih dahulu. Ternyata serbuk tablet langsung berbuih hebat dan habis dalam hitungan detik, sementara tablet utuh masih terus bergelembung pelan cukup lama.",
      caption:
        "Zat yang sama, jumlah yang sama — tetapi bentuk serbuk bereaksi jauh lebih cepat.",
      question:
        "Berdasarkan fenomena di atas, apa yang kamu amati tentang hubungan ukuran/bentuk padatan dengan cepat-lambatnya reaksi?",
    },
    problem: {
      hintBebas: "contoh: luas permukaan (bentuk) padatan CaCO₃",
      hintTerikat: "contoh: laju reaksi CaCO₃ dengan larutan HCl",
    },
    hypothesis: {
      subject: "Jika luas permukaan zat padat",
      directions: ["semakin luas (bentuk serbuk)", "semakin kecil (bentuk bongkahan)"],
      effects: ["semakin cepat", "semakin lambat", "tidak berubah"],
    },
    experiment: {
      kind: "surface",
      title: "Reaksi Pualam (CaCO₃) dengan Larutan HCl",
      paramName: "Bentuk CaCO₃",
      minSelections: 3,
      options: [
        { value: "bongkahan", label: "Bongkahan", factor: 1.0 },
        { value: "kepingan", label: "Kepingan", factor: 2.1 },
        { value: "butiran", label: "Butiran", factor: 3.4 },
        { value: "serbuk", label: "Serbuk halus", factor: 5.5 },
      ],
      reaction: "CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)",
      reactionLeft: "CaCO₃(s) + 2HCl(aq) →",
      symbolicPrompt:
        "Tuliskan zat hasil reaksi (produk) pada persamaan berikut.",
      symbolicTokens: ["cacl2", "h2o", "co2"],
      symbolicSolution: "CaCl₂(aq) + H₂O(l) + CO₂(g)",
      rateKind: "gasRate",
      rateLabel: "v = ΔV/Δt",
      rateUnit: "mL/s",
      timeLabel: "Volume gas CO₂ (mL)",
      // Semua bentuk menghasilkan volume akhir CO₂ yang sama. `duration` adalah
      // waktu bentuk paling lambat; bentuk lain selesai lebih cepat sesuai faktor.
      gas: { vmax: 48, sampleEvery: 10, duration: 200 },
      chartX: "Bentuk CaCO₃",
      numericParam: false,
      stageNote:
        "Massa CaCO₃, volume dan konsentrasi HCl, serta suhu dibuat sama; hanya bentuk padatan yang diubah. CO₂ dialirkan lewat selang ke gelas ukur terbalik berisi air dan volumenya tercatat otomatis tiap 10 detik sampai reaksi selesai.",
    },
  },
  {
    id: 3,
    title: "Faktor Suhu",
    short: "Suhu",
    emoji: "🌡️",
    description:
      "Menyelidiki pengaruh suhu terhadap laju reaksi melalui eksperimen virtual Na₂S₂O₃ + HCl (hilangnya tanda X).",
    sections: INQUIRY_SECTIONS(),
    orientation: {
      story:
        "Ibu membeli dua kotak susu segar yang sama. Satu kotak tertinggal di meja dapur yang hangat, satu lagi disimpan di dalam kulkas. Sore harinya susu di meja sudah basi dan menggumpal, sedangkan susu di kulkas masih segar hingga beberapa hari kemudian.",
      caption:
        "Reaksi pembusukan berjalan cepat di suhu hangat dan sangat lambat di suhu dingin.",
      question:
        "Berdasarkan fenomena di atas, apa yang kamu amati tentang hubungan suhu dengan cepat-lambatnya suatu reaksi?",
    },
    problem: {
      hintBebas: "contoh: suhu larutan Na₂S₂O₃",
      hintTerikat: "contoh: laju reaksi Na₂S₂O₃ dengan larutan HCl",
    },
    hypothesis: {
      subject: "Jika suhu larutan",
      directions: ["semakin tinggi", "semakin rendah"],
      effects: ["semakin cepat", "semakin lambat", "tidak berubah"],
    },
    experiment: {
      kind: "temperature",
      title: "Reaksi Na₂S₂O₃ dengan HCl di Atas Tanda X",
      paramName: "Suhu Larutan",
      paramUnit: "°C",
      minSelections: 3,
      options: [
        { value: "10", label: "10 °C", factor: 10 },
        { value: "20", label: "20 °C", factor: 20 },
        { value: "30", label: "30 °C", factor: 30 },
        { value: "40", label: "40 °C", factor: 40 },
        { value: "50", label: "50 °C", factor: 50 },
      ],
      reaction:
        "Na₂S₂O₃(aq) + 2HCl(aq) → 2NaCl(aq) + S(s) + SO₂(g) + H₂O(l)",
      reactionLeft: "Na₂S₂O₃(aq) + 2HCl(aq) →",
      symbolicPrompt:
        "Tuliskan zat hasil reaksi (produk) pada persamaan berikut (endapan belerang membuat larutan keruh).",
      symbolicTokens: ["nacl", "s", "so2", "h2o"],
      symbolicSolution: "2NaCl(aq) + S(s) + SO₂(g) + H₂O(l)",
      rateKind: "inverseTime",
      rateLabel: "v = 1/t",
      rateUnit: "s⁻¹",
      timeLabel: "Waktu tanda X hilang (s)",
      chartX: "Suhu (°C)",
      numericParam: true,
      stageNote:
        "Volume dan konsentrasi Na₂S₂O₃ 0,1 M serta HCl 1 M, gelas, dan tanda X dibuat sama; hanya suhu yang diubah. Kedua larutan disetarakan ke suhu target, dicampurkan (stopwatch berjalan otomatis), lalu tekan Stop saat tanda X tidak terlihat.",
      // Students choose their own temperatures (revisi simulasi 3D Modul 3).
      customRange: { min: 10, max: 60, step: 5, maxSelections: 6, minGapWarn: 10 },
    },
  },
  {
    id: 4,
    title: "Faktor Katalis",
    short: "Katalis",
    emoji: "⚗️",
    description:
      "Menyelidiki pengaruh katalis terhadap laju reaksi melalui eksperimen virtual penguraian H₂O₂.",
    sections: INQUIRY_SECTIONS("Kesimpulan & Finalisasi LKPD"),
    orientation: {
      story:
        "Dalam demonstrasi sains, dua botol berisi larutan hidrogen peroksida (H₂O₂) yang sama didiamkan. Botol pertama nyaris tidak menunjukkan perubahan. Ke botol kedua ditambahkan sedikit ragi — seketika muncul buih busa oksigen yang meluap deras seperti pasta gigi raksasa, padahal ragi itu sendiri tidak habis bereaksi.",
      caption:
        "Zat tambahan tertentu dapat mempercepat reaksi tanpa ikut habis bereaksi.",
      question:
        "Berdasarkan fenomena di atas, apa yang kamu amati tentang peran zat tambahan (ragi) terhadap cepat-lambatnya reaksi?",
    },
    problem: {
      hintBebas: "contoh: jenis katalis yang ditambahkan",
      hintTerikat: "contoh: laju penguraian H₂O₂ (pembentukan gas O₂)",
    },
    hypothesis: {
      subject: "Jika ke dalam suatu reaksi",
      directions: ["ditambahkan katalis", "tidak ditambahkan katalis"],
      effects: ["semakin cepat", "semakin lambat", "tidak berubah"],
    },
    experiment: {
      kind: "catalyst",
      title: "Penguraian H₂O₂ dengan Berbagai Katalis",
      paramName: "Kondisi / Katalis",
      // Students choose at least two catalysts; the no-catalyst control is mandatory.
      minSelections: 2,
      options: [
        { value: "tanpa", label: "Tanpa Katalis", factor: 0.35 },
        { value: "mno2", label: "MnO₂", factor: 6 },
        { value: "fecl3", label: "FeCl₃", factor: 3.6 },
        { value: "hati", label: "Ekstrak Hati (katalase)", factor: 4.8 },
      ],
      reaction: "2H₂O₂(aq) → 2H₂O(l) + O₂(g)",
      reactionLeft: "2H₂O₂(aq) →",
      symbolicPrompt:
        "Tuliskan zat hasil reaksi (produk) pada persamaan penguraian H₂O₂ berikut.",
      symbolicTokens: ["h2o", "o2"],
      symbolicSolution: "2H₂O(l) + O₂(g)",
      rateKind: "gasRate",
      rateLabel: "v = ΔV/Δt",
      rateUnit: "mL/s",
      timeLabel: "Volume gas O₂ (mL)",
      gas: { vmax: 52, sampleEvery: 2, duration: 40 },
      chartX: "Kondisi",
      numericParam: false,
      stageNote:
        "H₂O₂ diurai dalam labu; gas O₂ yang terbentuk terukur pada tabung pengukur gas. Bandingkan tiap kondisi katalis.",
    },
  },
  {
    id: 5,
    title: "Aplikasi Konsep",
    short: "Studi Kasus",
    emoji: "💬",
    description:
      "Menerapkan konsep laju reaksi pada isu keselamatan industri dan sosial-ekonomi melalui studi kasus.",
    sections: [
      { id: "section1", title: "Forum Diskusi Berbasis Studi Kasus", type: "m6intro" },
      {
        id: "sectionCases",
        title: "Rangkaian Studi Kasus",
        type: "m6cases",
      },
      {
        id: "sectionConclusion",
        title: "Kesimpulan Guru",
        type: "m6conclusion",
      },
    ],
  },
  {
    id: 6,
    title: "Penutup",
    short: "Penutup",
    emoji: "🎉",
    description: "Rangkuman perjalanan belajarmu dan unduhan LKPD final.",
    sections: [{ id: "section1", title: "Selesai!", type: "m7closing" }],
  },
];

export function getModuleDef(id: number): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}

export function sectionIds(def: ModuleDef): string[] {
  return def.sections.map((s) => s.id);
}

export function nextSectionId(def: ModuleDef, sectionId: string): string | null {
  const ids = sectionIds(def);
  const i = ids.indexOf(sectionId);
  if (i < 0 || i >= ids.length - 1) return null;
  return ids[i + 1];
}

export function sectionDef(def: ModuleDef, sectionId: string): SectionDef | undefined {
  return def.sections.find((s) => s.id === sectionId);
}

// ===== Teacher confirmation-material content =====

export const M5_EQUATION_QUIZ = [
  {
    q: "Diketahui persamaan laju v = k[A]²[B]. Berapakah orde reaksi total?",
    options: ["1", "2", "3", "0", "4"],
    answer: 2,
    explain: "Orde total = jumlah pangkat = 2 + 1 = 3.",
  },
  {
    q: "Jika v = k[A]² dan konsentrasi A diperbesar 2 kali, laju reaksi menjadi…",
    options: [
      "2 kali lebih besar",
      "4 kali lebih besar",
      "8 kali lebih besar",
      "tetap",
      "16 kali lebih besar",
    ],
    answer: 1,
    explain: "v ∝ [A]², maka (2)² = 4 kali lebih besar.",
  },
  {
    q: "Orde reaksi terhadap suatu pereaksi ditentukan melalui…",
    options: [
      "koefisien persamaan reaksi",
      "data percobaan (eksperimen)",
      "jumlah mol pereaksi",
      "wujud zat pereaksi",
      "suhu awal pereaksi",
    ],
    answer: 1,
    explain: "Orde reaksi hanya dapat ditentukan dari data eksperimen, bukan koefisien reaksi.",
  },
];

export const M5_COLLISION_QUIZ = [
  {
    q: "Tumbukan yang menghasilkan reaksi disebut tumbukan efektif. Syaratnya adalah…",
    options: [
      "energi cukup (≥ energi aktivasi) dan orientasi tepat",
      "jumlah partikel banyak",
      "wadah reaksi tertutup",
      "warna larutan pekat",
      "tekanan sistem selalu rendah",
    ],
    answer: 0,
    explain:
      "Tumbukan efektif memerlukan energi minimal sebesar energi aktivasi DAN arah orientasi yang tepat.",
  },
  {
    q: "Kenaikan suhu mempercepat reaksi karena…",
    options: [
      "energi kinetik partikel bertambah sehingga tumbukan efektif makin sering",
      "jumlah partikel bertambah",
      "energi aktivasi mengecil",
      "volume larutan mengecil",
      "massa pereaksi bertambah",
    ],
    answer: 0,
    explain:
      "Suhu naik → partikel bergerak lebih cepat → frekuensi tumbukan efektif meningkat. Energi aktivasi tetap (kecuali dengan katalis).",
  },
  {
    q: "Katalis mempercepat reaksi dengan cara…",
    options: [
      "menaikkan suhu campuran",
      "menyediakan jalur reaksi lain dengan energi aktivasi lebih rendah",
      "menambah konsentrasi pereaksi",
      "memperbesar luas permukaan",
      "meningkatkan energi aktivasi reaksi",
    ],
    answer: 1,
    explain:
      "Katalis menurunkan energi aktivasi melalui mekanisme/jalur reaksi alternatif tanpa ikut habis bereaksi.",
  },
];

// ===== Practice question bank (Latihan Soal) =====

export interface PracticeQ {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export const PRACTICE_BANK: PracticeQ[] = [
  {
    q: "Laju reaksi dapat dinyatakan sebagai…",
    options: [
      "berkurangnya konsentrasi pereaksi per satuan waktu",
      "bertambahnya volume larutan per satuan waktu",
      "berkurangnya suhu per satuan waktu",
      "bertambahnya massa campuran per satuan waktu",
      "tetapnya jumlah partikel selama reaksi",
    ],
    answer: 0,
    explain:
      "Laju reaksi = berkurangnya konsentrasi pereaksi (atau bertambahnya produk) tiap satuan waktu.",
  },
  {
    q: "Pita Mg bereaksi paling cepat dengan larutan HCl…",
    options: ["0,5 M", "1,0 M", "2,0 M", "3,0 M", "semua sama cepat"],
    answer: 3,
    explain: "Semakin besar konsentrasi, semakin banyak partikel per volume → tumbukan makin sering.",
  },
  {
    q: "Serbuk pualam bereaksi lebih cepat daripada bongkahan karena…",
    options: [
      "massa serbuk lebih besar",
      "luas permukaan sentuh serbuk lebih besar",
      "serbuk lebih murni",
      "bongkahan lebih mudah larut",
      "suhu serbuk selalu lebih tinggi",
    ],
    answer: 1,
    explain: "Luas permukaan besar → bidang sentuh antar pereaksi bertambah → tumbukan makin banyak.",
  },
  {
    q: "Setiap kenaikan suhu, laju reaksi umumnya meningkat karena…",
    options: [
      "energi aktivasi turun",
      "energi kinetik partikel naik sehingga tumbukan efektif bertambah",
      "konsentrasi bertambah",
      "tekanan turun",
      "jumlah partikel pereaksi menjadi dua kali lipat",
    ],
    answer: 1,
    explain: "Suhu tidak mengubah Ea; suhu menaikkan energi kinetik partikel.",
  },
  {
    q: "Fungsi katalis dalam reaksi kimia adalah…",
    options: [
      "menggeser kesetimbangan ke arah produk",
      "menurunkan energi aktivasi melalui jalur reaksi alternatif",
      "menaikkan energi aktivasi",
      "menambah jumlah produk",
      "menaikkan entalpi reaksi",
    ],
    answer: 1,
    explain: "Katalis menyediakan mekanisme dengan Ea lebih rendah dan tidak habis bereaksi.",
  },
  {
    q: "Diketahui v = k[P][Q]². Jika [P] dan [Q] masing-masing diperbesar 2 kali, laju menjadi…",
    options: ["2 kali", "4 kali", "6 kali", "8 kali", "16 kali"],
    answer: 3,
    explain: "v' = k(2[P])(2[Q])² = 2 × 4 = 8 kali laju semula.",
  },
  {
    q: "Grafik jumlah partikel vs energi kinetik (Maxwell–Boltzmann) pada suhu lebih tinggi menunjukkan…",
    options: [
      "puncak lebih tinggi dan bergeser ke kiri",
      "puncak lebih rendah dan bergeser ke kanan",
      "kurva tidak berubah",
      "seluruh partikel berenergi sama",
      "puncak lebih tinggi tanpa mengalami pergeseran",
    ],
    answer: 1,
    explain:
      "Pada suhu tinggi distribusi melebar ke kanan: lebih banyak partikel melampaui energi aktivasi.",
  },
  {
    q: "Satuan laju reaksi yang umum digunakan adalah…",
    options: ["M s⁻¹", "mol", "gram", "liter", "mol² s⁻¹"],
    answer: 0,
    explain: "Laju = perubahan konsentrasi (M) per waktu (s) → M/s.",
  },
  {
    q: "Reaksi Na₂S₂O₃ + HCl menghasilkan larutan keruh karena terbentuk…",
    options: [
      "gas H₂",
      "endapan belerang (S)",
      "gas CO₂",
      "endapan NaCl",
      "uap air",
    ],
    answer: 1,
    explain: "Endapan koloid belerang membuat larutan keruh hingga tanda X tak terlihat.",
  },
  {
    q: "Di antara tindakan berikut, yang TIDAK mempercepat laju reaksi adalah…",
    options: [
      "memperbesar konsentrasi pereaksi",
      "menggerus padatan menjadi serbuk",
      "menurunkan suhu campuran",
      "menambahkan katalis yang sesuai",
      "memperbesar luas permukaan sentuh",
    ],
    answer: 2,
    explain: "Menurunkan suhu justru memperlambat gerak partikel dan mengurangi tumbukan efektif.",
  },
];
