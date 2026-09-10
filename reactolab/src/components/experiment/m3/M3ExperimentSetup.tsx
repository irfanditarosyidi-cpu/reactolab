"use client";

import { Check, LockKeyhole, Thermometer } from "lucide-react";
import type { ExperimentConfig } from "@/lib/module-defs";
import { cn } from "@/lib/utils";

interface M3ExperimentSetupProps {
  options: ExperimentConfig["options"];
  selected: string[];
  locked: boolean;
  readOnly: boolean;
  onToggle: (value: string) => void;
}

function ApparatusPreview() {
  return (
    <svg
      viewBox="0 0 720 270"
      className="h-auto w-full"
      role="img"
      aria-label="Gelas kimia reaksi, termometer, penangas suhu, stopwatch, dan kartu bertanda X"
    >
      <defs>
        <linearGradient id="m3-setup-wall" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="m3-setup-bench" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#dbc29d" />
          <stop offset="1" stopColor="#94643d" />
        </linearGradient>
        <linearGradient id="m3-setup-glass" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".9" />
          <stop offset=".5" stopColor="#bae6fd" stopOpacity=".2" />
          <stop offset="1" stopColor="#64748b" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id="m3-setup-water" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e0f2fe" stopOpacity=".76" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity=".28" />
        </linearGradient>
        <filter id="m3-setup-shadow" x="-30%" y="-30%" width="170%" height="190%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#0f172a" floodOpacity=".2" />
        </filter>
      </defs>

      <rect width="720" height="270" rx="20" fill="url(#m3-setup-wall)" />
      <path d="M0 205h720v65H0Z" fill="url(#m3-setup-bench)" />
      <path d="M0 205h720l-42 13H42Z" fill="#ead6b7" opacity=".85" />

      <g filter="url(#m3-setup-shadow)">
        <path d="M68 88h185v116H68Z" fill="url(#m3-setup-glass)" stroke="#64748b" strokeWidth="2.5" />
        <path d="M72 130h177v71H72Z" fill="url(#m3-setup-water)" />
        <ellipse cx="160" cy="130" rx="88" ry="9" fill="#e0f2fe" stroke="#38bdf8" />
        <path d="M68 88q92 17 185 0" fill="none" stroke="#64748b" strokeWidth="2.5" />
        <text x="160" y="190" textAnchor="middle" fontSize="8" fontWeight="900" fill="#0e7490">PENANGAS SUHU</text>
      </g>

      <g filter="url(#m3-setup-shadow)">
        <ellipse cx="160" cy="196" rx="59" ry="8" fill="#0f172a" opacity=".12" />
        <path d="M112 80h96l-9 103q-3 14-18 15h-42q-15-1-18-15Z" fill="url(#m3-setup-glass)" stroke="#64748b" strokeWidth="2.5" />
        <path d="M119 139h82l-4 43q-2 10-15 11h-44q-12-1-14-11Z" fill="#f8fafc" fillOpacity=".72" />
        <ellipse cx="160" cy="139" rx="41" ry="6" fill="#fff" fillOpacity=".7" stroke="#7dd3fc" />
        <path d="M124 91v85" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".58" />
      </g>

      <g transform="translate(285 39)" filter="url(#m3-setup-shadow)">
        <rect width="96" height="150" rx="16" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
        <rect x="13" y="17" width="70" height="42" rx="8" fill="#d9f99d" stroke="#65a30d" />
        <text x="48" y="44" textAnchor="middle" fontFamily="monospace" fontSize="20" fontWeight="900" fill="#365314">30.0°</text>
        <circle cx="48" cy="95" r="22" fill="#e2e8f0" stroke="#94a3b8" />
        <path d="M48 77v18l12 8" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <text x="48" y="135" textAnchor="middle" fontSize="7" fontWeight="900" fill="#64748b">SUHU & WAKTU</text>
      </g>

      <path d="M333 62C299 78 257 104 201 136" fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
      <circle cx="201" cy="136" r="5" fill="#ef4444" stroke="#991b1b" />

      <g transform="translate(434 94)" filter="url(#m3-setup-shadow)">
        <path d="M0 25 92 0l107 80-96 31Z" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
        <path d="m70 27 58 51m0-67L70 89" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
        <text x="102" y="104" textAnchor="middle" fontSize="8" fontWeight="900" fill="#64748b">KARTU TANDA X</text>
      </g>

      <g transform="translate(430 24)">
        <rect width="236" height="42" rx="18" fill="#fff" fillOpacity=".92" stroke="#bae6fd" />
        <text x="118" y="17" textAnchor="middle" fontSize="8" fontWeight="900" fill="#0369a1">VARIABEL KONTROL</text>
        <text x="118" y="31" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#64748b">volume • konsentrasi • ukuran gelas • tanda X</text>
      </g>
    </svg>
  );
}

