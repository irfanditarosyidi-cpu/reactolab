"use client";

// Learning Mission Map — replaces ModuleGrid on the Student Dashboard.
// Two states:
//   1. Intro/Pemantik: shown when student hasn't started learning yet
//   2. Mission Map: gamified zig-zag learning path with sequential unlock

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { StudentProgress } from "@/lib/types";

// ─── Mission definitions (UI order, NOT backend ID order) ───────────

interface MissionDef {
  backendId: number;      // maps to Module ID in backend
  emoji: string;
  title: string;
  label: string;          // "Misi 1", "Tahap Lanjutan", etc.
}

const MISSIONS: MissionDef[] = [
  { backendId: 1, emoji: "🧪", title: "Faktor Konsentrasi",      label: "Misi 1" },
  { backendId: 2, emoji: "🔬", title: "Faktor Luas Permukaan",   label: "Misi 2" },
  { backendId: 3, emoji: "🌡️", title: "Faktor Suhu",             label: "Misi 3" },
  { backendId: 4, emoji: "⚗️",  title: "Faktor Katalis",          label: "Misi 4" },
  { backendId: 6, emoji: "💬", title: "Forum Diskusi Ilmiah",    label: "Tahap Lanjutan" },
  { backendId: 5, emoji: "📘", title: "Konfirmasi Materi",       label: "Tahap Akhir" },
  { backendId: 7, emoji: "🎉", title: "Penutup",                 label: "Finish" },
];

type NodeState = "current" | "locked" | "completed";

function getLocalKey(uid: string) {
  return `reactolab_started_${uid}`;
}

// ─── Intro Section (Pemantik) ───────────────────────────────────────

export function RustTimelapseCard() {
  return (
    <article className="anim-intro-card overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-sm" style={{ animationDelay: "0.05s" }}>
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-100 to-amber-50/60 px-4 pt-3">
        <svg viewBox="0 0 360 205" className="mt-1 w-full" role="img" aria-label="Animasi timelapse paku besi yang berkarat selama 30 hari">
          <defs>
            <linearGradient id="intro-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#dbe4ee" />
              <stop offset="0.42" stopColor="#718096" />
              <stop offset="0.62" stopColor="#eef2f7" />
              <stop offset="1" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="intro-rust" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7c2d12" />
              <stop offset="0.48" stopColor="#c2410c" />
              <stop offset="1" stopColor="#78350f" />
            </linearGradient>
            <filter id="intro-nail-shadow" x="-20%" y="-50%" width="150%" height="200%">
              <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#0f172a" floodOpacity="0.2" />
            </filter>
            <mask id="intro-rust-mask">
              <rect className="intro-rust-reveal" x="38" y="60" width="290" height="92" rx="30" fill="white" />
            </mask>
          </defs>
          <ellipse cx="180" cy="151" rx="132" ry="16" fill="#64748b" opacity="0.13" />
          <g filter="url(#intro-nail-shadow)" transform="rotate(-7 180 108)">
            <path d="M58 91 H286 L329 110 L286 129 H58 Z" fill="url(#intro-metal)" />
            <rect x="37" y="75" width="29" height="70" rx="8" fill="url(#intro-metal)" />
            <rect x="31" y="69" width="40" height="18" rx="7" fill="#64748b" />
            <path d="M60 94 H284" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
            <g mask="url(#intro-rust-mask)" className="intro-rust-layer">
              <path d="M58 91 H286 L329 110 L286 129 H58 Z" fill="url(#intro-rust)" opacity="0.94" />
              <rect x="37" y="75" width="29" height="70" rx="8" fill="#9a3412" opacity="0.88" />
              <rect x="31" y="69" width="40" height="18" rx="7" fill="#7c2d12" opacity="0.9" />
              {[84, 112, 148, 186, 224, 258, 286].map((x, i) => (
                <circle key={x} cx={x} cy={101 + (i % 3) * 8} r={5 + (i % 2) * 3} fill={i % 2 ? "#f97316" : "#7c2d12"} opacity="0.72" />
              ))}
            </g>
          </g>
          <g className="intro-rust-flakes" fill="#9a3412">
            <circle cx="224" cy="157" r="3" />
            <circle cx="245" cy="163" r="2" />
            <circle cx="268" cy="155" r="2.5" />
          </g>
        </svg>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="intro-time-track bg-amber-100">
          <span className="intro-time-progress intro-time-progress-rust bg-amber-600" />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-bold text-amber-800">
          <span>Hari 0</span><span>Hari 15</span><span>Hari 30</span>
        </div>
        <p className="mt-3 text-center text-base font-black text-slate-800">Besi Berkarat</p>
      </div>
    </article>
  );
}

