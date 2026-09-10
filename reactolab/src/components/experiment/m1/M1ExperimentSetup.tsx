"use client";

import type { ExperimentConfig } from "@/lib/module-defs";

export interface M1ExperimentSetupProps {
  options: ExperimentConfig["options"];
  selected: string[];
  locked: boolean;
  readOnly: boolean;
  onToggle: (value: string) => void;
}

type ApparatusKind = "flask" | "cylinder" | "stopwatch" | "magnesium";

const APPARATUS: Array<{
  kind: ApparatusKind;
  name: string;
  detail: string;
}> = [
  {
    kind: "flask",
    name: "Erlenmeyer terbuka",
    detail: "Wadah reaksi yang sama",
  },
  {
    kind: "cylinder",
    name: "Gelas ukur",
    detail: "Volume HCl dibuat tetap",
  },
  {
    kind: "stopwatch",
    name: "Stopwatch digital",
    detail: "Mengukur waktu Mg habis",
  },
  {
    kind: "magnesium",
    name: "Pinset & pita Mg",
    detail: "0,10 g; dimensi awal sama",
  },
];

function CheckMark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="m4.5 10.3 3.3 3.25 7.7-7.3"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockMark() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="8.5" width="12" height="8.5" rx="2.3" fill="currentColor" />
      <path
        d="M6.7 8.5V6.4a3.3 3.3 0 0 1 6.6 0v2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="12.6" r="1.1" fill="white" />
    </svg>
  );
}

function FlaskIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="m1-setup-flask-glass" x1="44" y1="20" x2="139" y2="104">
          <stop stopColor="#fff" stopOpacity=".88" />
          <stop offset=".42" stopColor="#dbeafe" stopOpacity=".42" />
          <stop offset="1" stopColor="#93c5fd" stopOpacity=".24" />
        </linearGradient>
        <linearGradient id="m1-setup-flask-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff" stopOpacity=".72" />
          <stop offset="1" stopColor="#e2e8f0" stopOpacity=".62" />
        </linearGradient>
        <filter id="m1-setup-flask-shadow" x="-30%" y="-40%" width="160%" height="190%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1e3a8a" floodOpacity=".2" />
        </filter>
      </defs>

      <ellipse cx="91" cy="105" rx="57" ry="8" fill="#1e3a8a" opacity=".11" />
      <g filter="url(#m1-setup-flask-shadow)">
        <path
          d="M71 22v29L43 92c-5 8 .3 14 10 14h76c9.7 0 15-6 10-14l-29-41V22"
          fill="url(#m1-setup-flask-glass)"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M53 85c20-5 55-5 76 0l8 12c2.5 4-.7 7-7 7H52c-6.2 0-9.5-3-7-7l8-12Z"
          fill="url(#m1-setup-flask-liquid)"
        />
        <path d="M53 85c20-5 55-5 76 0" stroke="#94a3b8" strokeWidth="1.4" />
        <path d="M72 22h37" stroke="#64748b" strokeWidth="2" />
        <ellipse cx="90.5" cy="21.5" rx="19" ry="5" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
        <ellipse cx="90.5" cy="21.5" rx="13.5" ry="2.7" fill="#cbd5e1" opacity=".55" />
        <path d="M76 30v20L53 86" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".68" />
        <path d="M121 76h8M117 69h8M113 62h8" stroke="#64748b" strokeWidth="1.1" opacity=".65" />
      </g>
      <g transform="translate(128 25) rotate(8)">
        <rect width="34" height="17" rx="8.5" fill="#eff6ff" stroke="#93c5fd" />
        <text x="17" y="11.6" fill="#1d4ed8" fontSize="7.5" fontWeight="700" textAnchor="middle">
          TERBUKA
        </text>
      </g>
    </svg>
  );
}

function CylinderIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="m1-setup-cylinder-glass" x1="68" y1="12" x2="116" y2="101">
          <stop stopColor="#fff" stopOpacity=".92" />
          <stop offset=".55" stopColor="#dbeafe" stopOpacity=".36" />
          <stop offset="1" stopColor="#bfdbfe" stopOpacity=".25" />
        </linearGradient>
        <filter id="m1-setup-cylinder-shadow" x="-40%" y="-20%" width="180%" height="170%">
          <feDropShadow dx="1" dy="5" stdDeviation="4" floodColor="#1e3a8a" floodOpacity=".2" />
        </filter>
      </defs>

      <ellipse cx="91" cy="106" rx="43" ry="7" fill="#1e3a8a" opacity=".11" />
      <g filter="url(#m1-setup-cylinder-shadow)" transform="rotate(-2 90 60)">
        <path d="M70 16h40l-4 79H74l-4-79Z" fill="url(#m1-setup-cylinder-glass)" stroke="#64748b" strokeWidth="2" />
        <ellipse cx="90" cy="16" rx="20" ry="4.8" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
        <path d="M74.8 74h30.4l-1 20H75.8l-1-20Z" fill="#fff" fillOpacity=".66" />
        <ellipse cx="90" cy="74" rx="15.2" ry="3" fill="#fff" fillOpacity=".78" stroke="#94a3b8" strokeWidth="1" />
        <path d="M77 22h5v66" stroke="white" strokeWidth="3.8" strokeLinecap="round" opacity=".7" />
        {[29, 38, 47, 56, 65, 74, 83].map((y, index) => (
          <path
            key={y}
            d={`M${index % 2 === 0 ? 98 : 102} ${y}h7`}
            stroke="#475569"
            strokeWidth="1"
            opacity=".68"
          />
        ))}
        <path d="M84 95v5M96 95v5" stroke="#64748b" strokeWidth="2" />
        <path d="M65 100h51l8 5H57l8-5Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <rect x="116" y="54" width="48" height="19" rx="9.5" fill="#ecfdf5" stroke="#86efac" />
      <text x="140" y="66.7" fill="#047857" fontSize="7.8" fontWeight="700" textAnchor="middle">
        VOLUME TETAP
      </text>
    </svg>
  );
}

function StopwatchIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" fill="none">
      <defs>
        <radialGradient id="m1-setup-watch-face" cx="0" cy="0" r="1" gradientTransform="translate(77 48) rotate(48) scale(65)">
          <stop stopColor="#fff" />
          <stop offset=".62" stopColor="#eff6ff" />
          <stop offset="1" stopColor="#bfdbfe" />
        </radialGradient>
        <linearGradient id="m1-setup-watch-rim" x1="48" y1="28" x2="129" y2="105">
          <stop stopColor="#475569" />
          <stop offset=".48" stopColor="#0f172a" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <filter id="m1-setup-watch-shadow" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="2" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity=".26" />
        </filter>
      </defs>

      <ellipse cx="92" cy="107" rx="49" ry="7" fill="#0f172a" opacity=".12" />
      <g filter="url(#m1-setup-watch-shadow)" transform="rotate(5 90 65)">
        <path d="M78 20V12h24v8" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
        <rect x="79" y="7" width="22" height="10" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
        <path d="m120 30 8-7 7 8-8 7" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
        <circle cx="90" cy="66" r="43" fill="url(#m1-setup-watch-rim)" />
        <circle cx="90" cy="64" r="35.5" fill="url(#m1-setup-watch-face)" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M90 33v5M111.5 42.5l-3.6 3.6M121 64h-5M68.5 42.5l3.6 3.6M59 64h5" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="67" y="56" width="46" height="18" rx="4" fill="#0f172a" />
        <text x="90" y="69" fill="#a7f3d0" fontFamily="ui-monospace, monospace" fontSize="13" fontWeight="700" textAnchor="middle">
          00.0
        </text>
        <path d="M72 83c11 7 25 7 36 0" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      </g>
    </svg>
  );
}

function MagnesiumIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 180 120" className="h-full w-full" fill="none">
      <defs>
        <linearGradient id="m1-setup-forceps" x1="39" y1="15" x2="134" y2="102">
          <stop stopColor="#f8fafc" />
          <stop offset=".34" stopColor="#94a3b8" />
          <stop offset=".58" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="m1-setup-mg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" />
          <stop offset=".28" stopColor="#cbd5e1" />
          <stop offset=".62" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <filter id="m1-setup-metal-shadow" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity=".24" />
        </filter>
      </defs>

      <ellipse cx="92" cy="104" rx="61" ry="8" fill="#0f172a" opacity=".11" />
      <g filter="url(#m1-setup-metal-shadow)">
        <path d="M35 23c25 19 52 42 90 72" stroke="url(#m1-setup-forceps)" strokeWidth="7" strokeLinecap="round" />
        <path d="M42 16c19 27 46 50 88 72" stroke="url(#m1-setup-forceps)" strokeWidth="7" strokeLinecap="round" />
        <path d="M35 23 42 16" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
        <path d="m123 95 13 7M128 87l13 6" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M135 92c8-7 18-6 20 1 2 8-6 14-15 10-8-4-7-13 1-18 7-5 15-2 15 4"
          stroke="url(#m1-setup-mg)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M57 35 91 65" stroke="white" strokeWidth="1.7" strokeLinecap="round" opacity=".75" />
      </g>
      <g transform="translate(14 79)">
        <rect width="62" height="19" rx="9.5" fill="#f8fafc" stroke="#cbd5e1" />
        <text x="31" y="12.8" fill="#475569" fontSize="7.7" fontWeight="700" textAnchor="middle">
          Mg IDENTIK
        </text>
      </g>
    </svg>
  );
}

function ApparatusIllustration({ kind }: { kind: ApparatusKind }) {
  switch (kind) {
    case "flask":
      return <FlaskIllustration />;
    case "cylinder":
      return <CylinderIllustration />;
    case "stopwatch":
      return <StopwatchIllustration />;
    case "magnesium":
      return <MagnesiumIllustration />;
  }
}

function ApparatusCard({
  kind,
  name,
  detail,
}: {
  kind: ApparatusKind;
  name: string;
  detail: string;
}) {
  return (
    <article className="group relative isolate min-h-[170px] overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-blue-50 px-3 pb-3 pt-2 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_35px_-18px_rgba(37,99,235,0.35)] motion-reduce:transform-none motion-reduce:transition-none sm:min-h-[190px]">
      <div
        aria-hidden="true"
        className="absolute inset-x-3 bottom-[58px] -z-10 h-12 origin-bottom -skew-x-6 rounded-[50%] bg-gradient-to-b from-blue-100/30 to-slate-300/35 blur-[1px]"
      />
      <div className="mx-auto h-[98px] max-w-[180px] transition duration-300 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none sm:h-[118px]">
        <ApparatusIllustration kind={kind} />
      </div>
      <div className="relative border-t border-slate-200/70 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h5 className="text-xs font-extrabold leading-tight text-slate-800">{name}</h5>
            <p className="mt-1 text-[10px] font-medium leading-snug text-slate-500">{detail}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckMark className="h-3 w-3" /> Tetap
          </span>
        </div>
      </div>
    </article>
  );
}

