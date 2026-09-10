"use client";

// Macroscopic simulation stage + stopwatch + inline submicroscopic magnifier.
// The magnifier is a lens overlay / zoom panel on the SAME page (INV-06).

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Search, Timer } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import {
  buildSeries,
  computeRate,
  drawExperiment,
  runDuration,
  volumeAt,
} from "./sim-models";
import ParticleView from "./ParticleView";
import M4MechanismView from "./m4/M4MechanismView";

const CANVAS_W = 640;
const CANVAS_H = 300;

export default function SimStage({
  cfg,
  selected,
  runs,
  onRunDone,
}: {
  cfg: ExperimentConfig;
  selected: string[];
  runs: Record<string, ExperimentRun>;
  onRunDone: (run: ExperimentRun) => void;
}) {
  const options = cfg.options.filter((o) => selected.includes(o.value));
  const [param, setParam] = useState<string>(options[0]?.value ?? "");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [simT, setSimT] = useState(0);
  const [doneFlag, setDoneFlag] = useState(false);
  const [magnifier, setMagnifier] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(3);
  const paramRef = useRef(param);
  const doneRef = useRef(false);
  runningRef.current = running;
  speedRef.current = speed;
  paramRef.current = param;

  const opt = cfg.options.find((o) => o.value === param) ?? cfg.options[0];
  const maxFactor = Math.max(...cfg.options.map((o) => o.factor));
  const duration = opt ? runDuration(cfg, opt.factor) : 10;
  const progress = Math.min(1, simT / duration);

  const finishRun = useCallback(() => {
    const option = cfg.options.find((o) => o.value === paramRef.current);
    if (!option) return;
    const dur = runDuration(cfg, option.factor);
    const { rate, rateLabel } = computeRate(cfg, option.factor, dur);
    const run: ExperimentRun = {
      id: `${option.value}-${Date.now()}`,
      paramValue: option.value,
      label: option.label,
      timeSec: dur,
      rate,
      rateLabel,
      at: Date.now(),
      ...(cfg.rateKind === "gasRate"
        ? { series: buildSeries(cfg, option.factor) }
        : {}),
    };
    onRunDone(run);
  }, [cfg, onRunDone]);

  // animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const canvas = canvasRef.current;
      const option = cfg.options.find((o) => o.value === paramRef.current);
      if (canvas && option) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dt = Math.min(0.06, (now - last) / 1000);
          if (runningRef.current && !doneRef.current) {
            tRef.current += dt * speedRef.current;
            const dur = runDuration(cfg, option.factor);
            if (tRef.current >= dur) {
              tRef.current = dur;
              doneRef.current = true;
              setDoneFlag(true);
              setRunning(false);
              finishRun();
            }
            setSimT(tRef.current);
          }
          const dur = runDuration(cfg, option.factor);
          const progress = Math.min(1, tRef.current / dur);
          drawExperiment(cfg, ctx, CANVAS_W, CANVAS_H, {
            factor: option.factor,
            label: option.label,
            t: tRef.current,
            duration: dur,
            progress,
            volume:
              cfg.rateKind === "gasRate"
                ? volumeAt(cfg, option.factor, tRef.current)
                : undefined,
            vmax: cfg.gas?.vmax,
          });
        }
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cfg, finishRun]);

  const resetRun = (nextParam?: string) => {
    tRef.current = 0;
    doneRef.current = false;
    setSimT(0);
    setDoneFlag(false);
    setRunning(false);
    if (nextParam) setParam(nextParam);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!magnifier || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    setLens({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div>
      {/* run parameter picker (from locked setup only — no free navigation) */}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const done = Boolean(runs[o.value.replace(/[.#$/[\]]/g, "_")]);
          const active = o.value === param;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => resetRun(o.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "border-brand-500 bg-brand-600 text-white"
                  : done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                    : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
              )}
            >
              {done ? "✓ " : ""}
              {o.label}
            </button>
          );
        })}
      </div>

      {/* stage */}
      <div
        ref={stageRef}
        className="relative mt-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setLens(null)}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-auto block"
        />
        {/* magnifier lens overlay (desktop hover) */}
        {magnifier && lens && opt && (
          <div
            className="pointer-events-none absolute hidden md:block"
            style={{ left: lens.x - 84, top: lens.y - 84 }}
          >
            <div className="h-42 w-42 rounded-full border-4 border-brand-500 shadow-2xl overflow-hidden bg-[#0f2a5e]"
              style={{ width: 168, height: 168 }}
            >
              <ParticleView
                cfg={{ kind: cfg.kind, factor: opt.factor, maxFactor }}
                width={168}
                height={168}
              />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5">
              tampilan partikel
            </div>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">{cfg.stageNote}</p>

      {/* controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!running ? (
          <Button
            size="sm"
            onClick={() => setRunning(true)}
            disabled={doneFlag || !opt}
          >
            <Play className="h-4 w-4" /> {simT > 0 ? "Lanjutkan" : "Mulai"}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setRunning(false)}>
            <Pause className="h-4 w-4" /> Jeda
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => resetRun()}>
          <RotateCcw className="h-4 w-4" /> Ulangi
        </Button>
        <Button
          size="sm"
          variant={magnifier ? "primary" : "secondary"}
          onClick={() => setMagnifier((v) => !v)}
        >
          <Search className="h-4 w-4" />
          {magnifier ? "Kaca Pembesar: AKTIF" : "Kaca Pembesar Partikel"}
        </Button>
        <div className="flex items-center gap-1 ml-auto">
          {[1, 3, 6].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "rounded-lg px-2 py-1 text-xs font-bold border",
                speed === s
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-brand-300"
              )}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white font-mono text-sm px-3 py-1.5">
          <Timer className="h-4 w-4 text-brand-300" />
          {simT.toFixed(1)} s
          <span className="text-[10px] text-slate-400 font-sans">simulasi</span>
        </span>
      </div>

      {doneFlag && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 font-semibold">
          ✔ Percobaan {opt?.label} selesai — data otomatis tercatat di tabel. Pilih
          kondisi lain atau lanjut ke analisis data.
        </div>
      )}

      {/* magnifier zoom panel (works on touch too, stays on the same page) */}
      {magnifier && opt && (
        <div className="mt-3 rounded-xl border border-brand-200 overflow-hidden">
          <div className="bg-brand-600 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Panel Zoom Submikroskopik — {opt.label}
          </div>
          {cfg.kind === "catalyst" ? (
            <M4MechanismView progress={progress} catalystLabel={opt.label} />
          ) : <>
          <div className="h-44 bg-[#0f2a5e]">
            <ParticleView cfg={{ kind: cfg.kind, factor: opt.factor, maxFactor }} width={640} height={176} />
          </div>
          <div className="bg-brand-50 px-3 py-2 text-xs text-brand-800 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#60a5fa] mr-1" />
              partikel pereaksi A
            </span>
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#fbbf24] mr-1" />
              partikel pereaksi B
            </span>
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-yellow-400 mr-1" />
              tumbukan efektif
            </span>
          </div>
          </>}
        </div>
      )}
    </div>
  );
}
