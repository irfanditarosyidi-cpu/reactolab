"use client";

// Module 3 — simulation orchestrator (mobile-first, minimal UI).
//
// Per temperature: choose from the dropdown → "Atur Suhu" (both solutions equilibrate to the
// target; status "Siap dicampurkan") → "Campurkan" (pour animation, stopwatch
// starts automatically) → the mixture clouds up at a temperature-dependent
// rate → the student presses "Stop" when X is no longer visible → time recorded.
// "Perbesar" swaps the stage to the particle view with a Maxwell–Boltzmann
// panel; tested temperatures can be compared side by side.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Circle,
  CircleHelp,
  Eye,
  RotateCcw,
  Zap,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/forms";
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

  const statusLabel =
    phase === "heating"
      ? "Menyesuaikan suhu…"
      : phase === "ready"
        ? "Siap dicampurkan"
        : phase === "pouring"
          ? "Menuang…"
          : phase === "reacting"
            ? "Reaksi berlangsung"
            : phase === "done"
              ? "Data tercatat"
              : currentRun
                ? "Data sudah tersimpan"
                : "Siap dimulai";

  const primary =
    phase === "idle"
      ? { label: "Atur Suhu", disabled: !param, cls: "" }
      : phase === "heating"
        ? { label: "Menyesuaikan…", disabled: true, cls: "" }
        : phase === "ready"
          ? { label: "Campurkan", disabled: false, cls: "" }
          : phase === "pouring"
            ? { label: "Menuang…", disabled: true, cls: "" }
            : phase === "reacting"
              ? { label: "Stop", disabled: false, cls: "!bg-rose-600 hover:!bg-rose-700" }
              : { label: "Tercatat", disabled: true, cls: "" };

  return (
    <div className="space-y-3">
      {/* ---------------- temperature selector ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="m3-temperature" className="text-xs">
              Pilih suhu pengamatan
            </Label>
            <Select
              id="m3-temperature"
              value={param}
              onChange={(event) => selectParam(event.target.value)}
              disabled={
                phase === "heating" ||
                phase === "pouring" ||
                phase === "reacting" ||
                ordered.length === 0
              }
              aria-describedby="m3-temperature-progress"
              className="min-h-11 bg-white font-bold"
            >
              {ordered.length === 0 && <option value="">Tidak ada suhu terpilih</option>}
              {ordered.map((value) => (
                <option key={value} value={value}>
                  {tempLabel(parseFloat(value))}
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
          id="m3-temperature-progress"
          className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500"
        >
          <span>Ganti suhu sebelum memulai percobaan berikutnya.</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-emerald-700">
            <Check className="h-3.5 w-3.5" /> {completedCount}/{ordered.length} selesai
          </span>
        </div>
      </div>

      <div className={cn("grid gap-3", micro && "lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start")}>
        <div className="space-y-2">
          {/* ---------------- 3D stage ---------------- */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-[88vw] max-h-[460px] min-h-[320px] sm:h-[380px] lg:h-[440px]">
              <M3Scene3D shared={sharedRef} micro={micro} onStats={setStats} className="absolute inset-0" />
            </div>
          </div>

          {/* ---------------- stage toolbar ---------------- */}
          <div className="flex w-full items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              disabled={primary.disabled}
              onClick={primaryAction}
              className={cn(
                "h-10 min-w-0 flex-1 whitespace-nowrap px-2 text-xs sm:h-11 sm:px-4 sm:text-sm",
                primary.cls
              )}
            >
              {primary.label}
            </Button>
            {!micro && (
              <button
                type="button"
                onClick={toggleTopView}
                aria-pressed={topView}
                aria-label="Lihat dari atas"
                title="Lihat dari atas"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:h-11 sm:w-11 sm:rounded-xl",
                  topView
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                )}
              >
                <Eye className="h-5 w-5" />
              </button>
            )}
            <Button
              type="button"
              size="sm"
              variant={micro ? "secondary" : "primary"}
              onClick={toggleMicro}
              aria-pressed={micro}
              className="h-10 shrink-0 px-2 text-xs sm:h-11 sm:px-3 sm:text-sm"
            >
              {micro ? "Kembali" : "Perbesar"}
            </Button>
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

      {/* ---------------- simulation information ---------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Suhu pengamatan</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-slate-800">
              {tempLabel(micro ? microTemp : temp)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Waktu reaksi</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-brand-700">
              {fmtSeconds(phase === "idle" && currentRun ? currentRun.timeSec ?? 0 : elapsedUi)} s
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
            <p
              className={cn(
                "mt-0.5 text-sm font-black",
                phase === "ready" || phase === "done" || (phase === "idle" && currentRun)
                  ? "text-emerald-700"
                  : phase === "reacting"
                    ? "text-brand-700"
                    : phase === "heating" || phase === "pouring"
                      ? "text-amber-700"
                      : "text-slate-700"
              )}
            >
              {statusLabel}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {micro ? "Tumbukan" : "Tampilan"}
            </p>
            {micro ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-black tabular-nums">
                <span className="inline-flex items-center gap-1 text-amber-700" title="Tumbukan efektif">
                  <Zap className="h-3.5 w-3.5" /> {stats.effective} efektif
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500" title="Tumbukan tidak efektif">
                  <Circle className="h-3.5 w-3.5" /> {stats.ineffective} tidak
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-black text-slate-800">Makroskopik</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            resetRun();
            setHintState(null);
          }}
          disabled={phase === "idle" && !currentRun}
          className="min-h-10 whitespace-nowrap px-3 sm:min-h-11"
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
