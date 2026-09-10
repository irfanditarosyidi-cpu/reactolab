"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { memo, useId, type ReactNode } from "react";

export interface M1LabApparatusProps {
  factor: number;
  label: string;
  progress: number;
  running: boolean;
  magnifierOpen: boolean;
  onMagnifierClick: () => void;
  zoomEnabled: boolean;
  onZoomModeToggle: () => void;
  lensOverlay?: ReactNode;
  /** Optional explicit playback state. Falls back to running/progress. */
  started?: boolean;
  /** Simulation playback multiplier. It never depends on concentration. */
  playbackRate?: number;
  /** Current simulated time in seconds. Defaults to progress × duration. */
  simTime?: number;
  /** Total simulated duration in seconds. Defaults to the Module 1 timing model. */
  duration?: number;
}

interface BubbleEventSpec {
  at: number;
  x: number;
  y: number;
  r: number;
  rise: number;
  drift: number;
}

interface PitSpec {
  x: number;
  y: number;
  r: number;
  threshold: number;
}

const TOTAL_BUBBLE_EVENTS = 72;
const BUBBLE_LIFETIME_SECONDS = 1.65;

function hash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const BUBBLE_EVENTS: BubbleEventSpec[] = Array.from(
  { length: TOTAL_BUBBLE_EVENTS },
  (_, i) => ({
    // Each event occupies its own normalized time bin. Every condition therefore
    // emits the same total number of representative bubbles by progress=1.
    at: (i + 0.12 + hash(i + 131) * 0.72) / TOTAL_BUBBLE_EVENTS,
    // Every bubble begins on, or immediately above, the immersed Mg ribbon.
    x: 323 + hash(i + 3) * 100,
    y: 293 - hash(i + 19) * 17,
    r: 2.6 + hash(i + 41) * 3.5,
    rise: 102 + hash(i + 67) * 92,
    drift: (hash(i + 89) - 0.5) * 34,
  }),
);

const PITS: PitSpec[] = Array.from({ length: 16 }, (_, i) => {
  const t = hash(i + 151);
  return {
    x: 329 + t * 87,
    y: 294 - t * 19 + (hash(i + 173) - 0.5) * 5,
    r: 1.25 + hash(i + 197) * 1.8,
    threshold: 0.08 + (i / 16) * 0.82,
  };
});

function rateLabel(factor: number): string {
  if (factor < 1.15) return "rendah";
  if (factor < 2.15) return "sedang";
  return "tinggi";
}

