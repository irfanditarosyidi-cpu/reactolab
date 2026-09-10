"use client";

// Module 2 — experiment preparation (minimal, icon-first).
// Students pick at least 3 of 4 CaCO₃ shapes; mass, HCl volume/concentration,
// temperature and apparatus are shown as fixed (controlled) variables.

import { Check, FlaskConical, Lock, Scale, TestTube, Thermometer, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";

export interface M2ExperimentSetupProps {
  options: ExperimentConfig["options"];
  selected: string[];
  locked: boolean;
  readOnly: boolean;
  onToggle: (value: string) => void;
}

const FIXED = [
  { icon: Droplets, label: "HCl 1 M · 20 mL" },
  { icon: Scale, label: "CaCO₃ 1,0 g" },
  { icon: Thermometer, label: "25 °C" },
  { icon: FlaskConical, label: "Erlenmeyer" },
  { icon: TestTube, label: "Gelas ukur terbalik" },
];

/** Simple, legible glyphs for each solid shape (no text inside). */
function ShapeGlyph({ value, active }: { value: string; active: boolean }) {
  const fill = active ? "#1d4ed8" : "#64748b";
  const light = active ? "#93c5fd" : "#cbd5e1";
  switch (value) {
    case "bongkahan":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
          <path d="M14 26 32 16l18 8-3 24-16 8-17-8z" fill={light} />
          <path d="M32 16v40M32 24l18 0M14 26l18-2" stroke={fill} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
          <path d="M14 26 32 16l18 8-3 24-16 8-17-8z" stroke={fill} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "kepingan":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
          {[
            "M10 40l20-8 22 6-20 8z",
            "M14 30l20-8 20 6-20 8z",
            "M18 20l18-7 18 5-18 8z",
          ].map((d, i) => (
            <path key={i} d={d} fill={light} stroke={fill} strokeWidth="2.2" strokeLinejoin="round" />
          ))}
        </svg>
      );
    case "butiran":
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
          {[
            [16, 18], [32, 15], [48, 19], [12, 34], [28, 31], [44, 34], [20, 48], [36, 47], [52, 48],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 6} y={y - 6} width="12" height="12" rx="3" fill={light} stroke={fill} strokeWidth="2" transform={`rotate(${(i * 23) % 40 - 20} ${x} ${y})`} />
          ))}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden="true">
          <path d="M8 50c6-14 14-20 24-20s18 6 24 20z" fill={light} stroke={fill} strokeWidth="2.2" />
          {Array.from({ length: 26 }, (_, i) => {
            const a = (i * 137.5) % 360;
            const r = 4 + ((i * 7) % 15);
            const x = 32 + Math.cos((a * Math.PI) / 180) * r * 1.6;
            const y = 42 + Math.sin((a * Math.PI) / 180) * r * 0.55;
            return <circle key={i} cx={x} cy={y} r="1.7" fill={fill} />;
          })}
        </svg>
      );
  }
}

export default function M2ExperimentSetup({
  options,
  selected,
  locked,
  readOnly,
  onToggle,
}: M2ExperimentSetupProps) {
  const disabled = locked || readOnly;

  return (
    <div className="space-y-4">
      {/* fixed (controlled) variables & apparatus */}
      <div className="thin-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FIXED.map((f) => (
          <span
            key={f.label}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            <f.icon className="h-3.5 w-3.5 text-brand-600" />
            {f.label}
            <Lock className="h-3 w-3 text-slate-400" />
          </span>
        ))}
      </div>

      {/* shape cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
              className={cn(
                "relative flex min-h-[124px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-all disabled:cursor-not-allowed",
                on
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-brand-300",
                disabled && !on && "opacity-50"
              )}
            >
              {on && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              <ShapeGlyph value={o.value} active={on} />
              <span className={cn("text-sm font-black", on ? "text-brand-800" : "text-slate-700")}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>

      {disabled && selected.length > 0 && (
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <Lock className="h-3.5 w-3.5" />
          {readOnly ? "Dokumentasi percobaan." : "Pilihan terkunci."}
        </p>
      )}
    </div>
  );
}
