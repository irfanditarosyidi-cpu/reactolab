"use client";

// Module 3 — Maxwell–Boltzmann panel shown next to the 3D particle view.
// X = kinetic energy, Y = number of particles. The Ea line stays fixed while the
// curve changes with temperature; the area with E ≥ Ea is lightly highlighted.

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export const M3_EA = 46;

/** Relative population density at kinetic energy E for temperature T (°C). */
export function mbDensity(E: number, tempC: number): number {
  const kT = 6 + 0.5 * tempC;
  return Math.round(E * Math.exp(-E / kT) * 1000) / 100;
}

export default function M3MaxwellPanel({
  temps,
  active,
  className,
}: {
  temps: number[];
  active: number;
  className?: string;
}) {
  const rows = useMemo(() => {
    const out: Array<Record<string, number>> = [];
    for (let E = 0; E <= 100; E += 2) {
      const row: Record<string, number> = { E };
      for (const t of temps) row[`t${t}`] = mbDensity(E, t);
      row.aktif = mbDensity(E, active);
      row.aktifEa = E >= M3_EA ? mbDensity(E, active) : 0;
      out.push(row);
    }
    return out;
  }, [temps, active]);

  const others = temps.filter((t) => t !== active);

  return (
    <div className={"rounded-2xl border border-slate-200 bg-white p-3 " + (className ?? "")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-600">Distribusi energi partikel</p>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-black tabular-nums text-brand-700">
          {active} °C
        </span>
      </div>
      <div className="mt-1 h-52 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 20, right: 8, bottom: 4, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="E"
              tick={{ fontSize: 10 }}
              tickCount={6}
              label={{ value: "Energi kinetik →", position: "insideBottomRight", offset: -2, fontSize: 10 }}
            />
            <YAxis
              tick={false}
              label={{ value: "Jumlah partikel", angle: -90, position: "insideLeft", fontSize: 10, offset: 28 }}
            />
            <ReferenceLine
              x={M3_EA}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 4"
              label={{ value: "Ea", fill: "#ef4444", fontSize: 11, position: "top" }}
            />
            {others.map((t) => (
              <Area
                key={t}
                type="monotone"
                dataKey={`t${t}`}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="transparent"
                isAnimationActive={false}
              />
            ))}
            <Area
              type="monotone"
              dataKey="aktifEa"
              stroke="none"
              fill="#f59e0b"
              fillOpacity={0.32}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="aktif"
              stroke="#2563eb"
              strokeWidth={3}
              fill="#2563eb"
              fillOpacity={0.07}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-1.5 w-4 rounded bg-brand-600" /> {active} °C
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-3 rounded-sm bg-amber-400/60" /> E ≥ Ea
        </span>
        {others.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0 w-4 border-t-2 border-dashed border-slate-400" /> suhu lain
          </span>
        )}
      </div>
    </div>
  );
}
