"use client";

import { Check, LockKeyhole } from "lucide-react";
import type { ExperimentConfig } from "@/lib/module-defs";
import { cn } from "@/lib/utils";

interface M2ExperimentSetupProps {
  options: ExperimentConfig["options"];
  selected: string[];
  locked: boolean;
  readOnly: boolean;
  onToggle: (value: string) => void;
}

const GRAINS = Array.from({ length: 30 }, (_, index) => ({
  x: 34 + ((index * 37) % 94),
  y: 82 + ((index * 19) % 32),
  r: 2 + (index % 3) * 0.35,
}));

function ApparatusPreview() {
  return (
    <svg
      viewBox="0 0 720 270"
      className="h-auto w-full"
      role="img"
      aria-label="Rangkaian Erlenmeyer tertutup yang tersambung selang ke gelas ukur terbalik di dalam bak air"
    >
      <defs>
        <linearGradient id="m2-setup-wall" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="m2-setup-bench" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d7b98d" />
          <stop offset="1" stopColor="#9a6b3d" />
        </linearGradient>
        <linearGradient id="m2-setup-glass" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".9" />
          <stop offset=".45" stopColor="#bae6fd" stopOpacity=".25" />
          <stop offset="1" stopColor="#64748b" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id="m2-setup-water" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e0f2fe" stopOpacity=".72" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity=".34" />
        </linearGradient>
        <filter id="m2-setup-shadow" x="-30%" y="-30%" width="170%" height="190%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#0f172a" floodOpacity=".2" />
        </filter>
      </defs>

      <rect width="720" height="270" rx="20" fill="url(#m2-setup-wall)" />
      <path d="M0 208H720V270H0Z" fill="url(#m2-setup-bench)" />
      <path d="M0 208H720L681 220H39Z" fill="#ead6b7" opacity=".82" />

      <g filter="url(#m2-setup-shadow)">
        <ellipse cx="225" cy="218" rx="105" ry="12" fill="#0f172a" opacity=".12" />
        <path
          d="M194 48v54l-67 92c-10 14-2 25 18 27h160c20-2 28-13 18-27l-67-92V48"
          fill="url(#m2-setup-glass)"
          stroke="#64748b"
          strokeWidth="2.5"
        />
        <path d="M143 177q82-16 164 0l16 23c7 11 0 17-18 19H145c-18-2-25-8-18-19Z" fill="#f8fafc" fillOpacity=".7" />
        <path d="M143 177q82-16 164 0" fill="none" stroke="#7dd3fc" strokeOpacity=".7" />
        <ellipse cx="225" cy="47" rx="32" ry="8" fill="#334155" />
        <path d="M201 47h48v11h-48z" fill="#475569" />
        <path d="M208 64v45l-55 81" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".62" />
        <g fill="#d6d3d1" stroke="#78716c">
          <circle cx="201" cy="197" r="7" />
          <circle cx="221" cy="201" r="8" />
          <circle cx="242" cy="196" r="6" />
          <circle cx="261" cy="202" r="7" />
        </g>
        <rect x="181" y="132" width="88" height="30" rx="8" fill="#fff" fillOpacity=".86" stroke="#bae6fd" />
        <text x="225" y="145" textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f766e">CaCO₃ + HCl</text>
        <text x="225" y="156" textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748b">MASSA & LARUTAN TETAP</text>
      </g>

      <path
        d="M225 43C318 13 405 30 463 78c37 30 53 57 65 92"
        fill="none"
        stroke="#334155"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M225 43C318 13 405 30 463 78c37 30 53 57 65 92"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <g filter="url(#m2-setup-shadow)">
        <ellipse cx="561" cy="224" rx="118" ry="12" fill="#0f172a" opacity=".12" />
        <path d="M433 164h250v59H433z" fill="url(#m2-setup-water)" stroke="#0e7490" strokeWidth="2" />
        <path d="M443 173h230" stroke="#fff" strokeWidth="2" opacity=".8" />
        <path d="M510 36h103v173H510z" fill="url(#m2-setup-glass)" stroke="#64748b" strokeWidth="2.5" />
        <path d="M520 76h83v132h-83z" fill="url(#m2-setup-water)" />
        <path d="M520 76h83" stroke="#38bdf8" strokeWidth="2" />
        <path d="M510 209q52 11 103 0" fill="none" stroke="#475569" strokeWidth="3" />
        {Array.from({ length: 6 }, (_, index) => (
          <g key={index}>
            <path d={`M583 ${53 + index * 25}h20`} stroke="#475569" strokeWidth="1.4" />
            <text x="578" y={57 + index * 25} textAnchor="end" fontSize="7" fontWeight="700" fill="#475569">
              {index * 10}
            </text>
          </g>
        ))}
        <path d="M528 170v35" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <circle cx="528" cy="159" r="5" fill="#fff" stroke="#38bdf8" />
        <circle cx="536" cy="143" r="4" fill="#fff" stroke="#38bdf8" />
        <circle cx="529" cy="128" r="3.5" fill="#fff" stroke="#38bdf8" />
      </g>

      <g transform="translate(486 19)">
        <rect width="190" height="31" rx="15.5" fill="#fff" stroke="#a5f3fc" />
        <text x="95" y="13" textAnchor="middle" fontSize="8" fontWeight="900" fill="#0e7490">PENGUMPULAN GAS CO₂</text>
        <text x="95" y="24" textAnchor="middle" fontSize="7" fontWeight="700" fill="#64748b">pendesakan air • skala mL</text>
      </g>
    </svg>
  );
}

function ShapePreview({ value }: { value: string }) {
  const rock = "#d6d3d1";
  const edge = "#78716c";

  return (
    <svg viewBox="0 0 160 128" className="h-24 w-full sm:h-28" aria-hidden="true">
      <defs>
        <linearGradient id={`m2-rock-${value}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fafaf9" />
          <stop offset=".48" stopColor={rock} />
          <stop offset="1" stopColor="#a8a29e" />
        </linearGradient>
        <filter id={`m2-rock-shadow-${value}`} x="-30%" y="-30%" width="170%" height="190%">
          <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#0f172a" floodOpacity=".2" />
        </filter>
      </defs>
      <ellipse cx="80" cy="112" rx="55" ry="8" fill="#0f172a" opacity=".11" />
      <g filter={`url(#m2-rock-shadow-${value})`} fill={`url(#m2-rock-${value})`} stroke={edge}>
        {value === "bongkahan" && (
          <path d="M41 95 34 64l20-29 42-10 30 22 4 35-26 25-43-1Z" strokeWidth="2" />
        )}
        {value === "kepingan" && (
          <>
            <path d="m33 88 28-18 39 7 7 13-29 14-39-4Z" />
            <path d="m47 64 25-17 37 8 4 12-27 13-34-5Z" />
            <path d="m62 42 23-13 30 8 2 11-23 12-28-6Z" />
          </>
        )}
        {value === "butiran" &&
          Array.from({ length: 12 }, (_, index) => {
            const x = 42 + ((index * 29) % 78);
            const y = 55 + ((index * 17) % 49);
            const r = 7 + (index % 3);
            return <circle key={index} cx={x} cy={y} r={r} />;
          })}
        {value === "serbuk" &&
          GRAINS.map((grain, index) => (
            <circle key={index} cx={grain.x} cy={grain.y} r={grain.r} strokeWidth=".7" />
          ))}
      </g>
      <path d="M46 105q34 10 69-1" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
    </svg>
  );
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
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.55)]">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-cyan-950 to-teal-800 px-4 py-5 text-white sm:px-6">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
              Persiapan eksperimen virtual
            </p>
            <h3 className="mt-1.5 text-lg font-black sm:text-xl">
              Rangkai penampung gas, lalu pilih bentuk CaCO₃
            </h3>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-cyan-50/90 sm:text-sm">
              Massa CaCO₃, volume dan konsentrasi HCl, serta suhu dibuat sama.
              Bentuk padatan adalah satu-satunya variabel yang diubah.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-64 sm:justify-end">
            {["massa CaCO₃ sama", "volume HCl tetap", "konsentrasi HCl tetap"].map((text) => (
              <span key={text} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-cyan-50">
                <Check className="h-3 w-3" /> {text}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6">
        <section aria-labelledby="m2-apparatus-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-600">Langkah 1</p>
              <h4 id="m2-apparatus-title" className="mt-0.5 text-sm font-extrabold text-slate-900">
                Perangkat pengumpulan gas lewat pendesakan air
              </h4>
            </div>
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
              <Check className="mr-1 h-3 w-3" /> Siap
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <ApparatusPreview />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Erlenmeyer ditutup rapat agar CO₂ mengalir melalui selang. Ujung selang
            berada di bawah mulut gelas ukur terbalik yang mula-mula penuh air.
          </p>
        </section>

        <section aria-labelledby="m2-shapes-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-600">Langkah 2</p>
              <h4 id="m2-shapes-title" className="mt-0.5 text-sm font-extrabold text-slate-900">
                Pilih minimal tiga bentuk padatan untuk dibandingkan
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-500" role="status" aria-live="polite">
              <span className="text-teal-700">{selected.length}</span> kondisi dipilih
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {options.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${active ? "Batalkan" : "Pilih"} bentuk ${option.label}; massa CaCO3 tetap sama`}
                  disabled={disabled}
                  onClick={() => onToggle(option.value)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-2.5 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                    active
                      ? "-translate-y-0.5 border-teal-500 bg-gradient-to-b from-cyan-50 to-white shadow-lg shadow-cyan-100 ring-2 ring-teal-100"
                      : "border-slate-200 bg-gradient-to-b from-white to-stone-50 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md",
                    disabled && !active && "opacity-55",
                  )}
                >
                  {active && (
                    <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white ring-2 ring-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <div className="transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none">
                    <ShapePreview value={option.value} />
                  </div>
                  <div className="border-t border-slate-200/80 px-1 pt-2">
                    <p className="text-sm font-black text-slate-800">{option.label}</p>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">CaCO₃ · massa sama</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-black", active ? "bg-teal-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200")}>
                        {active ? "DIPILIH" : "PILIH"}
                      </span>
                    </div>
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
                : "Pilihan terkunci; semua kondisi memakai variabel kontrol yang sama."}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
