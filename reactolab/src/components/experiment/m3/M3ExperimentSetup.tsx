"use client";

// Module 3 — experiment preparation.
// Students define their own temperatures (slider / numeric input, at least 3)
// while the solutions, volumes, glassware and the X mark stay fixed.

import { useState } from "react";
import { Beaker, Droplets, Lock, Plus, Thermometer, TriangleAlert, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";
import { minGap, normalizeConcentration } from "@/lib/runs";

export interface M3ExperimentSetupProps {
  range: NonNullable<ExperimentConfig["customRange"]>;
  minSelections: number;
  selected: string[];
  locked: boolean;
  readOnly: boolean;
  onChange: (values: string[]) => void;
}

const FIXED = [
  { icon: Droplets, label: "Na₂S₂O₃ 0,1 M · 25 mL" },
  { icon: Droplets, label: "HCl 1 M · 25 mL" },
  { icon: Beaker, label: "Gelas reaksi sama" },
  { icon: X, label: "Kertas tanda X" },
];

export function tempLabel(t: number): string {
  return `${Math.round(t)} °C`;
}

export default function M3ExperimentSetup({
  range,
  minSelections,
  selected,
  locked,
  readOnly,
  onChange,
}: M3ExperimentSetupProps) {
  const disabled = locked || readOnly;
  const [draft, setDraft] = useState(35);
  const [input, setInput] = useState("35");
  const [note, setNote] = useState("");

  const values = selected.map((v) => parseFloat(v)).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const gap = minGap(values);
  const gapWarning = values.length >= 2 && gap < range.minGapWarn - 1e-9;

  const setBoth = (n: number) => {
    setDraft(n);
    setInput(String(Math.round(n)));
    setNote("");
  };

  const add = () => {
    const n = normalizeConcentration(parseFloat(input.replace(",", ".")), range);
    if (n === null) {
      setNote("Masukkan angka yang valid.");
      return;
    }
    if (selected.length >= range.maxSelections) {
      setNote(`Maksimal ${range.maxSelections} suhu.`);
      return;
    }
    const value = String(Math.round(n));
    if (selected.includes(value)) {
      setNote("Suhu ini sudah ada.");
      return;
    }
    onChange([...selected, value].sort((a, b) => parseFloat(a) - parseFloat(b)));
    setNote("");
  };

  return (
    <div className="space-y-4">
      {/* fixed (controlled) variables */}
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

      {/* temperature builder */}
      {!disabled && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">
                <Thermometer className="h-3.5 w-3.5" /> Suhu larutan
              </p>
              <p className="mt-0.5 text-3xl font-black tabular-nums text-slate-900">{tempLabel(draft)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={range.min}
                max={range.max}
                step={range.step}
                value={input}
                aria-label="Nilai suhu (°C)"
                onChange={(e) => {
                  setInput(e.target.value);
                  const n = parseFloat(e.target.value.replace(",", "."));
                  if (Number.isFinite(n)) setDraft(Math.min(range.max, Math.max(range.min, n)));
                }}
                onBlur={() => {
                  const n = normalizeConcentration(parseFloat(input.replace(",", ".")), range);
                  if (n !== null) setBoth(n);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add();
                }}
                className="h-12 w-24 rounded-xl border border-slate-300 bg-white px-3 text-center text-base font-black tabular-nums text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm font-bold text-slate-500">°C</span>
            </div>
          </div>

          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={draft}
            aria-label="Geser untuk memilih suhu"
            onChange={(e) => setBoth(parseFloat(e.target.value))}
            className="mt-4 h-3 w-full cursor-pointer accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-[11px] font-bold text-slate-400">
            <span>{tempLabel(range.min)}</span>
            <span>{tempLabel(range.max)}</span>
          </div>

          <Button className="mt-4 min-h-12 w-full sm:w-auto" onClick={add} disabled={selected.length >= range.maxSelections}>
            <Plus className="h-4 w-4" /> Tambah
          </Button>
          {note && (
            <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold text-amber-700">
              {note}
            </p>
          )}
        </div>
      )}

      {/* chosen temperatures */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Suhu yang diuji</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-black",
              selected.length >= minSelections ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}
          >
            {selected.length}/{minSelections} min.
          </span>
        </div>

        {selected.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-400">
            Belum ada — geser slider lalu ketuk Tambah.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {[...selected]
              .sort((a, b) => parseFloat(a) - parseFloat(b))
              .map((value) => (
                <span
                  key={value}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1 rounded-full border pl-4 text-sm font-black tabular-nums",
                    disabled ? "border-emerald-200 bg-emerald-50 pr-4 text-emerald-800" : "border-brand-300 bg-white pr-1 text-brand-800"
                  )}
                >
                  {tempLabel(parseFloat(value))}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onChange(selected.filter((v) => v !== value))}
                      aria-label={`Hapus ${tempLabel(parseFloat(value))}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </span>
              ))}
          </div>
        )}

        {gapWarning && (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Jarak antar suhumu: {tempLabel(gap)}, perbedaan lajunya mungkin sulit terlihat.
          </p>
        )}

        {disabled && selected.length > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <Lock className="h-3.5 w-3.5" />
            {readOnly ? "Dokumentasi percobaan." : "Pilihan terkunci."}
          </p>
        )}
      </div>
    </div>
  );
}
