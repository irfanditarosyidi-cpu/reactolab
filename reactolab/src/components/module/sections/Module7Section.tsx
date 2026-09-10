"use client";

// Module 7 — Penutup (PRD §25, PR-LEARN-SAVE-005).

import { useState } from "react";
import { Download, PartyPopper } from "lucide-react";
import Button from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/misc";
import { MODULES } from "@/lib/module-defs";
import { downloadLkpdPdf } from "@/lib/lkpd-pdf";
import { useEngine } from "../engine";
import type { SectionProps } from "./InquirySections";

export function M7Closing({ sec, readOnly }: SectionProps) {
  const { progress, classId, uid, studentName, completeSection, exitToDashboard } =
    useEngine();
  const [busy, setBusy] = useState(false);
  const [dl, setDl] = useState(false);
  const completedCount = MODULES.filter(
    (m) => progress.modules[String(m.id)]?.status === "completed"
  ).length;
  const isDone = progress.modules["7"]?.status === "completed";

  return (
    <div className="text-center py-4">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg">
        <PartyPopper className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-2xl font-black text-slate-900">
        Luar Biasa, {studentName || "Ilmuwan Muda"}! 🎉
      </h3>
      <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
        Kamu telah menuntaskan seluruh penyelidikan laju reaksi: konsentrasi, luas
        permukaan, suhu, dan katalis — lengkap dengan analisis tiga level representasi
        dan diskusi ilmiah CER. Kamu sudah belajar layaknya seorang ilmuwan!
      </p>

      <div className="mt-5 max-w-sm mx-auto">
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
          <span>Progres Pembelajaran</span>
          <span>{isDone ? 100 : progress.overallPercent}%</span>
        </div>
        <ProgressBar value={isDone ? 100 : progress.overallPercent} />
        <p className="mt-1.5 text-xs text-slate-400">
          {completedCount} dari {MODULES.length} modul selesai
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="secondary"
          loading={dl}
          onClick={async () => {
            setDl(true);
            try {
              await downloadLkpdPdf(classId, uid);
            } finally {
              setDl(false);
            }
          }}
        >
          <Download className="h-4 w-4" /> Unduh LKPD (PDF)
        </Button>
        {!readOnly && !isDone && (
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await completeSection(sec.id);
              } finally {
                setBusy(false);
              }
            }}
          >
            Simpan &amp; Selesai Pembelajaran
          </Button>
        )}
        {isDone && (
          <Button onClick={() => void exitToDashboard()}>Kembali ke Dashboard</Button>
        )}
      </div>
    </div>
  );
}
