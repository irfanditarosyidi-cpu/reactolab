import {
  HYPOTHESIS_CONCEPTS,
  type HypothesisFieldFeedback,
} from "./hypothesis-validation";
import {
  matchesAcceptedConcept,
  normalizeProblemAnswer,
} from "./problem-validation";
import type { HypoTestDraft, HypothesisDraft } from "./types";

type HypothesisVerdict = NonNullable<HypoTestDraft["verdict"]>;

export interface HypothesisTestValidationResult {
  valid: boolean;
  verdict: HypothesisFieldFeedback;
  explanation: HypothesisFieldFeedback;
}

export interface ConclusionValidationResult {
  valid: boolean;
  relationship: HypothesisFieldFeedback;
  evidence: HypothesisFieldFeedback;
  reasoning: HypothesisFieldFeedback;
}

interface ModuleAnswerConcept {
  factors: string[];
  higherFactor: string[];
  lowerFactor: string[];
}

const MODULE_ANSWER_CONCEPTS: Record<number, ModuleAnswerConcept> = {
  1: {
    factors: ["konsentrasi", "kepekatan", "larutan hcl", "hcl"],
    higherFactor: [
      "konsentrasi semakin tinggi",
      "semakin tinggi konsentrasi",
      "konsentrasi semakin besar",
      "semakin besar konsentrasi",
      "konsentrasi meningkat",
      "konsentrasi bertambah",
      "konsentrasi tinggi",
      "larutan semakin pekat",
      "larutan lebih pekat",
      "larutan pekat",
      "semakin pekat",
      "lebih pekat",
    ],
    lowerFactor: [
      "konsentrasi semakin rendah",
      "semakin rendah konsentrasi",
      "konsentrasi semakin kecil",
      "semakin kecil konsentrasi",
      "konsentrasi menurun",
      "konsentrasi berkurang",
      "konsentrasi rendah",
      "larutan semakin encer",
      "larutan lebih encer",
      "larutan encer",
      "semakin encer",
      "lebih encer",
    ],
  },
  2: {
    factors: [
      "luas permukaan",
      "bidang sentuh",
      "ukuran partikel",
      "bentuk caco3",
      "serbuk",
      "bongkahan",
    ],
    higherFactor: [
      "luas permukaan semakin luas",
      "semakin luas permukaan",
      "luas permukaan semakin besar",
      "luas permukaan lebih besar",
      "luas permukaan meningkat",
      "luas permukaan bertambah",
      "bidang sentuh semakin luas",
      "bidang sentuh lebih luas",
      "ukuran partikel semakin kecil",
      "semakin kecil ukuran partikel",
      "ukuran lebih kecil",
      "bentuk serbuk",
      "serbuk halus",
      "serbuk",
      "lebih halus",
    ],
    lowerFactor: [
      "luas permukaan semakin kecil",
      "semakin kecil luas permukaan",
      "luas permukaan lebih kecil",
      "luas permukaan menurun",
      "luas permukaan berkurang",
      "bidang sentuh semakin kecil",
      "bidang sentuh lebih kecil",
      "ukuran partikel semakin besar",
      "semakin besar ukuran partikel",
      "ukuran lebih besar",
      "bentuk bongkahan",
      "bongkahan",
      "lebih kasar",
    ],
  },
  3: {
    factors: ["suhu", "temperatur", "panas", "dingin"],
    higherFactor: [
      "suhu semakin tinggi",
      "semakin tinggi suhu",
      "suhu meningkat",
      "suhu bertambah",
      "suhu naik",
      "suhu tinggi",
      "temperatur semakin tinggi",
      "temperatur meningkat",
      "semakin tinggi",
      "lebih tinggi",
      "semakin panas",
      "lebih panas",
    ],
    lowerFactor: [
      "suhu semakin rendah",
      "semakin rendah suhu",
      "suhu menurun",
      "suhu berkurang",
      "suhu turun",
      "suhu rendah",
      "temperatur semakin rendah",
      "temperatur menurun",
      "semakin rendah",
      "lebih rendah",
      "semakin dingin",
      "lebih dingin",
    ],
  },
  4: {
    factors: [
      "katalis",
      "mno2",
      "fecl3",
      "ekstrak hati",
      "katalase",
      "ragi",
    ],
    higherFactor: [
      "dengan katalis",
      "penambahan katalis",
      "ditambahkan katalis",
      "ditambah katalis",
      "diberi katalis",
      "menggunakan katalis",
      "terdapat katalis",
      "ada katalis",
      "mno2",
      "fecl3",
      "ekstrak hati",
      "katalase",
      "ragi",
    ],
    lowerFactor: [
      "tanpa katalis",
      "tidak ditambahkan katalis",
      "tidak ditambah katalis",
      "tidak menggunakan katalis",
      "tidak ada katalis",
    ],
  },
};

