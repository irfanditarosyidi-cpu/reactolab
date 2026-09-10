"use client";

import { memo, useId, useMemo } from "react";

interface M2ParticleLensProps {
  value: string;
  label: string;
  factor: number;
  maxFactor: number;
  simTime: number;
  progress: number;
  running: boolean;
  compact?: boolean;
}

interface Piece {
  x: number;
  y: number;
  rx: number;
  ry: number;
  tilt: number;
}

interface Site {
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  seed: number;
}

function hash(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function piecesFor(value: string): Piece[] {
  if (value === "bongkahan") {
    return [{ x: 180, y: 224, rx: 55, ry: 42, tilt: -0.12 }];
  }
  if (value === "kepingan") {
    return [
      { x: 137, y: 218, rx: 39, ry: 15, tilt: -0.2 },
      { x: 210, y: 217, rx: 38, ry: 14, tilt: 0.16 },
      { x: 154, y: 247, rx: 38, ry: 14, tilt: 0.11 },
      { x: 225, y: 247, rx: 37, ry: 14, tilt: -0.18 },
    ];
  }

  const count = value === "serbuk" ? 28 : 12;
  const rx = value === "serbuk" ? 7.2 : 13;
  const ry = value === "serbuk" ? 5.7 : 10.5;
  return Array.from({ length: count }, (_, index) => ({
    x: 104 + ((index * 47) % 155) + (hash(index + 41) - 0.5) * 8,
    y: 205 + ((index * 29) % 67) + (hash(index + 73) - 0.5) * 5,
    rx,
    ry,
    tilt: (hash(index + 101) - 0.5) * 0.8,
  }));
}

function sitesFor(pieces: Piece[], total: number): Site[] {
  return Array.from({ length: total }, (_, index) => {
    const piece = pieces[index % pieces.length];
    const round = Math.floor(index / pieces.length);
    const angle = ((round * 2.399 + index * 0.73) % (Math.PI * 2)) - Math.PI;
    return {
      cx: piece.x,
      cy: piece.y,
      dx: Math.cos(angle) * piece.rx,
      dy: Math.sin(angle) * piece.ry,
      seed: hash(index + 211),
    };
  });
}

function Ion({
  kind,
  x,
  y,
  scale,
}: {
  kind: "acid" | "chloride";
  x: number;
  y: number;
  scale: number;
}) {
  if (kind === "chloride") {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle r="6.5" fill="#22d3ee" stroke="#0e7490" strokeWidth="1" />
        <circle cx="-2" cy="-2" r="1.4" fill="#cffafe" />
        <text y="2.7" textAnchor="middle" fontSize="7" fontWeight="900" fill="#083344">−</text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r="9.5" fill="#bae6fd" fillOpacity=".18" stroke="#38bdf8" strokeDasharray="2 2" />
      <circle r="5.3" fill="#ef4444" stroke="#9f1239" strokeWidth=".8" />
      <circle cx="-5.2" cy="-3.8" r="2.1" fill="#fff" stroke="#cbd5e1" strokeWidth=".5" />
      <circle cx="5.2" cy="-3.8" r="2.1" fill="#fff" stroke="#cbd5e1" strokeWidth=".5" />
      <circle cy="5.6" r="2.1" fill="#fff" stroke="#cbd5e1" strokeWidth=".5" />
      <circle cx="8" cy="-7.5" r="3" fill="#be123c" />
      <text x="8" y="-5.4" textAnchor="middle" fontSize="5" fontWeight="900" fill="#fff">+</text>
    </g>
  );
}

export default memo(function M2ParticleLens({
  value,
  label,
  factor,
  maxFactor,
  simTime,
  progress,
  running,
  compact = false,
}: M2ParticleLensProps) {
  const uid = useId().replace(/:/g, "");
  const solidId = `m2-particle-solid-${uid}`;
  const pieces = useMemo(() => piecesFor(value), [value]);
  const totalSites = Math.max(6, Math.round(factor * 6));
  const sites = useMemo(
    () => sitesFor(pieces, totalSites),
    [pieces, totalSites],
  );
  const remainingFraction = Math.max(0.08, 1 - progress * 0.78);
  const visibleSites = Math.max(
    progress >= 0.995 ? 0 : 1,
    Math.ceil(sites.length * remainingFraction),
  );
  const started = running || simTime > 0;
  const relative = Math.max(0, Math.min(1, factor / maxFactor));
  const relativeLevel = Math.max(1, Math.round(relative * 5));

  const ions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        kind: (index % 2 === 0 ? "acid" : "chloride") as "acid" | "chloride",
        x: 34 + hash(index + 301) * 292,
        y: 43 + hash(index + 337) * 127,
        z: hash(index + 373),
        phase: hash(index + 401) * Math.PI * 2,
      })),
    [],
  );

  return (
    <section
      className={`w-full min-w-0 ${compact ? "h-full" : ""}`}
      aria-label={`Zoom submikroskopik bentuk ${label}`}
    >
      <div
        className={
          compact
            ? "h-full w-full overflow-hidden rounded-full bg-sky-50"
            : "overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm"
        }
      >
        {!compact && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-3 py-2.5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-600">Tingkat partikel</p>
            <p className="text-xs font-black text-slate-800">Permukaan CaCO₃ · {label}</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-teal-700 ring-1 ring-teal-100">
            massa padatan sama
          </span>
          </div>
        )}

        <div className={compact ? "relative h-full w-full bg-sky-50" : "relative aspect-[9/8] w-full bg-sky-50"}>
          <svg
            viewBox="0 0 360 320"
            preserveAspectRatio={compact ? "xMidYMid slice" : "xMidYMid meet"}
            className="h-full w-full"
            role="img"
            aria-label={`Massa CaCO3 sama dalam bentuk ${label}; ${visibleSites} titik model permukaan terbuka ditampilkan. Ion asam bergerak dengan pola yang sama untuk semua bentuk dan tumbukan hanya disorot pada permukaan yang terkena larutan.`}
          >
            <defs>
              <radialGradient id={solidId} cx="30%" cy="22%" r="82%">
                <stop stopColor="#fff" />
                <stop offset=".38" stopColor="#e7e5e4" />
                <stop offset="1" stopColor="#a8a29e" />
              </radialGradient>
              <radialGradient id={`m2-particle-bg-${uid}`} cx="34%" cy="18%" r="92%">
                <stop stopColor="#f8fdff" />
                <stop offset=".58" stopColor="#dff5fa" />
                <stop offset="1" stopColor="#b8d9e2" />
              </radialGradient>
            </defs>

            <rect width="360" height="320" fill={`url(#m2-particle-bg-${uid})`} />
            <path d="M0 190q180-34 360 0v130H0Z" fill="#0f766e" fillOpacity=".05" />
            <ellipse cx="180" cy="273" rx="124" ry="22" fill="#0f172a" opacity=".1" />

            {/* Water is the solvent and stays constant in every condition. */}
            {Array.from({ length: 18 }, (_, index) => {
              const x = 27 + hash(index + 501) * 305;
              const y = 28 + hash(index + 533) * 232;
              const tilt = (hash(index + 557) - 0.5) * 80;
              return (
                <g key={index} transform={`translate(${x} ${y}) rotate(${tilt})`} opacity=".19">
                  <circle r="2.4" fill="#38bdf8" />
                  <circle cx="-3.5" cy="-2.8" r="1.25" fill="#fff" />
                  <circle cx="3.5" cy="-2.8" r="1.25" fill="#fff" />
                </g>
              );
            })}

            {/* HCl conditions are fixed: same count and motion for every form. */}
            {ions
              .slice()
              .sort((a, b) => a.z - b.z)
              .map((ion, index) => {
                const x = ion.x + Math.sin(simTime * 0.65 + ion.phase) * 8;
                const y = ion.y + Math.cos(simTime * 0.52 + ion.phase) * 6;
                return (
                  <Ion
                    key={index}
                    kind={ion.kind}
                    x={x}
                    y={y}
                    scale={0.72 + ion.z * 0.38}
                  />
                );
              })}

            {/* Equal projected solid amount, divided into a different number of pieces. */}
            <g opacity={0.45 + remainingFraction * 0.55}>
              {pieces.map((piece, index) => (
                <g key={index} transform={`rotate(${(piece.tilt * 180) / Math.PI} ${piece.x} ${piece.y})`}>
                  <ellipse cx={piece.x} cy={piece.y + piece.ry * 0.28} rx={piece.rx * remainingFraction} ry={piece.ry * remainingFraction} fill="#0f172a" opacity=".14" />
                  <ellipse cx={piece.x} cy={piece.y} rx={piece.rx * remainingFraction} ry={piece.ry * remainingFraction} fill={`url(#${solidId})`} stroke="#78716c" strokeWidth="1.2" />
                  <ellipse cx={piece.x - piece.rx * 0.22 * remainingFraction} cy={piece.y - piece.ry * 0.25 * remainingFraction} rx={piece.rx * 0.23 * remainingFraction} ry={piece.ry * 0.16 * remainingFraction} fill="#fff" opacity=".52" />
                </g>
              ))}
            </g>

            {/* Amber marks identify exposed sites; pulses are tied to the shared clock. */}
            {sites.slice(0, visibleSites).map((site, index) => {
              const cycle = (simTime * (0.28 + relative * 0.34) + site.seed * 4.7) % 1;
              const active = started && cycle > 0.72;
              const pulse = active ? 4 + (cycle - 0.72) * 24 : 0;
              const x = site.cx + site.dx * remainingFraction;
              const y = site.cy + site.dy * remainingFraction;
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="2.5" fill="#f59e0b" stroke="#fff" strokeWidth=".8" />
                  {active && (
                    <circle cx={x} cy={y} r={pulse} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity={Math.max(0, 1 - (cycle - 0.72) / 0.28)} />
                  )}
                </g>
              );
            })}

            <g transform="translate(13 13)">
              <rect width="139" height="39" rx="10" fill="#fff" fillOpacity=".88" stroke="#bae6fd" />
              <text x="11" y="15" fontSize="7.2" fontWeight="900" fill="#64748b">HCl DIKONTROL TETAP</text>
              <text x="11" y="30" fontSize="8" fontWeight="800" fill="#0f766e">jumlah & gerak ion sama</text>
            </g>
          </svg>
        </div>

        {!compact && (
          <div className="space-y-2 border-t border-slate-200 bg-white px-3 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-600">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-sky-100" />H₃O⁺ / H⁺(aq)</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400 ring-1 ring-cyan-700" />Cl⁻, ion pendamping</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-stone-300 ring-1 ring-stone-500" />CaCO₃(s)</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" />situs permukaan terbuka</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="font-bold">Luas permukaan relatif</span>
            <span className="flex gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((level) => (
                <span key={level} className={`h-3 w-1.5 rounded-full ${level <= relativeLevel ? "bg-teal-500" : "bg-slate-200"}`} />
              ))}
            </span>
            <span className="font-bold text-teal-700">{label}</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500">
            Untuk massa yang sama, membagi padatan menjadi lebih banyak bagian
            menambah total permukaan yang terkena larutan. Bagian dalam bongkahan
            belum dapat bertumbukan sebelum permukaan luarnya bereaksi.
          </p>
          <p className="text-[9px] italic leading-relaxed text-slate-400">
            Ikon, ukuran, warna, dan jumlah titik adalah model perbandingan, bukan skala atom sebenarnya.
          </p>
          </div>
        )}
      </div>
    </section>
  );
});