export function BurningWoodCard() {
  return (
    <article className="anim-intro-card overflow-hidden rounded-2xl border border-orange-200/70 bg-white shadow-sm" style={{ animationDelay: "0.14s" }}>
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-orange-950 px-4 pt-3">
        <svg viewBox="0 0 360 205" className="mt-1 w-full" role="img" aria-label="Animasi kayu yang terbakar dan mengarang dalam 10 menit">
          <defs>
            <linearGradient id="intro-log" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b45309" />
              <stop offset="0.5" stopColor="#78350f" />
              <stop offset="1" stopColor="#451a03" />
            </linearGradient>
            <radialGradient id="intro-ember">
              <stop offset="0" stopColor="#fde68a" />
              <stop offset="0.35" stopColor="#f97316" />
              <stop offset="1" stopColor="#7c2d12" />
            </radialGradient>
            <filter id="intro-fire-blur" x="-40%" y="-40%" width="180%" height="190%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <ellipse cx="180" cy="166" rx="112" ry="18" fill="#fb923c" opacity="0.18" filter="url(#intro-fire-blur)" />
          <g className="intro-fire-glow-code" opacity="0.6" filter="url(#intro-fire-blur)">
            <ellipse cx="180" cy="112" rx="66" ry="74" fill="#f97316" />
          </g>
          <g className="intro-code-flames">
            <path className="intro-code-flame intro-code-flame-back" d="M145 139 C119 112 144 91 153 72 C161 55 155 40 164 28 C188 54 185 79 174 96 C198 77 204 58 200 43 C225 69 222 101 207 119 C197 132 190 140 190 151 Z" fill="#f97316" />
            <path className="intro-code-flame intro-code-flame-main" d="M166 145 C145 119 167 101 176 84 C187 64 181 48 186 37 C211 65 205 91 195 106 C218 91 222 76 220 65 C239 91 225 124 207 143 Z" fill="#facc15" />
            <path className="intro-code-flame intro-code-flame-core" d="M179 147 C166 129 181 116 187 105 C194 93 192 84 195 76 C211 94 207 113 201 123 C214 115 216 106 215 99 C226 117 217 136 207 147 Z" fill="#fff7ed" />
          </g>
          <g transform="rotate(5 180 150)">
            <rect x="82" y="133" width="198" height="37" rx="18" fill="url(#intro-log)" />
            <ellipse cx="280" cy="151.5" rx="18" ry="18.5" fill="#d97706" />
            <ellipse cx="280" cy="151.5" rx="11" ry="12" fill="#92400e" />
            <path d="M103 145 H244 M115 158 H261" stroke="#451a03" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
            <rect className="intro-char-layer" x="82" y="133" width="198" height="37" rx="18" fill="#111827" />
          </g>
          {[128, 158, 205, 231].map((x, i) => (
            <circle key={x} className="intro-code-spark" cx={x} cy={62 + (i % 2) * 22} r={2 + (i % 2)} fill="#fbbf24" style={{ animationDelay: `${i * 0.28}s` }} />
          ))}
          <g fill="url(#intro-ember)">
            <circle cx="124" cy="166" r="4" /><circle cx="174" cy="171" r="3" /><circle cx="230" cy="165" r="4" />
          </g>
        </svg>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="intro-time-track bg-orange-100">
          <span className="intro-time-progress intro-time-progress-fire bg-orange-600" />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-bold text-orange-800">
          <span>Menit 0</span><span>Menit 5</span><span>Menit 10</span>
        </div>
        <p className="mt-3 text-center text-base font-black text-slate-800">Kayu Terbakar</p>
      </div>
    </article>
  );
}

function IntroSection({ onStart }: { onStart: () => void }) {
  const [fadingOut, setFadingOut] = useState(false);

  const handleStart = () => {
    setFadingOut(true);
    setTimeout(onStart, 350);
  };

  return (
    <div className={fadingOut ? "anim-intro-fade-out" : ""}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <h2 className="font-black text-slate-900 text-xl">
            Manakah yang lebih cepat?
          </h2>
        </div>

        {/* Code-native reaction-rate comparison */}
        <div className="mx-auto grid max-w-4xl gap-5 px-6 py-5 sm:grid-cols-2">
          <RustTimelapseCard />
          <BurningWoodCard />
        </div>

        {/* Pemantik text + CTA */}
        <div className="px-6 pb-6 text-center">
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 mb-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              Besi berkarat membutuhkan hitungan <strong>hari</strong>, sedangkan kayu terbakar berubah dalam hitungan <strong>menit</strong>. Reaksi kimia ternyata berlangsung dengan kecepatan berbeda-beda.{" "}
              <span className="font-semibold text-slate-800">
                Kira-kira apa yang membuatnya begitu?
              </span>
            </p>
            <p className="text-sm text-brand-700 font-bold mt-2">
              Yuk selidiki lewat 4 misi laboratorium!
            </p>
          </div>
          <Button size="lg" onClick={handleStart} className="shadow-lg px-8">
            🚀 Mulai Belajar
          </Button>
        </div>
      </div>
    </div>
  );
}
// ─── Road Map SVG ───────────────────────────────────────────────────

