"use client";

// Module cards grid (dashboard & module list). Cards only expose what the
// engine has unlocked — locked modules are not clickable.
// When grades are available, shows score badge and optional note popup.

import Link from "next/link";
import { useState } from "react";
import { Lock, MessageSquareText } from "lucide-react";
import { Badge, ProgressBar, moduleStatusTone } from "@/components/ui/misc";
import Modal from "@/components/ui/Modal";
import { MODULES } from "@/lib/module-defs";
import { MODULE_STATUS_LABEL } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { StudentProgress, TeacherGrade } from "@/lib/types";

export default function ModuleGrid({
  progress,
  grades,
}: {
  progress: StudentProgress | null;
  grades?: Record<string, TeacherGrade>;
}) {
  const [noteModal, setNoteModal] = useState<{ moduleId: number; note: string; score: number } | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODULES.map((m) => {
          const mp = progress?.modules?.[String(m.id)];
          const rawStatus = mp?.status ?? (m.id === 1 ? "unlocked" : "locked");
          const status = m.id === 1 && rawStatus === "locked" ? "unlocked" : rawStatus;
          const pct = mp?.completionPercent ?? 0;
          const clickable = status !== "locked";
          const grade = grades?.[`m${m.id}`];

          const inner = (
            <div
              className={cn(
                "h-full rounded-2xl border bg-white p-4 shadow-card transition-all",
                clickable
                  ? "border-slate-200 hover:border-brand-400 hover:shadow-md cursor-pointer"
                  : "border-slate-200 opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex items-center gap-1.5">
                  {grade && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-black text-amber-700">
                      ⭐ {grade.score}
                    </span>
                  )}
                  {status === "locked" ? (
                    <Lock className="h-4 w-4 text-slate-300 mt-0.5" />
                  ) : (
                    <Badge tone={moduleStatusTone(status)}>
                      {MODULE_STATUS_LABEL[status]}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
                Modul {m.id}
              </p>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{m.title}</h3>
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar value={pct} className="h-1.5 flex-1" />
                <span className="text-[11px] font-bold text-slate-500">{pct}%</span>
              </div>
              {grade?.note && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setNoteModal({ moduleId: m.id, note: grade.note!, score: grade.score });
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition-colors"
                >
                  <MessageSquareText className="h-3 w-3" />
                  Catatan Guru
                </button>
              )}
            </div>
          );
          return clickable ? (
            <Link key={m.id} href={`/student/modules/${m.id}`}>
              {inner}
            </Link>
          ) : (
            <div key={m.id}>{inner}</div>
          );
        })}
      </div>

      {/* Note popup */}
      <Modal
        open={noteModal !== null}
        onClose={() => setNoteModal(null)}
        title={
          noteModal ? (
            <span className="flex items-center gap-2">
              📝 Catatan Guru — Modul {noteModal.moduleId}
            </span>
          ) : ""
        }
      >
        {noteModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
              <span className="text-lg">⭐</span>
              <span className="text-lg font-black text-slate-800">Nilai: {noteModal.score}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Catatan
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {noteModal.note}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
