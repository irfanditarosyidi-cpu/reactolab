"use client";

import { memo, useId, useMemo } from "react";

interface M3ParticleLensProps {
  label: string;
  temperature: number;
  simTime: number;
  progress: number;
  running: boolean;
}

interface ParticleSpec {
  kind: "acid" | "thiosulfate" | "sodium" | "chloride";
  x: number;
  y: number;
  phase: number;
  vx: number;
  vy: number;
  speedSpread: number;
  depth: number;
}

function hash(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function Particle({ kind, x, y, scale }: { kind: ParticleSpec["kind"]; x: number; y: number; scale: number }) {
  if (kind === "acid") {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle r="9" fill="#bae6fd" fillOpacity=".25" stroke="#38bdf8" strokeDasharray="2 2" />
        <circle r="5" fill="#ef4444" stroke="#9f1239" strokeWidth=".8" />
        <circle cx="-4.8" cy="-3.6" r="2" fill="#fff" stroke="#cbd5e1" strokeWidth=".5" />
        <circle cx="4.8" cy="-3.6" r="2" fill="#fff" stroke="#cbd5e1" strokeWidth=".5" />
        <circle cy="5.2" r="2" fill="#fff" stroke="#cbd5e1" strokeWidth=".5" />
        <circle cx="7.5" cy="-7" r="2.8" fill="#be123c" />
        <text x="7.5" y="-5" textAnchor="middle" fontSize="4.8" fontWeight="900" fill="#fff">+</text>
      </g>
    );
  }

  if (kind === "thiosulfate") {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle r="11" fill="#fef3c7" fillOpacity=".75" stroke="#d97706" />
        <circle cx="-4" cy="0" r="4.1" fill="#f59e0b" />
        <circle cx="4" cy="-3" r="3.2" fill="#fde047" />
        <circle cx="4" cy="4" r="3.2" fill="#fde047" />
        <text y="17" textAnchor="middle" fontSize="6.4" fontWeight="900" fill="#92400e">S₂O₃²⁻</text>
      </g>
    );
  }

  const sodium = kind === "sodium";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r="6.2" fill={sodium ? "#a78bfa" : "#22d3ee"} stroke={sodium ? "#6d28d9" : "#0e7490"} />
      <text y="2.4" textAnchor="middle" fontSize="5.8" fontWeight="900" fill="#fff">{sodium ? "+" : "−"}</text>
    </g>
  );
}

