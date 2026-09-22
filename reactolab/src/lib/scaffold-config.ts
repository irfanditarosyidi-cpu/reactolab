import {
  HYPOTHESIS_CONCEPTS,
  HYPOTHESIS_EFFECTS,
} from "./hypothesis-validation";
import {
  CONCLUSION_REASON_TERMS,
  INQUIRY_EVIDENCE_TERMS,
  INQUIRY_RELATIONSHIP_TERMS,
} from "./inquiry-response-validation";
import { getModuleDef } from "./module-defs";
import {
  matchesAcceptedConcept,
  normalizeProblemAnswer,
  PROBLEM_CONCEPTS,
} from "./problem-validation";

export type ScaffoldFieldKey =
  | "problem_independent"
  | "problem_dependent"
  | "hypothesis_direction"
  | "hypothesis_effect"
  | "hypothesis_reason"
  | "symbolic_product"
  | "hypotest_explanation"
  | "conclusion_relationship"
  | "conclusion_evidence"
  | "conclusion_reason";

export interface ScaffoldFieldDefinition {
  key: ScaffoldFieldKey;
  section: string;
  label: string;
  description: string;
}

export const SCAFFOLD_FIELDS: ScaffoldFieldDefinition[] = [
  {
    key: "problem_independent",
    section: "Rumusan Masalah",
    label: "Variabel bebas",
    description: "Kata atau frasa untuk faktor yang sengaja diubah.",
  },
  {
    key: "problem_dependent",
    section: "Rumusan Masalah",
    label: "Variabel terikat",
    description: "Kata atau frasa untuk hasil yang diamati atau diukur.",
  },
  {
    key: "hypothesis_direction",
    section: "Hipotesis",
    label: "Arah perubahan",
    description: "Kata atau frasa yang menunjukkan perubahan variabel.",
  },
  {
    key: "hypothesis_effect",
    section: "Hipotesis",
    label: "Dampak terhadap laju",
    description: "Kata atau frasa untuk perubahan laju reaksi.",
  },
  {
    key: "hypothesis_reason",
    section: "Hipotesis",
    label: "Alasan ilmiah",
    description: "Konsep ilmiah yang dapat muncul pada alasan siswa.",
  },
  {
    key: "symbolic_product",
    section: "Representasi Simbolik",
    label: "Produk reaksi",
    description: "Rumus atau nama produk reaksi yang dapat diterima.",
  },
  {
    key: "hypotest_explanation",
    section: "Uji Hipotesis",
    label: "Penjelasan data",
    description:
      "Frasa alternatif untuk hubungan faktor–laju dan rujukan terhadap bukti eksperimen.",
  },
  {
    key: "conclusion_relationship",
    section: "Kesimpulan",
    label: "Pola hubungan hasil",
    description:
      "Frasa alternatif untuk hubungan faktor yang diuji dengan laju atau waktu reaksi.",
  },
  {
    key: "conclusion_evidence",
    section: "Kesimpulan",
    label: "Rujukan bukti data",
    description:
      "Kata atau frasa yang menandakan penggunaan data, grafik, tabel, atau hasil pengamatan.",
  },
  {
    key: "conclusion_reason",
    section: "Kesimpulan",
    label: "Alasan ilmiah",
    description:
      "Konsep ilmiah alternatif yang dapat diterima pada penjelasan akhir siswa.",
  },
];

export const SCAFFOLD_FIELD_KEYS = new Set<ScaffoldFieldKey>(
  SCAFFOLD_FIELDS.map((field) => field.key)
);

export interface ScaffoldTerm {
  text: string;
  normalized: string;
  createdAt: number;
  createdBy: string;
}

export type ScaffoldTermMap = Record<string, ScaffoldTerm>;
export type ScaffoldModuleConfig = Partial<
  Record<ScaffoldFieldKey, ScaffoldTermMap>
>;
export type ScaffoldConfigMap = Record<string, ScaffoldModuleConfig>;

export function normalizeScaffoldTerm(value: string): string {
  return normalizeProblemAnswer(value);
}

export function customScaffoldTerms(
  config: ScaffoldModuleConfig | null | undefined,
  field: ScaffoldFieldKey
): string[] {
  return Object.values(config?.[field] ?? {})
    .map((entry) => entry.text?.trim())
    .filter((text): text is string => Boolean(text));
}

export function getDefaultScaffoldTerms(
  moduleId: number,
  field: ScaffoldFieldKey
): string[] {
  const problem = PROBLEM_CONCEPTS[moduleId];
  const hypothesis = HYPOTHESIS_CONCEPTS[moduleId];
  switch (field) {
    case "problem_independent":
      return problem?.independent ?? [];
    case "problem_dependent":
      return problem?.dependent ?? [];
    case "hypothesis_direction":
      return hypothesis?.directions ?? [];
    case "hypothesis_effect":
      return HYPOTHESIS_EFFECTS;
    case "hypothesis_reason":
      return hypothesis?.reasons ?? [];
    case "symbolic_product":
      return getModuleDef(moduleId)?.experiment?.symbolicTokens ?? [];
    case "hypotest_explanation":
      return Array.from(
        new Set([
          ...(INQUIRY_RELATIONSHIP_TERMS[moduleId] ?? []),
          ...INQUIRY_EVIDENCE_TERMS,
        ])
      );
    case "conclusion_relationship":
      return INQUIRY_RELATIONSHIP_TERMS[moduleId] ?? [];
    case "conclusion_evidence":
      return INQUIRY_EVIDENCE_TERMS;
    case "conclusion_reason":
      return Array.from(
        new Set([
          ...(hypothesis?.reasons ?? []),
          ...(CONCLUSION_REASON_TERMS[moduleId] ?? []),
        ])
      );
  }
}

export function matchesSymbolicTerms(answer: string, terms: string[]): boolean {
  const actual = normalizeScaffoldTerm(answer).split(" ").filter(Boolean);
  return terms.some((term) => {
    const expected = normalizeScaffoldTerm(term).split(" ").filter(Boolean);
    return (
      expected.length > 0 &&
      expected.every((fragment) => actual.includes(fragment))
    );
  });
}

export function previewScaffoldAnswer(
  field: ScaffoldFieldKey,
  answer: string,
  terms: string[]
): boolean {
  if (field === "symbolic_product") {
    return matchesSymbolicTerms(answer, terms);
  }
  const normalized = normalizeScaffoldTerm(answer);
  if (normalized.replace(/[^a-z]/g, "").length < 3) return false;
  if (
    (field === "hypothesis_reason" || field === "conclusion_reason") &&
    normalized.length < 15
  ) {
    return false;
  }
  return matchesAcceptedConcept(answer, terms);
}
