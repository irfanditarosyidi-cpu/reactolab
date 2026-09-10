"use client";

// Module 3 — step-by-step simulation tutorial (bottom sheet on phones).
// Mandatory on first use, replayable any time via the "?" button.

import { useEffect, useState } from "react";
import {
  Atom,
  Beaker,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Square,
  Thermometer,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Thermometer,
    title: "Pilih suhu",
    text: "Ketuk salah satu suhu yang sudah kamu tentukan.",
  },
  {
    icon: Flame,
    title: "Atur suhu",
    text: "Ketuk Atur Suhu — kedua larutan dipanaskan/didinginkan sampai suhu target.",
  },
  {
    icon: Beaker,
    title: "Campurkan",
    text: "Saat status Siap dicampurkan, ketuk Campurkan; stopwatch berjalan otomatis.",
  },
  {
    icon: Eye,
    title: "Lihat dari atas",
    text: "Ketuk tombol mata agar kamera tepat di atas gelas reaksi untuk mengamati tanda X.",
  },
  {
    icon: Square,
    title: "Stop saat X hilang",
    text: "Tekan Stop — X tidak terlihat sesuai pengamatanmu; waktu tercatat otomatis.",
  },
  {
    icon: Atom,
    title: "Perbesar",
    text: "Bandingkan gerak partikel dan kurva Maxwell–Boltzmann antar suhu yang sudah diuji.",
  },
];

export default function M3Tutorial({
  open,
  mandatory,
  onClose,
}: {
  open: boolean;
  mandatory: boolean;
  onClose: (completed: boolean) => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open || mandatory) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mandatory, onClose]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial simulasi faktor suhu"
    >
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => {
          if (!mandatory) onClose(false);
        }}
      />
      <div
        className="anim-m1-sheet relative w-full max-w-md rounded-t-3xl bg-white px-5 pt-4 shadow-2xl sm:rounded-3xl sm:px-6 sm:pt-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-black text-brand-700">
            Langkah {step + 1}/{STEPS.length}
          </span>
          {!mandatory && (
            <button
              type="button"
              onClick={() => onClose(false)}
              aria-label="Tutup tutorial"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-200">
            <Icon className="h-8 w-8" />
          </span>
          <div className="min-w-0 pt-1">
            <h3 className="text-lg font-black leading-tight text-slate-900">{current.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{current.text}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-brand-600" : i < step ? "w-1.5 bg-brand-300" : "w-1.5 bg-slate-200"
              )}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
          <Button
            variant="secondary"
            className="min-h-12 px-3"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            aria-label="Langkah sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            className="min-h-12"
            onClick={() => {
              if (isLast) onClose(true);
              else setStep((s) => s + 1);
            }}
          >
            {isLast ? "Mulai Simulasi" : "Lanjut"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