export default memo(function M3ParticleLens({
  label,
  temperature,
  simTime,
  progress,
  running,
}: M3ParticleLensProps) {
  const uid = useId().replace(/:/g, "");
  const relativeTemperature = Math.max(0, Math.min(1, (temperature - 10) / 40));
  const motionScale = 0.62 + relativeTemperature * 1.05;
  const safeProgress = Math.max(0, Math.min(1, progress));
  const started = running || simTime > 0;

  const particles = useMemo<ParticleSpec[]>(() => {
    const kinds: ParticleSpec["kind"][] = [
      ...Array.from({ length: 8 }, () => "acid" as const),
      ...Array.from({ length: 6 }, () => "thiosulfate" as const),
      ...Array.from({ length: 6 }, () => "sodium" as const),
      ...Array.from({ length: 6 }, () => "chloride" as const),
    ];
    return kinds.map((kind, index) => ({
      kind,
      x: 32 + hash(index + 31) * 296,
      y: 38 + hash(index + 71) * 226,
      phase: hash(index + 111) * Math.PI * 2,
      vx: 0.58 + hash(index + 151) * 1.3,
      vy: 0.58 + hash(index + 191) * 1.2,
      speedSpread: 0.55 + hash(index + 231) * 1.05,
      depth: hash(index + 271),
    }));
  }, []);

  const remainingReactants = Math.max(0, 1 - safeProgress * 0.72);
  const sulfurCount = Math.floor(safeProgress * 34);
  const effectiveFraction = 0.18 + relativeTemperature * 0.62;

  return (
    <section className="h-full w-full" aria-label={`Tampilan partikel reaksi pada ${label}`}>
      <svg
        viewBox="0 0 360 360"
        className="h-full w-full"
        role="img"
        aria-label={`Jumlah awal partikel sama pada suhu ${label}. Partikel memiliki beragam kelajuan; suhu lebih tinggi meningkatkan kelajuan rata-rata dan proporsi tumbukan efektif.`}
      >
        <defs>
          <radialGradient id={`m3-lens-bg-${uid}`} cx="34%" cy="20%" r="92%">
            <stop stopColor="#f8fdff" />
            <stop offset=".58" stopColor="#dff5fa" />
            <stop offset="1" stopColor="#afcfda" />
          </radialGradient>
          <radialGradient id={`m3-sulfur-${uid}`} cx="30%" cy="25%" r="80%">
            <stop stopColor="#fef08a" />
            <stop offset=".55" stopColor="#eab308" />
            <stop offset="1" stopColor="#a16207" />
          </radialGradient>
        </defs>

        <rect width="360" height="360" fill={`url(#m3-lens-bg-${uid})`} />
        <path d="M0 218q180-32 360 0v142H0Z" fill="#eab308" fillOpacity={safeProgress * 0.05} />

        {Array.from({ length: 22 }, (_, index) => {
          const x = 22 + hash(index + 401) * 316;
          const y = 24 + hash(index + 441) * 295;
          const angle = hash(index + 481) * 90;
          return (
            <g key={index} transform={`translate(${x} ${y}) rotate(${angle})`} opacity=".17">
              <circle r="2.4" fill="#38bdf8" />
              <circle cx="-3.5" cy="-2.7" r="1.2" fill="#fff" />
              <circle cx="3.5" cy="-2.7" r="1.2" fill="#fff" />
            </g>
          );
        })}

        {particles
          .slice()
          .sort((a, b) => a.depth - b.depth)
          .map((particle, index) => {
            const consumes = particle.kind === "acid" || particle.kind === "thiosulfate";
            const visible = !consumes || hash(index + 531) < remainingReactants;
            if (!visible) return null;
            const localSpeed = motionScale * particle.speedSpread;
            const x = particle.x + Math.sin(simTime * particle.vx * localSpeed + particle.phase) * 18;
            const y = particle.y + Math.cos(simTime * particle.vy * localSpeed + particle.phase) * 15;
            return <Particle key={index} kind={particle.kind} x={x} y={y} scale={0.7 + particle.depth * 0.34} />;
          })}

        {Array.from({ length: sulfurCount }, (_, index) => (
          <circle
            key={index}
            cx={72 + hash(index + 601) * 220}
            cy={220 + hash(index + 641) * 89}
            r={2.4 + hash(index + 681) * 4.2}
            fill={`url(#${`m3-sulfur-${uid}`})`}
            stroke="#a16207"
            strokeWidth=".7"
            opacity={0.55 + hash(index + 721) * 0.4}
          />
        ))}

        {Array.from({ length: 10 }, (_, index) => {
          const cycle = (simTime * motionScale * (0.18 + hash(index + 801) * 0.16) + hash(index + 841) * 3) % 1;
          const active = started && cycle > 0.76;
          if (!active) return null;
          const effective = hash(index + 881) < effectiveFraction;
          const x = 54 + hash(index + 921) * 252;
          const y = 68 + hash(index + 961) * 184;
          const phase = (cycle - 0.76) / 0.24;
          return (
            <g key={index} opacity={Math.max(0, 1 - phase)}>
              <circle cx={x} cy={y} r={5 + phase * 19} fill="none" stroke={effective ? "#facc15" : "#94a3b8"} strokeWidth={effective ? 2.4 : 1.2} strokeDasharray={effective ? undefined : "3 3"} />
              {effective && <circle cx={x} cy={y} r="3.2" fill="#fef08a" />}
            </g>
          );
        })}

        <g transform="translate(14 14)">
          <rect width="154" height="42" rx="12" fill="#fff" fillOpacity=".9" stroke="#bae6fd" />
          <text x="12" y="16" fontSize="7.3" fontWeight="900" fill="#64748b">SUHU: {label}</text>
          <text x="12" y="31" fontSize="7.5" fontWeight="800" fill="#0369a1">jumlah awal & konsentrasi sama</text>
        </g>
      </svg>
    </section>
  );
});
