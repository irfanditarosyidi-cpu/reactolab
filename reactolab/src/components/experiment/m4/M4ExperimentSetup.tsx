"use client";

import { Check, Droplets, FlaskConical, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperimentConfig } from "@/lib/module-defs";

const styles: Record<string, { color: string; sample: string; note: string }> = {
  tanpa: { color: "bg-sky-100", sample: "bening", note: "Kontrol pembanding" },
  mno2: { color: "bg-slate-800", sample: "serbuk hitam", note: "Katalis anorganik" },
  fecl3: { color: "bg-orange-500", sample: "larutan jingga", note: "Katalis homogen" },
  hati: { color: "bg-amber-800", sample: "ekstrak cokelat", note: "Mengandung katalase" },
};

export default function M4ExperimentSetup({
  options,
  selected,
  locked,
  readOnly,
  minSelections,
  onToggle,
}: {
  options: ExperimentConfig["options"];
  selected: string[];
  locked: boolean;
  readOnly: boolean;
  minSelections: number;
  onToggle: (value: string) => void;
}) {
  const selectedCatalystCount = selected.filter((value) => value !== "tanpa").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Droplets className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pereaksi tetap</p><p className="text-sm font-black text-slate-700">H₂O₂ 3% · 20 mL</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><FlaskConical className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alat ukur</p><p className="text-sm font-black text-slate-700">Labu + penampung O₂</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Sparkles className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Variabel bebas</p><p className="text-sm font-black text-slate-700">Jenis katalis</p></div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Kontrol wajib dan pilihan katalis yang akan diuji
        </p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {options.map((option) => {
            const meta = styles[option.value] ?? styles.tanpa;
            const isControl = option.value === "tanpa";
            const isSelected = isControl || selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                disabled={isControl || locked || readOnly}
                aria-pressed={isSelected}
                onClick={() => onToggle(option.value)}
                className={cn(
                  "relative min-h-[142px] overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition disabled:cursor-not-allowed",
                  isSelected
                    ? "border-blue-300 bg-blue-50 ring-1 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40",
                )}
              >
                <span
                  className={cn(
                    "absolute right-2 top-2 grid min-h-6 min-w-6 place-items-center rounded-full px-1.5 text-white",
                    isSelected ? "bg-blue-600" : "bg-slate-300",
                  )}
                >
                  {isControl || locked ? (
                    <Lock className="h-3 w-3" />
                  ) : isSelected ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[9px] font-black">Pilih</span>
                  )}
                </span>
                <span className="mx-auto mt-2 block h-16 w-12 rounded-b-xl rounded-t-md border-2 border-slate-300 bg-white p-1 shadow-inner"><i className={cn("mt-6 block h-7 rounded-b-lg", meta.color)} /></span>
                <span className="mt-2 block text-center text-sm font-black text-slate-800">{option.label}</span>
                <span className="block text-center text-[9px] font-bold text-slate-400">{meta.sample} · {meta.note}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-bold text-blue-700">
          {selectedCatalystCount}/{minSelections} minimal katalis dipilih
        </p>
      </div>

      <div className="space-y-2">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          <b>Kontrol pembanding:</b> kondisi tanpa katalis wajib diuji agar pengaruh
          katalis dapat dibandingkan dengan reaksi penguraian H₂O₂ tanpa katalis.
        </p>
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900">
          <b>Variabel kontrol:</b> volume dan konsentrasi H₂O₂, massa/volume katalis,
          suhu, serta ukuran labu dibuat sama.
        </p>
      </div>
    </div>
  );
}
