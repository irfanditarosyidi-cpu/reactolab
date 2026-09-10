"use client";

import { memo, useMemo } from "react";
import { ArrowLeftRight, ScanSearch } from "lucide-react";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import M1ParticleLens from "./M1ParticleLens";

export interface M1CompareViewProps {
  cfg: ExperimentConfig;
  runs: Record<string, ExperimentRun>;
  maxFactor: number;
  selected?: string[];
}

function runKey(value: string) {
  return value.replace(/[.#$/[\]]/g, "_");
}

export default memo(function M1CompareView({
  cfg,
  runs,
  maxFactor,
  selected,
}: M1CompareViewProps) {
  const completed = useMemo(
    () =>
      cfg.options
        .filter(
          (option) =>
            (!selected || selected.includes(option.value)) &&
            Boolean(runs[runKey(option.value)]),
        )
        .sort((a, b) => a.factor - b.factor),
    [cfg.options, runs, selected],
  );

  if (completed.length < 2) return null;

  const low = completed[0];
  const high = completed[completed.length - 1];

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <ScanSearch className="h-4 w-4" />
          </span>
          <div>
            <h5 className="text-sm font-black text-slate-800">
              Perbandingan Submikroskopik
            </h5>
            <p className="text-[11px] text-slate-500">
              Cuplikan awal statis pada volume, suhu, dan perbesaran yang sama
            </p>
          </div>
        </div>
        <span className="self-start rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 ring-1 ring-indigo-100 sm:self-auto">
          variabel: konsentrasi
        </span>
      </div>

      <div className="grid items-start gap-3 p-4 md:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)]">
        <ComparisonCell title="Konsentrasi lebih rendah" label={low.label}>
          <M1ParticleLens
            factor={low.factor}
            maxFactor={maxFactor}
            diameter={250}
            progress={0}
            running={false}
            playbackRate={1}
            label={low.label}
            showHeader={false}
            showLegend={false}
            showFrequency
          />
        </ComparisonCell>

        <div className="hidden h-full items-center justify-center md:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200">
            <ArrowLeftRight className="h-4 w-4" />
          </span>
        </div>

        <ComparisonCell title="Konsentrasi lebih tinggi" label={high.label}>
          <M1ParticleLens
            factor={high.factor}
            maxFactor={maxFactor}
            diameter={250}
            progress={0}
            running={false}
            playbackRate={1}
            label={high.label}
            showHeader={false}
            showLegend={false}
            showFrequency
          />
        </ComparisonCell>
      </div>

      <div className="mx-4 mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-rose-600 bg-rose-500 ring-2 ring-sky-100" />
          H₃O⁺ / H⁺(aq), terhidrasi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-cyan-700 bg-cyan-400" />
          Cl⁻(aq), ion pendamping
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-slate-600 bg-slate-300" />
          Mg(s), permukaan logam
        </span>
        <span className="basis-full text-center font-normal italic text-slate-400">
          Jumlah ikon sebanding untuk perbandingan, tetapi tidak menunjukkan skala
          atau jumlah partikel sebenarnya.
        </span>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-xs font-semibold leading-relaxed text-slate-700">
          Pada volume yang sama, HCl yang lebih terkonsentrasi mengandung lebih
          banyak ion asam. Akibatnya, tumbukan ion asam dengan permukaan Mg terjadi
          lebih sering per satuan waktu.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Konsentrasi menaikkan frekuensi tumbukan, bukan membuat partikel bergerak
          lebih cepat atau otomatis membuat setiap tumbukan lebih efektif.
        </p>
      </div>
    </section>
  );
});

function ComparisonCell({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top,#f8fafc,#ffffff_70%)] p-3">
      <div className="mb-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          {title}
        </p>
        <p className="mt-0.5 text-base font-black text-indigo-700">HCl {label}</p>
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
