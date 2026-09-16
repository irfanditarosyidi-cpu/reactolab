"use client";

// Symbolic representation + three-level explanation panels (PRD §30-F/G).

import Button from "@/components/ui/Button";
import { Help, Input, Label, Textarea } from "@/components/ui/forms";
import type { ExperimentConfig } from "@/lib/module-defs";
import { useState } from "react";

const SUBSCRIPTS: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};

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

function normalizeFragments(answer: string): string[] {
  let s = answer.toLowerCase();
  for (const [sub, digit] of Object.entries(SUBSCRIPTS)) {
    s = s.split(sub).join(digit);
  }
  return s.split(/[^a-z0-9]+/).filter(Boolean);
}

export function checkSymbolic(cfg: ExperimentConfig, answer: string): boolean {
  const frags = normalizeFragments(answer);
  return cfg.symbolicTokens.every((tok) => frags.includes(tok));
}

export function SymbolicPanel({
  cfg,
  answer,
  ok,
  readOnly,
  onChange,
  onValidated,
}: {
  cfg: ExperimentConfig;
  answer: string;
  ok: boolean;
  readOnly: boolean;
  onChange: (v: string) => void;
  onValidated: (ok: boolean) => void;
}) {
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"" | "wrong" | "right">(ok ? "right" : "");

  const verify = () => {
    const good = checkSymbolic(cfg, answer);
    setFeedback(good ? "right" : "wrong");
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
              Periksa
            </Button>
            {attempts >= 2 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onChange(cfg.symbolicSolution);
                  onValidated(true);
                  setFeedback("right");
                }}
              >
                Lihat &amp; Gunakan Jawaban
              </Button>
            )}
          </div>
        )}
        {feedback === "wrong" && (
          <p className="mt-2 text-sm text-red-600">
            Belum tepat — periksa kembali rumus kimia hasil reaksi. ({attempts}×
            percobaan)
          </p>
        )}
        {(ok || feedback === "right") && (
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
            <p className="text-sm font-bold text-emerald-800 font-mono">
              ✔ {cfg.reaction}
            </p>
          </div>
        )}
      </div>
      <Help>
        Perhitungan laju ({cfg.rateLabel}) pada tabel data dihitung otomatis dari hasil
        percobaanmu.
      </Help>
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