export const INQUIRY_RELATIONSHIP_TERMS: Record<number, string[]> = {
  1: [
    "konsentrasi semakin tinggi laju reaksi semakin cepat",
    "konsentrasi semakin rendah laju reaksi semakin lambat",
    "konsentrasi berbanding lurus dengan laju reaksi",
  ],
  2: [
    "luas permukaan semakin besar laju reaksi semakin cepat",
    "luas permukaan semakin kecil laju reaksi semakin lambat",
    "luas permukaan berbanding lurus dengan laju reaksi",
    "ukuran partikel semakin kecil laju reaksi semakin cepat",
  ],
  3: [
    "suhu semakin tinggi laju reaksi semakin cepat",
    "suhu semakin rendah laju reaksi semakin lambat",
    "suhu berbanding lurus dengan laju reaksi",
  ],
  4: [
    "penambahan katalis mempercepat laju reaksi",
    "dengan katalis laju reaksi lebih cepat",
    "tanpa katalis laju reaksi lebih lambat",
  ],
};

const FAST_EFFECTS = [
  "semakin cepat",
  "lebih cepat",
  "paling cepat",
  "mempercepat laju",
  "mempercepat reaksi",
  "laju meningkat",
  "laju reaksi meningkat",
  "laju bertambah",
  "laju reaksi bertambah",
  "laju naik",
  "laju reaksi naik",
  "laju semakin tinggi",
  "laju reaksi semakin tinggi",
  "laju lebih tinggi",
  "laju paling tinggi",
  "waktu semakin singkat",
  "waktu lebih singkat",
  "waktu semakin pendek",
  "waktu lebih pendek",
  "waktu berkurang",
  "waktu lebih sedikit",
];

const SLOW_EFFECTS = [
  "semakin lambat",
  "lebih lambat",
  "paling lambat",
  "memperlambat laju",
  "memperlambat reaksi",
  "laju menurun",
  "laju reaksi menurun",
  "laju berkurang",
  "laju reaksi berkurang",
  "laju turun",
  "laju reaksi turun",
  "laju semakin rendah",
  "laju reaksi semakin rendah",
  "laju lebih rendah",
  "laju paling rendah",
  "waktu semakin lama",
  "waktu lebih lama",
  "waktu bertambah",
  "membutuhkan waktu lama",
];

const RATE_OUTCOMES = [
  "laju reaksi",
  "kecepatan reaksi",
  "cepat lambat reaksi",
  "waktu reaksi",
  "waktu yang dibutuhkan",
  "bereaksi",
  "reaksi berlangsung",
  "reaksi menjadi",
];

export const INQUIRY_EVIDENCE_TERMS = [
  "data",
  "hasil percobaan",
  "hasil eksperimen",
  "hasil pengamatan",
  "percobaan",
  "eksperimen",
  "pengamatan",
  "grafik",
  "tabel",
  "menunjukkan",
  "berdasarkan",
  "dibuktikan",
  "bukti",
  "terlihat",
  "tercatat",
  "dibandingkan",
  "perbandingan",
];

export const CONCLUSION_REASON_TERMS: Record<number, string[]> = {
  1: [
    "partikel lebih banyak",
    "partikel semakin banyak",
    "tumbukan lebih sering",
    "lebih sering bertumbukan",
  ],
  2: [
    "permukaan sentuh",
    "lebih banyak bagian yang bersentuhan",
    "kontak lebih banyak",
    "tumbukan lebih sering",
    "lebih sering bertumbukan",
  ],
  3: [
    "partikel bergerak lebih cepat",
    "gerakan partikel lebih cepat",
    "tumbukan lebih sering",
    "lebih sering bertumbukan",
    "lebih banyak partikel melampaui energi aktivasi",
  ],
  4: [
    "energi aktivasi lebih rendah",
    "menurunkan ea",
    "ea lebih rendah",
    "jalur reaksi alternatif",
  ],
};

function includesAny(normalizedValue: string, aliases: string[]): boolean {
  return aliases.some((alias) =>
    normalizedValue.includes(normalizeProblemAnswer(alias))
  );
}

