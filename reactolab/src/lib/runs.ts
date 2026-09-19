// Shared helpers for experiment runs. Module 1 lets students choose their own
// HCl concentrations, so runs can no longer be enumerated from cfg.options —
// every consumer (data table, charts, hypothesis test, LKPD PDF, teacher view)
// sorts the stored runs generically through this module instead.

import type { ExperimentConfig } from "./module-defs";
import type { ExperimentRun } from "./types";

/** RTDB-safe key for a parameter value ("1.25" → "1_25"). */
export function safeKey(value: string): string {
  return value.replace(/[.#$/[\]]/g, "_");
}

/** Round a concentration to the slider step and clamp it to the allowed range. */
export function normalizeConcentration(
  raw: number,
  range: { min: number; max: number; step: number }
): number | null {
  if (!Number.isFinite(raw)) return null;
  const stepped = Math.round(raw / range.step) * range.step;
  const clamped = Math.min(range.max, Math.max(range.min, stepped));
  return Math.round(clamped * 100) / 100;
}

/** Canonical stored value for a custom concentration: two decimals ("1.25"). */
export function concentrationValue(c: number): string {
  return c.toFixed(2);
}

/** Indonesian display label: 1.5 → "1,5 M", 1.25 → "1,25 M". */
export function concentrationLabel(c: number, unit = "M"): string {
  const text = (Math.round(c * 100) / 100)
    .toFixed(2)
    .replace(/0$/, "")
    .replace(".", ",");
  return `${text} ${unit}`.trim();
}

/** Smallest gap between neighbouring values (Infinity when < 2 values). */
export function minGap(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < sorted.length; i++) {
    gap = Math.min(gap, sorted[i] - sorted[i - 1]);
  }
  return gap;
}

/**
 * Sort stored runs for display. Numeric parameters (concentration, temperature)
 * sort by their numeric value so custom values interleave with legacy preset
 * runs; categorical parameters follow cfg.options order; ties fall back to the
 * recording time.
 */
export function sortRuns(
  cfg: ExperimentConfig,
  runs: Record<string, ExperimentRun> | null | undefined
): ExperimentRun[] {
  const list = Object.values(runs ?? {}).filter(
    (r): r is ExperimentRun => Boolean(r && typeof r === "object" && r.paramValue !== undefined)
  );
  const optionIndex = (r: ExperimentRun) =>
    cfg.options.findIndex((o) => o.value === r.paramValue);
  return list.sort((a, b) => {
    if (cfg.numericParam) {
      const na = parseFloat(a.paramValue);
      const nb = parseFloat(b.paramValue);
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    }
    const ia = optionIndex(a);
    const ib = optionIndex(b);
    if (ia !== -1 && ib !== -1 && ia !== ib) return ia - ib;
    return (a.at ?? 0) - (b.at ?? 0);
  });
}

/** Numeric x-value of a run (custom value first, preset factor as fallback). */
export function runNumericValue(cfg: ExperimentConfig, r: ExperimentRun): number {
  const parsed = parseFloat(r.paramValue);
  if (Number.isFinite(parsed)) return parsed;
  return cfg.options.find((o) => o.value === r.paramValue)?.factor ?? 0;
}

/** A valid rate explicitly calculated and entered by the student. */
export function studentRateValue(run: ExperimentRun | null | undefined): number | null {
  const value = run?.studentRate;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

/** Student answer when available, with the old automatic value as legacy fallback. */
export function reportedRateValue(run: ExperimentRun): number {
  return studentRateValue(run) ?? run.rate;
}

/** Display label for reports, teacher views, and finalized/legacy experiment data. */
export function reportedRateLabel(run: ExperimentRun, unit: string): string {
  const studentRate = studentRateValue(run);
  if (studentRate === null) return run.rateLabel;
  return `${String(studentRate).replace(".", ",")} ${unit}`.trim();
}

/**
 * Merge gas-volume series for a comparison table/chart. In Module 2, faster
 * shapes stay at the shared final CO₂ volume until the slowest reaction ends.
 */
export function buildGasComparisonRows(
  cfg: ExperimentConfig,
  runs: ExperimentRun[]
): Array<Record<string, number>> {
  if (cfg.kind !== "surface") {
    const rows = new Map<number, Record<string, number>>();
    for (const run of runs) {
      for (const point of run.series ?? []) {
        const row = rows.get(point.t) ?? { t: point.t };
        row[run.label] = point.v;
        rows.set(point.t, row);
      }
    }
    return Array.from(rows.values()).sort((a, b) => a.t - b.t);
  }

  const sampleEvery = cfg.gas?.sampleEvery ?? 10;
  const finalVolume = cfg.gas?.vmax ?? 0;
  const slowestTime = Math.max(
    0,
    ...runs.map(
      (run) => run.timeSec ?? run.series?.[run.series.length - 1]?.t ?? 0
    )
  );
  const finalTime = Math.ceil(slowestTime / sampleEvery) * sampleEvery;
  const rows: Array<Record<string, number>> = [];

  for (let time = 0; time <= finalTime; time += sampleEvery) {
    const row: Record<string, number> = { t: time };
    for (const run of runs) {
      const completionTime =
        run.timeSec ?? run.series?.[run.series.length - 1]?.t ?? 0;
      if (time >= completionTime) {
        row[run.label] = finalVolume;
        continue;
      }
      const points = run.series ?? [];
      const point = [...points].reverse().find((candidate) => candidate.t <= time);
      row[run.label] = point?.v ?? 0;
    }
    rows.push(row);
  }
  return rows;
}
