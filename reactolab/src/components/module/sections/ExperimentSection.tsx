"use client";

// Section 4 — Integrated Experiment Workspace (PRD §16.1, §30).
// Setup → macroscopic sim (+ inline submicroscopic magnifier) → auto data →
// graphs → symbolic → 3-level explanation. All in ONE section on ONE page,
// with strict internal micro-step order.

import { useState } from "react";
import { Beaker, Check, Lock, RotateCcw, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { Help } from "@/components/ui/forms";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import SimStage from "@/components/experiment/SimStage";
import M1ExperimentSetup from "@/components/experiment/m1/M1ExperimentSetup";
import M1SimStage from "@/components/experiment/m1/M1SimStage";
import M2ExperimentSetup from "@/components/experiment/m2/M2ExperimentSetup";
import M2SimStage from "@/components/experiment/m2/M2SimStage";
import M3ExperimentSetup from "@/components/experiment/m3/M3ExperimentSetup";
import M3SimStage from "@/components/experiment/m3/M3SimStage";
import M4ExperimentSetup from "@/components/experiment/m4/M4ExperimentSetup";
import M4SimStage from "@/components/experiment/m4/M4SimStage";
import DataPanel, { orderedRuns } from "@/components/experiment/DataPanel";
import { EnergyDiagram, MaxwellBoltzmann } from "@/components/experiment/extras";
import {
  ExplainPanel,
  SymbolicPanel,
  explainComplete,
} from "@/components/experiment/panels";
import { useEngine } from "../engine";
import type { SectionProps } from "./InquirySections";
import type { ExperimentDraft } from "@/lib/types";

function SubStep({
  n,
  title,
  state,
  children,
}: {
  n: string;
  title: string;
  state: "locked" | "open" | "done";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 sm:p-4",
        state === "open" && "border-brand-200 bg-white",
        state === "done" && "border-emerald-200 bg-white",
        state === "locked" && "border-slate-200 bg-slate-50 opacity-70"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "h-6 w-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0",
            state === "open" && "bg-brand-600 text-white",
            state === "done" && "bg-emerald-500 text-white",
            state === "locked" && "bg-slate-200 text-slate-500"
          )}
        >
          {state === "done" ? (
            <Check className="h-3.5 w-3.5" />
          ) : state === "locked" ? (
            <Lock className="h-3 w-3" />
          ) : (
            n
          )}
        </span>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      {state !== "locked" && children ? <div className="mt-3">{children}</div> : null}
      {state === "locked" && (
        <p className="mt-2 text-xs text-slate-400 pl-9">
          Selesaikan langkah sebelumnya dahulu.
        </p>
      )}
    </div>
  );
}