function hasExpectedRelationship(
  moduleId: number,
  value: string,
  additions: string[] = []
): boolean {
  const concept = MODULE_ANSWER_CONCEPTS[moduleId];
  if (!concept) return false;

  const normalized = normalizeProblemAnswer(value);
  const higher = includesAny(normalized, concept.higherFactor);
  const lower = includesAny(normalized, concept.lowerFactor);
  const faster = includesAny(normalized, FAST_EFFECTS);
  const slower = includesAny(normalized, SLOW_EFFECTS);
  const namesOutcome = includesAny(normalized, RATE_OUTCOMES);

  const followsBuiltInPattern =
    namesOutcome && ((higher && faster) || (lower && slower));
  const matchesAcceptedPhrase = matchesAcceptedConcept(value, [
    ...(INQUIRY_RELATIONSHIP_TERMS[moduleId] ?? []),
    ...additions,
  ]);

  return followsBuiltInPattern || matchesAcceptedPhrase;
}

function hasRelevantFactor(
  moduleId: number,
  value: string,
  additions: string[] = []
): boolean {
  const concept = MODULE_ANSWER_CONCEPTS[moduleId];
  return Boolean(
    concept &&
      matchesAcceptedConcept(value, [...concept.factors, ...additions])
  );
}

function hasEvidence(value: string, additions: string[] = []): boolean {
  const normalized = normalizeProblemAnswer(value);
  return (
    includesAny(normalized, INQUIRY_EVIDENCE_TERMS) ||
    matchesAcceptedConcept(value, additions) ||
    /\d/.test(normalized)
  );
}

function classifyEffect(value: string): -1 | 0 | 1 | null {
  const normalized = normalizeProblemAnswer(value);
  if (includesAny(normalized, ["tidak berubah", "tetap", "sama"])) return 0;
  if (includesAny(normalized, ["menurun", "berkurang", "turun"])) return -1;
  if (includesAny(normalized, ["meningkat", "bertambah", "naik"])) return 1;
  if (includesAny(normalized, SLOW_EFFECTS)) return -1;
  if (includesAny(normalized, FAST_EFFECTS)) return 1;
  return null;
}

function classifyDirection(moduleId: number, value: string): -1 | 1 | null {
  const concept = MODULE_ANSWER_CONCEPTS[moduleId];
  if (!concept) return null;
  const normalized = normalizeProblemAnswer(value);

  const directionAliases: Record<number, { higher: string[]; lower: string[] }> = {
    1: {
      higher: [
        "semakin besar",
        "lebih besar",
        "bertambah",
        "meningkat",
        "semakin tinggi",
        "lebih pekat",
        "semakin pekat",
      ],
      lower: [
        "semakin kecil",
        "lebih kecil",
        "berkurang",
        "menurun",
        "semakin rendah",
        "lebih encer",
        "semakin encer",
      ],
    },
    2: {
      higher: [
        "semakin luas",
        "lebih luas",
        "semakin besar",
        "lebih besar",
        "bertambah",
        "meningkat",
        "bentuk serbuk",
        "menjadi serbuk",
        "ukuran lebih kecil",
      ],
      lower: [
        "semakin kecil",
        "lebih kecil",
        "berkurang",
        "menurun",
        "bentuk bongkahan",
        "menjadi bongkahan",
        "ukuran lebih besar",
      ],
    },
    3: {
      higher: [
        "semakin tinggi",
        "lebih tinggi",
        "bertambah",
        "meningkat",
        "naik",
        "lebih panas",
        "semakin panas",
      ],
      lower: [
        "semakin rendah",
        "lebih rendah",
        "berkurang",
        "menurun",
        "turun",
        "lebih dingin",
        "semakin dingin",
      ],
    },
    4: {
      higher: [
        "ditambahkan katalis",
        "ditambah katalis",
        "diberi katalis",
        "menggunakan katalis",
        "terdapat katalis",
        "ada katalis",
      ],
      lower: [
        "tidak ditambahkan katalis",
        "tanpa katalis",
        "tidak menggunakan katalis",
        "tidak ada katalis",
      ],
    },
  };
  const aliases = directionAliases[moduleId];

  // Check the negative catalyst phrases first because they also contain the
  // positive fragment "ditambahkan katalis". In Module 2, check specific
  // phrases such as "ukuran lebih kecil" before the generic "lebih kecil".
  if (moduleId === 2 && includesAny(normalized, aliases?.higher ?? [])) return 1;
  if (includesAny(normalized, aliases?.lower ?? [])) return -1;
  if (includesAny(normalized, aliases?.higher ?? [])) return 1;
  if (includesAny(normalized, concept.lowerFactor)) return -1;
  if (includesAny(normalized, concept.higherFactor)) return 1;
  return null;
}

