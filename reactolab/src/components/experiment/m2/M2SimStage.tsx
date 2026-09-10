"use client";

// Module 2 — simulation orchestrator (mobile-first, minimal UI).
//
// Per shape: choose from the dropdown → "Masukkan CaCO₃" → reaction runs on an accelerated
// clock (TIME_SCALE sim-seconds per real second) → the CO₂ volume is read from
// the inverted cylinder and sampled automatically every `sampleEvery` sim
// seconds → sampling stops when the volume stops increasing → the run (series,
// completion time, rate) is recorded automatically. "Zoom" swaps the stage to
// the particle-surface view.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  CircleHelp,
  ClipboardList,
  RotateCcw,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/forms";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { safeKey } from "@/lib/runs";
import { volumeAt } from "../sim-models";
import M2Scene3D, { type M2SimShared, type M2Stats } from "./M2Scene3D";
import M2Tutorial from "./M2Tutorial";

type Phase = "idle" | "inserting" | "reacting" | "done";
interface Hint {
  text: string;
  tone: "info" | "warn" | "ok";
}
interface Sample {
  t: number;
  v: number;
}

const TIME_SCALE = 5; // simulated seconds per real second
const INSERT_MS = 900;
const COMPLETE_DELTA_ML = 0.2; // "volume stopped increasing" threshold per interval

function fmtMl(v: number): string {
  return v.toFixed(1).replace(".", ",");
}

