"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FlaskConical,
  Gauge,
  GripHorizontal,
  Microscope,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { buildSeries, computeRate, runDuration, volumeAt } from "../sim-models";
import M4MechanismView from "./M4MechanismView";
import M4Scene3D from "./M4Scene3D";

const keyOf = (value: string) => value.replace(/[.#$/[\]]/g, "_");

const CONDITION_NOTES: Record<string, string> = {
  tanpa: "Kontrol tanpa katalis · reaksi paling lambat",
  mno2: "Katalis padat MnO₂ · katalisis heterogen",
  fecl3: "Katalis FeCl₃ dalam larutan · katalisis homogen",
  hati: "Ekstrak hati · mengandung enzim katalase",
};

type ExperimentOption = ExperimentConfig["options"][number];

function ApparatusCarousel({
  options,
  activeValue,
  progress,
  volume,
  running,
  runs,
  onSelect,
  mechanismOpen,
  onMechanismChange,
}: {
  options: ExperimentConfig["options"];
  activeValue: string;
  progress: number;
  volume: number;
  running: boolean;
  runs: Record<string, ExperimentRun>;
  onSelect: (value: string) => void;
  mechanismOpen: boolean;
  onMechanismChange: (open: boolean) => void;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === activeValue),
  );
  const activeOption = options[activeIndex];
  const [dragX, setDragX] = useState(0);
  const [slidePercent, setSlidePercent] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const dragCurrentRef = useRef(0);
  const timerRefs = useRef<number[]>([]);
  const frameRefs = useRef<number[]>([]);

  const clearScheduled = useCallback(() => {
    timerRefs.current.forEach((timer) => window.clearTimeout(timer));
    frameRefs.current.forEach((frame) => cancelAnimationFrame(frame));
    timerRefs.current = [];
    frameRefs.current = [];
  }, []);

  useEffect(() => clearScheduled, [clearScheduled]);

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timerRefs.current.push(timer);
  };

  const navigateTo = (nextIndex: number) => {
    if (
      transitioning ||
      nextIndex < 0 ||
      nextIndex >= options.length ||
      nextIndex === activeIndex
    ) {
      setAnimate(true);
      setDragX(0);
      schedule(() => setAnimate(false), 220);
      return;
    }

    clearScheduled();
    const direction = nextIndex > activeIndex ? 1 : -1;
    setTransitioning(true);
    setAnimate(true);
    setDragX(0);
    setSlidePercent(-direction * 108);

    schedule(() => {
      onSelect(options[nextIndex].value);
      setAnimate(false);
      setSlidePercent(direction * 108);

      const firstFrame = requestAnimationFrame(() => {
        const secondFrame = requestAnimationFrame(() => {
          setAnimate(true);
          setSlidePercent(0);
          schedule(() => {
            setAnimate(false);
            setTransitioning(false);
          }, 240);
        });
        frameRefs.current.push(secondFrame);
      });
      frameRefs.current.push(firstFrame);
    }, 220);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (transitioning || (event.target as HTMLElement).closest("button")) return;
    draggingRef.current = true;
    dragStartRef.current = event.clientX;
    dragCurrentRef.current = 0;
    setAnimate(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = Math.max(-150, Math.min(150, event.clientX - dragStartRef.current));
    dragCurrentRef.current = delta;
    setDragX(delta);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const delta = dragCurrentRef.current;
    if (Math.abs(delta) >= 52) {
      navigateTo(activeIndex + (delta < 0 ? 1 : -1));
    } else {
      setAnimate(true);
      setDragX(0);
      schedule(() => setAnimate(false), 220);
    }
  };

  const completed = options.filter((option) => runs[keyOf(option.value)]).length;
  const movement = Math.min(1, Math.abs(slidePercent) / 108 + Math.abs(dragX) / 220);

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
      aria-label="Carousel empat rangkaian pengukur gas oksigen"
      aria-roledescription="carousel"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
            Percobaan {activeIndex + 1} dari {options.length}
          </p>
          <p className="mt-0.5 text-base font-black text-slate-800">
            {activeOption?.label}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500 sm:text-xs">
            {CONDITION_NOTES[activeOption?.value ?? ""]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mechanismOpen && (
            <button
              type="button"
              onClick={() => onMechanismChange(false)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-[11px] font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <FlaskConical className="h-4 w-4" />
              Kembali ke alat
            </button>
          )}
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
            {completed}/{options.length} selesai
          </span>
        </div>
      </div>

      {mechanismOpen ? (
        <div className="bg-slate-50">
          <M4MechanismView
            progress={progress}
            catalystLabel={activeOption?.label ?? ""}
            running={running}
            embedded
          />
        </div>
      ) : (
      <div
        className="relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            navigateTo(activeIndex - 1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            navigateTo(activeIndex + 1);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="relative h-[88vw] max-h-[500px] min-h-[340px] cursor-grab active:cursor-grabbing sm:h-[420px] lg:h-[480px]"
          style={{
            transform: `translateX(calc(${slidePercent}% + ${dragX}px)) scale(${1 - movement * 0.035})`,
            opacity: 1 - movement * 0.56,
            transition: animate
              ? "transform 220ms cubic-bezier(.4,0,.2,1), opacity 220ms ease"
              : "none",
          }}
        >
          <M4Scene3D
            label={activeOption?.label ?? ""}
            progress={progress}
            volume={volume}
            running={running}
            orbitEnabled={false}
            className="absolute inset-0"
          />

          <button
            type="button"
            onClick={() => onMechanismChange(true)}
            className="absolute inset-x-3 bottom-3 z-30 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-lg transition hover:bg-blue-700 sm:inset-x-auto sm:bottom-4 sm:right-4"
          >
            <Microscope className="h-4 w-4" />
            Lihat mekanisme partikel
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigateTo(activeIndex - 1)}
          disabled={activeIndex === 0 || transitioning}
          aria-label="Lihat rangkaian sebelumnya"
          className="absolute left-2 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/90 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => navigateTo(activeIndex + 1)}
          disabled={activeIndex === options.length - 1 || transitioning}
          aria-label="Lihat rangkaian berikutnya"
          className="absolute right-2 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/90 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
          <GripHorizontal className="h-4 w-4" />
          {mechanismOpen
            ? "Mekanisme terhubung dengan simulasi alat"
            : "Swipe, tombol panah, atau titik kondisi"}
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Pilih rangkaian eksperimen">
          {options.map((option, index) => {
            const active = index === activeIndex;
            const saved = Boolean(runs[keyOf(option.value)]);
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${option.label}${saved ? ", data tersimpan" : ""}`}
                onClick={() => navigateTo(index)}
                disabled={transitioning}
                className={cn(
                  "grid h-8 min-w-8 place-items-center rounded-full border px-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : saved
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-400 hover:border-blue-300",
                )}
              >
                {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function M4SimStage({
  cfg,
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
  // Modul 4 selalu menampilkan keempat kondisi pada carousel agar perbandingan
  // makroskopik dan submikroskopik menggunakan urutan eksperimen yang sama.
  const options = cfg.options;
  const [param, setParam] = useState(options[0]?.value ?? "");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [simT, setSimT] = useState(0);
  const [done, setDone] = useState(false);
  const [mechanismOpen, setMechanismOpen] = useState(false);
  const timeRef = useRef(0);
  const runningRef = useRef(false);
  const speedRef = useRef(3);
  const paramRef = useRef(param);
  const doneRef = useRef(false);
  runningRef.current = running;
  speedRef.current = speed;
  paramRef.current = param;

  const opt: ExperimentOption | undefined =
    options.find((option) => option.value === param) ?? options[0];
  const duration = opt ? runDuration(cfg, opt.factor) : 40;
  const progress = Math.min(1, simT / duration);
  const volume = opt ? volumeAt(cfg, opt.factor, simT) : 0;

  const finish = useCallback(() => {
    if (readOnly) return;
    const option = cfg.options.find(
      (candidate) => candidate.value === paramRef.current,
    );
    if (!option) return;
    const runTime = runDuration(cfg, option.factor);
    const rate = computeRate(cfg, option.factor, runTime);
    onRunDone({
      id: `${option.value}-${Date.now()}`,
      paramValue: option.value,
      label: option.label,
      timeSec: runTime,
      rate: rate.rate,
      rateLabel: rate.rateLabel,
      at: Date.now(),
      series: buildSeries(cfg, option.factor),
    });
  }, [cfg, onRunDone, readOnly]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(0.06, (now - last) / 1000);
      last = now;
      if (runningRef.current && !doneRef.current) {
        timeRef.current += delta * speedRef.current;
        const option = cfg.options.find(
          (candidate) => candidate.value === paramRef.current,
        );
        if (option) {
          const runTime = runDuration(cfg, option.factor);
          if (timeRef.current >= runTime) {
            timeRef.current = runTime;
            doneRef.current = true;
            runningRef.current = false;
            setRunning(false);
            setDone(true);
            finish();
          }
        }
        setSimT(timeRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cfg, finish]);

  const reset = (next?: string) => {
    timeRef.current = 0;
    doneRef.current = false;
    runningRef.current = false;
    setSimT(0);
    setDone(false);
    setRunning(false);
    setMechanismOpen(false);
    if (next) {
      paramRef.current = next;
      setParam(next);
    }
  };

  return (
    <div className="space-y-4">
      <ApparatusCarousel
        options={options}
        activeValue={param}
        progress={progress}
        volume={volume}
        running={running}
        runs={runs}
        onSelect={(value) => reset(value)}
        mechanismOpen={mechanismOpen}
        onMechanismChange={setMechanismOpen}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid grid-cols-2 gap-2">
            {running ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRunning(false)}
              >
                <Pause className="h-4 w-4" />
                Jeda
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setRunning(true)}
                disabled={done || !opt}
              >
                <Play className="h-4 w-4" />
                {simT ? "Lanjutkan" : "Mulai"}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => reset()}
            >
              <RotateCcw className="h-4 w-4" />
              Ulangi
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-slate-400" />
            {[1, 3, 6].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSpeed(value)}
                className={cn(
                  "grid min-h-11 min-w-11 place-items-center rounded-lg text-xs font-black",
                  speed === value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {value}×
              </button>
            ))}
          </div>

          <div className="flex-1">
            <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
              <span>
                {done
                  ? "Reaksi selesai"
                  : running
                    ? "O₂ sedang terbentuk"
                    : "Siap memulai"}
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <span className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 font-mono font-black text-white">
            <Timer className="h-4 w-4 text-cyan-300" />
            {simT.toFixed(1)} s
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        <b>Prosedur terkendali:</b> {cfg.stageNote}
      </div>

      {done && (
        <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <Eye className="h-4 w-4 shrink-0" />
          <p>
            <b>Percobaan {opt?.label} selesai.</b>{" "}
            {readOnly
              ? "Pemutaran ulang selesai; data yang sudah tersimpan tidak diubah."
              : "Volume O₂ dan laju reaksi otomatis tersimpan. Geser ke rangkaian berikutnya."}
          </p>
        </div>
      )}
    </div>
  );
}
