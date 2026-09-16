"use client";

import { useEffect, useMemo, useState } from "react";
import M4Mechanism3D, { type MechanismMode } from "./M4Mechanism3D";

type LegendItem = {
  label: string;
  color: string;
  ring?: string;
};

type ModeDefinition = {
  label: string;
  shortLabel: string;
  category: string;
  accent: string;
  soft: string;
  description: string;
  barrier: number;
  contexts: readonly string[];
  legend: readonly LegendItem[];
};

const MODES: Record<MechanismMode, ModeDefinition> = {
  tanpa: {
    label: "Tanpa Katalis",
    shortLabel: "Kontrol",
    category: "Reaksi tanpa katalis",
    accent: "#64748b",
    soft: "#f1f5f9",
    description:
      "H₂O₂ bergerak bebas. Sebagian besar tumbukan tidak efektif karena harus melewati energi aktivasi yang tinggi.",
    barrier: 126,
    contexts: [
      "Molekul H₂O₂ bergerak bebas",
      "Tumbukan kurang efektif",
      "Energi aktivasi tinggi",
      "H₂O dan O₂ terbentuk",
      "Reaksi berikutnya tetap sulit",
    ],
    legend: [
      { label: "Atom H", color: "#e2e8f0", ring: "#94a3b8" },
      { label: "Atom O", color: "#ef4444", ring: "#991b1b" },
      { label: "Tumbukan tidak efektif", color: "#94a3b8" },
    ],
  },
  mno2: {
    label: "MnO₂",
    shortLabel: "MnO₂",
    category: "Katalis anorganik heterogen",
    accent: "#2563eb",
    soft: "#eff6ff",
    description:
      "H₂O₂ teradsorpsi pada situs aktif permukaan MnO₂ yang kasar, lalu produk dilepas dan situs aktif pulih.",
    barrier: 74,
    contexts: [
      "H₂O₂ mendekati permukaan",
      "Teradsorpsi pada situs aktif",
      "Ikatan O–O melemah",
      "H₂O dan O₂ dilepaskan",
      "Situs aktif MnO₂ beregenerasi",
    ],
    legend: [
      { label: "Atom H", color: "#e2e8f0", ring: "#94a3b8" },
      { label: "Atom O", color: "#ef4444", ring: "#991b1b" },
      { label: "Situs aktif MnO₂", color: "#2563eb", ring: "#1e3a8a" },
    ],
  },
  fecl3: {
    label: "FeCl₃",
    shortLabel: "FeCl₃",
    category: "Katalis anorganik homogen",
    accent: "#d97706",
    soft: "#fffbeb",
    description:
      "Spesies Fe³⁺ dan Fe²⁺ berinteraksi dengan H₂O₂ di dalam larutan, menjalani siklus sementara, lalu kembali pulih.",
    barrier: 74,
    contexts: [
      "H₂O₂ mendekati spesies Fe³⁺",
      "Interaksi berlangsung dalam larutan",
      "Fe³⁺ berubah sementara menjadi Fe²⁺",
      "H₂O dan O₂ dilepaskan",
      "Spesies Fe³⁺ terbentuk kembali",
    ],
    legend: [
      { label: "Atom H", color: "#e2e8f0", ring: "#94a3b8" },
      { label: "Atom O", color: "#ef4444", ring: "#991b1b" },
      { label: "Fe³⁺", color: "#f59e0b", ring: "#92400e" },
      { label: "Fe²⁺", color: "#8b5cf6", ring: "#5b21b6" },
    ],
  },
  katalase: {
    label: "Ekstrak Hati",
    shortLabel: "Ekstrak Hati",
    category: "Katalis biologis · enzim katalase",
    accent: "#059669",
    soft: "#ecfdf5",
    description:
      "H₂O₂ masuk ke kantong aktif katalase, diuraikan menjadi H₂O dan O₂, lalu enzim kembali siap digunakan.",
    barrier: 74,
    contexts: [
      "H₂O₂ mendekati enzim katalase",
      "Substrat terikat pada kantong aktif",
      "Ikatan H₂O₂ menjadi tidak stabil",
      "Produk dilepaskan dari enzim",
      "Enzim katalase siap digunakan lagi",
    ],
    legend: [
      { label: "Atom H", color: "#e2e8f0", ring: "#94a3b8" },
      { label: "Atom O", color: "#ef4444", ring: "#991b1b" },
      { label: "Enzim katalase", color: "#10b981", ring: "#065f46" },
      { label: "Kantong aktif", color: "#fbbf24", ring: "#92400e" },
    ],
  },
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

function modeFromLabel(label: string): MechanismMode {
  const normalized = label.toLowerCase();
  if (normalized.includes("mno")) return "mno2";
  if (normalized.includes("fecl")) return "fecl3";
  if (normalized.includes("hati") || normalized.includes("katalase")) {
    return "katalase";
  }
  return "tanpa";
}

function phaseIndex(progress: number) {
  return Math.min(4, Math.floor(clamp(progress) * 5));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function MechanismLegend({ mode }: { mode: MechanismMode }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 bg-white px-4 py-3"
      aria-label="Keterangan visual"
    >
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        Keterangan
      </span>
      {MODES[mode].legend.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 sm:text-xs"
        >
          <span
            className="h-3 w-3 rounded-full border"
            style={{
              backgroundColor: item.color,
              borderColor: item.ring ?? item.color,
            }}
            aria-hidden="true"
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ReactionMechanismPanel({
  mode,
  progress,
  playing,
  reducedMotion,
}: {
  mode: MechanismMode;
  progress: number;
  playing: boolean;
  reducedMotion: boolean;
}) {
  const definition = MODES[mode];
  const context = definition.contexts[phaseIndex(progress)];
  const contextPosition = (clamp(progress) * 5) % 1;
  const contextOpacity =
    contextPosition < 0.12
      ? 0.55 + (contextPosition / 0.12) * 0.45
      : contextPosition > 0.84
        ? 0.55 + ((1 - contextPosition) / 0.16) * 0.45
        : 1;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-labelledby="mechanism-heading"
    >
      <div className="flex flex-col gap-1 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: definition.accent }}
          >
            {definition.category}
          </p>
          <h3
            id="mechanism-heading"
            className="mt-0.5 text-sm font-black text-slate-800 sm:text-base"
          >
            Animasi mekanisme reaksi 3D
          </h3>
        </div>
        <span className="text-xs font-black text-slate-500">
          2 H₂O₂ → 2 H₂O + O₂
        </span>
      </div>

      <div className="relative bg-slate-50">
        <M4Mechanism3D
          mode={mode}
          progress={progress}
          playing={playing}
          reducedMotion={reducedMotion}
        />
        <div
          className="pointer-events-none absolute left-3 top-3 z-20 max-w-[68%] rounded-full border bg-white/90 px-3 py-1.5 text-[10px] font-black shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:text-xs"
          style={{
            color: definition.accent,
            borderColor: `${definition.accent}55`,
            opacity: contextOpacity,
            transition: "opacity 140ms linear",
          }}
          aria-live="polite"
        >
          {context}
        </div>
      </div>

      <MechanismLegend mode={mode} />
    </section>
  );
}

function energyPoint(progress: number, barrier: number) {
  const p = clamp(progress);
  return {
    x: 50 + p * 290,
    y: 190 + p * 18 - barrier * Math.sin(Math.PI * p),
  };
}

function energyPath(barrier: number) {
  return Array.from({ length: 61 }, (_, index) => {
    const point = energyPoint(index / 60, barrier);
    return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }).join(" ");
}

function EnergyDiagramPanel({
  mode,
  progress,
}: {
  mode: MechanismMode;
  progress: number;
}) {
  const definition = MODES[mode];
  const activePath = useMemo(
    () => energyPath(definition.barrier),
    [definition.barrier],
  );
  const controlPath = useMemo(() => energyPath(MODES.tanpa.barrier), []);
  const marker = energyPoint(progress, definition.barrier);
  const catalyzed = mode !== "tanpa";

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-labelledby="energy-heading"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <p
          className="text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: definition.accent }}
        >
          Jalur reaksi kualitatif
        </p>
        <h3
          id="energy-heading"
          className="mt-0.5 text-sm font-black text-slate-800 sm:text-base"
        >
          Diagram energi
        </h3>
      </div>

      <div className="px-2 pb-2 pt-3">
        <svg
          viewBox="0 0 390 292"
          className="mx-auto block w-full max-w-[440px]"
          role="img"
          aria-label={`Diagram energi ${definition.label}. ${
            catalyzed
              ? "Jalur berkatalis memiliki energi aktivasi lebih rendah daripada jalur tanpa katalis."
              : "Energi aktivasi tanpa katalis lebih tinggi."
          }`}
        >
          <defs>
            <marker
              id="energy-axis-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 7 3.5 0 7Z" fill="#64748b" />
            </marker>
            <filter
              id="energy-marker-shadow"
              x="-80%"
              y="-80%"
              width="260%"
              height="260%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2"
                floodColor="#0f172a"
                floodOpacity="0.25"
              />
            </filter>
          </defs>

          <rect x="0" y="0" width="390" height="292" rx="16" fill="#f8fafc" />
          {[68, 108, 148, 188].map((y) => (
            <line
              key={y}
              x1="50"
              y1={y}
              x2="350"
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="5 6"
            />
          ))}
          <line
            x1="50"
            y1="230"
            x2="354"
            y2="230"
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#energy-axis-arrow)"
          />
          <line
            x1="50"
            y1="230"
            x2="50"
            y2="24"
            stroke="#64748b"
            strokeWidth="2"
            markerEnd="url(#energy-axis-arrow)"
          />
          <text
            x="203"
            y="274"
            textAnchor="middle"
            fill="#475569"
            fontSize="12"
            fontWeight="900"
          >
            Koordinat Reaksi
          </text>
          <text
            x="16"
            y="128"
            textAnchor="middle"
            fill="#475569"
            fontSize="12"
            fontWeight="900"
            transform="rotate(-90 16 128)"
          >
            Energi
          </text>

          {catalyzed && (
            <>
              <path
                d={controlPath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeDasharray="7 7"
                opacity="0.72"
              />
              <text
                x="198"
                y="46"
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontWeight="800"
              >
                tanpa katalis · barrier tinggi
              </text>
            </>
          )}

          <path
            d={activePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={activePath}
            fill="none"
            stroke={definition.accent}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={marker.x}
            cy={marker.y}
            r="8"
            fill={definition.accent}
            stroke="white"
            strokeWidth="3"
            filter="url(#energy-marker-shadow)"
          />
          <line
            x1={marker.x}
            y1={marker.y + 11}
            x2={marker.x}
            y2="230"
            stroke={definition.accent}
            strokeWidth="1.5"
            strokeDasharray="4 5"
            opacity="0.45"
          />
          <text x="52" y="220" fill="#475569" fontSize="10" fontWeight="800">
            H₂O₂
          </text>
          <text
            x="335"
            y="220"
            textAnchor="end"
            fill="#475569"
            fontSize="10"
            fontWeight="800"
          >
            H₂O + O₂
          </text>
          <g transform={`translate(68 ${catalyzed ? 82 : 54})`}>
            <rect
              width={catalyzed ? 155 : 183}
              height="28"
              rx="10"
              fill="white"
              stroke={definition.accent}
              strokeOpacity="0.35"
            />
            <text
              x="12"
              y="18"
              fill={definition.accent}
              fontSize="10"
              fontWeight="900"
            >
              {catalyzed
                ? "Energi aktivasi lebih rendah"
                : "Energi aktivasi lebih tinggi"}
            </text>
          </g>
        </svg>
      </div>

      <div className="border-t border-slate-200 px-4 py-3 text-[10px] leading-relaxed text-slate-500 sm:text-xs">
        {catalyzed ? (
          <>
            Garis putus-putus menunjukkan jalur tanpa katalis. Jalur{" "}
            <b style={{ color: definition.accent }}>
              {definition.shortLabel}
            </b>{" "}
            menyediakan barrier yang lebih rendah.
          </>
        ) : (
          <>
            Tanpa jalur alternatif, reaksi harus melewati barrier energi yang
            lebih tinggi.
          </>
        )}
        <span className="mt-1 block font-semibold text-slate-400">
          Diagram bersifat konseptual dan tidak menyatakan nilai energi absolut
          atau peringkat antar-katalis.
        </span>
      </div>
    </section>
  );
}

function ProgressControl({
  mode,
  progress,
  running,
  reducedMotion,
  onProgressChange,
}: {
  mode: MechanismMode;
  progress: number;
  running: boolean;
  reducedMotion: boolean;
  onProgressChange: (progress: number) => void;
}) {
  const definition = MODES[mode];
  const context = definition.contexts[phaseIndex(progress)];
  const percentage = Math.round(progress * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          htmlFor="m4-reaction-progress"
          className="text-[10px] font-black uppercase tracking-wider text-slate-500 sm:text-xs"
        >
          Reaction progress
        </label>
        <output
          htmlFor="m4-reaction-progress"
          className="text-xs font-black tabular-nums"
          style={{ color: definition.accent }}
        >
          {percentage}%
        </output>
      </div>
      <input
        id="m4-reaction-progress"
        type="range"
        min="0"
        max="100"
        step="1"
        value={percentage}
        onChange={(event) =>
          onProgressChange(Number(event.target.value) / 100)
        }
        aria-label="Progres mekanisme reaksi"
        aria-valuetext={`${percentage} persen, ${context}`}
        className="h-2 w-full cursor-pointer accent-blue-600"
        style={{ accentColor: definition.accent }}
      />
      <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-400">
        <span
          className={`h-2 w-2 rounded-full ${
            running ? "animate-pulse bg-emerald-500" : "bg-slate-300"
          }`}
          aria-hidden="true"
        />
        <span>
          {running
            ? "Bergerak mengikuti simulasi makroskopik"
            : "Geser slider untuk mengamati mekanisme secara manual"}
        </span>
      </div>
      {reducedMotion && (
        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          Gerakan dekoratif diminimalkan sesuai preferensi perangkat.
        </p>
      )}
    </div>
  );
}

export default function M4MechanismView({
  progress,
  catalystLabel,
  running = false,
  embedded = false,
}: {
  progress: number;
  catalystLabel: string;
  running?: boolean;
  embedded?: boolean;
}) {
  const mode = modeFromLabel(catalystLabel);
  const [reactionProgress, setReactionProgress] = useState(() =>
    clamp(progress),
  );
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setReactionProgress(clamp(progress));
  }, [progress]);

  return (
    <div
      className={
        embedded
          ? "bg-slate-50 p-3 sm:p-4"
          : "min-h-full bg-slate-50 px-3 pb-6 pt-16 sm:px-5 sm:pb-8"
      }
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <ReactionMechanismPanel
            mode={mode}
            progress={reactionProgress}
            playing={running}
            reducedMotion={reducedMotion}
          />
          <EnergyDiagramPanel mode={mode} progress={reactionProgress} />
        </div>

        <div className="mt-4">
          <ProgressControl
            mode={mode}
            progress={reactionProgress}
            running={running}
            reducedMotion={reducedMotion}
            onProgressChange={(nextProgress) =>
              setReactionProgress(clamp(nextProgress))
            }
          />
        </div>

        <p className="mt-3 px-1 text-[10px] leading-relaxed text-slate-400 sm:text-xs">
          <b className="text-slate-500">Model konseptual:</b> visualisasi 3D
          menyederhanakan mekanisme pada tingkat partikel. Katalis menyediakan
          jalur alternatif berenergi aktivasi lebih rendah dan kembali tersedia
          setelah reaksi.
        </p>
      </div>
    </div>
  );
}
