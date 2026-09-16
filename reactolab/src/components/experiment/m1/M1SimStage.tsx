"use client";

// Module 1 — simulation orchestrator (mobile-first, minimal UI).
//
// Flow per concentration: pick chip → "Masukkan Mg" → reaction runs in real
// time (T = 18 / C seconds) → student presses ▶ when bubbles appear → presses ■
// when the ribbon is gone → measured time is recorded automatically as a run.
// "Perbesar" swaps the same stage to the submicroscopic particle view.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Circle,
  CircleHelp,
  Pipette,
  Play,
  RotateCcw,
  Square,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { concentrationLabel, safeKey } from "@/lib/runs";
import { runDuration } from "../sim-models";
import M1Scene3D, { type CollisionStats, type M1SimShared } from "./M1Scene3D";
import M1Tutorial from "./M1Tutorial";

type Phase = "idle" | "inserting" | "reacting" | "done";
type SwState = "off" | "running" | "stopped";
interface Hint {
  text: string;
  tone: "info" | "warn" | "ok";
}

const INSERT_MS = 700;
const LATE_FRACTION = 0.25;

function fmtSeconds(sec: number): string {
  return sec.toFixed(1).replace(".", ",");
}

export default function M1SimStage({
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
  const ordered = useMemo(
    () => [...selected].sort((a, b) => parseFloat(a) - parseFloat(b)),
    [selected]
  );
  const maxConc = cfg.customRange?.max ?? 3;

  const [param, setParam] = useState(ordered[0] ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [sw, setSw] = useState<SwState>("off");
  const [elapsedUi, setElapsedUi] = useState(0);
  const [progressUi, setProgressUi] = useState(0);
  const [micro, setMicro] = useState(false);
  const [stats, setStats] = useState<CollisionStats>({ effective: 0, ineffective: 0 });
  const [hint, setHintState] = useState<Hint | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen && !readOnly);
  const [tutorialMandatory, setTutorialMandatory] = useState(!tutorialSeen && !readOnly);

  const conc = parseFloat(param) || 1;
  const duration = runDuration(cfg, conc);

  const sharedRef = useRef<M1SimShared>({
    concentration: conc,
    maxConcentration: maxConc,
    progress: 0,
    inserted: false,
    reacting: false,
    finished: false,
    micro: false,
    resetToken: 0,
  });
  const phaseRef = useRef<Phase>("idle");
  const swRef = useRef<SwState>("off");
  const durationRef = useRef(duration);
  const insertStartRef = useRef(0);
  const reactionStartRef = useRef(0);
  const swStartRef = useRef(0);
  const swElapsedRef = useRef(0);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  durationRef.current = duration;
  sharedRef.current.concentration = conc;

  const setHint = useCallback((text: string, tone: Hint["tone"] = "info") => {
    setHintState({ text, tone });
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintState(null), tone === "ok" ? 4500 : 3200);
  }, []);

  // keep the active chip valid when the setup list changes
  useEffect(() => {
    if (!ordered.includes(param)) setParam(ordered[0] ?? "");
  }, [ordered, param]);

  const resetRun = useCallback(() => {
    phaseRef.current = "idle";
    swRef.current = "off";
    swElapsedRef.current = 0;
    const s = sharedRef.current;
    s.progress = 0;
    s.inserted = false;
    s.reacting = false;
    s.finished = false;
    s.resetToken += 1;
    setPhase("idle");
    setSw("off");
    setElapsedUi(0);
    setProgressUi(0);
    setStats({ effective: 0, ineffective: 0 });
  }, []);

  // ---- simulation clock (real time; 1 s = 1 s) ----
  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    const loop = (now: number) => {
      const s = sharedRef.current;
      if (phaseRef.current === "inserting" && now - insertStartRef.current >= INSERT_MS) {
        phaseRef.current = "reacting";
        reactionStartRef.current = now;
        setPhase("reacting");
      }
      if (phaseRef.current === "reacting") {
        const p = Math.min(1, (now - reactionStartRef.current) / (durationRef.current * 1000));
        s.progress = p;
        if (p >= 1) {
          phaseRef.current = "done";
          setPhase("done");
          if (swRef.current !== "running") {
            setHint("Pita Mg habis, stopwatch belum dijalankan — tekan Ulangi.", "warn");
          }
        }
      }
      s.inserted = phaseRef.current !== "idle";
      s.reacting = phaseRef.current === "reacting";
      s.finished = phaseRef.current === "done";
      if (swRef.current === "running") {
        swElapsedRef.current = (now - swStartRef.current) / 1000;
      }
      if (now - lastUi >= 100) {
        lastUi = now;
        setElapsedUi(swElapsedRef.current);
        setProgressUi(s.progress);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [setHint]);

  // ---- actions ----
  const selectParam = (value: string) => {
    if (value === param) return;
    if (swRef.current === "running") {
      setHint("Hentikan stopwatch dulu.", "warn");
      return;
    }
    resetRun();
    setParam(value);
  };

  const insertMg = () => {
    if (phaseRef.current !== "idle" || !param) return;
    phaseRef.current = "inserting";
    insertStartRef.current = performance.now();
    setPhase("inserting");
    setHint("Tekan ▶ saat gelembung muncul.");
  };

  const pressStopwatch = () => {
    const now = performance.now();
    if (swRef.current === "off") {
      if (phaseRef.current === "idle" || phaseRef.current === "inserting") {
        setHint("Masukkan pita Mg dulu.", "warn");
        return;
      }
      if (phaseRef.current === "done") {
        setHint("Mg sudah habis — tekan Ulangi.", "warn");
        return;
      }
      swRef.current = "running";
      swStartRef.current = now;
      setSw("running");
      const lateSec = (now - reactionStartRef.current) / 1000;
      if (lateSec > LATE_FRACTION * durationRef.current) {
        setHint("Stopwatch mulai terlambat; Ulangi untuk data lebih akurat.", "warn");
      } else {
        setHintState(null);
      }
      return;
    }
    if (swRef.current === "running") {
      if (phaseRef.current !== "done") {
        setHint("Pita Mg belum habis.", "warn");
        return;
      }
      swRef.current = "stopped";
      const elapsed = (now - swStartRef.current) / 1000;
      swElapsedRef.current = elapsed;
      setSw("stopped");
      setElapsedUi(elapsed);
      const timeSec = Math.max(0.1, Math.round(elapsed * 10) / 10);
      const rate = 1 / timeSec;
      const run: ExperimentRun = {
        id: `${param}-${Date.now()}`,
        paramValue: param,
        label: concentrationLabel(conc, cfg.paramUnit),
        timeSec,
        rate,
        rateLabel: `${rate.toFixed(4)} ${cfg.rateUnit}`,
        at: Date.now(),
      };
      if (readOnly) {
        setHint("Pemutaran ulang — data tersimpan tidak diubah.");
      } else {
        onRunDone(run);
        setHint(`Tercatat: ${fmtSeconds(timeSec)} s`, "ok");
      }
      return;
    }
    setHint("Tekan Ulangi untuk mengukur lagi.");
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

  const completedCount = ordered.filter((v) => Boolean(runs[safeKey(v)])).length;
  const currentRun = param ? runs[safeKey(param)] : undefined;

  return (
    <div className="space-y-3">
      {/* ---------------- 3D stage ---------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[88vw] max-h-[460px] min-h-[320px] sm:h-[380px] lg:h-[440px]">
          <M1Scene3D
            shared={sharedRef}
            micro={micro}
            onStats={setStats}
            className="absolute inset-0"
          />

          {/* concentration + fixed volume (top-left) */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
            <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-sm font-black tabular-nums text-slate-900 shadow-sm backdrop-blur">
              {param ? concentrationLabel(conc, cfg.paramUnit) : "—"}
            </span>
            <span className="rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              20 mL
            </span>
          </div>

          {/* tutorial replay (top-right) */}
          <button
            type="button"
            onClick={() => {
              setTutorialMandatory(false);
              setTutorialOpen(true);
            }}
            aria-label="Lihat tutorial"
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-brand-700 shadow-sm backdrop-blur hover:bg-white sm:right-3 sm:top-3 sm:h-11 sm:w-11"
          >
            <CircleHelp className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* collision stats (micro only, bottom-left) */}
          {micro && (
            <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 sm:flex-row">
              <span
                title="Tumbukan efektif"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black tabular-nums text-amber-950 shadow"
              >
                <Zap className="h-3.5 w-3.5" /> {stats.effective}
                <span className="font-semibold opacity-80">efektif</span>
              </span>
              <span
                title="Tumbukan tidak efektif"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black tabular-nums text-slate-700 shadow backdrop-blur"
              >
                <Circle className="h-3.5 w-3.5 text-slate-400" /> {stats.ineffective}
                <span className="font-semibold opacity-80">tidak</span>
              </span>
            </div>
          )}

          {/* state pill (bottom-left, macro only) — one short label */}
          {phase === "done" && !micro && (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow">
              Pita Mg habis
            </span>
          )}

          {/* Perbesar toggle (bottom-right) */}
          <button
            type="button"
            onClick={toggleMicro}
            aria-pressed={micro}
            className={cn(
              "absolute bottom-2 right-2 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-black shadow-lg transition-colors sm:bottom-3 sm:right-3 sm:h-12 sm:gap-2 sm:px-4 sm:text-sm",
              micro
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-brand-600 text-white hover:bg-brand-700"
            )}
          >
            {micro ? (
              <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
            {micro ? "Kembali" : "Perbesar"}
          </button>

          {/* Mg remaining (thin bar, no text) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-200/70">
            <div
              className={cn("h-full transition-[width]", phase === "done" ? "bg-emerald-500" : "bg-brand-500")}
              style={{ width: `${Math.round((1 - progressUi) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ---------------- concentration chips ---------------- */}
      <div className="thin-scroll -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {ordered.map((value) => {
          const run = runs[safeKey(value)];
          const active = value === param;
          return (
            <button
              key={value}
              type="button"
              onClick={() => selectParam(value)}
              aria-pressed={active}
              className={cn(
                "flex min-h-12 min-w-[96px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border px-3 py-1.5 transition-colors",
                active
                  ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-200"
                  : run
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
              )}
            >
              <span className="text-sm font-black tabular-nums leading-tight">
                {concentrationLabel(parseFloat(value), cfg.paramUnit)}
              </span>
              <span
                className={cn(
                  "mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold tabular-nums",
                  active ? "text-brand-100" : run ? "text-emerald-700" : "text-slate-400"
                )}
              >
                {run ? (
                  <>
                    <Check className="h-3 w-3" /> {fmtSeconds(run.timeSec ?? 0)} s
                  </>
                ) : (
                  "—"
                )}
              </span>
            </button>
          );
        })}
        <span className="ml-auto hidden shrink-0 self-center text-[11px] font-bold text-slate-400 sm:block">
          {completedCount}/{ordered.length}
        </span>
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(240px,340px)_auto_auto] sm:items-stretch">
        {/* stopwatch */}
        <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white sm:col-span-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-black tabular-nums leading-none">
              {fmtSeconds(elapsedUi)}
            </span>
            <span className="text-xs font-bold text-slate-400">s</span>
          </div>
          <button
            type="button"
            onClick={pressStopwatch}
            disabled={sw === "stopped"}
            aria-label={
              sw === "running" ? "Hentikan stopwatch" : sw === "off" ? "Mulai stopwatch" : "Stopwatch selesai"
            }
            className={cn(
              "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
              sw === "running"
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : sw === "stopped"
                  ? "bg-emerald-500 text-white"
                  : phase === "reacting"
                    ? "bg-brand-500 text-white hover:bg-brand-400"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            )}
          >
            {sw === "running" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/40" />
            )}
            {sw === "running" ? (
              <Square className="h-6 w-6 fill-current" />
            ) : sw === "stopped" ? (
              <Check className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 fill-current" />
            )}
          </button>
        </div>

        {/* insert Mg */}
        <Button
          variant={phase === "idle" ? "primary" : "secondary"}
          disabled={phase !== "idle" || !param}
          onClick={insertMg}
          className="min-h-12 whitespace-nowrap px-3"
        >
          <Pipette className="h-4 w-4 shrink-0" /> Masukkan Mg
        </Button>

        {/* redo */}
        <Button
          variant="secondary"
          onClick={() => {
            resetRun();
            setHintState(null);
          }}
          disabled={phase === "idle" && sw === "off" && !currentRun}
          className="min-h-12 whitespace-nowrap px-3"
        >
          <RotateCcw className="h-4 w-4 shrink-0" /> Ulangi
        </Button>
      </div>

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
        {hint?.text ?? " "}
      </p>

      <M1Tutorial open={tutorialOpen} mandatory={tutorialMandatory} onClose={closeTutorial} />
    </div>
  );
}
