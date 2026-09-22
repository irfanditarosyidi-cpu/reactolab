"use client";

// Generic guided-inquiry sections used by Modules 1–4 (PRD §16).

import { useState } from "react";
import { CheckCircle2, FlaskConical, Lightbulb, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { Help, Input, Label, Textarea } from "@/components/ui/forms";
import { useEngine } from "../engine";
import { reportedRateLabel, sortRuns } from "@/lib/runs";
import {
  normalizeProblemAnswer,
  validateProblemAnswer,
  type ProblemValidationResult,
} from "@/lib/problem-validation";
import {
  normalizeHypothesisAnswer,
  validateHypothesisAnswer,
  type HypothesisValidationResult,
} from "@/lib/hypothesis-validation";
import {
  validateConclusionAnswer,
  validateHypothesisTestAnswer,
  type ConclusionValidationResult,
  type HypothesisTestValidationResult,
} from "@/lib/inquiry-response-validation";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { customScaffoldTerms } from "@/lib/scaffold-config";
import type { ModuleDef, SectionDef } from "@/lib/module-defs";
import type {
  ConclusionDraft,
  ExperimentRun,
  HypoTestDraft,
  HypothesisDraft,
  ProblemDraft,
} from "@/lib/types";

export interface SectionProps {
  sec: SectionDef;
  readOnly: boolean;
}

export function hypothesisSentence(
  def: ModuleDef,
  d: HypothesisDraft | undefined
): string {
  if (!d?.direction || !d?.effect) return "(hipotesis belum lengkap)";
  return `${def.hypothesis?.subject ?? "Jika"} ${d.direction}, maka laju reaksi akan ${d.effect}, karena ${d.reason ?? "…"}`;
}

function CompleteBar({
  valid,
  onComplete,
  label = "Simpan & Lanjut",
  hint,
}: {
  valid: boolean;
  onComplete: () => Promise<void>;
  label?: string;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2">
      <Button
        disabled={!valid}
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onComplete();
          } catch {
            // save indicator shows the error state
          } finally {
            setBusy(false);
          }
        }}
      >
        {label}
      </Button>
      {!valid && hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

// ---------- Section 1: Orientasi ----------

export function OrientationSection({ sec, readOnly }: SectionProps) {
  const { def, moduleId, orientationMedia, completeSection } = useEngine();
  const o = def.orientation!;
  const embedUrl = orientationMedia
    ? getYouTubeEmbedUrl(orientationMedia.youtubeUrl)
    : null;

  return (
    <div>
      {embedUrl ? (
        <figure className="relative isolate rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-video rounded-2xl bg-slate-950">
            <iframe
              src={embedUrl}
              title={`Video orientasi Modul ${moduleId}: ${def.title}`}
              className="pointer-events-auto absolute inset-0 z-10 block h-full w-full touch-manipulation rounded-2xl border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          </div>
        </figure>
      ) : (
        <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
          <div className="flex items-start gap-3">
            <span className="h-9 w-9 rounded-xl bg-white text-brand-600 border border-brand-200 flex items-center justify-center shrink-0">
              <FlaskConical className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            </span>
            <div>
              <p className="text-sm text-slate-700 leading-relaxed">{o.story}</p>
              <p className="mt-2 text-xs font-semibold text-brand-700 italic">
                {o.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      {embedUrl && orientationMedia?.caption.trim() ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 sm:px-5">
          <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-slate-700">
            {orientationMedia.caption.trim()}
          </p>
        </div>
      ) : null}

      {!readOnly && (
        <CompleteBar
          valid
          onComplete={() => completeSection(sec.id)}
          label="Lanjutkan"
        />
      )}
    </div>
  );
}

// ---------- Section 2: Rumusan Masalah ----------

export function ProblemSection({ sec, readOnly }: SectionProps) {
  const {
    moduleId,
    drafts,
    scaffoldTerms,
    scaffoldingEnabled,
    updateDraft,
    completeSection,
  } = useEngine();
  const d = (drafts[sec.id] ?? {}) as ProblemDraft;
  const [attempts, setAttempts] = useState(0);
  const [checked, setChecked] = useState<{
    answerKey: string;
    result: ProblemValidationResult;
  } | null>(null);
  const independentValue = d.varBebas ?? "";
  const dependentValue = d.varTerikat ?? "";
  const answerKey = `${normalizeProblemAnswer(independentValue)}|${normalizeProblemAnswer(
    dependentValue
  )}`;
  const feedback =
    scaffoldingEnabled && checked?.answerKey === answerKey ? checked.result : null;
  const canAttempt =
    independentValue.trim().length >= 3 && dependentValue.trim().length >= 3;

  const continueIfValid = async () => {
    if (!scaffoldingEnabled) {
      setChecked(null);
      await completeSection(sec.id);
      return;
    }
    const nextAttempt = attempts + 1;
    const result = validateProblemAnswer(
      moduleId,
      independentValue,
      dependentValue,
      nextAttempt,
      {
        independent: customScaffoldTerms(scaffoldTerms, "problem_independent"),
        dependent: customScaffoldTerms(scaffoldTerms, "problem_dependent"),
      }
    );
    setAttempts(nextAttempt);
    setChecked({ answerKey, result });
    if (result.valid) await completeSection(sec.id);
  };

  return (
    <div>
      <p className="text-sm text-slate-600">
        Ubah rasa penasaranmu menjadi pertanyaan ilmiah. Lengkapi pola berikut:
      </p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2 text-slate-800 font-semibold">
          <span>Bagaimana pengaruh</span>
          <Input
            className="w-full sm:w-64 inline-block"
            value={independentValue}
            disabled={readOnly}
            placeholder="Variabel bebas"
            aria-label="Variabel bebas pada rumusan masalah"
            aria-invalid={Boolean(feedback && !feedback.independent.valid)}
            onChange={(e) => updateDraft(sec.id, { varBebas: e.target.value })}
          />
          <span>terhadap</span>
          <Input
            className="w-full sm:w-72 inline-block"
            value={dependentValue}
            disabled={readOnly}
            placeholder="Variabel terikat"
            aria-label="Variabel terikat pada rumusan masalah"
            aria-invalid={Boolean(feedback && !feedback.dependent.valid)}
            onChange={(e) => updateDraft(sec.id, { varTerikat: e.target.value })}
          />
          <span>?</span>
        </div>
      </div>
      <Help>
        Bagian pertama = variabel bebas (yang sengaja diubah-ubah), bagian kedua =
        variabel terikat (yang diamati/diukur).
      </Help>

      {!readOnly && (
        <>
          {feedback && (
            <div
              role="status"
              className={
                "mt-3 rounded-xl border px-3 py-3 text-sm " +
                (feedback.valid
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900")
              }
            >
              {feedback.swapped ? (
                <p className="flex items-start gap-2 font-semibold">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  {feedback.independent.message}
                </p>
              ) : (
                <div className="space-y-2">
                  {[
                    ["Variabel bebas", feedback.independent],
                    ["Variabel terikat", feedback.dependent],
                  ].map(([label, field]) => {
                    const fieldFeedback = field as ProblemValidationResult["independent"];
                    return (
                      <p key={label as string} className="flex items-start gap-2">
                        {fieldFeedback.valid ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <span>
                          <b>{label as string}:</b> {fieldFeedback.message}
                        </span>
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <CompleteBar
            valid={canAttempt}
            onComplete={continueIfValid}
            hint="Lengkapi kedua bagian rumusan masalah untuk melanjutkan."
          />
        </>
      )}
    </div>
  );
}

// ---------- Section 3: Hipotesis ----------

export function HypothesisSection({ sec, readOnly }: SectionProps) {
  const {
    moduleId,
    def,
    drafts,
    scaffoldTerms,
    scaffoldingEnabled,
    updateDraft,
    completeSection,
  } = useEngine();
  const d = (drafts[sec.id] ?? {}) as HypothesisDraft;
  const h = def.hypothesis!;
  const [attempts, setAttempts] = useState(0);
  const [checked, setChecked] = useState<{
    answerKey: string;
    result: HypothesisValidationResult;
  } | null>(null);
  const directionValue = d.direction ?? "";
  const effectValue = d.effect ?? "";
  const reasonValue = d.reason ?? "";
  const answerKey = [directionValue, effectValue, reasonValue]
    .map(normalizeHypothesisAnswer)
    .join("|");
  const feedback =
    scaffoldingEnabled && checked?.answerKey === answerKey ? checked.result : null;
  const canAttempt =
    directionValue.trim().length >= 3 &&
    effectValue.trim().length >= 3 &&
    reasonValue.trim().length >= 10;

  const continueIfValid = async () => {
    if (!scaffoldingEnabled) {
      setChecked(null);
      await completeSection(sec.id);
      return;
    }
    const nextAttempt = attempts + 1;
    const result = validateHypothesisAnswer(
      moduleId,
      directionValue,
      effectValue,
      reasonValue,
      nextAttempt,
      {
        directions: customScaffoldTerms(scaffoldTerms, "hypothesis_direction"),
        effects: customScaffoldTerms(scaffoldTerms, "hypothesis_effect"),
        reasons: customScaffoldTerms(scaffoldTerms, "hypothesis_reason"),
      }
    );
    setAttempts(nextAttempt);
    setChecked({ answerKey, result });
    if (result.valid) await completeSection(sec.id);
  };

  return (
    <div>
      <p className="text-sm text-slate-600">
        Susun dugaan ilmiah (hipotesis) yang akan kamu uji dengan eksperimen:
      </p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-slate-800 font-semibold">
          <span>{h.subject}</span>
          <Input
            className="w-full sm:w-52"
            value={directionValue}
            disabled={readOnly}
            onChange={(e) => updateDraft(sec.id, { direction: e.target.value })}
            placeholder="Tuliskan perubahannya"
            aria-label="Perubahan variabel pada hipotesis"
            aria-invalid={Boolean(feedback && !feedback.direction.valid)}
          />
          <span>, maka laju reaksi akan</span>
          <Input
            className="w-full sm:w-52"
            value={effectValue}
            disabled={readOnly}
            onChange={(e) => updateDraft(sec.id, { effect: e.target.value })}
            placeholder="Tuliskan dampaknya"
            aria-label="Dampak terhadap laju reaksi pada hipotesis"
            aria-invalid={Boolean(feedback && !feedback.effect.valid)}
          />
          <span>, karena…</span>
        </div>
        <Textarea
          value={reasonValue}
          disabled={readOnly}
          onChange={(e) => updateDraft(sec.id, { reason: e.target.value })}
          placeholder="Tuliskan alasan ilmiahmu (hubungkan dengan tumbukan antar-partikel)…"
          rows={3}
          aria-invalid={Boolean(feedback && !feedback.reason.valid)}
        />
      </div>

      {!readOnly && feedback && (
        <div
          role="status"
          className={
            "mt-3 rounded-xl border px-3 py-3 text-sm " +
            (feedback.valid
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900")
          }
        >
          <div className="space-y-2">
            {[
              ["Arah perubahan", feedback.direction],
              ["Dampak", feedback.effect],
              ["Alasan ilmiah", feedback.reason],
            ].map(([label, field]) => {
              const fieldFeedback = field as HypothesisValidationResult["direction"];
              return (
                <p key={label as string} className="flex items-start gap-2">
                  {fieldFeedback.valid ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span>
                    <b>{label as string}:</b> {fieldFeedback.message}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      {!readOnly && (
        <CompleteBar
          valid={canAttempt}
          onComplete={continueIfValid}
          hint="Isi arah perubahan, dampak, dan alasan ilmiah untuk melanjutkan."
        />
      )}
    </div>
  );
}

// ---------- Section 5: Uji Hipotesis ----------

export function HypoTestSection({ sec, readOnly }: SectionProps) {
  const {
    moduleId,
    def,
    drafts,
    runs,
    scaffoldTerms,
    scaffoldingEnabled,
    updateDraft,
    completeSection,
  } = useEngine();
  const d = (drafts[sec.id] ?? {}) as HypoTestDraft;
  const hypo = drafts["section3"] as HypothesisDraft | undefined;
  const cfg = def.experiment!;
  const customExplanationTerms = customScaffoldTerms(
    scaffoldTerms,
    "hypotest_explanation"
  );
  const [attempts, setAttempts] = useState(0);
  const [checked, setChecked] = useState<{
    answerKey: string;
    result: HypothesisTestValidationResult;
  } | null>(null);
  const explanationValue = d.explanation ?? "";
  const answerKey = `${d.verdict ?? ""}|${normalizeProblemAnswer(
    explanationValue
  )}`;
  const feedback =
    scaffoldingEnabled && checked?.answerKey === answerKey ? checked.result : null;
  const canAttempt = Boolean(d.verdict && explanationValue.trim().length >= 10);

  const continueIfValid = async () => {
    if (!scaffoldingEnabled) {
      setChecked(null);
      await completeSection(sec.id);
      return;
    }
    const nextAttempt = attempts + 1;
    const result = validateHypothesisTestAnswer(
      moduleId,
      d.verdict,
      explanationValue,
      hypo,
      nextAttempt,
      {
        factors: customScaffoldTerms(scaffoldTerms, "problem_independent"),
        relationships: customExplanationTerms,
        evidence: customExplanationTerms,
      }
    );
    setAttempts(nextAttempt);
    setChecked({ answerKey, result });
    if (result.valid) await completeSection(sec.id);
  };

  // Generic ordering so Module 1's student-defined concentrations appear too.
  const orderedRuns: ExperimentRun[] = sortRuns(cfg, runs);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Hipotesismu
          </p>
          <p className="mt-2 text-sm text-slate-700 italic leading-relaxed">
            &ldquo;{hypothesisSentence(def, hypo)}&rdquo;
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Data Eksperimenmu
          </p>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="py-1 pr-2 font-semibold">{cfg.paramName}</th>
                <th className="py-1 pr-2 font-semibold">Laju ({cfg.rateUnit})</th>
              </tr>
            </thead>
            <tbody>
              {orderedRuns.map((r) => (
                <tr key={r.paramValue} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2 font-semibold text-slate-700">{r.label}</td>
                  <td className="py-1.5 pr-2 text-slate-600">
                    {reportedRateLabel(r, cfg.rateUnit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <Label>Berdasarkan data di atas, hipotesismu…</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          {(
            [
              ["terbukti", "✅ Terbukti (didukung data)"],
              ["tidak_terbukti", "❌ Tidak terbukti (tidak didukung data)"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              disabled={readOnly}
              onClick={() => updateDraft(sec.id, { verdict: val })}
              className={
                "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-colors " +
                (d.verdict === val
                  ? "border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Jelaskan: bagaimana data mendukung/menolak hipotesismu?</Label>
        <Textarea
          value={explanationValue}
          disabled={readOnly}
          onChange={(e) => updateDraft(sec.id, { explanation: e.target.value })}
          placeholder="Bandingkan pola data (waktu/laju) dengan dugaan awalmu…"
          aria-invalid={Boolean(feedback && !feedback.explanation.valid)}
        />
      </div>

      {!readOnly && feedback && (
        <div
          role="status"
          className={
            "rounded-xl border px-3 py-3 text-sm " +
            (feedback.valid
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900")
          }
        >
          <div className="space-y-2">
            {[
              ["Keputusan uji", feedback.verdict],
              ["Penjelasan data", feedback.explanation],
            ].map(([label, field]) => {
              const fieldFeedback = field as HypothesisTestValidationResult["verdict"];
              return (
                <p key={label as string} className="flex items-start gap-2">
                  {fieldFeedback.valid ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span>
                    <b>{label as string}:</b> {fieldFeedback.message}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      {!readOnly && (
        <CompleteBar
          valid={canAttempt}
          onComplete={continueIfValid}
          hint="Pilih kesimpulan uji dan tulis penjelasannya."
        />
      )}
    </div>
  );
}

// ---------- Section 6: Kesimpulan (Module 4 also finalizes the LKPD) ----------

export function ConclusionSection({ sec, readOnly }: SectionProps) {
  const {
    def,
    moduleId,
    drafts,
    scaffoldTerms,
    scaffoldingEnabled,
    updateDraft,
    completeSection,
  } = useEngine();
  const d = (drafts[sec.id] ?? {}) as ConclusionDraft;
  const isFinalize = moduleId === 4;
  const [attempts, setAttempts] = useState(0);
  const [checked, setChecked] = useState<{
    answerKey: string;
    result: ConclusionValidationResult;
  } | null>(null);
  const conclusionValue = d.text ?? "";
  const answerKey = normalizeProblemAnswer(conclusionValue);
  const feedback =
    scaffoldingEnabled && checked?.answerKey === answerKey ? checked.result : null;
  const textOk = conclusionValue.trim().length >= 30;
  const canAttempt = textOk && (!isFinalize || Boolean(d.confirmFinal));

  const continueIfValid = async () => {
    if (!scaffoldingEnabled) {
      setChecked(null);
      await completeSection(sec.id);
      return;
    }
    const nextAttempt = attempts + 1;
    const result = validateConclusionAnswer(
      moduleId,
      conclusionValue,
      nextAttempt,
      {
        factors: customScaffoldTerms(scaffoldTerms, "problem_independent"),
        relationships: customScaffoldTerms(
          scaffoldTerms,
          "conclusion_relationship"
        ),
        evidence: customScaffoldTerms(scaffoldTerms, "conclusion_evidence"),
        reasons: [
          ...customScaffoldTerms(scaffoldTerms, "hypothesis_reason"),
          ...customScaffoldTerms(scaffoldTerms, "conclusion_reason"),
        ],
      }
    );
    setAttempts(nextAttempt);
    setChecked({ answerKey, result });
    if (result.valid) await completeSection(sec.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>
          Tuliskan kesimpulanmu tentang pengaruh {def.experiment?.paramName.toLowerCase()}{" "}
          terhadap laju reaksi, berdasarkan data eksperimen.
        </Label>
        <Textarea
          value={conclusionValue}
          disabled={readOnly}
          onChange={(e) => updateDraft(sec.id, { text: e.target.value })}
          rows={4}
          placeholder="Semakin … maka laju reaksi … . Hal ini ditunjukkan oleh data … dan dijelaskan oleh teori tumbukan karena …"
          aria-invalid={Boolean(feedback && !feedback.valid)}
        />
        <Help>
          Kesimpulan yang baik menyebut pola data DAN penjelasan partikelnya (≥ 30
          karakter).
        </Help>
      </div>

      {!readOnly && feedback && (
        <div
          role="status"
          className={
            "rounded-xl border px-3 py-3 text-sm " +
            (feedback.valid
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900")
          }
        >
          <div className="space-y-2">
            {[
              ["Pola hasil", feedback.relationship],
              ["Bukti data", feedback.evidence],
              ["Alasan ilmiah", feedback.reasoning],
            ].map(([label, field]) => {
              const fieldFeedback = field as ConclusionValidationResult["relationship"];
              return (
                <p key={label as string} className="flex items-start gap-2">
                  {fieldFeedback.valid ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span>
                    <b>{label as string}:</b> {fieldFeedback.message}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      {isFinalize && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Finalisasi LKPD Modul 1–4
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Setelah difinalisasi, seluruh jawaban Modul 1–4 dikunci (tidak dapat
            diubah), tersimpan sebagai LKPD, dan dapat diunduh sebagai PDF.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm text-amber-900 font-semibold">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-600"
              checked={Boolean(d.confirmFinal)}
              disabled={readOnly}
              onChange={(e) => updateDraft(sec.id, { confirmFinal: e.target.checked })}
            />
            Saya memahami dan setuju memfinalisasi LKPD Modul 1–4.
          </label>
        </div>
      )}

      {!readOnly && (
        <CompleteBar
          valid={canAttempt}
          onComplete={continueIfValid}
          label={isFinalize ? "Selesaikan & Finalisasi LKPD" : "Simpan & Lanjut"}
          hint={
            isFinalize
              ? "Tulis kesimpulan dan centang persetujuan finalisasi."
              : "Tulis kesimpulan minimal 30 karakter."
          }
        />
      )}
    </div>
  );
}