function TemperatureCard({ label, factor }: { label: string; factor: number }) {
  const fraction = Math.max(0.08, Math.min(1, factor / 50));
  const warm = factor >= 40;
  const cold = factor <= 20;

  return (
    <div className="relative mx-auto h-24 w-full max-w-[118px] sm:h-28" aria-hidden="true">
      <div className="absolute bottom-2 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-slate-900/10 blur-sm" />
      <div className="absolute bottom-4 left-1/2 h-[76px] w-8 -translate-x-1/2 rounded-full border-2 border-slate-400 bg-gradient-to-r from-white via-slate-100 to-slate-300 shadow-lg sm:h-[88px]">
        <div className="absolute bottom-1 left-1/2 w-2.5 -translate-x-1/2 overflow-hidden rounded-full bg-slate-200" style={{ height: "82%" }}>
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 rounded-full",
              warm ? "bg-red-500" : cold ? "bg-sky-500" : "bg-amber-500",
            )}
            style={{ height: `${fraction * 100}%` }}
          />
        </div>
        <div className={cn("absolute -bottom-2 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-2 border-white shadow", warm ? "bg-red-500" : cold ? "bg-sky-500" : "bg-amber-500")} />
      </div>
      <div className="absolute right-0 top-2 rounded-lg border border-white bg-slate-900/85 px-2 py-1 font-mono text-xs font-black text-white shadow">
        {label}
      </div>
    </div>
  );
}

export default function M3ExperimentSetup({
  options,
  selected,
  locked,
  readOnly,
  onToggle,
}: M3ExperimentSetupProps) {
  const disabled = locked || readOnly;

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.55)]">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-800 px-4 py-5 text-white sm:px-6">
        <div className="absolute -right-14 -top-20 h-60 w-60 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-200">Persiapan eksperimen virtual</p>
            <h3 className="mt-1.5 text-lg font-black sm:text-xl">Siapkan tanda X, lalu pilih suhu reaksi</h3>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-sky-50/90 sm:text-sm">
              Volume dan konsentrasi kedua larutan, gelas, serta tanda X dibuat sama.
              Hanya suhu awal campuran yang diubah.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-64 sm:justify-end">
            {["volume larutan sama", "konsentrasi sama", "tanda X sama"].map((text) => (
              <span key={text} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-sky-50">
                <Check className="h-3 w-3" /> {text}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6">
        <section aria-labelledby="m3-apparatus-title">
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Langkah 1</p>
            <h4 id="m3-apparatus-title" className="mt-0.5 text-sm font-extrabold text-slate-900">Perangkat pengamatan tanda X</h4>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <ApparatusPreview />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Larutan diseimbangkan pada suhu target, kemudian dicampur di atas kartu
            bertanda X. Waktu dihentikan ketika tanda X tidak lagi terlihat dari atas.
          </p>
        </section>

        <section aria-labelledby="m3-temperature-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Langkah 2</p>
              <h4 id="m3-temperature-title" className="mt-0.5 text-sm font-extrabold text-slate-900">Pilih minimal tiga suhu untuk dibandingkan</h4>
            </div>
            <span className="shrink-0 text-xs font-bold text-slate-500" role="status" aria-live="polite">
              <span className="text-sky-700">{selected.length}</span> dipilih
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            {options.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${active ? "Batalkan" : "Pilih"} suhu ${option.label}; volume dan konsentrasi larutan tetap sama`}
                  disabled={disabled}
                  onClick={() => onToggle(option.value)}
                  className={cn(
                    "group relative min-h-36 overflow-hidden rounded-2xl border p-2.5 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                    active
                      ? "-translate-y-0.5 border-sky-500 bg-gradient-to-b from-sky-50 to-white shadow-lg shadow-sky-100 ring-2 ring-sky-100"
                      : "border-slate-200 bg-gradient-to-b from-white to-slate-50 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md",
                    disabled && !active && "opacity-55",
                  )}
                >
                  {active && (
                    <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white ring-2 ring-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <TemperatureCard label={option.label} factor={option.factor} />
                  <div className="mt-1 flex items-center justify-between gap-1 border-t border-slate-200/80 px-1 pt-2">
                    <span className="inline-flex items-center gap-1 text-sm font-black text-slate-800"><Thermometer className="h-3.5 w-3.5" />{option.label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black", active ? "bg-sky-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200")}>
                      {active ? "DIPILIH" : "PILIH"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {(locked || readOnly) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
              <LockKeyhole className="h-3.5 w-3.5" />
              {readOnly
                ? "Setup ditampilkan sebagai dokumentasi percobaan."
                : "Pilihan terkunci; variabel selain suhu tetap sama pada semua percobaan."}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