function HclBottle({
  label,
  selected,
  index,
}: {
  label: string;
  selected: boolean;
  index: number;
}) {
  const glassId = `m1-setup-bottle-glass-${index}`;
  const labelId = `m1-setup-bottle-label-${index}`;
  const shadowId = `m1-setup-bottle-shadow-${index}`;

  return (
    <svg aria-hidden="true" viewBox="0 0 136 154" className="h-[108px] w-full sm:h-[132px]" fill="none">
      <defs>
        <linearGradient id={glassId} x1="35" y1="24" x2="105" y2="139">
          <stop stopColor="#fff" stopOpacity=".96" />
          <stop offset=".28" stopColor="#eff6ff" stopOpacity=".58" />
          <stop offset=".65" stopColor="#fff" stopOpacity=".72" />
          <stop offset="1" stopColor="#cbd5e1" stopOpacity=".42" />
        </linearGradient>
        <linearGradient id={labelId} x1="42" y1="75" x2="101" y2="118">
          <stop stopColor={selected ? "#2563eb" : "#475569"} />
          <stop offset="1" stopColor={selected ? "#1e40af" : "#1e293b"} />
        </linearGradient>
        <filter id={shadowId} x="-35%" y="-25%" width="180%" height="180%">
          <feDropShadow dx="2" dy="7" stdDeviation="5" floodColor={selected ? "#1d4ed8" : "#0f172a"} floodOpacity={selected ? ".25" : ".18"} />
        </filter>
      </defs>

      <ellipse cx="69" cy="142" rx="43" ry="7" fill={selected ? "#2563eb" : "#0f172a"} opacity={selected ? ".15" : ".09"} />
      <g filter={`url(#${shadowId})`}>
        <path d="M51 24h35v21c13 5 21 16 22 31l4 53c.5 8-5.5 12-13 12H38c-7.5 0-13.5-4-13-12l4-53c1-15 9-26 22-31V24Z" fill={`url(#${glassId})`} stroke={selected ? "#2563eb" : "#64748b"} strokeWidth={selected ? "2.4" : "1.8"} />
        <path d="M32 96h73l2.5 33c.3 4.5-3 7-8 7h-62c-5 0-8.3-2.5-8-7L32 96Z" fill="#fff" fillOpacity=".58" />
        <ellipse cx="68.5" cy="96" rx="36.5" ry="5" fill="#fff" fillOpacity=".82" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M40 58c-5 8-6 18-6.5 32L31 124" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".8" />
        <rect x="47" y="20" width="43" height="11" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
        <ellipse cx="68.5" cy="20" rx="21.5" ry="4.5" fill="#64748b" stroke="#1e293b" strokeWidth="1.5" />
        <path d="M51 25h35" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
        <path d="M102 80c2 15 2 30 3 43" stroke="#94a3b8" strokeWidth="1.5" opacity=".45" />

        <g>
          <path d="M38 69h61l3 47H35l3-47Z" fill={`url(#${labelId})`} />
          <path d="m38 69 5-4h60l-4 4H38Z" fill={selected ? "#60a5fa" : "#94a3b8"} />
          <path d="m99 69 4-4-3 45-1 6V69Z" fill="#0f172a" opacity=".28" />
          <text x="68.5" y="84" fill="white" fontSize="9" fontWeight="800" letterSpacing="1.2" textAnchor="middle">
            HCl
          </text>
          <text x="68.5" y="101" fill="white" fontSize="13" fontWeight="900" textAnchor="middle">
            {label}
          </text>
          <text x="68.5" y="111" fill="#dbeafe" fontSize="5.8" fontWeight="700" letterSpacing=".55" textAnchor="middle">
            LARUTAN BENING
          </text>
        </g>
      </g>

      <g transform="translate(91 42)">
        <rect width="35" height="15" rx="7.5" fill="#fff" stroke={selected ? "#93c5fd" : "#cbd5e1"} />
        <text x="17.5" y="10.2" fill={selected ? "#1d4ed8" : "#64748b"} fontSize="6.3" fontWeight="800" textAnchor="middle">
          V SAMA
        </text>
      </g>
    </svg>
  );
}

