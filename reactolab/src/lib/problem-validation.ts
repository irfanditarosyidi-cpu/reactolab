export interface ProblemConcept {
  independent: string[];
  dependent: string[];
  independentHints: string[];
  dependentHints: string[];
}

export interface ProblemFieldFeedback {
  valid: boolean;
  message: string;
}

export interface ProblemValidationResult {
  valid: boolean;
  swapped: boolean;
  independent: ProblemFieldFeedback;
  dependent: ProblemFieldFeedback;
}

export const PROBLEM_CONCEPTS: Record<number, ProblemConcept> = {
  1: {
    independent: ["konsentrasi", "kepekatan", "larutan pekat", "larutan encer"],
    dependent: [
      "laju reaksi",
      "kecepatan reaksi",
      "kelajuan reaksi",
      "cepat lambat reaksi",
      "cepatnya reaksi",
      "waktu reaksi",
      "lama reaksi",
      "waktu magnesium habis",
      "waktu mg habis",
    ],
    independentHints: [
      "Tuliskan faktor yang sengaja diubah pada percobaan.",
      "Perhatikan kepekatan larutan HCl yang digunakan.",
    ],
    dependentHints: [
      "Tuliskan hasil yang diamati atau diukur akibat perubahan tersebut.",
      "Hubungkan jawabanmu dengan cepat-lambatnya reaksi Mg dan HCl.",
    ],
  },
  2: {
    independent: [
      "luas permukaan",
      "bentuk caco3",
      "bentuk zat",
      "ukuran caco3",
      "ukuran partikel",
      "ukuran padatan",
    ],
    dependent: [
      "laju reaksi",
      "kecepatan reaksi",
      "kelajuan reaksi",
      "cepat lambat reaksi",
      "cepatnya reaksi",
      "waktu reaksi",
      "lama reaksi",
      "waktu caco3 habis",
      "volume gas co2",
      "volume co2",
      "pembentukan co2",
      "karbon dioksida",
    ],
    independentHints: [
      "Tuliskan faktor pada CaCO₃ yang sengaja dibedakan.",
      "Perhatikan perbedaan bongkahan, kepingan, butiran, dan serbuk.",
    ],
    dependentHints: [
      "Tuliskan hasil reaksi yang diamati atau dibandingkan.",
      "Hubungkan jawabanmu dengan laju reaksi atau pembentukan gas CO₂.",
    ],
  },
  3: {
    independent: ["suhu", "temperatur"],
    dependent: [
      "laju reaksi",
      "kecepatan reaksi",
      "kelajuan reaksi",
      "cepat lambat reaksi",
      "cepatnya reaksi",
      "waktu reaksi",
      "lama reaksi",
      "waktu tanda x hilang",
      "waktu tanda x menghilang",
      "waktu hilangnya tanda x",
      "tanda x tidak terlihat",
    ],
    independentHints: [
      "Tuliskan faktor yang sengaja diubah pada campuran reaksi.",
      "Perhatikan perbedaan kondisi panas dan dingin.",
    ],
    dependentHints: [
      "Tuliskan hasil yang diamati atau diukur akibat perubahan tersebut.",
      "Perhatikan waktu yang dibutuhkan hingga tanda X tidak terlihat.",
    ],
  },
  4: {
    independent: [
      "katalis",
      "jenis katalis",
      "macam katalis",
      "penambahan katalis",
      "penggunaan katalis",
      "ada katalis",
    ],
    dependent: [
      "laju reaksi",
      "kecepatan reaksi",
      "kelajuan reaksi",
      "cepat lambat reaksi",
      "cepatnya reaksi",
      "waktu reaksi",
      "lama reaksi",
      "waktu penguraian",
      "penguraian h2o2",
      "volume gas o2",
      "volume o2",
      "pembentukan o2",
      "gas oksigen",
    ],
    independentHints: [
      "Tuliskan faktor pembantu reaksi yang sengaja dibedakan.",
      "Perhatikan kondisi tanpa katalis dan dengan beberapa jenis katalis.",
    ],
    dependentHints: [
      "Tuliskan hasil reaksi yang diamati atau dibandingkan.",
      "Hubungkan jawabanmu dengan laju reaksi atau pembentukan gas O₂.",
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

export function normalizeProblemAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (digit) =>
      String("₀₁₂₃₄₅₆₇₈₉".indexOf(digit))
    )
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export function matchesAcceptedConcept(value: string, aliases: string[]): boolean {
  const words = normalizeProblemAnswer(value).split(" ").filter(Boolean);
  return aliases.some((alias) =>
    normalizeProblemAnswer(alias)
      .split(" ")
      .filter(Boolean)
      .every((expected) => words.some((actual) => tokenMatches(actual, expected)))
  );
}

function isObviouslyMeaningless(value: string): boolean {
  const normalized = normalizeProblemAnswer(value);
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

export function validateProblemAnswer(
  moduleId: number,
  independentValue: string,
  dependentValue: string,
  attempt: number,
  additions?: {
    independent?: string[];
    dependent?: string[];
  }
): ProblemValidationResult {
  const concept = PROBLEM_CONCEPTS[moduleId];
  if (!concept) {
    return {
      valid: false,
      swapped: false,
      independent: { valid: false, message: "Modul tidak dikenali." },
      dependent: { valid: false, message: "Modul tidak dikenali." },
    };
  }

  const independentValid =
    !isObviouslyMeaningless(independentValue) &&
    matchesAcceptedConcept(independentValue, [
      ...concept.independent,
      ...(additions?.independent ?? []),
    ]);
  const dependentValid =
    !isObviouslyMeaningless(dependentValue) &&
    matchesAcceptedConcept(dependentValue, [
      ...concept.dependent,
      ...(additions?.dependent ?? []),
    ]);
  const swapped =
    !independentValid &&
    !dependentValid &&
    matchesAcceptedConcept(independentValue, [
      ...concept.dependent,
      ...(additions?.dependent ?? []),
    ]) &&
    matchesAcceptedConcept(dependentValue, [
      ...concept.independent,
      ...(additions?.independent ?? []),
    ]);

  if (swapped) {
    const message =
      "Kedua jawaban tampaknya tertukar. Letakkan faktor yang diubah di bagian pertama dan hasil yang diamati di bagian kedua.";
    return {
      valid: false,
      swapped: true,
      independent: { valid: false, message },
      dependent: { valid: false, message },
    };
  }

  return {
    valid: independentValid && dependentValid,
    swapped: false,
    independent: {
      valid: independentValid,
      message: independentValid
        ? "Variabel bebas sudah tepat."
        : hintAt(concept.independentHints, attempt),
    },
    dependent: {
      valid: dependentValid,
      message: dependentValid
        ? "Variabel terikat sudah tepat."
        : hintAt(concept.dependentHints, attempt),
    },
  };
}
