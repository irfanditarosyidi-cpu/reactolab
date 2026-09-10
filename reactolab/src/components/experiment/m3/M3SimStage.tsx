"use client";

// Module 3 — simulation orchestrator (mobile-first, minimal UI).
//
// Per temperature: pick chip → "Atur Suhu" (both solutions equilibrate to the
// target; status "Siap dicampurkan") → "Campurkan" (pour animation, stopwatch
// starts automatically) → the mixture clouds up at a temperature-dependent
// rate → the student presses "Stop — X tidak terlihat" → time recorded.
// "Perbesar" swaps the stage to the particle view with a Maxwell–Boltzmann
// panel; tested temperatures can be compared side by side.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Atom,
  Beaker,
  Check,
  Circle,
  CircleHelp,
  Eye,
  Minus,
  Plus,
  RotateCcw,
  Square,
  Thermometer,
  Undo2,
  Zap,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { safeKey } from "@/lib/runs";
import { runDuration } from "../sim-models";
import M3Scene3D, { type M3Phase, type M3SimShared, type M3Stats } from "./M3Scene3D";
import M3MaxwellPanel from "./M3MaxwellPanel";
import M3Tutorial from "./M3Tutorial";

interface Hint {
  text: string;
  tone: "info" | "warn" | "ok";
}

const ROOM_T = 25;
const HEAT_MIN_MS = 2400;
const HEAT_MS_PER_DEG = 70;
const POUR_MS = 2600;
const STOP_MIN_P = 0.6; // X still clearly visible below this progress
const OVERDUE_P = 1.3;

function fmtSeconds(sec: number): string {
  return sec.toFixed(1).replace(".", ",");
}
function tempLabel(t: number): string {
  return `${Math.round(t)} °C`;
}

