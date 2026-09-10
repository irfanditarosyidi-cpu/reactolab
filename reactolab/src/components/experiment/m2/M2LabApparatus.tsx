"use client";

import { Search } from "lucide-react";
import { memo, useId, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface M2LabApparatusProps {
  value: string;
  label: string;
  factor: number;
  simTime: number;
  duration: number;
  volume: number;
  vmax: number;
  running: boolean;
  started: boolean;
  magnifierOpen: boolean;
  onMagnifierClick: () => void;
  zoomEnabled: boolean;
  onZoomModeToggle: () => void;
  lensOverlay?: ReactNode;
}

interface Packet {
  index: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

const GAS_PACKET_COUNT = 38;
const GAS_TRAVEL_SECONDS = 2.6;

function hash(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function cubic(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function packetPoint(phase: number, waterY: number, jitter: number) {
  if (phase < 0.24) {
    const t = phase / 0.24;
    return {
      x: 236 + jitter * 8 + Math.sin(t * Math.PI) * 8,
      y: 294 - t * 192,
    };
  }

  if (phase < 0.78) {
    const t = (phase - 0.24) / 0.54;
    return {
      x: cubic(244, 360, 505, 558, t),
      y: cubic(95, 18, 58, 320, t),
    };
  }

  const t = (phase - 0.78) / 0.22;
  return {
    x: 558 + jitter * 5 + Math.sin(t * Math.PI * 2) * 4,
    y: 320 - t * Math.max(18, 310 - waterY),
  };
}

function SolidSample({
  value,
  remaining,
  gradientId,
}: {
  value: string;
  remaining: number;
  gradientId: string;
}) {
  const scale = 0.35 + Math.sqrt(Math.max(0, remaining)) * 0.65;
  const opacity = remaining <= 0.01 ? 0 : 0.42 + remaining * 0.58;
  const common = { fill: `url(#${gradientId})`, stroke: "#78716c" };

  return (
    <g
      transform={`translate(236 298) scale(${scale}) translate(-236 -298)`}
      opacity={opacity}
    >
      {value === "bongkahan" && (
        <path d="m190 307-7-27 17-23 41-7 35 17 6 28-22 22-45 2Z" {...common} strokeWidth="2" />
      )}
      {value === "kepingan" && (
        <>
          <path d="m186 303 30-13 49 5 12 12-37 11-45-4Z" {...common} />
          <path d="m198 286 28-14 43 6 8 11-33 10-39-4Z" {...common} />
          <path d="m211 268 24-12 35 7 5 10-29 9-31-5Z" {...common} />
        </>
      )}
      {value === "butiran" &&
        Array.from({ length: 13 }, (_, index) => (
          <circle
            key={index}
            cx={194 + ((index * 31) % 82)}
            cy={276 + ((index * 17) % 38)}
            r={5 + (index % 3)}
            {...common}
          />
        ))}
      {value === "serbuk" &&
        Array.from({ length: 34 }, (_, index) => (
          <circle
            key={index}
            cx={188 + ((index * 37) % 96)}
            cy={282 + ((index * 19) % 32)}
            r={1.8 + (index % 3) * 0.35}
            {...common}
            strokeWidth=".5"
          />
        ))}
    </g>
  );
}

export default memo(function M2LabApparatus({
  value,
  label,
  factor,
  simTime,
  duration,
  volume,
  vmax,
  running,
  started,
  magnifierOpen,
  onMagnifierClick,
  zoomEnabled,
  onZoomModeToggle,
  lensOverlay,
}: M2LabApparatusProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `m2-${name}-${uid}`;
  const waterY = 82 + Math.min(1, Math.max(0, volume / 50)) * 218;
  const reactedFraction = Math.min(1, Math.max(0, volume / Math.max(1, vmax)));
  const remaining = 1 - reactedFraction;
  const k = 0.02 * factor;

  const packets = useMemo(() => {
    if (!started || simTime <= 0) return [] as Packet[];

    return Array.from({ length: GAS_PACKET_COUNT }, (_, index) => {
      const targetFraction = ((index + 0.55) / GAS_PACKET_COUNT) * 0.985;
      const emittedAt = -Math.log(1 - targetFraction) / Math.max(0.001, k);
      const age = simTime - emittedAt;
      if (age < 0 || age >= GAS_TRAVEL_SECONDS || emittedAt > duration) return null;

      const phase = age / GAS_TRAVEL_SECONDS;
      const point = packetPoint(phase, waterY, hash(index + 91) - 0.5);
      const fade = Math.min(1, phase / 0.08, (1 - phase) / 0.12);
      return {
        index,
        ...point,
        radius: 3 + hash(index + 43) * 2.4,
        opacity: Math.max(0, fade) * 0.9,
      };
    }).filter((packet): packet is Packet => packet !== null);
  }, [duration, k, simTime, started, waterY]);

  const wallId = id("wall");
  const benchId = id("bench");
  const glassId = id("glass");
  const liquidId = id("liquid");
  const waterId = id("water");
  const gasId = id("gas");
  const stoneId = id("stone");
  const shadowId = id("shadow");

  return (
    <section className="relative mx-auto w-full max-w-[860px] select-none">
      <div className="overflow-hidden rounded-[24px] border border-slate-700 bg-slate-950 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.8)]">
        <div className="relative h-[270px] bg-slate-100 sm:h-[400px] lg:h-[455px]">
          <svg
            viewBox="0 0 760 440"
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full"
            role="img"
            aria-label={`Rangkaian pengumpulan CO2 untuk CaCO3 bentuk ${label}. Volume terbaca ${volume.toFixed(1)} mililiter pada ${simTime.toFixed(1)} detik.`}
          >
            <defs>
              <linearGradient id={wallId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#f8fafc" />
                <stop offset=".66" stopColor="#e7f4f7" />
                <stop offset="1" stopColor="#d7e7ec" />
              </linearGradient>
              <linearGradient id={benchId} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#d5b58a" />
                <stop offset="1" stopColor="#93633a" />
              </linearGradient>
              <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#fff" stopOpacity=".82" />
                <stop offset=".42" stopColor="#bae6fd" stopOpacity=".16" />
                <stop offset="1" stopColor="#64748b" stopOpacity=".2" />
              </linearGradient>
              <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#fff" stopOpacity=".68" />
                <stop offset="1" stopColor="#dbeafe" stopOpacity=".34" />
              </linearGradient>
              <linearGradient id={waterId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#e0f2fe" stopOpacity=".82" />
                <stop offset="1" stopColor="#0ea5e9" stopOpacity=".3" />
              </linearGradient>
              <linearGradient id={gasId} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#fff" stopOpacity=".8" />
                <stop offset="1" stopColor="#e2e8f0" stopOpacity=".38" />
              </linearGradient>
              <linearGradient id={stoneId} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#fafaf9" />
                <stop offset=".5" stopColor="#d6d3d1" />
                <stop offset="1" stopColor="#a8a29e" />
              </linearGradient>
              <filter id={shadowId} x="-30%" y="-30%" width="170%" height="190%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity=".22" />
              </filter>
              <clipPath id={id("flask-clip")}>
                <path d="M205 87v75l-75 137q-16 31 25 39h162q41-8 25-39l-75-137V87Z" />
              </clipPath>
              <clipPath id={id("cylinder-clip")}>
                <path d="M509 67h100v265H509Z" />
              </clipPath>
            </defs>

            <rect width="760" height="440" fill={`url(#${wallId})`} />
            <circle cx="380" cy="130" r="285" fill="#fff" opacity=".34" />
            <path d="M0 91h760M0 180h760" stroke="#94a3b8" strokeOpacity=".16" />
            <path d="M80 0v292M380 0v292M680 0v292" stroke="#94a3b8" strokeOpacity=".1" />
            <path d="M0 326h760v114H0Z" fill={`url(#${benchId})`} />
            <path d="M0 326h760l-47 17H47Z" fill="#ead6b7" opacity=".8" />

            {/* Delivery hose: a closed flask routes all gas into the collector. */}
            <path
              d="M236 82C354 7 490 31 532 111c27 51 22 115 26 212"
              fill="none"
              stroke="#1e293b"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M236 82C354 7 490 31 532 111c27 51 22 115 26 212"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Reaction flask. */}
            <ellipse cx="236" cy="342" rx="119" ry="18" fill="#0f172a" opacity=".14" />
            <g clipPath={`url(#${id("flask-clip")})`}>
              <rect x="112" y="231" width="250" height="112" fill={`url(#${liquidId})`} />
              <ellipse cx="236" cy="231" rx="91" ry="10" fill="#fff" fillOpacity=".7" stroke="#7dd3fc" strokeOpacity=".42" />
              <SolidSample value={value} remaining={remaining} gradientId={stoneId} />
            </g>
            <path
              d="M205 87v75l-75 137q-16 31 25 39h162q41-8 25-39l-75-137V87"
              fill={`url(#${glassId})`}
              stroke="#64748b"
              strokeWidth="3"
              filter={`url(#${shadowId})`}
            />
            <path d="M205 89v73l-69 130" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".55" />
            <ellipse cx="236" cy="87" rx="36" ry="9" fill="#334155" stroke="#0f172a" strokeWidth="2" />
            <rect x="208" y="82" width="56" height="18" rx="5" fill="#475569" />
            <path d="M222 85h28" stroke="#cbd5e1" strokeWidth="2" />
            <g transform="translate(236 255)">
              <rect x="-61" y="-18" width="122" height="36" rx="9" fill="#fff" fillOpacity=".82" stroke="#bae6fd" />
              <text x="0" y="-3" textAnchor="middle" fontSize="10" fontWeight="900" fill="#0f766e">CaCO₃ · {label}</text>
              <text x="0" y="10" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#64748b">massa sama • HCl tetap</text>
            </g>

            {/* Water trough and inverted graduated cylinder. */}
            <ellipse cx="558" cy="350" rx="132" ry="18" fill="#0f172a" opacity=".14" />
            <path d="M417 284h282v69q0 16-17 18H434q-17-2-17-18Z" fill={`url(#${waterId})`} stroke="#0e7490" strokeWidth="2.5" />
            <ellipse cx="558" cy="284" rx="141" ry="14" fill="#e0f2fe" fillOpacity=".84" stroke="#38bdf8" />
            <g clipPath={`url(#${id("cylinder-clip")})`}>
              <rect x="509" y="67" width="100" height={Math.max(0, waterY - 67)} fill={`url(#${gasId})`} />
              <rect x="509" y={waterY} width="100" height={332 - waterY} fill={`url(#${waterId})`} />
              <ellipse cx="559" cy={waterY} rx="45" ry="6" fill="#e0f2fe" stroke="#0284c7" strokeOpacity=".62" />
            </g>
            <path d="M509 330V76q0-10 10-10h80q10 0 10 10v254" fill={`url(#${glassId})`} stroke="#64748b" strokeWidth="3" />
            <path d="M520 78v241" stroke="#fff" strokeWidth="5" opacity=".52" />
            <path d="M509 330q50 12 100 0" fill="none" stroke="#475569" strokeWidth="3" />

            {Array.from({ length: 6 }, (_, index) => {
              const y = 82 + index * 43.6;
              return (
                <g key={index}>
                  <path d={`M580 ${y}h25`} stroke="#475569" strokeWidth="1.5" />
                  <text x="575" y={y + 3.5} textAnchor="end" fontSize="8" fontWeight="800" fill="#334155">
                    {index * 10}
                  </text>
                </g>
              );
            })}
            <text x="594" y="55" textAnchor="middle" fontSize="8" fontWeight="900" fill="#475569">mL</text>

            {volume > 2 && (
              <g transform={`translate(559 ${Math.max(92, waterY - 22)})`}>
                <rect x="-35" y="-12" width="70" height="22" rx="11" fill="#fff" fillOpacity=".86" stroke="#cbd5e1" />
                <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="900" fill="#334155">CO₂(g)</text>
              </g>
            )}

            {/* Representative packets trace the complete gas path. */}
            {packets.map((packet) => (
              <g key={packet.index} opacity={packet.opacity}>
                <circle cx={packet.x} cy={packet.y} r={packet.radius} fill="#fff" fillOpacity=".78" stroke="#64748b" strokeWidth=".9" />
                <circle cx={packet.x - 1} cy={packet.y - 1} r={Math.max(0.8, packet.radius * 0.24)} fill="#fff" />
              </g>
            ))}

            {/* Direct reading callout at the moving gas-water interface. */}
            <path d={`M610 ${waterY}h43`} stroke="#0f766e" strokeWidth="2" strokeDasharray="4 3" />
            <g transform={`translate(682 ${Math.min(311, Math.max(93, waterY))})`}>
              <rect x="-44" y="-16" width="76" height="32" rx="10" fill="#0f172a" />
              <text x="-6" y="-2" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">{volume.toFixed(1)} mL</text>
              <text x="-6" y="10" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#a5f3fc">VOLUME CO₂</text>
            </g>

            <g transform="translate(31 24)">
              <rect width="194" height="48" rx="12" fill="#fff" fillOpacity=".9" stroke="#cbd5e1" />
              <text x="14" y="18" fontSize="8" fontWeight="900" fill="#64748b">WAKTU PENGAMATAN</text>
              <text x="14" y="37" fontFamily="monospace" fontSize="17" fontWeight="900" fill="#0f172a">{simTime.toFixed(1)} s</text>
              <circle cx="174" cy="24" r="8" fill={running ? "#14b8a6" : started ? "#f59e0b" : "#94a3b8"} />
            </g>
          </svg>

          {zoomEnabled && (
            <button
              type="button"
              onClick={onMagnifierClick}
              aria-expanded={magnifierOpen}
              aria-controls="m2-particle-panel"
              aria-label={magnifierOpen ? "Hilangkan zoom permukaan" : "Aktifkan zoom permukaan"}
              title={magnifierOpen ? "Hilangkan zoom" : "Aktifkan zoom permukaan"}
              className={cn(
                "absolute left-[31%] top-[49%] inline-flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border p-0 text-[10px] font-extrabold shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 lg:w-auto lg:gap-1.5 lg:px-2.5",
                magnifierOpen
                  ? "border-teal-500 bg-teal-600 text-white"
                  : "border-teal-200 bg-white/90 text-teal-800 hover:-translate-y-0.5",
              )}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">{magnifierOpen ? "Tutup Zoom" : "Zoom Permukaan"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onZoomModeToggle}
            aria-pressed={zoomEnabled}
            className={cn(
              "absolute bottom-3 left-1/2 z-40 inline-flex min-h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:min-h-11 sm:px-4 sm:text-[11px]",
              zoomEnabled
                ? "border-teal-400 bg-teal-600 text-white"
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

        <div className="grid gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-slate-700">Pembacaan lewat pendesakan air</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
              CO₂ mengisi bagian atas gelas ukur dan mendorong batas air turun;
              posisi batas gas–air menunjukkan volume pada skala mL.
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
            <b>Batas model:</b> sebagian CO₂ nyata dapat larut dalam air. Simulasi
            menganggap kehilangan itu sama dan dapat diabaikan agar pengaruh luas
            permukaan dapat dibandingkan secara adil.
          </div>
        </div>
      </div>
    </section>
  );
});