export default function M2SimStage({
  cfg,
  selected,
  runs,
  readOnly = false,
  onRunDone,
  tutorialSeen,
  onTutorialSeen,
}: {
  cfg: ExperimentConfig;
  selected: string[];
  runs: Record<string, ExperimentRun>;
  readOnly?: boolean;
  onRunDone: (run: ExperimentRun) => void;
  tutorialSeen: boolean;
  onTutorialSeen: () => void;
}) {
  const options = useMemo(
    () => cfg.options.filter((o) => selected.includes(o.value)),
    [cfg.options, selected]
  );
  const vmax = cfg.gas?.vmax ?? 48;
  const sampleEvery = cfg.gas?.sampleEvery ?? 10;
  const maxSimT = cfg.gas?.duration ?? 300;

  const [param, setParam] = useState(options[0]?.value ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [volumeUi, setVolumeUi] = useState(0);
  const [simTUi, setSimTUi] = useState(0);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [micro, setMicro] = useState(false);
  const [stats, setStats] = useState<M2Stats>({ collisions: 0 });
  const [hint, setHintState] = useState<Hint | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen && !readOnly);
  const [tutorialMandatory, setTutorialMandatory] = useState(!tutorialSeen && !readOnly);

  const option = options.find((o) => o.value === param) ?? options[0];
  const factor = option?.factor ?? 1;

  const sharedRef = useRef<M2SimShared>({
    shape: option?.value ?? "bongkahan",
    factor,
    volume: 0,
    vmax,
    progress: 0,
    inserted: false,
    reacting: false,
    finished: false,
    micro: false,
    resetToken: 0,
  });
  sharedRef.current.shape = option?.value ?? sharedRef.current.shape;
  sharedRef.current.factor = factor;
  sharedRef.current.vmax = vmax;

  const phaseRef = useRef<Phase>("idle");
  const insertStartRef = useRef(0);
  const reactionStartRef = useRef(0);
  const nextSampleRef = useRef(sampleEvery);
  const samplesRef = useRef<Sample[]>([]);
  const factorRef = useRef(factor);
  const optionRef = useRef(option);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  factorRef.current = factor;
  optionRef.current = option;

  const setHint = useCallback((text: string, tone: Hint["tone"] = "info") => {
    setHintState({ text, tone });
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintState(null), tone === "ok" ? 4500 : 3200);
  }, []);

  useEffect(() => {
    if (!options.some((o) => o.value === param)) setParam(options[0]?.value ?? "");
  }, [options, param]);

  const resetRun = useCallback(() => {
    phaseRef.current = "idle";
    samplesRef.current = [];
    nextSampleRef.current = sampleEvery;
    const s = sharedRef.current;
    s.volume = 0;
    s.progress = 0;
    s.inserted = false;
    s.reacting = false;
    s.finished = false;
    s.resetToken += 1;
    setPhase("idle");
    setVolumeUi(0);
    setSimTUi(0);
    setSamples([]);
    setStats({ collisions: 0 });
  }, [sampleEvery]);

  const finishRun = useCallback(
    (tDone: number) => {
      const opt = optionRef.current;
      if (!opt) return;
      const series = samplesRef.current;
      const v10 = series.find((p) => p.t === 10)?.v ?? Math.round(volumeAt(cfg, opt.factor, 10) * 10) / 10;
      const rate = v10 / 10;
      const run: ExperimentRun = {
        id: `${opt.value}-${Date.now()}`,
        paramValue: opt.value,
        label: opt.label,
        timeSec: tDone,
        series,
        rate,
        rateLabel: `${rate.toFixed(2)} ${cfg.rateUnit}`,
        at: Date.now(),
      };
      if (readOnly) setHint("Pemutaran ulang — data tersimpan tidak diubah.");
      else {
        onRunDone(run);
        setHint(`Reaksi selesai pada ${tDone} s — data tercatat.`, "ok");
      }
    },
    [cfg, onRunDone, readOnly, setHint]
  );

  // ---- simulation clock (accelerated) ----
  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    const loop = (now: number) => {
      const s = sharedRef.current;
      if (phaseRef.current === "inserting" && now - insertStartRef.current >= INSERT_MS) {
        phaseRef.current = "reacting";
        reactionStartRef.current = now;
        samplesRef.current = [{ t: 0, v: 0 }];
        nextSampleRef.current = sampleEvery;
        setSamples([{ t: 0, v: 0 }]);
        setPhase("reacting");
      }
      let simT = 0;
      if (phaseRef.current === "reacting") {
        simT = ((now - reactionStartRef.current) / 1000) * TIME_SCALE;
        let v = volumeAt(cfg, factorRef.current, simT);
        // automatic sampling every `sampleEvery` s until the volume stops rising
        while (phaseRef.current === "reacting" && simT >= nextSampleRef.current) {
          const t = nextSampleRef.current;
          const sv = Math.round(volumeAt(cfg, factorRef.current, t) * 10) / 10;
          const prev = samplesRef.current[samplesRef.current.length - 1];
          samplesRef.current = [...samplesRef.current, { t, v: sv }];
          setSamples(samplesRef.current);
          if ((prev && sv - prev.v < COMPLETE_DELTA_ML) || t >= maxSimT) {
            phaseRef.current = "done";
            v = sv;
            simT = t;
            setPhase("done");
            finishRun(t);
          } else {
            nextSampleRef.current = t + sampleEvery;
          }
        }
        s.volume = v;
        s.progress = Math.min(1, v / s.vmax);
      } else if (phaseRef.current === "done") {
        simT = samplesRef.current[samplesRef.current.length - 1]?.t ?? 0;
      }
      s.inserted = phaseRef.current !== "idle";
      s.reacting = phaseRef.current === "reacting";
      s.finished = phaseRef.current === "done";
      if (now - lastUi >= 100) {
        lastUi = now;
        setVolumeUi(s.volume);
        setSimTUi(simT);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [cfg, finishRun, maxSimT, sampleEvery]);

  // ---- actions ----
  const selectParam = (value: string) => {
    if (value === param) return;
    if (phaseRef.current === "reacting") {
      setHint("Reaksi masih berjalan — tekan Ulangi dulu.", "warn");
      return;
    }
    resetRun();
    setParam(value);
  };

  const insertSolid = () => {
    if (phaseRef.current !== "idle" || !option) return;
    phaseRef.current = "inserting";
    insertStartRef.current = performance.now();
    setPhase("inserting");
    setHint(`Volume tercatat otomatis tiap ${sampleEvery} s.`);
  };

  const toggleMicro = () => {
    const next = !micro;
    sharedRef.current.micro = next;
    setMicro(next);
  };

  const closeTutorial = (completed: boolean) => {
    setTutorialOpen(false);
    if (completed) {
      setTutorialMandatory(false);
      if (!tutorialSeen) onTutorialSeen();
    }
  };

  const completedCount = options.filter((o) => Boolean(runs[safeKey(o.value)])).length;
  const currentRun = option ? runs[safeKey(option.value)] : undefined;
  const volumePercent = Math.round(Math.min(1, volumeUi / vmax) * 100);
  const statusLabel =
    phase === "inserting"
      ? "Memasukkan CaCO₃"
      : phase === "reacting"
        ? "Reaksi berlangsung"
        : phase === "done"
          ? "Reaksi selesai"
          : currentRun
            ? "Data sudah tersimpan"
            : "Siap dimulai";

  return (
    <div className="space-y-3">
      {/* ---------------- shape selector ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="m2-shape" className="text-xs">
              Pilih bentuk CaCO₃
            </Label>
            <Select
              id="m2-shape"
              value={param}
              onChange={(event) => selectParam(event.target.value)}
              disabled={phase === "inserting" || phase === "reacting" || options.length === 0}
              aria-describedby="m2-shape-progress"
              className="min-h-11 bg-white font-bold"
            >
              {options.length === 0 && <option value="">Tidak ada kondisi terpilih</option>}
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}{runs[safeKey(o.value)] ? " — data tersimpan" : ""}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            onClick={() => {
              setTutorialMandatory(false);
              setTutorialOpen(true);
            }}
            aria-label="Lihat tutorial"
            title="Lihat tutorial"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <CircleHelp className="h-5 w-5" />
          </button>
        </div>
        <div
          id="m2-shape-progress"
          className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500"
        >
          <span>Ganti bentuk sebelum memulai reaksi berikutnya.</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-emerald-700">
            <Check className="h-3.5 w-3.5" /> {completedCount}/{options.length} selesai
          </span>
        </div>
      </div>

      {/* ---------------- clean 3D stage ---------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[88vw] max-h-[460px] min-h-[320px] sm:h-[380px] lg:h-[440px]">
          <M2Scene3D shared={sharedRef} micro={micro} onStats={setStats} className="absolute inset-0" />
        </div>
      </div>

      {/* ---------------- simulation information ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kondisi</p>
            <p className="mt-0.5 truncate text-sm font-black text-slate-800">{option?.label ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {micro ? "Tumbukan" : "Volume CO₂"}
            </p>
            <p className={cn("mt-0.5 text-sm font-black tabular-nums", micro ? "text-amber-700" : "text-brand-700")}>
              {micro ? (
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> {stats.collisions}
                </span>
              ) : (
                `${fmtMl(volumeUi)} mL`
              )}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Waktu simulasi</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-slate-800">
              {Math.floor(simTUi)} s <span className="text-[10px] text-slate-400">({TIME_SCALE}×)</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
            <p
              className={cn(
                "mt-0.5 text-sm font-black",
                phase === "done" || (phase === "idle" && currentRun)
                  ? "text-emerald-700"
                  : phase === "reacting"
                    ? "text-brand-700"
                    : phase === "inserting"
                      ? "text-amber-700"
                      : "text-slate-700"
              )}
            >
              {statusLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>Pengisian gas</span>
              <span>{volumePercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full transition-[width]", phase === "done" ? "bg-emerald-500" : "bg-brand-500")}
                style={{ width: `${volumePercent}%` }}
              />
            </div>
          </div>
          <Button
            type="button"
            variant={micro ? "secondary" : "primary"}
            onClick={toggleMicro}
            aria-pressed={micro}
            className="min-h-11 shrink-0 px-3"
          >
            {micro ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            {micro ? "Kembali" : "Zoom"}
          </Button>
        </div>
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          variant={phase === "idle" ? "primary" : "secondary"}
          disabled={phase !== "idle" || !option}
          onClick={insertSolid}
          className="min-h-12 whitespace-nowrap px-3 sm:min-w-[190px]"
        >
          <ArrowDownToLine className="h-4 w-4 shrink-0" /> Masukkan CaCO₃
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            resetRun();
            setHintState(null);
          }}
          disabled={phase === "idle" && !currentRun}
          className="min-h-12 whitespace-nowrap px-3"
        >
          <RotateCcw className="h-4 w-4 shrink-0" /> Ulangi
        </Button>
      </div>

      {/* ---------------- auto-recorded samples ---------------- */}
      {samples.length > 0 && (
        <div className="thin-scroll -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Data tercatat otomatis">
          <ClipboardList className="h-4 w-4 shrink-0 text-brand-600" />
          {samples.map((p) => (
            <span
              key={p.t}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-700"
            >
              {p.t} s · {fmtMl(p.v)} mL
            </span>
          ))}
        </div>
      )}

      {/* ---------------- one-line hint ---------------- */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "min-h-5 text-center text-xs font-semibold transition-opacity",
          !hint && "opacity-0",
          hint?.tone === "warn" && "text-amber-700",
          hint?.tone === "ok" && "text-emerald-700",
          hint?.tone === "info" && "text-slate-500"
        )}
      >
        {hint?.text ?? " "}
      </p>

      <M2Tutorial open={tutorialOpen} mandatory={tutorialMandatory} onClose={closeTutorial} />
    </div>
  );
}