export default function ExperimentSection({ sec, readOnly }: SectionProps) {
  const {
    moduleId,
    def,
    drafts,
    runs,
    updateDraft,
    completeSection,
    recordRun,
    resetExperiment,
  } = useEngine();
  const { toast } = useToast();
  const cfg = def.experiment!;
  const d = (drafts[sec.id] ?? {}) as ExperimentDraft;
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const hasExperimentData =
    Object.keys(d).length > 0 || Object.keys(runs).length > 0;

  // Module 1 stores student-defined concentrations (validated against the
  // allowed range); other modules keep preset option values.
  const customRange = cfg.customRange;
  const selected = (d.selected ?? []).filter((value) => {
    if (customRange) {
      const n = parseFloat(value);
      return Number.isFinite(n) && n >= customRange.min - 1e-9 && n <= customRange.max + 1e-9;
    }
    return cfg.options.some((option) => option.value === value);
  });
  const setupLocked = Boolean(d.setupLocked);
  const requiredRunValues =
    moduleId === 4 ? cfg.options.map((option) => option.value) : selected;
  const doneRuns = orderedRuns(cfg, runs);
  const allRunsDone =
    setupLocked &&
    requiredRunValues.length >= cfg.minSelections &&
    requiredRunValues.every((v) =>
      Boolean(runs[v.replace(/[.#$/[\]]/g, "_")]),
    );
  const symbolicOk = Boolean(d.symbolicOk);
  const explain = d.explain ?? {};
  const explainOk = explainComplete(explain);

  const toggleOption = (value: string) => {
    if (readOnly || setupLocked) return;
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    updateDraft(sec.id, { selected: next });
  };

  const stepState = (open: boolean, done: boolean): "locked" | "open" | "done" =>
    done ? "done" : open ? "open" : "locked";

  const handleReset = async () => {
    setResetBusy(true);
    try {
      await resetExperiment();
      setResetOpen(false);
      toast(`Simulasi Modul ${moduleId} berhasil direset.`, "success");
    } catch {
      toast("Simulasi gagal direset. Silakan coba lagi.", "error");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 sm:px-4">
        <Beaker className="h-4.5 w-4.5 text-brand-600 shrink-0 mt-0.5" style={{ width: 18, height: 18 }} />
        <p className="text-sm text-brand-900">
          {moduleId === 1 ? (
            <strong>
              Untuk membuktikan hipotesis yang telah Anda susun, mari lakukan
              percobaan menggunakan pita magnesium (Mg) dan larutan asam klorida
              (HCl).
            </strong>
          ) : moduleId === 2 ? (
            <strong>
              Untuk membuktikan hipotesis yang telah Anda susun, mari lakukan
              percobaan reaksi antara batu kapur (CaCO₃) dalam bentuk serbuk,
              butiran, kepingan, dan bongkahan dengan larutan HCl.
            </strong>
          ) : moduleId === 3 ? (
            <strong>
              Untuk membuktikan hipotesis yang telah Anda susun, mari lakukan
              percobaan reaksi antara larutan Na₂S₂O₃ dan HCl dengan mengamati
              waktu hingga tanda X di bawah wadah tidak lagi terlihat.
            </strong>
          ) : moduleId === 4 ? (
            <strong>
              Untuk membuktikan hipotesis yang telah Anda susun, mari lakukan
              percobaan penguraian H₂O₂ dengan menggunakan beberapa jenis katalis
              untuk membandingkan pengaruhnya terhadap laju reaksi.
            </strong>
          ) : (
            <>
              <b>{cfg.title}.</b> Kerjakan langkah A–E secara berurutan. Semua
              analisis (partikel, tabel, grafik, simbolik) ada di halaman ini juga.
            </>
          )}
        </p>
      </div>

      {!readOnly && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-600">
            Mulai ulang akan menghapus pilihan, seluruh data percobaan, grafik, dan
            jawaban pada bagian eksperimen modul ini.
          </p>
          <Button
            variant="danger"
            size="sm"
            loading={resetBusy}
            disabled={!hasExperimentData}
            className="min-h-10 shrink-0"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4" /> Reset Simulasi
          </Button>
        </div>
      )}

      <Modal
        open={resetOpen}
        onClose={() => {
          if (!resetBusy) setResetOpen(false);
        }}
        title="Konfirmasi Reset Simulasi"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={resetBusy}
              onClick={() => setResetOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              loading={resetBusy}
              onClick={() => void handleReset()}
            >
              Ya, Reset Simulasi
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Reset seluruh data simulasi Modul {moduleId}?
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Pilihan kondisi, data percobaan, grafik, dan jawaban pada bagian
              eksperimen akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>
      </Modal>

      {/* A. Setup */}
      <SubStep
        n="A"
        title={
          moduleId === 1
            ? `Persiapan — tentukan minimal ${cfg.minSelections} konsentrasi HCl`
            : moduleId === 2
              ? `Persiapan — pilih minimal ${cfg.minSelections} bentuk zat padat`
            : moduleId === 3
              ? `Persiapan — tentukan minimal ${cfg.minSelections} suhu`
            : moduleId === 4
              ? "Persiapan — empat kondisi pembanding"
            : `Setup Eksperimen — pilih minimal ${cfg.minSelections} ${cfg.paramName.toLowerCase()}`
        }
        state={stepState(true, setupLocked)}
      >
        {moduleId === 1 && customRange ? (
          <M1ExperimentSetup
            range={customRange}
            minSelections={cfg.minSelections}
            selected={selected}
            locked={setupLocked}
            readOnly={readOnly}
            onChange={(values) => {
              if (readOnly || setupLocked) return;
              updateDraft(sec.id, { selected: values });
            }}
          />
        ) : moduleId === 2 ? (
          <M2ExperimentSetup
            options={cfg.options}
            selected={selected}
            locked={setupLocked}
            readOnly={readOnly}
            onToggle={toggleOption}
          />
        ) : moduleId === 3 && customRange ? (
          <M3ExperimentSetup
            range={customRange}
            minSelections={cfg.minSelections}
            selected={selected}
            locked={setupLocked}
            readOnly={readOnly}
            onChange={(values) => {
              if (readOnly || setupLocked) return;
              updateDraft(sec.id, { selected: values });
            }}
          />
        ) : moduleId === 4 ? (
          <M4ExperimentSetup
            options={cfg.options}
            locked={setupLocked}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {cfg.options.map((o) => {
              const on = selected.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={readOnly || setupLocked}
                  onClick={() => toggleOption(o.value)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
                    on
                      ? "border-brand-500 bg-brand-600 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        )}
        {!setupLocked && !readOnly && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              size="sm"
              disabled={requiredRunValues.length < cfg.minSelections}
              onClick={() =>
                updateDraft(sec.id, {
                  selected: requiredRunValues,
                  setupLocked: true,
                })
              }
              className="min-h-11 w-full sm:w-auto"
            >
              Kunci Pilihan &amp; Siapkan Alat
            </Button>
            <span className="text-xs text-slate-400">
              {moduleId === 4
                ? `${requiredRunValues.length} kondisi akan disiapkan`
                : `${requiredRunValues.length}/${cfg.minSelections} minimal dipilih`}
            </span>
          </div>
        )}
        {setupLocked && (
          <p className="text-xs text-emerald-700 font-semibold">
            ✔ Setup terkunci: {requiredRunValues.length} kondisi siap diuji.
          </p>
        )}
      </SubStep>

      {/* B. Simulation + magnifier */}
      <SubStep
        n="B"
        title={
          moduleId === 1
            ? "Simulasi 3D + Perbesar Partikel"
            : moduleId === 2
            ? "Simulasi 3D Pendesakan Air + Zoom Partikel"
            : moduleId === 3
              ? "Laboratorium 3D Tanda X + Perbesar Partikel"
            : moduleId === 4
              ? "Simulasi Dekomposisi H₂O₂ + Mekanisme Katalis Submikroskopik"
            : "Simulasi Makroskopik + Kaca Pembesar Submikroskopik"
        }
        state={stepState(setupLocked, allRunsDone)}
      >
        {moduleId === 1 ? (
          <M1SimStage
            cfg={cfg}
            selected={selected}
            runs={runs}
            readOnly={readOnly}
            onRunDone={(run) => void recordRun(run)}
            tutorialSeen={Boolean(d.m1TutorialSeen)}
            onTutorialSeen={() => updateDraft(sec.id, { m1TutorialSeen: true })}
          />
        ) : moduleId === 2 ? (
          <M2SimStage
            cfg={cfg}
            selected={selected}
            runs={runs}
            readOnly={readOnly}
            onRunDone={(run) => void recordRun(run)}
            tutorialSeen={Boolean(d.m2TutorialSeen)}
            onTutorialSeen={() => updateDraft(sec.id, { m2TutorialSeen: true })}
          />
        ) : moduleId === 3 ? (
          <M3SimStage
            cfg={cfg}
            selected={selected}
            runs={runs}
            readOnly={readOnly}
            onRunDone={(run) => void recordRun(run)}
            tutorialSeen={Boolean(d.m3TutorialSeen)}
            onTutorialSeen={() => updateDraft(sec.id, { m3TutorialSeen: true })}
          />
        ) : moduleId === 4 ? (
          <M4SimStage cfg={cfg} selected={requiredRunValues} runs={runs} readOnly={readOnly} onRunDone={(run) => void recordRun(run)} />
        ) : (
          <SimStage
            cfg={cfg}
            selected={selected}
            runs={runs}
            onRunDone={(run) => void recordRun(run)}
          />
        )}
        {!allRunsDone && (
          <Help>
            {moduleId === 1 ? (
              <>Ukur waktu untuk <b>setiap</b> konsentrasi; data tercatat otomatis.</>
            ) : moduleId === 2 ? (
              <>Jalankan reaksi untuk <b>setiap</b> bentuk; volume tercatat otomatis tiap 10 s sampai reaksi selesai.</>
            ) : moduleId === 3 ? (
              <>Ukur waktu hilangnya tanda X untuk <b>setiap</b> suhu; data tercatat otomatis.</>
            ) : (
              <>
                Jalankan simulasi untuk <b>semua</b> kondisi yang kamu pilih. Data akan
                tercatat otomatis.
              </>
            )}
          </Help>
        )}
      </SubStep>

      {/* C. Data + graphs (+ module-specific inline visuals) */}
      <SubStep
        n="C"
        title="Data Percobaan & Grafik (otomatis)"
        state={stepState(doneRuns.length > 0, allRunsDone)}
      >
        <DataPanel cfg={cfg} runs={runs} />
        {cfg.kind === "temperature" && (
          <div className="mt-4">
            <MaxwellBoltzmann cfg={cfg} runs={runs} />
          </div>
        )}
        {cfg.kind === "catalyst" && (
          <div className="mt-4">
            <EnergyDiagram />
          </div>
        )}
      </SubStep>

      {/* D. Symbolic */}
      <SubStep
        n="D"
        title="Representasi Simbolik — Persamaan Reaksi & Laju"
        state={stepState(allRunsDone, symbolicOk)}
      >
        <SymbolicPanel
          cfg={cfg}
          answer={d.symbolicAnswer ?? ""}
          ok={symbolicOk}
          readOnly={readOnly}
          onChange={(v) => updateDraft(sec.id, { symbolicAnswer: v })}
          onValidated={(ok) => updateDraft(sec.id, { symbolicOk: ok })}
        />
      </SubStep>

      {/* E. Explain 3 level */}
      <SubStep
        n="E"
        title="Jelaskan pada 3 Level Representasi"
        state={stepState(symbolicOk, explainOk)}
      >
        <ExplainPanel
          value={explain}
          readOnly={readOnly}
          onChange={(v) => updateDraft(sec.id, { explain: v })}
        />
      </SubStep>

      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
          <Button
            disabled={!(setupLocked && allRunsDone && symbolicOk && explainOk)}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await completeSection(sec.id);
              } catch {
                // handled by save indicator
              } finally {
                setBusy(false);
              }
            }}
          >
            Selesaikan Bagian Eksperimen
          </Button>
          {!(setupLocked && allRunsDone && symbolicOk && explainOk) && (
            <p className="text-xs text-slate-400">
              Lengkapi langkah A–E untuk menyelesaikan bagian ini.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
