"use client";

// Auto data table + charts built from recorded runs (PRD §30-D/E).

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";

export const CHART_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
];

export function orderedRuns(
  cfg: ExperimentConfig,
  runs: Record<string, ExperimentRun>
): ExperimentRun[] {
  return cfg.options
    .map((o) => runs[o.value.replace(/[.#$/[\]]/g, "_")])
    .filter(Boolean) as ExperimentRun[];
}

export default function DataPanel({
  cfg,
  runs,
}: {
  cfg: ExperimentConfig;
  runs: Record<string, ExperimentRun>;
}) {
  const list = orderedRuns(cfg, runs);
  if (list.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Belum ada data — jalankan percobaan terlebih dahulu.
      </p>
    );
  }

  const isGas = cfg.rateKind === "gasRate";

  // gas: merge series into one chart dataset
  let gasRows: Array<Record<string, number>> = [];
  if (isGas) {
    const map = new Map<number, Record<string, number>>();
    for (const r of list) {
      for (const pt of r.series ?? []) {
        const row = map.get(pt.t) ?? { t: pt.t };
        row[r.label] = pt.v;
        map.set(pt.t, row);
      }
    }
    gasRows = Array.from(map.values()).sort((a, b) => a.t - b.t);
  }

  const rateRows = list.map((r) => ({
    name: r.label,
    x: cfg.numericParam
      ? (cfg.options.find((o) => o.value === r.paramValue)?.factor ?? 0)
      : r.label,
    waktu: r.timeSec ?? 0,
    laju: Number(r.rate.toFixed(4)),
  }));

  return (
    <div className="space-y-4">
      {/* ---- data table ---- */}
      <div className="grid gap-2 sm:hidden">
        {list.map((r, i) => {
          const v10 = r.series?.find((point) => point.t === 10)?.v;
          const vEnd = r.series?.[r.series.length - 1]?.v;
          return (
            <article
              key={r.paramValue}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Percobaan {i + 1}
                  </p>
                  <p className="truncate text-sm font-black text-slate-800">{r.label}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black text-brand-700">
                  {r.rateLabel}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {isGas ? (
                  <>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                      <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        V pada 10 s
                      </dt>
                      <dd className="mt-0.5 font-mono font-black tabular-nums text-slate-700">
                        {v10 ?? "—"} mL
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                      <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        {cfg.kind === "surface" ? "V pada 40 s" : "V akhir"}
                      </dt>
                      <dd className="mt-0.5 font-mono font-black tabular-nums text-slate-700">
                        {vEnd ?? "—"} mL
                      </dd>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 rounded-lg bg-slate-50 px-2.5 py-2">
                    <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      {cfg.timeLabel}
                    </dt>
                    <dd className="mt-0.5 font-mono font-black tabular-nums text-slate-700">
                      {r.timeSec?.toFixed(1)} s
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          );
        })}
      </div>

      <div className="thin-scroll hidden overflow-x-auto rounded-xl border border-slate-200 sm:block">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3 py-2 font-bold">No</th>
              <th className="px-3 py-2 font-bold">{cfg.paramName}</th>
              <th className="px-3 py-2 font-bold">
                {isGas ? "V pada t=10 s (mL)" : cfg.timeLabel}
              </th>
              {isGas && (
                <th className="px-3 py-2 font-bold">
                  {cfg.kind === "surface" ? "V pada t=40 s (mL)" : "V akhir (mL)"}
                </th>
              )}
              <th className="px-3 py-2 font-bold">
                Laju {cfg.rateLabel} ({cfg.rateUnit})
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => {
              const v10 = r.series?.find((p) => p.t === 10)?.v;
              const vEnd = r.series?.[r.series.length - 1]?.v;
              return (
                <tr key={r.paramValue} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold text-slate-700">{r.label}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {isGas ? (v10 ?? "-") : `${r.timeSec?.toFixed(1)} s`}
                  </td>
                  {isGas && (
                    <td className="px-3 py-2 text-slate-600">{vEnd ?? "-"}</td>
                  )}
                  <td className="px-3 py-2 font-bold text-brand-700">{r.rateLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cfg.kind === "surface" && (
        <div className="overflow-hidden rounded-xl border border-cyan-200 bg-cyan-50/40">
          <div className="border-b border-cyan-100 px-3 py-2.5">
            <p className="text-xs font-bold text-cyan-900">
              Tabel pembacaan volume CO₂ tiap 10 detik
            </p>
            <p className="mt-0.5 text-[10px] text-cyan-700">
              Data berasal dari skala gelas ukur terbalik pada setiap waktu pengamatan.
            </p>
          </div>
          <div className="space-y-2 p-2 sm:hidden">
            {gasRows
              .filter((row) => row.t % 10 === 0)
              .map((row) => (
                <article key={row.t} className="rounded-xl border border-cyan-100 bg-white p-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">
                    t = {row.t} detik
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-1.5">
                    {list.map((run) => (
                      <div key={run.paramValue} className="rounded-lg bg-slate-50 px-2 py-1.5">
                        <dt className="truncate text-[9px] font-bold text-slate-500">
                          {run.label}
                        </dt>
                        <dd className="font-mono text-xs font-black tabular-nums text-slate-800">
                          {row[run.label] ?? "—"} mL
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
          </div>
          <div className="thin-scroll hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-white/70">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2 font-bold">Waktu (s)</th>
                  {list.map((run) => (
                    <th key={run.paramValue} className="px-3 py-2 font-bold">
                      {run.label} (mL)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gasRows
                  .filter((row) => row.t % 10 === 0)
                  .map((row) => (
                  <tr key={row.t} className="border-t border-cyan-100 bg-white/50">
                    <td className="px-3 py-2 font-mono font-bold tabular-nums text-slate-600">
                      {row.t}
                    </td>
                    {list.map((run) => (
                      <td
                        key={run.paramValue}
                        className="px-3 py-2 font-mono tabular-nums text-slate-700"
                      >
                        {row[run.label] ?? "—"}
                      </td>
                    ))}
                  </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- charts ---- */}
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        {isGas ? (
          <div className="rounded-xl border border-slate-200 p-2.5 sm:p-3">
            <p className="text-xs font-bold text-slate-500 mb-2">
              Grafik Volume Gas vs Waktu
            </p>
            <div className="h-52 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gasRows} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 11 }}
                    label={{ value: "t (s)", position: "insideBottomRight", offset: -2, fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {list.map((r, i) => (
                    <Line
                      key={r.paramValue}
                      type="monotone"
                      dataKey={r.label}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 p-2.5 sm:p-3">
            <p className="text-xs font-bold text-slate-500 mb-2">
              Grafik Waktu Reaksi vs {cfg.chartX}
            </p>
            <div className="h-52 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateRows} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="waktu"
                    name="Waktu (s)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 p-2.5 sm:p-3">
          <p className="text-xs font-bold text-slate-500 mb-2">
            Grafik Laju Reaksi vs {cfg.chartX}
          </p>
          <div className="h-52 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              {cfg.numericParam ? (
                <LineChart data={rateRows} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="laju"
                    name={`Laju (${cfg.rateUnit})`}
                    stroke="#2563eb"
                    strokeWidth={2.5}
                  />
                </LineChart>
              ) : (
                <BarChart data={rateRows} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="laju"
                    name={`Laju (${cfg.rateUnit})`}
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
