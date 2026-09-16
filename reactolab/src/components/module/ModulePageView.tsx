"use client";

// Assembled single-page module view: header, section cards, end-of-module actions.

import Link from "next/link";
import { ArrowLeft, ArrowRight, Home, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { Badge, ProgressBar } from "@/components/ui/misc";
import { getModuleDef, sectionDef } from "@/lib/module-defs";
import { useEngine } from "./engine";
import SectionCard from "./SectionCard";
import SaveIndicator from "./SaveIndicator";
import { renderSection } from "./SectionRegistry";

export default function ModulePageView() {
  const engine = useEngine();
  const { def, modProgress, moduleId } = engine;

  const inProgress = modProgress.status === "in_progress";
  const completed = modProgress.status === "completed";
  const activeSection = modProgress.currentSection
    ? sectionDef(def, modProgress.currentSection)
    : null;
  const nextDef = getModuleDef(moduleId + 1) ?? null;

  return (
    <div className="space-y-5 pb-24">
      {/* ---- Module header (PRD §29.1 — passive indicators only) ---- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/student/modules"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <Badge tone="blue">Modul {moduleId}</Badge>
          {completed && <Badge tone="green">Selesai</Badge>}
          {inProgress && <Badge tone="amber">Sedang Dikerjakan</Badge>}
          <div className="flex-1" />
          {inProgress && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void engine.saveAndExit()}
            >
              <Save className="h-4 w-4" /> Simpan &amp; Keluar
            </Button>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-black text-slate-900">
          {def.emoji} {def.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{def.description}</p>
        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={modProgress.completionPercent} className="flex-1" />
          <span className="text-sm font-bold text-brand-700 w-12 text-right">
            {modProgress.completionPercent}%
          </span>
        </div>
        {activeSection && !completed && (
          <p className="mt-2 text-xs text-slate-500">
            Bagian aktif: <b className="text-slate-700">{activeSection.title}</b>
          </p>
        )}
      </div>

      {/* ---- Sequential section cards ---- */}
      {def.sections.map((s, i) => {
        const sp = modProgress.sections?.[s.id];
        const status = (sp?.status ?? "locked") as "locked" | "active" | "completed";
        return (
          <SectionCard
            key={s.id}
            id={s.id}
            index={i + 1}
            title={s.title}
            status={status}
            defaultOpen={moduleId === 6 && s.id === "sectionCases"}
          >
            {renderSection(s, status === "completed")}
          </SectionCard>
        );
      })}

      {/* ---- End-of-module actions (PR-LEARN-SAVE-004/005) ---- */}
      {completed && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-3xl">🎉</div>
          <h2 className="mt-2 text-lg font-black text-emerald-900">
            Modul {moduleId} Selesai!
          </h2>
          <p className="mt-1 text-sm text-emerald-800">
            {moduleId === 7
              ? "Seluruh rangkaian pembelajaran ReactoLab telah kamu tuntaskan."
              : "Kamu bebas memilih: lanjut sekarang, atau berhenti dulu dan lanjutkan di sesi berikutnya."}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {moduleId === 7 ? (
              <Button size="lg" onClick={() => void engine.exitToDashboard()}>
                <Home className="h-4 w-4" /> Kembali ke Dashboard
              </Button>
            ) : (
              <>
                {nextDef && (
                  <Button size="lg" onClick={() => engine.goToModule(moduleId + 1)}>
                    Lanjut ke Modul {moduleId + 1}: {nextDef.short}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => void engine.exitToDashboard()}
                >
                  <Save className="h-4 w-4" /> Simpan &amp; Selesai
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <SaveIndicator />
    </div>
  );
}