export default memo(function M1LabApparatus({
  factor,
  label,
  progress,
  running,
  magnifierOpen,
  onMagnifierClick,
  zoomEnabled,
  onZoomModeToggle,
  lensOverlay,
  started,
  playbackRate = 1,
  simTime,
  duration,
}: M1LabApparatusProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `m1-${name}-${uid}`;
  const safeProgress = Math.min(1, Math.max(0, progress));
  const concentration = Math.min(1, Math.max(0, factor / 3));
  const hasStarted = started ?? (running || safeProgress > 0.0001);
  const reactionComplete = safeProgress >= 1;
  const animationRate = Math.min(8, Math.max(0.25, playbackRate));
  const effectiveDuration = Math.max(
    0.1,
    duration ?? 18 / Math.max(0.05, factor),
  );
  const effectiveSimTime = Math.min(
    effectiveDuration,
    Math.max(0, simTime ?? safeProgress * effectiveDuration),
  );
  const ribbonWidth = Math.max(1.5, 10.5 - safeProgress * 8.3);
  const pitCount = PITS.filter((pit) => safeProgress >= pit.threshold).length;
  const frequencyLevel =
    !hasStarted || reactionComplete
      ? 0
      : Math.min(5, Math.max(1, Math.round(concentration * 5)));
  const frequencyText = !hasStarted
    ? "Belum dimulai"
    : reactionComplete
      ? "0 · Mg habis"
      : rateLabel(factor);

  const activeBubbles =
    hasStarted && !reactionComplete
      ? BUBBLE_EVENTS.flatMap((bubble, index) => {
          const emittedAt = bubble.at * effectiveDuration;
          const age = effectiveSimTime - emittedAt;
          if (age < 0 || age >= BUBBLE_LIFETIME_SECONDS) return [];

          const phase = age / BUBBLE_LIFETIME_SECONDS;
          const fadeIn = Math.min(1, phase / 0.1);
          const fadeOut = Math.min(1, (1 - phase) / 0.2);
          return [
            {
              ...bubble,
              index,
              x: bubble.x + bubble.drift * phase,
              y: bubble.y - bubble.rise * phase,
              r: bubble.r * (0.72 + phase * 0.38),
              opacity: Math.max(0, Math.min(fadeIn, fadeOut)) * 0.94,
            },
          ];
        })
      : [];

  const titleId = id("title");
  const descriptionId = id("description");
  const flaskClipId = id("flask-clip");
  const flaskGlassId = id("flask-glass");
  const liquidId = id("liquid");
  const metalId = id("metal");
  const ribbonMaskId = id("ribbon-mask");
  const benchId = id("bench");
  const benchFrontId = id("bench-front");
  const wallId = id("wall");
  const bottleId = id("bottle");
  const shadowId = id("shadow");
  const softShadowId = id("soft-shadow");
  const glassGlowId = id("glass-glow");

  return (
    <div className="relative mx-auto w-full max-w-[760px] select-none">
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
        <div className="relative h-[270px] bg-slate-100 sm:h-[380px] lg:h-[430px]">
          <svg
            viewBox="0 0 760 440"
            preserveAspectRatio="xMidYMid meet"
            className="block h-full w-full"
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            <title id={titleId}>Simulasi reaksi magnesium dengan larutan HCl</title>
            <desc id={descriptionId}>
              Labu Erlenmeyer terbuka berisi 20 mililiter larutan HCl bening dan
              pita magnesium. Gelembung gas hidrogen terbentuk di permukaan
              magnesium. Konsentrasi yang lebih tinggi meningkatkan frekuensi
              pembentukan gelembung, bukan kecepatan naik gelembung.
            </desc>

            <defs>
              <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f8fbff" />
                <stop offset="0.58" stopColor="#edf4fb" />
                <stop offset="1" stopColor="#dfe8f2" />
              </linearGradient>
              <linearGradient id={benchId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d7b98d" />
                <stop offset="0.48" stopColor="#bd9361" />
                <stop offset="1" stopColor="#9a6b3d" />
              </linearGradient>
              <linearGradient id={benchFrontId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8e6038" />
                <stop offset="1" stopColor="#5f3d25" />
              </linearGradient>
              <linearGradient id={flaskGlassId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
                <stop offset="0.28" stopColor="#dbeafe" stopOpacity="0.12" />
                <stop offset="0.64" stopColor="#ffffff" stopOpacity="0.28" />
                <stop offset="1" stopColor="#94a3b8" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.44" />
                <stop offset="0.45" stopColor="#e0f2fe" stopOpacity="0.28" />
                <stop offset="1" stopColor="#bfdbfe" stopOpacity="0.38" />
              </linearGradient>
              <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#64748b" />
                <stop offset="0.18" stopColor="#f8fafc" />
                <stop offset="0.42" stopColor="#94a3b8" />
                <stop offset="0.68" stopColor="#f1f5f9" />
                <stop offset="1" stopColor="#64748b" />
              </linearGradient>
              <linearGradient id={bottleId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e0f2fe" stopOpacity="0.78" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.42" />
                <stop offset="1" stopColor="#93c5fd" stopOpacity="0.4" />
              </linearGradient>
              <radialGradient id={glassGlowId} cx="35%" cy="20%" r="70%">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.96" />
                <stop offset="0.28" stopColor="#e0f2fe" stopOpacity="0.7" />
                <stop offset="0.76" stopColor="#7dd3fc" stopOpacity="0.38" />
                <stop offset="1" stopColor="#0284c7" stopOpacity="0.58" />
              </radialGradient>
              <filter id={shadowId} x="-40%" y="-40%" width="180%" height="190%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <filter id={softShadowId} x="-40%" y="-40%" width="180%" height="190%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.18" />
              </filter>
              <clipPath id={flaskClipId}>
                <path d="M329 89 L329 157 L246 296 Q228 328 258 341 Q274 348 304 348 L456 348 Q486 348 502 341 Q532 328 514 296 L431 157 L431 89 Z" />
              </clipPath>
              <mask id={ribbonMaskId} maskUnits="userSpaceOnUse" x="300" y="258" width="145" height="62">
                <rect x="300" y="258" width="145" height="62" fill="black" />
                <path
                  d="M322 301 C347 296 373 290 421 280"
                  fill="none"
                  stroke="white"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                {PITS.slice(0, pitCount).map((pit, index) => (
                  <circle key={index} cx={pit.x} cy={pit.y} r={pit.r} fill="black" />
                ))}
              </mask>
            </defs>

            {/* Laboratory wall and soft architectural depth. */}
            <rect width="760" height="440" fill={`url(#${wallId})`} />
            <circle cx="380" cy="132" r="250" fill="#ffffff" opacity="0.42" />
            <path d="M0 77 H760 M0 151 H760 M0 225 H760" stroke="#cbd5e1" strokeOpacity="0.28" />
            <path d="M94 0 V286 M260 0 V286 M496 0 V286 M662 0 V286" stroke="#cbd5e1" strokeOpacity="0.18" />

            {/* A restrained background shelf helps establish spatial scale. */}
            <path d="M72 114 H238 L224 126 H84 Z" fill="#94a3b8" opacity="0.16" />
            <path d="M82 109 H228" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
            <g opacity="0.56">
              <path d="M107 57 V100 Q107 108 115 108 H145 Q153 108 153 100 V57" fill={`url(#${bottleId})`} stroke="#94a3b8" strokeWidth="1.5" />
              <ellipse cx="130" cy="57" rx="23" ry="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="112" y="73" width="36" height="21" rx="4" fill="#ffffff" opacity="0.9" />
              <text x="130" y="82" textAnchor="middle" fontSize="7" fontWeight="800" fill="#1d4ed8">HCl</text>
              <text x="130" y="90" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#64748b">LARUTAN</text>
              <path d="M176 65 H204 V108 H176 Z" fill="#ffffff" fillOpacity="0.28" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M176 90 H204" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.55" />
              {[0, 1, 2, 3].map((i) => (
                <path key={i} d={`M198 ${73 + i * 8} H204`} stroke="#64748b" strokeWidth="1" opacity="0.58" />
              ))}
            </g>

            {/* Perspective workbench. */}
            <path d="M0 284 H760 L760 376 H0 Z" fill={`url(#${benchId})`} />
            <path d="M0 284 L760 284 L710 301 H50 Z" fill="#ead6b7" opacity="0.78" />
            <path d="M0 376 H760 V440 H0 Z" fill={`url(#${benchFrontId})`} />
            <path d="M0 376 H760" stroke="#52331f" strokeWidth="4" opacity="0.55" />
            <path d="M41 408 H719" stroke="#f5e6d3" strokeOpacity="0.1" strokeWidth="2" />

            {/* Bench props: reagent bottle and stopwatch. */}
            <g transform="translate(112 188)" filter={`url(#${softShadowId})`}>
              <ellipse cx="0" cy="130" rx="53" ry="10" fill="#0f172a" opacity="0.12" />
              <path d="M-27 15 H27 L31 110 Q31 124 16 127 H-16 Q-31 124 -31 110 Z" fill={`url(#${bottleId})`} stroke="#94a3b8" strokeWidth="2" />
              <rect x="-20" y="-3" width="40" height="20" rx="4" fill="#1e3a8a" />
              <path d="M-13 0 H13" stroke="#60a5fa" strokeWidth="2" opacity="0.75" />
              <rect x="-25" y="50" width="50" height="43" rx="7" fill="#ffffff" stroke="#bfdbfe" />
              <text x="0" y="65" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e3a8a">HCl</text>
              <text x="0" y="79" textAnchor="middle" fontSize="9" fontWeight="800" fill="#2563eb">{label}</text>
              <text x="0" y="88" textAnchor="middle" fontSize="5.8" fontWeight="700" fill="#64748b">LARUTAN • AQ</text>
            </g>

            <g transform="translate(581 302)" filter={`url(#${softShadowId})`}>
              <ellipse cx="0" cy="44" rx="55" ry="12" fill="#0f172a" opacity="0.14" />
              <path d="M-34 -19 Q-34 -34 -19 -34 H19 Q34 -34 34 -19 V27 Q34 40 20 42 H-20 Q-34 40 -34 27 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <rect x="-25" y="-20" width="50" height="31" rx="7" fill="#dff8f2" stroke="#64748b" strokeWidth="1.2" />
              <text x="0" y="0" textAnchor="middle" fontFamily="monospace" fontSize="13" fontWeight="900" fill="#0f3d3a">{effectiveSimTime.toFixed(1).padStart(4, "0")}</text>
              <circle cx="0" cy="26" r="8" fill="#2563eb" />
              <circle cx="0" cy="26" r="3" fill="#bfdbfe" />
              <rect x="-15" y="-42" width="30" height="9" rx="4.5" fill="#334155" />
              <text x="0" y="58" textAnchor="middle" fontSize="8" fontWeight="800" fill="#475569">STOPWATCH</text>
            </g>

            {/* Ready state: Mg is held above the liquid, so no reaction is implied
                before the shared stopwatch starts. */}
            {!hasStarted && (
              <g filter={`url(#${softShadowId})`}>
                <path
                  d="M531 36 L403 132"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M540 47 L409 140"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path d="M530 36 L540 47" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                <path
                  d="M405 136 C395 151 393 173 397 196"
                  fill="none"
                  stroke={`url(#${metalId})`}
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <path
                  d="M402 139 C397 154 397 175 400 192"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <g transform="translate(514 82)">
                  <rect x="-58" y="-13" width="116" height="26" rx="13" fill="#ffffff" fillOpacity="0.9" stroke="#bfdbfe" />
                  <text x="0" y="3.5" textAnchor="middle" fontSize="8" fontWeight="900" fill="#1d4ed8">
                    Mg SIAP DIMASUKKAN
                  </text>
                </g>
              </g>
            )}

            {/* Flask shadow and grounded base. */}
            <ellipse cx="380" cy="350" rx="151" ry="22" fill="#0f172a" opacity="0.24" filter={`url(#${shadowId})`} />
            <ellipse cx="380" cy="344" rx="130" ry="13" fill="#172033" opacity="0.13" />

            {/* Colorless, constant-volume HCl within the flask interior. */}
            <g clipPath={`url(#${flaskClipId})`}>
              <rect x="220" y="229" width="320" height="126" fill={`url(#${liquidId})`} />
              <ellipse cx="380" cy="229" rx="119" ry="12" fill="#f8fdff" fillOpacity="0.64" stroke="#7dd3fc" strokeOpacity="0.45" strokeWidth="1.4" />
              <path d="M267 238 Q380 257 493 238" fill="none" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="2" />

              {/* Mg remains the same length and instead becomes uniformly thinner and pitted. */}
              {hasStarted && !reactionComplete && (
                <g mask={`url(#${ribbonMaskId})`}>
                  <path
                    d="M322 301 C347 296 373 290 421 280"
                    fill="none"
                    stroke="#475569"
                    strokeWidth={ribbonWidth + 2.2}
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <path
                    d="M322 301 C347 296 373 290 421 280"
                    fill="none"
                    stroke={`url(#${metalId})`}
                    strokeWidth={ribbonWidth}
                    strokeLinecap="round"
                  />
                  <path
                    d="M326 298 C350 293 377 288 415 280"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={Math.max(0.7, ribbonWidth * 0.18)}
                    strokeLinecap="round"
                    opacity="0.78"
                  />
                </g>
              )}

              {/* Active bubbles rendered based on simTime. */}
              {activeBubbles.map((bubble) => (
                <g
                  key={bubble.index}
                  style={{ opacity: bubble.opacity }}
                  aria-hidden="true"
                >
                  <circle
                    cx={bubble.x}
                    cy={bubble.y}
                    r={bubble.r}
                    fill={`url(#${glassGlowId})`}
                    stroke="#38bdf8"
                    strokeOpacity="0.72"
                    strokeWidth="0.8"
                  />
                  <circle
                    cx={bubble.x - bubble.r * 0.3}
                    cy={bubble.y - bubble.r * 0.3}
                    r={Math.max(0.75, bubble.r * 0.22)}
                    fill="#ffffff"
                    opacity="0.92"
                  />
                </g>
              ))}
            </g>

            {/* Volumetric glass shell; it is visibly open at the neck. */}
            <path
              d="M329 89 L329 157 L246 296 Q228 328 258 341 Q274 348 304 348 L456 348 Q486 348 502 341 Q532 328 514 296 L431 157 L431 89"
              fill={`url(#${flaskGlassId})`}
              stroke="#64748b"
              strokeOpacity="0.58"
              strokeWidth="3"
              strokeLinejoin="round"
              filter={`url(#${softShadowId})`}
            />
            <path d="M329 91 V157 L246 296" fill="none" stroke="#ffffff" strokeWidth="6" strokeOpacity="0.52" strokeLinecap="round" />
            <path d="M431 91 V157 L514 296" fill="none" stroke="#94a3b8" strokeWidth="3" strokeOpacity="0.25" strokeLinecap="round" />
            <path d="M278 328 Q380 348 482 328" fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.5" />
            <ellipse cx="380" cy="89" rx="51" ry="12" fill="#e2e8f0" fillOpacity="0.62" stroke="#64748b" strokeOpacity="0.65" strokeWidth="2.5" />
            <ellipse cx="380" cy="88" rx="43" ry="7.2" fill="#64748b" fillOpacity="0.32" stroke="#f8fafc" strokeOpacity="0.85" strokeWidth="2" />
            <path d="M340 107 Q380 114 420 107" fill="none" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="2.2" />

            {/* Measurement ticks and condition label stay independent of liquid color. */}
            <g opacity="0.72">
              <path d="M469 229 H493" stroke="#64748b" strokeWidth="1.5" />
              <text x="499" y="232" fontSize="7.5" fontWeight="800" fill="#475569">20 mL</text>
            </g>
            <g transform="translate(380 255)">
              <rect x="-55" y="-17" width="110" height="34" rx="9" fill="#ffffff" fillOpacity="0.78" stroke="#bfdbfe" />
              <text x="0" y="-3" textAnchor="middle" fontSize="10" fontWeight="900" fill="#1e3a8a">HCl(aq) {label}</text>
              <text x="0" y="10" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">20 mL • bening</text>
            </g>

            {/* Reaction-zone cue and magnifier connector. */}
            {!magnifierOpen && (
              <g
                className="m1-reaction-cue"
                style={{
                  animationDuration: `${2.2 / animationRate}s`,
                  animationPlayState: running ? "running" : "paused",
                }}
                aria-hidden="true"
              >
                <circle cx="377" cy="291" r="23" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="5 5" opacity="0.82" />
                <circle cx="377" cy="291" r="8" fill="#6366f1" opacity="0.1" />
                <path d="M398 278 C470 244 515 199 594 181" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeDasharray="6 5" opacity="0.6" />
                <circle cx="594" cy="181" r="4" fill="#4f46e5" opacity="0.65" />
              </g>
            )}

            {/* Completion state is explicit and does not imply a color change. */}
            {reactionComplete && (
              <g transform="translate(380 293)">
                <rect x="-75" y="-18" width="150" height="36" rx="18" fill="#ecfdf5" stroke="#6ee7b7" />
                <circle cx="-56" cy="0" r="9" fill="#10b981" />
                <path d="M-60 0 L-57 3 L-52 -4" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <text x="12" y="4" textAnchor="middle" fontSize="10" fontWeight="900" fill="#047857">Pita Mg telah bereaksi</text>
              </g>
            )}

            <style>{`
              .m1-reaction-cue {
                animation: m1-reaction-pulse 2.2s ease-in-out infinite;
                transform-box: view-box;
                transform-origin: 377px 291px;
              }

              @keyframes m1-reaction-pulse {
                0%, 100% { opacity: 0.58; transform: scale(0.94); }
                50% { opacity: 1; transform: scale(1.04); }
              }

              @media (prefers-reduced-motion: reduce) {
                .m1-reaction-cue {
                  animation: none !important;
                }
              }
            `}</style>
          </svg>

          <div className="pointer-events-none absolute left-3 top-3 sm:left-5 sm:top-5">
            <div className="rounded-xl border border-white/80 bg-white/85 px-3 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-md">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                Kondisi percobaan
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    reactionComplete
                      ? "bg-emerald-500"
                      : running
                        ? "bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.14)]"
                        : "bg-amber-400",
                  )}
                />
                <span className="text-xs font-extrabold text-slate-800">
                  HCl {label} · 20 mL
                </span>
              </div>
            </div>
          </div>

          {zoomEnabled && (
            <button
              type="button"
              onClick={onMagnifierClick}
              aria-expanded={magnifierOpen}
              aria-controls="m1-particle-panel"
              aria-label={
                magnifierOpen
                  ? "Tutup tampilan submikroskopik"
                  : "Perbesar zona reaksi untuk melihat partikel"
              }
              title={magnifierOpen ? "Hilangkan zoom" : "Aktifkan zoom partikel"}
              className={cn(
                "absolute right-3 top-[42%] inline-flex h-11 w-11 items-center justify-center rounded-full border p-0 text-[10px] font-extrabold shadow-lg backdrop-blur-md transition-all sm:right-5 lg:w-auto lg:gap-1.5 lg:px-2.5",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                magnifierOpen
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-indigo-900/20"
                  : "border-indigo-200 bg-white/90 text-indigo-700 hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-xl",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full",
                  magnifierOpen ? "bg-white/15" : "bg-indigo-100",
                )}
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden lg:inline">
                {magnifierOpen ? "Tutup Lensa" : "Lihat Partikel"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onZoomModeToggle}
            aria-pressed={zoomEnabled}
            className={cn(
              "absolute bottom-3 left-1/2 z-40 inline-flex min-h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:min-h-11 sm:px-4 sm:text-[11px]",
              zoomEnabled
                ? "border-indigo-400 bg-indigo-600 text-white"
                : "border-slate-300 bg-slate-700/75 text-white hover:bg-slate-700",
            )}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full ring-2 ring-white/40",
                zoomEnabled ? "bg-emerald-300" : "bg-slate-300",
              )}
            />
            Tampilan Makroskopik
            <span className="font-semibold opacity-80">
              · zoom {zoomEnabled ? "aktif" : "mati"}
            </span>
          </button>

          {lensOverlay}
        </div>

        <div className="grid gap-2 border-t border-slate-200/80 bg-white/95 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-700 sm:text-xs">
                {reactionComplete
                  ? "Pembentukan H₂ berhenti karena Mg telah habis"
                  : hasStarted
                    ? "Gelembung H₂ terbentuk di permukaan Mg"
                    : "Pita Mg belum bersentuhan dengan larutan"}
              </p>
              <p className="text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                {hasStarted
                  ? "Setiap gelembung berisi banyak molekul H₂; larutan HCl tetap bening pada semua konsentrasi."
                  : "Tekan Mulai untuk memasukkan Mg dan menjalankan stopwatch pada saat yang sama."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4 sm:pl-0" aria-label={`Frekuensi pembentukan gelembung: ${frequencyText}`}>
            <span className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Frekuensi saat reaksi
            </span>
            <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
              {[0.25, 0.45, 0.65, 0.82, 1].map((threshold, index) => (
                <span
                  key={threshold}
                  className={cn(
                    "w-1.5 rounded-full transition-colors",
                    frequencyLevel >= index + 1 ? "bg-indigo-500" : "bg-slate-200",
                  )}
                  style={{ height: 6 + index * 3 }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold capitalize text-indigo-700">
              {frequencyText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
