"use client";

import { Search } from "lucide-react";
import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import M3ThreeScene from "./M3ThreeScene";

interface M3LabApparatusProps {
  label: string;
  temperature: number;
  simTime: number;
  progress: number;
  running: boolean;
  started: boolean;
  magnifierOpen: boolean;
  zoomEnabled: boolean;
  onMagnifierClick: () => void;
  onZoomModeToggle: () => void;
  lensOverlay?: ReactNode;
}

export default memo(function M3LabApparatus({
  label,
  temperature,
  simTime,
  progress,
  running,
  started,
  magnifierOpen,
  zoomEnabled,
  onMagnifierClick,
  onZoomModeToggle,
  lensOverlay,
}: M3LabApparatusProps) {
  const safeProgress = Math.min(1, Math.max(0, progress));

  return (
    <section className="relative mx-auto w-full max-w-[860px] select-none">
      <div className="overflow-hidden rounded-[24px] border border-slate-700 bg-slate-950 shadow-[0_22px_60px_-30px_rgba(15,23,42,0.8)]">
        <div className="relative h-[340px] bg-slate-100 sm:h-[440px] lg:h-[500px]">
          <M3ThreeScene
            temperature={temperature}
            progress={safeProgress}
            simTime={simTime}
            running={running}
          />

          <div className="pointer-events-none absolute bottom-16 left-3 rounded-xl border border-white/70 bg-white/90 px-2.5 py-2 shadow-lg backdrop-blur-md">
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
              Waktu pengamatan
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-base font-black tabular-nums text-slate-900">
                {simTime.toFixed(1)} s
              </span>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  running
                    ? "animate-pulse bg-sky-500"
                    : started
                      ? "bg-amber-400"
                      : "bg-slate-300",
                )}
              />
            </div>
          </div>

          {zoomEnabled && (
            <button
              type="button"
              onClick={onMagnifierClick}
              aria-expanded={magnifierOpen}
              aria-controls="m3-particle-panel"
              aria-label={magnifierOpen ? "Tutup zoom partikel" : "Zoom partikel dalam larutan"}
              title={magnifierOpen ? "Hilangkan zoom" : "Aktifkan zoom partikel"}
              className={cn(
                "absolute left-[52%] top-[48%] z-20 inline-flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border p-0 shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 lg:w-auto lg:gap-1.5 lg:px-2.5",
                magnifierOpen
                  ? "border-sky-500 bg-sky-600 text-white"
                  : "border-sky-200 bg-white/90 text-sky-800 hover:-translate-y-0.5",
              )}
            >
              <Search className="h-4 w-4" />
              <span className="hidden text-[10px] font-black lg:inline">Lihat Partikel</span>
            </button>
          )}

          <button
            type="button"
            onClick={onZoomModeToggle}
            aria-pressed={zoomEnabled}
            className={cn(
              "absolute bottom-3 left-1/2 z-40 inline-flex min-h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:min-h-11 sm:px-4 sm:text-[11px]",
              zoomEnabled
                ? "border-sky-400 bg-sky-600 text-white"
                : "border-slate-300 bg-slate-700/75 text-white hover:bg-slate-700",
            )}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full ring-2 ring-white/40",
                zoomEnabled ? "bg-emerald-300" : "bg-slate-300",
              )}
            />
            Tampilan Makroskopik
            <span className="font-semibold opacity-80">
              · zoom {zoomEnabled ? "aktif" : "mati"}
            </span>
          </button>

          {lensOverlay}
        </div>

        <div className="grid gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-slate-700">Titik akhir dinilai dari atas</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
              Putar bebas untuk memeriksa alat, lalu pilih sudut <b>Atas</b> ketika
              menentukan apakah tanda X masih terlihat melalui campuran {label}.
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900 ring-1 ring-amber-100">
            <b>Model partikel:</b> kekeruhan mewakili partikel belerang. Suhu lebih
            tinggi menaikkan kelajuan rata-rata, bukan menyamakan kelajuan seluruh
            partikel.
          </div>
        </div>
      </div>
    </section>
  );
});
