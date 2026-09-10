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
