"use client";

// Experiment observations plus student-calculated rates and their charts.

import { useEffect, useMemo, useState } from "react";

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
import { Input } from "@/components/ui/forms";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import {
  buildGasComparisonRows,
  runNumericValue,
  sortRuns,
  studentRateValue,
} from "@/lib/runs";

export const CHART_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
];

/** Runs in display order — supports custom (non-preset) parameter values. */
export function orderedRuns(
  cfg: ExperimentConfig,
  runs: Record<string, ExperimentRun>
): ExperimentRun[] {
  return sortRuns(cfg, runs);
}

export function parseStudentRate(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function parseStudentReactionOrder(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function editableRate(value: number): string {
  return String(value).replace(".", ",");
}

export default function DataPanel({
  cfg,
  runs,
  readOnly,
  showReactionOrder,
  onRateChange,
  onReactionOrderChange,
}: {
  cfg: ExperimentConfig;
  runs: Record<string, ExperimentRun>;
  readOnly: boolean;
  showReactionOrder: boolean;
  onRateChange: (paramValue: string, rate: number | null) => void;
  onReactionOrderChange: (paramValue: string, order: number | null) => void;
}) {
  const list = useMemo(() => orderedRuns(cfg, runs), [cfg, runs]);
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setRateInputs((previous) => {
      const next: Record<string, string> = {};
      let changed = Object.keys(previous).length !== list.length;
      for (const run of list) {
        const storedRate = studentRateValue(run);
        const fallbackRate = readOnly && Number.isFinite(run.rate) ? run.rate : null;
        const storedText =
          storedRate !== null
            ? editableRate(storedRate)
            : fallbackRate !== null
              ? editableRate(fallbackRate)
              : "";
        next[run.paramValue] = readOnly
          ? storedText
          : (previous[run.paramValue] ?? storedText);
        if (next[run.paramValue] !== previous[run.paramValue]) changed = true;
      }
      return changed ? next : previous;
    });
  }, [list, readOnly]);

  useEffect(() => {
    setOrderInputs((previous) => {
      const next: Record<string, string> = {};
      let changed = Object.keys(previous).length !== list.length;
      for (const run of list) {
        const storedOrder = Number.isFinite(run.studentReactionOrder)
          ? run.studentReactionOrder!
          : null;
        const storedText = storedOrder === null ? "" : editableRate(storedOrder);
        next[run.paramValue] = readOnly
          ? storedText
          : (previous[run.paramValue] ?? storedText);
        if (next[run.paramValue] !== previous[run.paramValue]) changed = true;
      }
      return changed ? next : previous;
    });
  }, [list, readOnly]);

  if (list.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Belum ada data — jalankan percobaan terlebih dahulu.
      </p>
    );
  }

  const isGas = cfg.rateKind === "gasRate";
  const enteredRateCount = list.filter(
    (run) => studentRateValue(run) !== null
  ).length;
  const enteredOrderCount = list.filter((run) =>
    Number.isFinite(run.studentReactionOrder)
  ).length;

  const changeRate = (run: ExperimentRun, rawValue: string) => {
    if (!/^\d*(?:[.,]\d*)?$/.test(rawValue)) return;
    setRateInputs((previous) => ({
      ...previous,
      [run.paramValue]: rawValue,
    }));
    onRateChange(run.paramValue, parseStudentRate(rawValue));
  };

  const rateField = (run: ExperimentRun) => {
    const value = rateInputs[run.paramValue] ?? "";
    const invalid = value.trim().length > 0 && parseStudentRate(value) === null;
    return (
      <div className="flex min-w-[150px] items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          disabled={readOnly}
          onChange={(event) => changeRate(run, event.target.value)}
          placeholder="Contoh: 0,025"
          aria-label={`Laju reaksi untuk ${run.label}`}
          aria-invalid={invalid}
          className={invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}
        />
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          {cfg.rateUnit}
        </span>
      </div>
    );
  };

  const changeReactionOrder = (run: ExperimentRun, rawValue: string) => {
    if (!/^-?\d*(?:[.,]\d*)?$/.test(rawValue)) return;
    setOrderInputs((previous) => ({
      ...previous,
      [run.paramValue]: rawValue,
    }));
    onReactionOrderChange(run.paramValue, parseStudentReactionOrder(rawValue));
  };

  const reactionOrderField = (run: ExperimentRun) => {
    const value = orderInputs[run.paramValue] ?? "";
    const invalid =
      value.trim().length > 0 && parseStudentReactionOrder(value) === null;
    return (
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        disabled={readOnly}
        onChange={(event) => changeReactionOrder(run, event.target.value)}
        placeholder="Contoh: 1"
        aria-label={`Orde reaksi untuk ${run.label}`}
        aria-invalid={invalid}
        className={`min-w-[110px] ${
          invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
    );
  };

  const gasRows = isGas ? buildGasComparisonRows(cfg, list) : [];

  const experimentRows = list.map((r) => ({
    name: r.label,
    x: cfg.numericParam ? runNumericValue(cfg, r) : r.label,
    waktu: r.timeSec ?? 0,
  }));
  const rateRows = list.flatMap((r) => {
    const studentRate = studentRateValue(r);
    const chartRate =
      studentRate ?? (readOnly && Number.isFinite(r.rate) ? r.rate : null);
    return chartRate === null
      ? []
      : [
          {
            name: r.label,
            x: cfg.numericParam ? runNumericValue(cfg, r) : r.label,
            laju: chartRate,
          },
        ];
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 sm:px-4">
        <p className="text-sm font-bold text-blue-900">
          Hitung dan isi laju reaksi dengan rumus {cfg.rateLabel}.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-blue-800">
          {cfg.kind === "surface"
            ? "Gunakan perubahan volume CO₂ dari 0 hingga 10 detik (V₁₀ ÷ 10 s). Masukkan angka saja; grafik laju menggunakan nilai yang kamu isi."
            : "Masukkan angka saja (koma atau titik desimal dapat digunakan). Grafik laju reaksi menggunakan nilai yang kamu isi pada tabel."}
        </p>
        {!readOnly && (
          <div className="mt-2 space-y-0.5 text-xs font-bold text-blue-700">
            <p>{enteredRateCount}/{list.length} nilai laju telah diisi</p>
            {showReactionOrder && (
              <p>{enteredOrderCount}/{list.length} nilai orde reaksi telah diisi</p>
            )}
          </div>
        )}
      </div>
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
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {isGas ? (
                  <>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                      <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        {cfg.kind === "surface" ? "Volume (mL)" : "V pada 10 s"}
                      </dt>
                      <dd className="mt-0.5 font-mono font-black tabular-nums text-slate-700">
                        {v10 ?? "—"} mL
                      </dd>
                    </div>
                    {cfg.kind !== "surface" && (
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          V akhir
                        </dt>
                        <dd className="mt-0.5 font-mono font-black tabular-nums text-slate-700">
                          {vEnd ?? "—"} mL
                        </dd>
                      </div>
                    )}
                    {cfg.kind === "surface" && (
                      <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Waktu (s)
                        </dt>
                        <dd className="mt-0.5 font-mono font-black tabular-nums text-slate-700">
                          10
                        </dd>
                      </div>
                    )}
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
                <div className="col-span-2 rounded-lg bg-brand-50 px-2.5 py-2">
                  <dt className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-brand-700">
                    Laju {cfg.rateLabel}
                  </dt>
                  <dd>{rateField(r)}</dd>
                </div>
                {showReactionOrder && (
                  <div className="col-span-2 rounded-lg bg-violet-50 px-2.5 py-2">
                    <dt className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-violet-700">
                      Orde Reaksi
                    </dt>
                    <dd>{reactionOrderField(r)}</dd>
                  </div>
                )}
              </dl>
            </article>
          );
        })}
      </div>

      <div className="thin-scroll hidden overflow-x-auto rounded-xl border border-slate-200 sm:block">
        <table className={`w-full text-sm ${showReactionOrder ? "min-w-[640px]" : "min-w-[480px]"}`}>
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3 py-2 font-bold">No</th>
              <th className="px-3 py-2 font-bold">{cfg.paramName}</th>
              <th className="px-3 py-2 font-bold">
                {isGas
                  ? cfg.kind === "surface"
                    ? "Volume (mL)"
                    : "V pada t=10 s (mL)"
                  : cfg.timeLabel}
              </th>
              {isGas && cfg.kind !== "surface" && (
                <th className="px-3 py-2 font-bold">V akhir (mL)</th>
              )}
              {cfg.kind === "surface" && (
                <th className="px-3 py-2 font-bold">Waktu (s)</th>
              )}
              <th className="px-3 py-2 font-bold">
                Laju {cfg.rateLabel} ({cfg.rateUnit})
              </th>
              {showReactionOrder && (
                <th className="px-3 py-2 font-bold">Orde Reaksi</th>
              )}
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
                  {isGas && cfg.kind !== "surface" && (
                    <td className="px-3 py-2 text-slate-600">{vEnd ?? "-"}</td>
                  )}
                  {cfg.kind === "surface" && (
                    <td className="px-3 py-2 text-slate-600">10</td>
                  )}
                  <td className="px-3 py-2">{rateField(r)}</td>
                  {showReactionOrder && (
                    <td className="px-3 py-2">{reactionOrderField(r)}</td>
                  )}
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
              Data dilengkapi hingga bentuk paling lambat selesai. Bentuk yang lebih
              cepat selesai tetap menunjukkan volume akhir CO₂ yang sama.
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
                  <dl className="mt-2 grid grid-cols-3 gap-1">
                    {list.map((run) => (
                      <div
                        key={run.paramValue}
                        className="min-w-0 rounded-lg bg-slate-50 px-1.5 py-1.5"
                      >
                        <dt className="truncate text-[8px] font-bold text-slate-500">
                          {run.label}
                        </dt>
                        <dd className="font-mono text-[11px] font-black tabular-nums text-slate-800">
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
                <LineChart data={gasRows} margin={{ top: 5, right: 10, bottom: 18, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 11 }}
                    height={42}
                    label={{
                      value: "Waktu (s)",
                      position: "insideBottom",
                      offset: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={58}
                    label={{
                      value: cfg.timeLabel,
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <Tooltip
                    itemSorter={(item) => -Number(item.value ?? 0)}
                  />
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
                <LineChart data={experimentRows} margin={{ top: 5, right: 10, bottom: 18, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="x"
                    tick={{ fontSize: 11 }}
                    height={42}
                    label={{
                      value: cfg.chartX,
                      position: "insideBottom",
                      offset: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={58}
                    label={{
                      value: cfg.timeLabel,
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                      style: { textAnchor: "middle" },
                    }}
                  />
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
            {rateRows.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 px-6 text-center text-sm text-slate-400">
                Grafik akan muncul setelah nilai laju reaksi diisi pada tabel.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {cfg.numericParam ? (
                <LineChart data={rateRows} margin={{ top: 5, right: 10, bottom: 18, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="x"
                    tick={{ fontSize: 11 }}
                    height={42}
                    label={{
                      value: cfg.chartX,
                      position: "insideBottom",
                      offset: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={58}
                    label={{
                      value: `Laju reaksi (${cfg.rateUnit})`,
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                      style: { textAnchor: "middle" },
                    }}
                  />
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
                <BarChart data={rateRows} margin={{ top: 5, right: 10, bottom: 18, left: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    height={42}
                    label={{
                      value: cfg.chartX,
                      position: "insideBottom",
                      offset: 8,
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={58}
                    label={{
                      value: `Laju reaksi (${cfg.rateUnit})`,
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#475569",
                      style: { textAnchor: "middle" },
                    }}
                  />
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
