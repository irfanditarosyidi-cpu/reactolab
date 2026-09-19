import { normalizeProblemAnswer as normalizeAnswer } from "./problem-validation";

export interface HypothesisConcept {
  directions: string[];
  reasons: string[];
  directionHints: string[];
  reasonHints: string[];
}

export interface HypothesisFieldFeedback {
  valid: boolean;
  message: string;
}

export interface HypothesisValidationResult {
  valid: boolean;
  direction: HypothesisFieldFeedback;
  effect: HypothesisFieldFeedback;
  reason: HypothesisFieldFeedback;
}

export const HYPOTHESIS_EFFECTS = [
  "semakin cepat",
  "lebih cepat",
  "cepat",
  "meningkat",
  "bertambah",
  "naik",
  "laju meningkat",
  "laju bertambah",
  "laju naik",
  "semakin lambat",
  "lebih lambat",
  "lambat",
  "menurun",
  "berkurang",
  "turun",
  "laju menurun",
  "laju berkurang",
  "laju turun",
  "tidak berubah",
  "tetap",
  "sama",
];

export const HYPOTHESIS_CONCEPTS: Record<number, HypothesisConcept> = {
  1: {
    directions: [
      "semakin besar",
      "lebih besar",
      "bertambah",
      "meningkat",
      "semakin tinggi",
      "lebih pekat",
      "semakin pekat",
      "semakin kecil",
      "lebih kecil",
      "berkurang",
      "menurun",
      "semakin rendah",
      "lebih encer",
      "semakin encer",
    ],
    reasons: [
      "jumlah partikel",
      "banyak partikel",
      "kerapatan partikel",
      "jarak partikel",
      "partikel berdekatan",
      "partikel lebih rapat",
      "frekuensi tumbukan",
      "tumbukan partikel",
      "tumbukan efektif",
    ],
    directionHints: [
      "Nyatakan apakah faktor pada awal kalimat bertambah atau berkurang.",
      "Gunakan kata yang menunjukkan perubahan tingkat kepekatan.",
    ],
    reasonHints: [
      "Alasan belum menghubungkan perubahan tersebut dengan keadaan partikel.",
      "Jelaskan hubungan jumlah atau jarak partikel dengan terjadinya tumbukan.",
    ],
  },
  2: {
    directions: [
      "semakin luas",
      "lebih luas",
      "semakin besar",
      "lebih besar",
      "bertambah",
      "meningkat",
      "bentuk serbuk",
      "menjadi serbuk",
      "ukuran lebih kecil",
      "semakin kecil",
      "lebih kecil",
      "berkurang",
      "menurun",
      "bentuk bongkahan",
      "menjadi bongkahan",
      "ukuran lebih besar",
    ],
    reasons: [
      "luas permukaan",
      "bidang sentuh",
      "luas sentuhan",
      "kontak antar zat",
      "partikel bersentuhan",
      "frekuensi tumbukan",
      "tumbukan partikel",
      "tumbukan efektif",
    ],
    directionHints: [
      "Nyatakan perubahan luas permukaan atau ukuran bentuk padatan.",
      "Gunakan kata yang membedakan bentuk berukuran halus dan kasar.",
    ],
    reasonHints: [
      "Alasan belum menghubungkan bentuk padatan dengan proses reaksi.",
      "Jelaskan hubungan bidang sentuh dengan kesempatan partikel bertumbukan.",
    ],
  },
  3: {
    directions: [
      "semakin tinggi",
      "lebih tinggi",
      "bertambah",
      "meningkat",
      "naik",
      "lebih panas",
      "semakin panas",
      "semakin rendah",
      "lebih rendah",
      "berkurang",
      "menurun",
      "turun",
      "lebih dingin",
      "semakin dingin",
    ],
    reasons: [
      "energi kinetik",
      "gerak partikel",
      "partikel bergerak",
      "kecepatan partikel",
      "frekuensi tumbukan",
      "tumbukan partikel",
      "tumbukan efektif",
      "energi aktivasi",
    ],
    directionHints: [
      "Nyatakan apakah kondisi pada awal kalimat menjadi lebih tinggi atau rendah.",
      "Gunakan kata yang menunjukkan perubahan kondisi panas atau dingin.",
    ],
    reasonHints: [
      "Alasan belum menjelaskan apa yang terjadi pada partikel.",
      "Hubungkan perubahan kondisi dengan gerak, energi, atau tumbukan partikel.",
    ],
  },
  4: {
    directions: [
      "ditambahkan katalis",
      "ditambah katalis",
      "diberi katalis",
      "menggunakan katalis",
      "terdapat katalis",
      "ada katalis",
      "jenis katalis berbeda",
      "tidak ditambahkan katalis",
      "tanpa katalis",
      "tidak menggunakan katalis",
      "tidak ada katalis",
    ],
    reasons: [
      "energi aktivasi",
      "menurunkan energi aktivasi",
      "jalur reaksi",
      "jalur alternatif",
      "mekanisme reaksi",
      "tumbukan efektif",
      "katalis tidak habis",
    ],
    directionHints: [
      "Nyatakan dengan jelas apakah zat pembantu digunakan atau tidak.",
      "Gunakan kata yang menunjukkan keberadaan atau perbedaan jenis zat pembantu.",
    ],
    reasonHints: [
      "Alasan belum menjelaskan bagaimana zat pembantu memengaruhi proses reaksi.",
      "Hubungkan alasan dengan jalur reaksi atau energi yang diperlukan reaksi.",
    ],
  },
};