export default function M1ExperimentSetup({
  options,
  selected,
  locked,
  readOnly,
  onToggle,
}: M1ExperimentSetupProps) {
  const disabled = locked || readOnly;

  return (
    <section
      aria-labelledby="m1-setup-title"
      className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.55)]"
    >
      <header className="relative isolate overflow-hidden border-b border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-brand-800 px-4 py-5 text-white sm:px-6">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 left-1/4 -z-10 h-52 w-72 rounded-full bg-cyan-300/10 blur-3xl"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">
              Persiapan eksperimen virtual
            </p>
            <h3 id="m1-setup-title" className="mt-1.5 text-lg font-black tracking-tight sm:text-xl">
              Siapkan alat, lalu pilih larutan HCl
            </h3>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-blue-100/90 sm:text-sm">
              Setiap percobaan memakai alat, 20 mL larutan, suhu, serta pita Mg
              0,10 g dengan dimensi awal yang sama. Hanya konsentrasi HCl—jumlah
              ion asam per volume—yang dibedakan.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[245px] sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-50 backdrop-blur-sm">
              <CheckMark /> Volume HCl 20 mL
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-50 backdrop-blur-sm">
              <CheckMark /> Mg 0,10 g & dimensi sama
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6">
        <section aria-labelledby="m1-apparatus-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">
                Langkah 1
              </p>
              <h4 id="m1-apparatus-title" className="mt-0.5 text-sm font-extrabold text-slate-900">
                Perangkat tetap untuk setiap percobaan
              </h4>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              Sudah disiapkan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {APPARATUS.map((item) => (
              <ApparatusCard key={item.kind} {...item} />
            ))}
          </div>
        </section>

        <section aria-labelledby="m1-reagent-title">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-600">
                Langkah 2
              </p>
              <h4 id="m1-reagent-title" className="mt-0.5 text-sm font-extrabold text-slate-900">
                Pilih konsentrasi HCl yang akan dibandingkan
              </h4>
            </div>
            <p
              className="text-xs font-bold text-slate-500"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="text-brand-700">{selected.length}</span> kondisi dipilih
            </p>
          </div>

          <div className="mb-3 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-[11px] leading-relaxed text-sky-900">
            <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 8.6v5M10 5.8v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p>
              <b>HCl(aq) tidak berwarna.</b> Semua botol sengaja menampilkan larutan
              bening; perbedaan konsentrasi ditunjukkan oleh label, bukan oleh warna.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
            {options.map((option, index) => {
              const isSelected = selected.includes(option.value);
              const action = isSelected ? "Batalkan pilihan" : "Pilih";

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${action} larutan HCl ${option.label}; volume HCl 20 mililiter serta pita magnesium 0,10 gram dengan dimensi awal yang sama`}
                  disabled={disabled}
                  onClick={() => onToggle(option.value)}
                  className={`group relative isolate overflow-hidden rounded-2xl border px-2 pb-3 pt-2 text-center shadow-sm transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-not-allowed ${
                    isSelected
                      ? "-translate-y-0.5 border-brand-500 bg-gradient-to-b from-blue-50 via-white to-blue-100/70 shadow-[0_16px_30px_-18px_rgba(37,99,235,0.7)] ring-2 ring-brand-100"
                      : "border-slate-200 bg-gradient-to-b from-white to-slate-100/80 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_14px_28px_-20px_rgba(37,99,235,0.55)]"
                  } ${disabled && !isSelected ? "opacity-60" : ""}`}
                >
                  <div
                    aria-hidden="true"
                    className={`absolute inset-x-2 bottom-[42px] -z-10 h-14 rounded-[50%] blur-xl ${
                      isSelected ? "bg-blue-300/25" : "bg-slate-300/15"
                    }`}
                  />

                  {isSelected && (
                    <span className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white">
                      <CheckMark className="h-4 w-4" />
                    </span>
                  )}

                  <div className="transition duration-300 group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none">
                    <HclBottle label={option.label} selected={isSelected} index={index} />
                  </div>

                  <span
                    className={`inline-flex min-h-6 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-brand-600 text-white"
                        : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200"
                    }`}
                  >
                    {isSelected ? "Dipilih" : disabled ? "Tidak dipilih" : "Pilih kondisi"}
                  </span>
                </button>
              );
            })}
          </div>

          {(locked || readOnly) && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800">
              <LockMark />
              {readOnly
                ? "Setup ini sudah selesai. Pilihan ditampilkan sebagai dokumentasi percobaan."
                : "Pilihan telah dikunci. Semua kondisi siap dijalankan dengan variabel kontrol yang sama."}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