// Checkpoint positions are matched to the static pre-rendered 3D road assets.
// The road itself is deliberately a raster image, not an interactive 3D scene.
const DESKTOP_NODES = [
  { x: 8.2,  y: 58.3 },
  { x: 23.5, y: 74.2 },
  { x: 35.4, y: 28.8 },
  { x: 49.5, y: 68.5 },
  { x: 62.1, y: 28.8 },
  { x: 76.9, y: 69.0 },
  { x: 91.5, y: 20.2 },
];

const MOBILE_NODES = [
  { x: 21.0, y: 7.4 },
  { x: 63.1, y: 19.9 },
  { x: 28.4, y: 32.7 },
  { x: 71.0, y: 46.4 },
  { x: 31.6, y: 59.0 },
  { x: 70.8, y: 76.0 },
  { x: 48.4, y: 88.5 },
];

type MapPoint = { x: number; y: number };

function getWalkerPosition(
  nodes: MapPoint[],
  currentIndex: number,
  completionPercent: number
): MapPoint & { facingLeft: boolean } {
  const from = nodes[currentIndex] ?? nodes[0];
  const to = nodes[currentIndex + 1];

  if (!to) return { ...from, facingLeft: false };

  // Start just after the current checkpoint and approach the next one as the
  // active module progresses. Smoothstep follows the road's rounded bends.
  const progress = Math.min(1, Math.max(0, completionPercent / 100));
  const t = 0.12 + progress * 0.76;
  const smoothT = t * t * (3 - 2 * t);

  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * smoothT,
    facingLeft: to.x < from.x,
  };
}

function LabStudentWalker({
  position,
  walking,
}: {
  position: MapPoint & { facingLeft: boolean };
  walking: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute z-30 transition-[left,top] duration-700 ease-out motion-reduce:transition-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -100%) translateY(-4px)",
      }}
      role="img"
      aria-label="Posisi siswa di jalur pembelajaran"
    >
      <div className={cn("lab-walker", !walking && "lab-walker-idle")}>
        <svg
          viewBox="0 0 72 98"
          className="h-[72px] w-[54px] sm:h-[82px] sm:w-[62px]"
          style={{ transform: position.facingLeft ? "scaleX(-1)" : undefined }}
          aria-hidden="true"
        >
          <ellipse className="lab-walker-shadow" cx="37" cy="93" rx="21" ry="4" fill="#0f172a" opacity="0.2" />

          <g className="lab-walker-body">
            <g className="lab-walker-leg lab-walker-leg-back">
              <path d="M34 68 L30 88" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="27" cy="91" rx="8" ry="4" fill="#172033" />
            </g>
            <g className="lab-walker-leg lab-walker-leg-front">
              <path d="M43 68 L48 88" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
              <ellipse cx="52" cy="91" rx="8" ry="4" fill="#172033" />
            </g>

            <g className="lab-walker-arm lab-walker-arm-back">
              <path d="M25 45 L15 63" stroke="#f1c7a5" strokeWidth="7" strokeLinecap="round" />
              <path d="M27 43 L19 57" stroke="white" strokeWidth="10" strokeLinecap="round" />
            </g>
            <g className="lab-walker-arm lab-walker-arm-front">
              <path d="M49 45 L58 62" stroke="#f1c7a5" strokeWidth="7" strokeLinecap="round" />
              <path d="M47 43 L55 57" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
            </g>

            <path d="M24 40 Q36 34 49 40 L53 72 Q38 79 20 72 Z" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M36 39 L32 70 M36 39 L42 70" fill="none" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M28 41 L36 50 L45 41" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
            <rect x="39" y="55" width="10" height="9" rx="2" fill="#eff6ff" stroke="#93c5fd" />
            <path d="M44 57 V62 M41.5 59.5 H46.5" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />

            <rect x="31" y="32" width="12" height="10" rx="5" fill="#efbd98" />
            <circle cx="37" cy="22" r="16" fill="#f3c9a8" />
            <path d="M22 22 Q21 5 37 4 Q53 5 53 23 Q48 16 42 13 Q32 19 22 22" fill="#26364d" />
            <path d="M23 18 Q20 24 24 29" fill="none" stroke="#26364d" strokeWidth="4" strokeLinecap="round" />
            <circle cx="31.5" cy="23" r="4.5" fill="#e0f2fe" fillOpacity="0.8" stroke="#334155" strokeWidth="1.5" />
            <circle cx="43" cy="23" r="4.5" fill="#e0f2fe" fillOpacity="0.8" stroke="#334155" strokeWidth="1.5" />
            <path d="M36 23 H38.5" stroke="#334155" strokeWidth="1.5" />
            <circle cx="32" cy="23" r="1.2" fill="#172033" />
            <circle cx="43" cy="23" r="1.2" fill="#172033" />
            <path d="M33 30 Q37 33 42 29" fill="none" stroke="#9f5f55" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─── Road Map Node (roundabout style) ───────────────────────────────