const MEANINGLESS = [
  "asal",
  "ngasal",
  "tidak tahu",
  "gak tahu",
  "ga tahu",
  "gatau",
  "bebas",
  "jawaban",
  "test",
  "tes",
  "coba",
  "asdf",
  "qwerty",
  "abc",
];

export function normalizeHypothesisAnswer(value: string): string {
  return normalizeAnswer(value);
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

function tokenMatches(actual: string, expected: string): boolean {
  if (actual === expected) return true;
  return expected.length >= 5 && editDistance(actual, expected) <= 1;
}

function matchesConcept(value: string, aliases: string[]): boolean {
  const words = normalizeAnswer(value).split(" ").filter(Boolean);
  return aliases.some((alias) =>
    normalizeAnswer(alias)
      .split(" ")
      .filter(Boolean)
      .every((expected) => words.some((actual) => tokenMatches(actual, expected)))
  );
}

function isObviouslyMeaningless(value: string): boolean {
  const normalized = normalizeAnswer(value);
  const letters = normalized.replace(/[^a-z]/g, "");
  return (
    letters.length < 3 ||
    /(.)\1{3,}/.test(letters) ||
    MEANINGLESS.some((term) => normalized === term)
  );
}

function hintAt(hints: string[], attempt: number): string {
  return hints[Math.min(Math.max(attempt - 1, 0), hints.length - 1)];
}

export function validateHypothesisAnswer(
  moduleId: number,
  directionValue: string,
  effectValue: string,
  reasonValue: string,
  attempt: number,
  additions?: {
    directions?: string[];
    effects?: string[];
    reasons?: string[];
  }
): HypothesisValidationResult {
  const concept = HYPOTHESIS_CONCEPTS[moduleId];
  if (!concept) {
    const invalid = { valid: false, message: "Modul tidak dikenali." };
    return { valid: false, direction: invalid, effect: invalid, reason: invalid };
  }

  const directionValid =
    !isObviouslyMeaningless(directionValue) &&
    matchesConcept(directionValue, [
      ...concept.directions,
      ...(additions?.directions ?? []),
    ]);
  const effectValid =
    !isObviouslyMeaningless(effectValue) &&
    matchesConcept(effectValue, [
      ...HYPOTHESIS_EFFECTS,
      ...(additions?.effects ?? []),
    ]);
  const reasonValid =
    normalizeAnswer(reasonValue).length >= 15 &&
    !isObviouslyMeaningless(reasonValue) &&
    matchesConcept(reasonValue, [
      ...concept.reasons,
      ...(additions?.reasons ?? []),
    ]);

  return {
    valid: directionValid && effectValid && reasonValid,
    direction: {
      valid: directionValid,
      message: directionValid
        ? "Arah perubahan sudah dinyatakan dengan jelas."
        : hintAt(concept.directionHints, attempt),
    },
    effect: {
      valid: effectValid,
      message: effectValid
        ? "Dampak terhadap laju reaksi sudah jelas."
        : "Nyatakan apakah laju reaksi menjadi lebih cepat, lebih lambat, atau tetap.",
    },
    reason: {
      valid: reasonValid,
      message: reasonValid
        ? "Alasan sudah menggunakan konsep ilmiah yang relevan."
        : hintAt(concept.reasonHints, attempt),
    },
  };
}
