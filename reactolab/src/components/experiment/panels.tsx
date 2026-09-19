"use client";

// Symbolic representation + three-level explanation panels (PRD §30-F/G).

import Button from "@/components/ui/Button";
import { Help, Input, Label, Textarea } from "@/components/ui/forms";
import type { ExperimentConfig } from "@/lib/module-defs";
import { matchesSymbolicTerms } from "@/lib/scaffold-config";
import { useState } from "react";

const DIGIT_SUBSCRIPTS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

/** Keep stoichiometric coefficients normal while formatting formula indices. */
export function formatChemicalSubscripts(value: string): string {
  return value.replace(/\d+/g, (digits, offset, source: string) => {
    const previous = source[offset - 1] ?? "";
    const isFormulaIndex = /[A-Za-z)\]₀-₉]/.test(previous);
    if (!isFormulaIndex) return digits;
    return digits
      .split("")
      .map((digit) => DIGIT_SUBSCRIPTS[digit] ?? digit)
      .join("");
  });
}

export function checkSymbolic(
  cfg: ExperimentConfig,
  answer: string,
  acceptedProducts: string[] = []
): boolean {
  return matchesSymbolicTerms(answer, [
    ...cfg.symbolicTokens,
    ...acceptedProducts,
  ]);
}

const SYMBOLIC_HINTS: Record<ExperimentConfig["kind"], string[]> = {
  concentration: [
    "Cermati kembali jenis atom pada sisi pereaksi. Atom-atom tersebut tetap harus ditemukan pada zat hasil reaksi.",
    "Hubungkan gelembung yang terlihat dan larutan baru yang terbentuk dengan kemungkinan jenis produknya.",
  ],
  surface: [
    "Cermati kembali jenis atom pada zat pereaksi dan pastikan tidak ada atom yang hilang pada zat hasil.",
    "Hubungkan gas yang tertampung serta perubahan larutan dengan ciri umum reaksi asam dan karbonat.",
  ],
  temperature: [
    "Gunakan gejala percobaan sebagai petunjuk untuk menentukan jenis zat hasil reaksi.",
    "Hubungkan kekeruhan dan gas yang terbentuk dengan wujud produk yang mungkin dihasilkan.",
  ],
  catalyst: [
    "Perhatikan bahwa penguraian memecah satu senyawa menjadi zat-zat yang lebih sederhana.",
    "Gunakan gelembung gas pada percobaan dan atom penyusun pereaksi sebagai petunjuk.",
  ],
};

function symbolicHint(cfg: ExperimentConfig, attempts: number): string {
  const hints = SYMBOLIC_HINTS[cfg.kind];
  return hints[Math.min(Math.max(attempts - 1, 0), hints.length - 1)];
}

export function SymbolicPanel({
  cfg,
  answer,
  ok,
  readOnly,
  scaffoldingEnabled,
  acceptedProducts = [],
  onChange,
  onValidated,
}: {
  cfg: ExperimentConfig;
  answer: string;
  ok: boolean;
  readOnly: boolean;
  scaffoldingEnabled: boolean;
  acceptedProducts?: string[];
  onChange: (v: string) => void;
  onValidated: (ok: boolean) => void;
}) {
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"" | "wrong">("");

  const verify = () => {
    const good =
      !scaffoldingEnabled || checkSymbolic(cfg, answer, acceptedProducts);
    setFeedback(good ? "" : "wrong");
    if (!good) setAttempts((a) => a + 1);
    onValidated(good);
  };

  return (
    <div>
      <p className="text-sm text-slate-600">{cfg.symbolicPrompt}</p>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm sm:text-base font-bold text-slate-800">
          <span>{cfg.reactionLeft}</span>
          <Input
            className="w-full sm:w-80 font-mono"
            value={formatChemicalSubscripts(answer)}
            disabled={readOnly || ok}
            onChange={(e) => {
              onChange(formatChemicalSubscripts(e.target.value));
              setFeedback("");
            }}
          />
        </div>
        {!ok && !readOnly && (
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={verify} disabled={answer.trim().length < 2}>
              {scaffoldingEnabled ? "Periksa" : "Lanjutkan"}
            </Button>
          </div>
        )}
        {scaffoldingEnabled && feedback === "wrong" && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-sm font-semibold text-amber-900">Petunjuk:</p>
            <p className="mt-0.5 text-sm text-amber-800">
              {symbolicHint(cfg, attempts)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const EXPLAIN_FIELDS = [
  {
    key: "makro",
    label: "Level Makroskopik (yang terlihat mata)",
    ph: "Apa yang teramati pada percobaan? (gelembung, kekeruhan, waktu, volume gas…)",
  },
  {
    key: "submikro",
    label: "Level Submikroskopik (dunia partikel)",
    ph: "Apa yang terjadi pada partikel-partikel? (jumlah, gerak, tumbukan efektif…)",
  },
  {
    key: "simbolik",
    label: "Level Simbolik (persamaan & perhitungan)",
    ph: "Hubungkan dengan persamaan reaksi dan nilai laju yang kamu hitung…",
  },
] as const;

export function ExplainPanel({
  value,
  readOnly,
  onChange,
}: {
  value: { makro?: string; submikro?: string; simbolik?: string };
  readOnly: boolean;
  onChange: (patch: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Jelaskan hasil eksperimenmu pada <b>tiga level representasi kimia</b>:
      </p>
      {EXPLAIN_FIELDS.map((f) => (
        <div key={f.key}>
          <Label>{f.label}</Label>
          <Textarea
            rows={2}
            value={value[f.key] ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            placeholder={f.ph}
          />
        </div>
      ))}
    </div>
  );
}

export function explainComplete(v: {
  makro?: string;
  submikro?: string;
  simbolik?: string;
}): boolean {
  return (
    (v.makro ?? "").trim().length >= 10 &&
    (v.submikro ?? "").trim().length >= 10 &&
    (v.simbolik ?? "").trim().length >= 10
  );
}