export default function M3SimStage({
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
  const ordered = useMemo(() => [...selected].sort((a, b) => parseFloat(a) - parseFloat(b)), [selected]);

  const [param, setParam] = useState(ordered[0] ?? "");
  const [phase, setPhase] = useState<M3Phase>("idle");
  const [elapsedUi, setElapsedUi] = useState(0);
  const [micro, setMicro] = useState(false);
  const [microTemp, setMicroTemp] = useState(parseFloat(ordered[0] ?? "25") || 25);
  const [topView, setTopView] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stats, setStats] = useState<M3Stats>({ effective: 0, ineffective: 0 });
  const [hint, setHintState] = useState<Hint | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen && !readOnly);
  const [tutorialMandatory, setTutorialMandatory] = useState(!tutorialSeen && !readOnly);

  const temp = parseFloat(param) || 25;
  const duration = runDuration(cfg, temp); // seconds until the X is (model-)invisible

  const sharedRef = useRef<M3SimShared>({
    temperature: temp,
    tempA: ROOM_T,
    tempB: ROOM_T,
    phase: "idle",
    pourProgress: 0,
    turbidity: 0,
    micro: false,
    microTemp,
    topView: false,
    zoom: 1,
    resetToken: 0,
    viewResetToken: 0,
  });
  sharedRef.current.temperature = temp;

  const phaseRef = useRef<M3Phase>("idle");
  const heatStartRef = useRef(0);
  const pourStartRef = useRef(0);
  const reactionStartRef = useRef(0);
  const elapsedRef = useRef(0);
  const overdueRef = useRef(false);
  const durationRef = useRef(duration);
  const tempRef = useRef(temp);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  durationRef.current = duration;
  tempRef.current = temp;

  const setHint = useCallback((text: string, tone: Hint["tone"] = "info") => {
    setHintState({ text, tone });
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintState(null), tone === "ok" ? 4500 : 3200);
  }, []);

  useEffect(() => {
    if (!ordered.includes(param)) setParam(ordered[0] ?? "");
  }, [ordered, param]);

  const resetRun = useCallback(() => {
    phaseRef.current = "idle";
    elapsedRef.current = 0;
    overdueRef.current = false;
    const s = sharedRef.current;
    s.phase = "idle";
    s.tempA = ROOM_T;
    s.tempB = ROOM_T;
    s.pourProgress = 0;
    s.turbidity = 0;
    s.resetToken += 1;
    setPhase("idle");
    setElapsedUi(0);
    setStats({ effective: 0, ineffective: 0 });
  }, []);

  // ---- simulation clock (real time) ----
  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    const loop = (now: number) => {
      const s = sharedRef.current;
      const ph = phaseRef.current;
      if (ph === "heating") {
        const target = tempRef.current;
        const delta = target - ROOM_T;
        const dur = Math.max(HEAT_MIN_MS, Math.abs(delta) * HEAT_MS_PER_DEG);
        const k = Math.min(1, (now - heatStartRef.current) / dur);
        const ease = k * k * (3 - 2 * k);
        s.tempA = ROOM_T + delta * ease;
        s.tempB = ROOM_T + delta * Math.min(1, ease * 1.04);
        if (k >= 1) {
          s.tempA = target;
          s.tempB = target;
          phaseRef.current = "ready";
          setPhase("ready");
          setHint("Siap dicampurkan.", "ok");
        }
      } else if (ph === "pouring") {
        const q = Math.min(1, (now - pourStartRef.current) / POUR_MS);
        s.pourProgress = q;
        if (q >= 1) {
          phaseRef.current = "reacting";
          reactionStartRef.current = now;
          setPhase("reacting");
        }
      } else if (ph === "reacting") {
        const elapsed = (now - reactionStartRef.current) / 1000;
        elapsedRef.current = elapsed;
        const p = elapsed / durationRef.current;
        s.turbidity = p < 1 ? p * p * (3 - 2 * p) : Math.min(1.3, 1 + (p - 1) * 0.3);
        if (p >= OVERDUE_P && !overdueRef.current) {
          overdueRef.current = true;
          setHint("Tanda X sudah tidak terlihat — tekan Stop.", "warn");
        }
      }
      s.phase = phaseRef.current;
      if (now - lastUi >= 100) {
        lastUi = now;
        setElapsedUi(elapsedRef.current);
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
    const ph = phaseRef.current;
    if (ph === "heating" || ph === "pouring" || ph === "reacting") {
      setHint("Percobaan masih berjalan — tekan Ulangi dulu.", "warn");
      return;
    }
    resetRun();
    setParam(value);
    setMicroTemp(parseFloat(value) || 25);
    sharedRef.current.microTemp = parseFloat(value) || 25;
  };

  const primaryAction = () => {
    const ph = phaseRef.current;
    const now = performance.now();
    if (ph === "idle") {
      if (!param) return;
      phaseRef.current = "heating";
      heatStartRef.current = now;
      setPhase("heating");
      setHint(`Menyesuaikan kedua larutan ke ${tempLabel(temp)}…`);
      return;
    }
    if (ph === "ready") {
      phaseRef.current = "pouring";
      pourStartRef.current = now;
      setPhase("pouring");
      setHint("Stopwatch berjalan otomatis saat larutan tercampur.");
      return;
    }
    if (ph === "reacting") {
      const elapsed = elapsedRef.current;
      const p = elapsed / durationRef.current;
      if (p < STOP_MIN_P) {
        setHint("Tanda X masih terlihat.", "warn");
        return;
      }
      phaseRef.current = "done";
      setPhase("done");
      const timeSec = Math.max(0.1, Math.round(elapsed * 10) / 10);
      const rate = 1 / timeSec;
      const run: ExperimentRun = {
        id: `${param}-${Date.now()}`,
        paramValue: param,
        label: tempLabel(temp),
        timeSec,
        rate,
        rateLabel: `${rate.toFixed(4)} ${cfg.rateUnit}`,
        at: Date.now(),
      };
      if (readOnly) setHint("Pemutaran ulang — data tersimpan tidak diubah.");
      else {
        onRunDone(run);
        setHint(`Tercatat: ${fmtSeconds(timeSec)} s`, "ok");
      }
    }
  };

  const toggleMicro = () => {
    const next = !micro;
    sharedRef.current.micro = next;
    if (next) {
      sharedRef.current.microTemp = temp;
      setMicroTemp(temp);
      setStats({ effective: 0, ineffective: 0 });
    }
    setMicro(next);
  };
  const pickMicroTemp = (t: number) => {
    setMicroTemp(t);
    sharedRef.current.microTemp = t;
    setStats({ effective: 0, ineffective: 0 });
  };
  const toggleTopView = () => {
    const next = !topView;
    sharedRef.current.topView = next;
    setTopView(next);
  };
  const changeZoom = (dir: number) => {
    const next = Math.min(1.6, Math.max(0.65, Math.round((zoom + dir * 0.15) * 100) / 100));
    sharedRef.current.zoom = next;
    setZoom(next);
  };
  const resetView = () => {
    sharedRef.current.zoom = 1;
    sharedRef.current.topView = false;
    sharedRef.current.viewResetToken += 1;
    setZoom(1);
    setTopView(false);
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
  const testedTemps = useMemo(() => {
    const set = new Set<number>();
    for (const v of ordered) if (runs[safeKey(v)]) set.add(parseFloat(v));
    set.add(temp);
    return Array.from(set).sort((a, b) => a - b);
  }, [ordered, runs, temp]);

  const statusPill =
    phase === "heating"
      ? { text: "Menyesuaikan suhu…", cls: "bg-amber-500 text-white" }
      : phase === "ready"
        ? { text: "Siap dicampurkan", cls: "bg-emerald-600 text-white" }
        : phase === "pouring"
          ? { text: "Menuang…", cls: "bg-sky-600 text-white" }
          : phase === "done"
            ? { text: "Tercatat", cls: "bg-emerald-600 text-white" }
            : null;

  const primary =
    phase === "idle"
      ? { label: "Atur Suhu", icon: Thermometer, disabled: !param, cls: "" }
      : phase === "heating"
        ? { label: "Menyesuaikan…", icon: Thermometer, disabled: true, cls: "" }
        : phase === "ready"
          ? { label: "Campurkan", icon: Beaker, disabled: false, cls: "" }
          : phase === "pouring"
            ? { label: "Menuang…", icon: Beaker, disabled: true, cls: "" }
            : phase === "reacting"
              ? { label: "Stop — X tidak terlihat", icon: Square, disabled: false, cls: "!bg-rose-600 hover:!bg-rose-700" }
              : { label: "Tercatat", icon: Check, disabled: true, cls: "" };
  const PrimaryIcon = primary.icon;

  return (
    <div className="space-y-3">
      <div className={cn("grid gap-3", micro && "lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start")}>
        {/* ---------------- 3D stage ---------------- */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[88vw] max-h-[460px] min-h-[320px] sm:h-[380px] lg:h-[440px]">
            <M3Scene3D shared={sharedRef} micro={micro} onStats={setStats} className="absolute inset-0" />

            {/* temperature + status (top-left) */}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2 pr-16">
              <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-sm font-black tabular-nums text-slate-900 shadow-sm backdrop-blur">
                {micro ? tempLabel(microTemp) : param ? tempLabel(temp) : "—"}
              </span>
              {!micro && statusPill && (
                <span className={cn("rounded-full px-3 py-1.5 text-xs font-black shadow", statusPill.cls)}>
                  {statusPill.text}
                </span>
              )}
            </div>

            {/* tutorial (top-right) */}
            <button
              type="button"
              onClick={() => {
                setTutorialMandatory(false);
                setTutorialOpen(true);
              }}
              aria-label="Lihat tutorial"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-brand-700 shadow-sm backdrop-blur hover:bg-white"
            >
              <CircleHelp className="h-5 w-5" />
            </button>

            {/* camera controls (top row under "?", macro only — keeps the apparatus clear) */}
            {!micro && (
              <div className="absolute right-3 top-16 flex flex-row gap-1.5">
                <button
                  type="button"
                  onClick={toggleTopView}
                  aria-pressed={topView}
                  aria-label="Lihat dari atas"
                  title="Lihat dari Atas"
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors",
                    topView ? "border-brand-600 bg-brand-600 text-white" : "border-white/80 bg-white/90 text-slate-700 hover:bg-white"
                  )}
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => changeZoom(-1)}
                  aria-label="Perbesar tampilan"
                  title="Zoom in"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => changeZoom(1)}
                  aria-label="Perkecil tampilan"
                  title="Zoom out"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  aria-label="Reset tampilan kamera"
                  title="Reset View"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
                >
                  <Undo2 className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* readouts (bottom-left) */}
            <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col items-start gap-1.5">
              {micro ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black tabular-nums text-amber-950 shadow">
                    <Zap className="h-3.5 w-3.5" /> {stats.effective}
                    <span className="font-semibold opacity-80">efektif</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black tabular-nums text-slate-700 shadow backdrop-blur">
                    <Circle className="h-3.5 w-3.5 text-slate-400" /> {stats.ineffective}
                    <span className="font-semibold opacity-80">tidak</span>
                  </span>
                </>
              ) : (
                (phase === "reacting" || phase === "done") && (
                  <span className="inline-flex items-baseline gap-1 rounded-2xl bg-slate-950 px-3.5 py-2 text-white shadow">
                    <span className="font-mono text-2xl font-black tabular-nums leading-none">{fmtSeconds(elapsedUi)}</span>
                    <span className="text-xs font-bold text-slate-300">s</span>
                  </span>
                )
              )}
            </div>

            {/* Perbesar toggle (bottom-right) */}
            <button
              type="button"
              onClick={toggleMicro}
              aria-pressed={micro}
              className={cn(
                "absolute bottom-3 right-3 inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-black shadow-lg transition-colors",
                micro ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-brand-600 text-white hover:bg-brand-700"
              )}
            >
              <Atom className="h-5 w-5" />
              {micro ? "Kembali" : "Perbesar"}
            </button>
          </div>
        </div>

        {/* ---------------- Maxwell–Boltzmann panel (micro) ---------------- */}
        {micro && (
          <div className="space-y-2">
            <div className="thin-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Bandingkan suhu yang sudah diuji">
              {testedTemps.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickMicroTemp(t)}
                  aria-pressed={t === microTemp}
                  className={cn(
                    "min-h-11 shrink-0 rounded-full border px-4 text-sm font-black tabular-nums transition-colors",
                    t === microTemp ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
                  )}
                >
                  {tempLabel(t)}
                </button>
              ))}
            </div>
            <M3MaxwellPanel temps={testedTemps} active={microTemp} />
          </div>
        )}
      </div>

      {/* ---------------- temperature chips ---------------- */}
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
              <span className="text-sm font-black tabular-nums leading-tight">{tempLabel(parseFloat(value))}</span>
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
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex sm:flex-wrap">
        <Button
          disabled={primary.disabled}
          onClick={primaryAction}
          className={cn("min-h-12 whitespace-nowrap px-3 sm:min-w-[230px]", primary.cls)}
        >
          <PrimaryIcon className={cn("h-4 w-4 shrink-0", phase === "reacting" && "fill-current")} /> {primary.label}
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

      <M3Tutorial open={tutorialOpen} mandatory={tutorialMandatory} onClose={closeTutorial} />
    </div>
  );
}
