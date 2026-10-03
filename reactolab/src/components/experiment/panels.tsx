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
  const [feedback, setFeedback] = useState<"" | "correct" | "wrong">("");

  const verify = () => {
    if (!scaffoldingEnabled) {
      setFeedback("");
      onValidated(true);
      return;
    }

    const good = checkSymbolic(cfg, answer, acceptedProducts);
    setFeedback(good ? "correct" : "wrong");
    if (!good) setAttempts((a) => a + 1);
    onValidated(false);
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
            }}
          />
        </div>
        {!ok && !readOnly && (
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={verify} disabled={!answer.trim()}>
              {scaffoldingEnabled ? "Periksa" : "Lanjutkan"}
            </Button>
          </div>
        )}
        {scaffoldingEnabled && feedback !== "" && !ok && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
            <p className="text-sm font-semibold">Scaffolding reflektif:</p>
            {feedback === "wrong" && (
              <p className="mt-1 text-sm">{symbolicHint(cfg, attempts)}</p>
            )}
            {feedback === "correct" && (
              <p className="mt-1 text-sm">
                Jawabanmu sudah memuat produk yang diperlukan. Tetap lakukan
                pemeriksaan mandiri sebelum melanjutkan.
              </p>
            )}
            <p className="mt-2 text-xs font-semibold">
              Apa pun hasil pemeriksaannya, perhatikan kembali hal berikut:
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-relaxed">
              <li>
                Bandingkan jumlah atom setiap unsur pada sisi reaktan dan produk;
                jumlahnya harus setara.
              </li>
              <li>
                Pastikan seluruh produk reaksi sudah ditulis dan sesuai dengan gejala
                yang diamati.
              </li>
              <li>
                Bedakan koefisien reaksi, indeks pada rumus kimia, dan simbol wujud
                zat.
              </li>
              <li>
                Hubungkan persamaan dengan laju: reaktan berkurang dan produk
                terbentuk dalam selang waktu tertentu.
              </li>
            </ul>
            <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-amber-800">
                Ini hanya peringatan scaffolding. Kamu tetap dapat melanjutkan.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFeedback("");
                  onValidated(true);
                }}
              >
                Tetap lanjutkan
              </Button>
            </div>
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
  completed,
  scaffoldingEnabled,
  onChange,
  onValidated,
}: {
  value: { makro?: string; submikro?: string; simbolik?: string };
  readOnly: boolean;
  completed: boolean;
  scaffoldingEnabled: boolean;
  onChange: (patch: Record<string, string>) => void;
  onValidated: (ok: boolean) => void;
}) {
  const [showScaffolding, setShowScaffolding] = useState(false);
  const filled = explainComplete(value);

  const verify = () => {
    if (!scaffoldingEnabled) {
      onValidated(true);
      return;
    }
    setShowScaffolding(true);
    onValidated(false);
  };

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
            readOnly={readOnly || completed}
            aria-readonly={readOnly || completed}
            className={
              readOnly || completed
                ? "cursor-not-allowed bg-slate-50 text-slate-600"
                : undefined
            }
            onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            placeholder={f.ph}
          />
        </div>
      ))}
      {!readOnly && !completed && (
        <Button size="sm" disabled={!filled} onClick={verify}>
          {scaffoldingEnabled ? "Periksa" : "Lanjutkan"}
        </Button>
      )}
      {scaffoldingEnabled && showScaffolding && !completed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
          <p className="text-sm font-semibold">Scaffolding reflektif:</p>
          <p className="mt-1 text-xs font-semibold">
            Sebelum melanjutkan, periksa kembali hubungan ketiga level berikut:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-relaxed">
            <li>
              <b>Makroskopik:</b> sebutkan gejala yang benar-benar dapat diamati atau
              diukur, seperti gelembung, kekeruhan, waktu, atau volume gas.
            </li>
            <li>
              <b>Submikroskopik:</b> jelaskan gerak dan tumbukan partikel serta
              perubahan jumlah tumbukan efektif akibat faktor yang diuji.
            </li>
            <li>
              <b>Simbolik:</b> hubungkan persamaan reaksi, rumus zat, dan nilai laju
              atau data hasil perhitungan.
            </li>
            <li>
              Pastikan ketiga penjelasan membahas peristiwa yang sama dan saling
              terhubung, bukan mengulang satu kalimat yang sama.
            </li>
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-amber-800">
              Ini hanya peringatan scaffolding. Kamu tetap dapat melanjutkan.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowScaffolding(false);
                onValidated(true);
              }}
            >
              Tetap lanjutkan
            </Button>
          </div>
        </div>
      )}
      {completed && !readOnly && (
        <Help>
          Penjelasan tiga level telah dikunci. Gunakan Reset Simulasi jika ingin
          menyusun jawaban baru.
        </Help>
      )}
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
