"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Thermometer,
  Timer,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { computeRate, runDuration } from "../sim-models";
import M3LabApparatus from "./M3LabApparatus";
import M3ParticleLens from "./M3ParticleLens";

function runKey(value: string) {
  return value.replace(/[.#$/[\]]/g, "_");
}

export default function M3SimStage({
  cfg,
  selected,
  runs,
  readOnly = false,
  onRunDone,
}: {
  cfg: ExperimentConfig;
  selected: string[];
  runs: Record<string, ExperimentRun>;
  readOnly?: boolean;
  onRunDone: (run: ExperimentRun) => void;
}) {
  const options = cfg.options.filter((option) => selected.includes(option.value));
  const [param, setParam] = useState(options[0]?.value ?? "");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [simT, setSimT] = useState(0);
  const [doneFlag, setDoneFlag] = useState(false);
  const [magnifier, setMagnifier] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);

  const tRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(3);
  const paramRef = useRef(param);
  const doneRef = useRef(false);
  runningRef.current = running;
  speedRef.current = speed;
  paramRef.current = param;

  const opt = options.find((option) => option.value === param) ?? options[0];
  const duration = opt ? runDuration(cfg, opt.factor) : 24;
  const progress = Math.min(1, simT / duration);
  const started = running || simT > 0;

  const finishRun = useCallback(() => {
    if (readOnly) return;
    const option = cfg.options.find((item) => item.value === paramRef.current);
    if (!option) return;
    const runTime = runDuration(cfg, option.factor);
    const { rate, rateLabel } = computeRate(cfg, option.factor, runTime);
    onRunDone({
      id: `${option.value}-${Date.now()}`,
      paramValue: option.value,
      label: option.label,
      timeSec: runTime,
      rate,
      rateLabel,
      at: Date.now(),
    });
  }, [cfg, onRunDone, readOnly]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.06, (now - last) / 1000);
      last = now;
      if (runningRef.current && !doneRef.current) {
        tRef.current += delta * speedRef.current;
        const option = cfg.options.find((item) => item.value === paramRef.current);
        if (option) {
          const runTime = runDuration(cfg, option.factor);
          if (tRef.current >= runTime) {
            tRef.current = runTime;
            doneRef.current = true;
            runningRef.current = false;
            setDoneFlag(true);
            setRunning(false);
            finishRun();
          }
        }
        setSimT(tRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cfg, finishRun]);

  const resetRun = (nextParam?: string) => {
    tRef.current = 0;
    runningRef.current = false;
    doneRef.current = false;
    setSimT(0);
    setDoneFlag(false);
    setRunning(false);
    setMagnifier(false);
    if (nextParam) {
      paramRef.current = nextParam;
      setParam(nextParam);
    }
  };

  const completedCount = options.filter((option) => Boolean(runs[runKey(option.value)])).length;
  const stateLabel = doneFlag
    ? "Tanda X tidak terlihat"
    : running
      ? "Kekeruhan sedang terbentuk"
      : simT > 0
        ? "Pengamatan dijeda"
        : "Siap mencampurkan larutan";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200">
              <Thermometer className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Rak suhu terpilih</p>
              <p className="text-xs font-semibold text-slate-600">Volume, konsentrasi, gelas, dan tanda X dikontrol tetap</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
            {completedCount}/{options.length} selesai
          </span>
        </div>

        <div className="thin-scroll -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
          {options.map((option) => {
            const done = Boolean(runs[runKey(option.value)]);
            const active = option.value === param;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => resetRun(option.value)}
                disabled={running}
                aria-pressed={active}
                className={cn(
                  "group relative min-h-14 min-w-[126px] snap-start overflow-hidden rounded-xl border px-3 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-0",
                  active
                    ? "border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-200/70"
                    : done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:shadow-sm",
                )}
              >
                <span className={cn("block text-[9px] font-black uppercase tracking-wider", active ? "text-sky-100" : "text-slate-400")}>
                  {done ? "Data tersimpan" : active ? "Aktif" : "Belum diuji"}
                </span>
                <span className="mt-0.5 block text-sm font-black">{option.label}</span>
                {done && <CheckCircle2 className={cn("absolute right-2 top-2 h-4 w-4", active ? "text-white" : "text-emerald-500")} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_55px_-34px_rgba(15,23,42,0.55)]">
        <M3LabApparatus
          label={opt?.label ?? ""}
          temperature={opt?.factor ?? 30}
          simTime={simT}
          progress={progress}
          running={running}
          started={started}
          magnifierOpen={magnifier}
          zoomEnabled={zoomEnabled}
          onMagnifierClick={() => setMagnifier((value) => !value)}
          onZoomModeToggle={() => {
            if (zoomEnabled) setMagnifier(false);
            setZoomEnabled(!zoomEnabled);
          }}
          lensOverlay={
            magnifier && opt ? (
              <div className="absolute inset-0 z-30 flex items-start justify-center px-2 pt-3 sm:px-4 sm:pt-5">
                <button type="button" aria-hidden="true" tabIndex={-1} onClick={() => setMagnifier(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" />
                <div
                  id="m3-particle-panel"
                  role="dialog"
                  aria-label={`Lensa submikroskopik reaksi pada suhu ${opt.label}`}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setMagnifier(false);
                  }}
                  className="relative z-10 aspect-square h-[72%] max-h-[340px] max-w-[86%] overflow-hidden rounded-full border-[5px] border-white bg-sky-50 shadow-[0_22px_60px_rgba(0,0,0,0.48)] ring-2 ring-slate-900/70 sm:h-[78%]"
                >
                  <M3ParticleLens label={opt.label} temperature={opt.factor} simTime={simT} progress={progress} running={running} />
                  <div aria-hidden="true" className="pointer-events-none absolute bottom-[5%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-2 py-1.5 text-[7px] font-black text-slate-700 shadow-lg backdrop-blur-sm sm:gap-2.5 sm:text-[9px]">
                    <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-500" />H⁺</span>
                    <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-500" />S₂O₃²⁻</span>
                    <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-yellow-400" />S</span>
                    <span className="inline-flex items-center gap-1 text-sky-700"><i className="h-2 w-2 rounded-full ring-2 ring-yellow-400" />efektif</span>
                  </div>
                  <button type="button" autoFocus onClick={() => setMagnifier(false)} aria-label="Tutup lensa submikroskopik" className="absolute right-[2%] top-[2%] z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-slate-950/85 text-white shadow-lg transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : null
          }
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {!running ? (
              <Button size="sm" onClick={() => setRunning(true)} disabled={doneFlag || !opt} className="min-h-11 w-full sm:min-w-28">
                <Play className="h-4 w-4" />{simT > 0 ? "Lanjutkan" : "Mulai"}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setRunning(false)} className="min-h-11 w-full sm:min-w-28">
                <Pause className="h-4 w-4" /> Jeda
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => resetRun()} className="min-h-11 w-full sm:w-auto">
              <RotateCcw className="h-4 w-4" /> Ulangi
            </Button>
          </div>

          <div className="hidden h-8 w-px bg-slate-200 lg:block" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400"><Gauge className="h-3.5 w-3.5" /> Kecepatan pemutaran</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Kecepatan pemutaran simulasi">
              {[1, 3, 6].map((value) => (
                <button key={value} type="button" onClick={() => setSpeed(value)} aria-pressed={speed === value} className={cn("min-h-11 min-w-11 rounded-lg px-2.5 py-1 text-xs font-black transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500", speed === value ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-700")}>
                  {value}×
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1 lg:px-2">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-bold">
              <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-1.5", doneFlag ? "text-emerald-600" : running ? "text-sky-600" : "text-slate-500")}>
                <span className={cn("h-2 w-2 rounded-full", doneFlag ? "bg-emerald-500" : running ? "animate-pulse bg-sky-500" : "bg-slate-300")} />{stateLabel}
              </span>
              <span className="tabular-nums text-slate-400">{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Kemajuan kekeruhan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <div className={cn("h-full rounded-full transition-[width] duration-150", doneFlag ? "bg-emerald-500" : "bg-gradient-to-r from-sky-500 to-amber-400")} style={{ width: `${progress * 100}%` }} />
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-white shadow-inner sm:w-auto">
            <Timer className="h-4 w-4 text-sky-300" />
            <span className="font-mono text-base font-black tabular-nums">{simT.toFixed(1)}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">detik</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-sky-900">
        <b>Prosedur terkendali:</b> {cfg.stageNote}
      </div>

      {doneFlag && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status" aria-live="polite">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>
            <b>{readOnly ? "Pemutaran ulang" : "Percobaan"} {opt?.label} selesai.</b>{" "}
            {readOnly
              ? "Data waktu yang sudah tersimpan tidak diubah. Tekan Ulangi atau pilih suhu lain untuk terus mengeksplorasi."
              : "Waktu saat tanda X hilang dan indikator laju sudah otomatis tercatat. Pilih suhu lain untuk melanjutkan."}
          </p>
        </div>
      )}
    </div>
  );
}