function RoadNode({
  mission,
  state,
  prevLabel,
}: {
  mission: MissionDef;
  state: NodeState;
  prevLabel: string;
}) {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [shaking, setShaking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = useCallback(() => {
    if (state === "locked") {
      setShaking(true);
      setShowTooltip(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShaking(false);
        setShowTooltip(false);
      }, 2000);
      return;
    }
    router.push(`/student/modules/${mission.backendId}`);
  }, [state, mission.backendId, router]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const isFinish = mission.label === "Finish";

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip for locked */}
      {showTooltip && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-800 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap anim-fade-slide-up">
          🔒 Selesaikan {prevLabel} terlebih dahulu
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      )}

      {/* Sparkle for current */}
      {state === "current" && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-base anim-sparkle z-10">✨</span>
      )}

      {/* Emoji above the roundabout */}
      <span className={cn(
        "text-2xl mb-1 transition-all z-10",
        state === "current" && "anim-float-node",
        state === "locked" && "text-black",
        isFinish && "text-3xl"
      )}>
        {state === "locked" ? (
          <Lock className="h-6 w-6 text-black" strokeWidth={2.5} />
        ) : mission.emoji}
      </span>

      {/* Roundabout circle */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${mission.label}: ${mission.title}${state === "locked" ? " (terkunci)" : ""}`}
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all duration-200",
          "w-12 h-12",
          shaking && "anim-shake",
          state === "current" && "bg-brand-600 shadow-lg anim-pulse-glow ring-4 ring-brand-200 hover:-translate-y-1 hover:shadow-xl",
          state === "completed" && "bg-emerald-500 shadow-card hover:-translate-y-1 hover:shadow-md",
          state === "locked" && "bg-slate-300 cursor-not-allowed"
        )}
      >
        {/* Inner circle (white inset) */}
        <div className={cn(
          "rounded-full w-8 h-8 flex items-center justify-center",
          state === "current" && "bg-white/20",
          state === "completed" && "bg-white/30",
          state === "locked" && "bg-white/40"
        )}>
          {state === "completed" && (
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          )}
          {state === "current" && (
            <div className="w-3 h-3 rounded-full bg-white" />
          )}
          {state === "locked" && (
            <Lock className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
          )}
        </div>
      </button>

      {/* Label below */}
      <div
        className={cn(
          "relative z-20 mt-2 w-[108px] rounded-lg border px-2 py-1.5 text-center shadow-md backdrop-blur-sm sm:w-[124px]",
          state === "completed" && "border-emerald-200 bg-white/95",
          state === "current" && "border-brand-200 bg-white/95 ring-1 ring-brand-100",
          state === "locked" && "border-slate-200 bg-slate-50/95"
        )}
      >
        {state === "current" && (
          <span className="mb-1 inline-block rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-black uppercase leading-none tracking-wide text-brand-700">
            Saat Ini
          </span>
        )}
        <p className={cn(
          "text-[11px] font-extrabold leading-snug sm:text-xs",
          state === "current" && "mt-0.5",
          state === "locked" ? "text-slate-600" : "text-slate-800"
        )}>
          {mission.title}
        </p>
      </div>
    </div>
  );
}

// ─── Mission Map ────────────────────────────────────────────────────

function MissionMap({
  progress,
  uid,
}: {
  progress: StudentProgress | null;
  uid: string;
}) {

  // Derive node states from progress
  const nodeStates = useMemo<NodeState[]>(() => {
    const states: NodeState[] = [];
    let foundCurrent = false;
    for (const m of MISSIONS) {
      const mp = progress?.modules?.[String(m.backendId)];
      const status = mp?.status ?? "locked";
      if (status === "completed") {
        states.push("completed");
      } else if (!foundCurrent) {
        states.push("current");
        foundCurrent = true;
      } else {
        states.push("locked");
      }
    }
    if (!foundCurrent && states.length > 0) {
      const idx = states.findIndex((s) => s !== "completed");
      if (idx >= 0) states[idx] = "current";
    }
    return states;
  }, [progress]);

  const currentStateIndex = nodeStates.findIndex((state) => state === "current");
  const currentNodeIndex = currentStateIndex >= 0 ? currentStateIndex : MISSIONS.length - 1;
  const courseComplete = nodeStates.every((state) => state === "completed");
  const activeMission = MISSIONS[currentNodeIndex];
  const activeCompletion = courseComplete
    ? 100
    : (progress?.modules?.[String(activeMission.backendId)]?.completionPercent ?? 0);
  const desktopWalker = getWalkerPosition(DESKTOP_NODES, currentNodeIndex, activeCompletion);
  const mobileWalker = getWalkerPosition(MOBILE_NODES, currentNodeIndex, activeCompletion);

  const prevLabel = (i: number) => {
    if (i === 0) return "langkah sebelumnya";
    return MISSIONS[i - 1].label + " — " + MISSIONS[i - 1].title;
  };

  return (
    <div className="anim-fade-slide-up">
      {/* Section header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-black text-slate-900 text-lg">Peta Belajarmu</h2>
        <Link
          href="/student/modules"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          Lihat semua →
        </Link>
      </div>

      {/* ═══ DESKTOP ROAD MAP ═══ */}
      <div
        className="relative hidden w-full overflow-visible md:block"
        style={{ aspectRatio: "1774 / 520" }}
      >
        <Image
          src="/images/mission-map/mission-road-3d-desktop.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 1152px, 100vw"
          className="pointer-events-none select-none object-contain mix-blend-multiply"
          aria-hidden="true"
        />
        <LabStudentWalker position={desktopWalker} walking={!courseComplete} />

        {/* Nodes overlaid */}
        <div className="absolute inset-0 z-10">
          {MISSIONS.map((m, i) => {
            const node = DESKTOP_NODES[i];
            return (
              <div
                key={m.backendId}
                className="absolute"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -52px)",
                }}
              >
                <RoadNode
                  mission={m}
                  state={nodeStates[i]}
                  prevLabel={prevLabel(i)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ MOBILE ROAD MAP ═══ */}
      <div
        className="relative w-full overflow-visible md:hidden"
        style={{ aspectRatio: "832 / 1536" }}
      >
        <Image
          src="/images/mission-map/mission-road-3d-mobile.png"
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none select-none object-contain mix-blend-multiply"
          aria-hidden="true"
        />
        <LabStudentWalker position={mobileWalker} walking={!courseComplete} />

        {/* Nodes */}
        <div className="absolute inset-0 z-10">
          {MISSIONS.map((m, i) => {
            const node = MOBILE_NODES[i];
            return (
              <div
                key={m.backendId}
                className="absolute"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: "translate(-50%, -52px)",
                }}
              >
                <RoadNode
                  mission={m}
                  state={nodeStates[i]}
                  prevLabel={prevLabel(i)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function LearningMissionMap({
  progress,
  uid,
}: {
  progress: StudentProgress | null;
  uid: string;
}) {
  const [hasStarted, setHasStarted] = useState<boolean | null>(null); // null = loading

  // Read localStorage on mount
  useEffect(() => {
    const key = getLocalKey(uid);
    const stored = localStorage.getItem(key);
    if (stored === "true") {
      setHasStarted(true);
    } else {
      // Also check: if progress indicates any module beyond 0 has been started,
      // treat as already started (returning student / different device)
      const modules = progress?.modules ?? {};
      const anyStarted = Object.entries(modules).some(([id, mp]) => {
        if (id === "0") return false; // skip orientasi
        return mp.status === "in_progress" || mp.status === "completed";
      });
      if (anyStarted) {
        localStorage.setItem(key, "true");
        setHasStarted(true);
      } else {
        setHasStarted(false);
      }
    }
  }, [uid, progress]);

  const handleStart = useCallback(() => {
    const key = getLocalKey(uid);
    localStorage.setItem(key, "true");
    setHasStarted(true);
  }, [uid]);

  // Still loading check
  if (hasStarted === null) return null;

  if (!hasStarted) {
    return <IntroSection onStart={handleStart} />;
  }

  return <MissionMap progress={progress} uid={uid} />;
}
