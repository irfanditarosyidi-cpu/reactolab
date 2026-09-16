"use client";

// Module-specific inline visualizations shown INSIDE the experiment section
// (never on a separate page): Maxwell–Boltzmann curve (M3) and the catalyst
// energy diagram (M4). PRD §20/§21.

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./DataPanel";
import type { ExperimentConfig } from "@/lib/module-defs";
import type { ExperimentRun } from "@/lib/types";
import { runNumericValue, sortRuns } from "@/lib/runs";

export function MaxwellBoltzmann({
  cfg,
  runs,
}: {
  cfg: ExperimentConfig;
  runs: Record<string, ExperimentRun>;
}) {
  // Generic: works for student-defined temperatures as well as legacy presets.
  const temps = sortRuns(cfg, runs).map((r) => ({
    value: r.paramValue,
    label: r.label,
    factor: runNumericValue(cfg, r),
  }));
  if (temps.length === 0) return null;

  const EA = 46;
  const rows: Array<Record<string, number>> = [];
  for (let E = 0; E <= 100; E += 2) {
    const row: Record<string, number> = { E };
    for (const t of temps) {
      const kT = 7 + t.factor * 0.55;
      row[t.label] = Math.round(E * Math.exp(-E / kT) * 1000) / 100;
    }
    rows.push(row);
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-bold text-slate-500 mb-1">
        Distribusi Energi Kinetik Partikel (Maxwell–Boltzmann)
      </p>
      <p className="text-[11px] text-slate-400 mb-2">
        Luas kurva di kanan garis Ea = jumlah partikel yang mampu bereaksi.
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 5, right: 10, bottom: 18, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="E"
              tick={{ fontSize: 10 }}
              height={42}
              label={{
                value: "Energi kinetik (relatif)",
                position: "insideBottom",
                offset: 8,
                fontSize: 10,
                fontWeight: 600,
                fill: "#475569",
              }}
            />
            <YAxis
              tick={false}
              width={54}
              label={{
                value: "Jumlah partikel (relatif)",
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                fontWeight: 600,
                fill: "#475569",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip itemSorter={(item) => -Number(item.value ?? 0)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              x={EA}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 4"
              label={{ value: "Ea", fill: "#ef4444", fontSize: 12, position: "top" }}
            />
            {temps.map((t, i) => (
              <Area
                key={t.value}
                type="monotone"
                dataKey={t.label}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.12}
                strokeWidth={2.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EnergyDiagram() {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-bold text-slate-500 mb-1">
        Diagram Energi: Dengan vs Tanpa Katalis
      </p>
      <p className="text-[11px] text-slate-400 mb-2">
        Katalis menyediakan jalur reaksi dengan energi aktivasi (Ea) lebih rendah.
      </p>
      <svg viewBox="0 0 360 220" className="w-full h-auto">
        {/* axes */}
        <line x1="36" y1="10" x2="36" y2="192" stroke="#94a3b8" strokeWidth="2" />
        <line x1="36" y1="192" x2="344" y2="192" stroke="#94a3b8" strokeWidth="2" />
        <text x="14" y="105" fontSize="10" fill="#64748b" transform="rotate(-90 14 105)">
          Energi
        </text>
        <text x="190" y="208" fontSize="10" fill="#64748b" textAnchor="middle">
          Koordinat reaksi
        </text>
        {/* without catalyst */}
        <path
          d="M 48 120 C 110 120, 130 30, 185 30 C 240 30, 260 150, 330 150"
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
        />
        {/* with catalyst */}
        <path
          d="M 48 120 C 115 120, 140 78, 185 78 C 235 78, 255 150, 330 150"
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeDasharray="7 5"
        />
        {/* levels */}
        <line x1="40" y1="120" x2="70" y2="120" stroke="#334155" strokeWidth="2" />
        <line x1="305" y1="150" x2="338" y2="150" stroke="#334155" strokeWidth="2" />
        <text x="48" y="114" fontSize="10" fill="#334155" fontWeight="bold">
          Reaktan (2H₂O₂)
        </text>
        <text x="252" y="166" fontSize="10" fill="#334155" fontWeight="bold">
          Produk (2H₂O + O₂)
        </text>
        {/* Ea arrows */}
        <line x1="185" y1="30" x2="185" y2="120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="190" y="58" fontSize="10" fill="#ef4444" fontWeight="bold">
          Ea tanpa katalis
        </text>
        <line x1="150" y1="78" x2="150" y2="120" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="60" y="92" fontSize="10" fill="#2563eb" fontWeight="bold">
          Ea + katalis
        </text>
      </svg>
    </div>
  );
}