export function expectedHypothesisVerdict(
  moduleId: number,
  hypothesis: HypothesisDraft | undefined
): HypothesisVerdict | null {
  if (!hypothesis) return null;
  const direction = classifyDirection(moduleId, hypothesis.direction ?? "");
  const effect = classifyEffect(hypothesis.effect ?? "");
  if (direction === null || effect === null) return null;
  return direction === effect ? "terbukti" : "tidak_terbukti";
}

function progressiveHint(hints: string[], attempt: number): string {
  return hints[Math.min(Math.max(attempt - 1, 0), hints.length - 1)];
}

export function validateHypothesisTestAnswer(
  moduleId: number,
  verdict: HypothesisVerdict | undefined,
  explanation: string,
  hypothesis: HypothesisDraft | undefined,
  attempt: number,
  additions?: {
    factors?: string[];
    relationships?: string[];
    evidence?: string[];
  }
): HypothesisTestValidationResult {
  const expectedVerdict = expectedHypothesisVerdict(moduleId, hypothesis);
  const verdictValid = Boolean(
    verdict && (!expectedVerdict || verdict === expectedVerdict)
  );
  const explanationValid =
    normalizeProblemAnswer(explanation).length >= 20 &&
    hasRelevantFactor(moduleId, explanation, [
      ...(additions?.factors ?? []),
      ...(additions?.relationships ?? []),
    ]) &&
    hasExpectedRelationship(moduleId, explanation, additions?.relationships) &&
    hasEvidence(explanation, additions?.evidence);

  const expectedLabel =
    expectedVerdict === "terbukti" ? "terbukti" : "tidak terbukti";

  return {
    valid: verdictValid && explanationValid,
    verdict: {
      valid: verdictValid,
      message: verdictValid
        ? "Keputusan uji sudah sesuai dengan hipotesis dan pola data."
        : progressiveHint(
            [
              "Bandingkan arah dugaan pada hipotesismu dengan pola laju atau waktu pada data.",
              expectedVerdict
                ? `Pola data menunjukkan hipotesismu ${expectedLabel}. Pilih keputusan yang sesuai.`
                : "Pilih keputusan setelah membandingkan hipotesis dengan pola data.",
            ],
            attempt
          ),
    },
    explanation: {
      valid: explanationValid,
      message: explanationValid
        ? "Penjelasan sudah menghubungkan pola data dengan faktor yang diuji."
        : progressiveHint(
            [
              "Jelaskan arah perubahan faktor dan perubahan laju atau waktu yang terlihat pada data.",
              "Sebutkan faktor yang diuji, pola laju/waktu yang benar, dan bukti dari data, tabel, atau grafik.",
            ],
            attempt
          ),
    },
  };
}

export function validateConclusionAnswer(
  moduleId: number,
  value: string,
  attempt: number,
  additions?: {
    factors?: string[];
    relationships?: string[];
    evidence?: string[];
    reasons?: string[];
  }
): ConclusionValidationResult {
  const concept = HYPOTHESIS_CONCEPTS[moduleId];
  const relationshipValid =
    hasRelevantFactor(moduleId, value, [
      ...(additions?.factors ?? []),
      ...(additions?.relationships ?? []),
    ]) &&
    hasExpectedRelationship(moduleId, value, additions?.relationships);
  const evidenceValid = hasEvidence(value, additions?.evidence);
  const reasoningValid = Boolean(
    concept &&
      matchesAcceptedConcept(value, [
        ...concept.reasons,
        ...(CONCLUSION_REASON_TERMS[moduleId] ?? []),
        ...(additions?.reasons ?? []),
      ])
  );

  return {
    valid: relationshipValid && evidenceValid && reasoningValid,
    relationship: {
      valid: relationshipValid,
      message: relationshipValid
        ? "Hubungan faktor dan laju reaksi sudah tepat."
        : progressiveHint(
            [
              "Nyatakan pola yang benar antara faktor yang diuji dan laju atau waktu reaksi.",
              "Tuliskan apa yang terjadi pada laju reaksi ketika faktor percobaan diperbesar, diperkecil, atau diberi katalis.",
            ],
            attempt
          ),
    },
    evidence: {
      valid: evidenceValid,
      message: evidenceValid
        ? "Kesimpulan sudah merujuk pada hasil pengamatan."
        : "Sertakan bukti dari data, hasil percobaan, tabel, grafik, atau nilai yang kamu peroleh.",
    },
    reasoning: {
      valid: reasoningValid,
      message: reasoningValid
        ? "Penjelasan ilmiah sudah relevan."
        : progressiveHint(
            concept?.reasonHints ?? ["Tambahkan penjelasan ilmiah yang relevan."],
            attempt
          ),
    },
  };
}
