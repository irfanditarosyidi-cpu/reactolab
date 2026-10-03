"use client";

// Student detail — teacher READ-ONLY view of answers & experiment data
// (PR-TCH-STU-001, INV-08).
// Also allows the teacher to give a score (0–100) and note per module.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Pencil, RefreshCw, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { Avatar, Badge, ProgressBar, Spinner, moduleStatusTone } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { listenGrades, readOnce, saveGrade } from "@/lib/db";
import { buildModuleReport } from "@/lib/format";
import { MODULES } from "@/lib/module-defs";
import { MODULE_STATUS_LABEL, normalizeProgress } from "@/lib/progress";
import { P } from "@/lib/paths";
import { reportedRateLabel } from "@/lib/runs";
import { formatRelative } from "@/lib/utils";
import type { ClassMembership, StudentProgress, TeacherGrade } from "@/lib/types";

export default function TeacherStudentDetail() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const { toast } = useToast();
  const [member, setMember] = useState<ClassMembership | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [experiments, setExperiments] = useState<Record<string, unknown>>({});
  const [grades, setGrades] = useState<Record<string, TeacherGrade>>({});
  const [loading, setLoading] = useState(true);
  const [openMods, setOpenMods] = useState<Record<number, boolean>>({ 1: true });

  // draft state per module for grade form
  const [draftScores, setDraftScores] = useState<Record<number, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [savedRecently, setSavedRecently] = useState<Record<number, boolean>>({});

  const load = async () => {
    setLoading(true);
    const [m, p, r, e] = await Promise.all([
      readOnce<ClassMembership>(P.member(classId, studentId)),
      readOnce<StudentProgress>(P.progress(classId, studentId)),
      readOnce<Record<string, unknown>>(P.responses(classId, studentId)),
      readOnce<Record<string, unknown>>(P.experiment(classId, studentId)),
    ]);
    setMember(m);
    setProgress(p ? normalizeProgress(p) : null);
    setResponses(r ?? {});
    setExperiments(e ?? {});
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, studentId]);

  // Realtime listener for grades
  useEffect(() => {
    if (!classId || !studentId) return;
    return listenGrades(classId, studentId, (g) => {
      setGrades(g);
      // Populate drafts from loaded grades (only set if not already dirty)
      const scores: Record<number, string> = {};
      const notes: Record<number, string> = {};
      for (const [key, val] of Object.entries(g)) {
        const moduleId = parseInt(key.replace("m", ""), 10);
        if (!isNaN(moduleId)) {
          scores[moduleId] = String(val.score);
          notes[moduleId] = val.note ?? "";
        }
      }
      setDraftScores((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(scores)) {
          if (!(Number(k) in next)) next[Number(k)] = v;
        }
        return next;
      });
      setDraftNotes((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(notes)) {
          if (!(Number(k) in next)) next[Number(k)] = v;
        }
        return next;
      });
    });
  }, [classId, studentId]);

  const handleSaveGrade = async (moduleId: number) => {
    const scoreStr = draftScores[moduleId] ?? "";
    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast("Nilai harus angka 0–100.", "error");
      return;
    }
    setSaving((s) => ({ ...s, [moduleId]: true }));
    try {
      await saveGrade(classId, studentId, moduleId, {
        score,
        note: draftNotes[moduleId]?.trim() || undefined,
      });
      setSavedRecently((s) => ({ ...s, [moduleId]: true }));
      setTimeout(() => setSavedRecently((s) => ({ ...s, [moduleId]: false })), 2000);
      toast(`Nilai Modul ${moduleId} tersimpan.`, "success");
    } catch {
      toast("Gagal menyimpan nilai.", "error");
    } finally {
      setSaving((s) => ({ ...s, [moduleId]: false }));
    }
  };

  if (loading) return <Spinner label="Memuat data siswa…" />;

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/classes/${classId}/monitoring`}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Monitoring Siswa
      </Link>

      <Card>
        <CardBody className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={member?.name} size={52} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900">{member?.name ?? "-"}</h1>
            <p className="text-sm text-slate-500">
              {member?.email ?? ""} · Aktivitas terakhir{" "}
              {formatRelative(progress?.lastActivityAt)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Posisi saat ini:{" "}
              <b className="text-slate-600">
                {progress?.currentSection
                  ? `Modul ${progress.currentModule} · ${progress.currentSection.replace("section", "Bagian ")}`
                  : `Modul ${progress?.currentModule ?? 1}`}
              </b>
            </p>
          </div>
          <div className="w-full sm:w-52">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Progres</span>
              <span>{progress?.overallPercent ?? 0}%</span>
            </div>
            <ProgressBar value={progress?.overallPercent ?? 0} />
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Muat Ulang
          </Button>
        </CardBody>
      </Card>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 font-semibold">
        🔒 Mode baca-saja: jawaban akademik siswa tidak dapat diubah oleh guru.
      </div>

      <div className="space-y-3">
        {MODULES.map((def) => {
          const mp = progress?.modules?.[String(def.id)];
          const report = buildModuleReport(def, responses, experiments);
          const open = openMods[def.id];
          const hasContent = report.items.some((i) => i.value !== "-") || report.runs.length > 0;
          const existingGrade = grades[`m${def.id}`];
          const scoreVal = draftScores[def.id] ?? (existingGrade ? String(existingGrade.score) : "");
          const noteVal = draftNotes[def.id] ?? (existingGrade?.note ?? "");
          const isSaving = saving[def.id] ?? false;
          const isSaved = savedRecently[def.id] ?? false;

          return (
            <Card key={def.id}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                onClick={() => setOpenMods((o) => ({ ...o, [def.id]: !o[def.id] }))}
              >
                <span className="text-xl">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">
                    Modul {def.id} — {def.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {mp?.completionPercent ?? 0}% ·{" "}
                    {MODULE_STATUS_LABEL[mp?.status ?? "locked"]}
                  </p>
                </div>
                {existingGrade && (
                  <Badge tone="blue">{existingGrade.score}/100</Badge>
                )}
                <Badge tone={moduleStatusTone(mp?.status ?? "locked")}>
                  {MODULE_STATUS_LABEL[mp?.status ?? "locked"]}
                </Badge>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {open && (
                <CardBody className="border-t border-slate-100">
                  {!hasContent ? (
                    <p className="text-sm text-slate-400">Belum ada jawaban.</p>
                  ) : (
                    <div className="space-y-3">
                      {report.items.map((item, itemIndex) => (
                        <div key={`${item.label}-${itemIndex}`}>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            {item.label}
                          </p>
                          <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                            {item.value}
                          </p>
                        </div>
                      ))}
                      {report.runs.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Data Eksperimen
                          </p>
                          <div className="overflow-x-auto thin-scroll rounded-lg border border-slate-200">
                            <table className="w-full text-sm min-w-[420px]">
                              <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                  <th className="px-3 py-1.5 text-left font-bold">
                                    {report.paramName}
                                  </th>
                                  <th className="px-3 py-1.5 text-left font-bold">Waktu (s)</th>
                                  <th className="px-3 py-1.5 text-left font-bold">
                                    Laju ({report.rateUnit})
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.runs.map((r) => (
                                  <tr key={r.paramValue} className="border-t border-slate-100">
                                    <td className="px-3 py-1.5 font-semibold text-slate-700">
                                      {r.label}
                                    </td>
                                    <td className="px-3 py-1.5 text-slate-600">
                                      {r.timeSec?.toFixed(1) ?? "-"}
                                    </td>
                                    <td className="px-3 py-1.5 text-slate-600">
                                      {reportedRateLabel(r, report.rateUnit ?? "")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Grade Form ── */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> Penilaian Guru
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-full sm:w-32">
                        <Label htmlFor={`score-${def.id}`}>Nilai (0–100)</Label>
                        <Input
                          id={`score-${def.id}`}
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0–100"
                          value={scoreVal}
                          onChange={(e) =>
                            setDraftScores((s) => ({ ...s, [def.id]: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`note-${def.id}`}>Catatan (opsional)</Label>
                        <Textarea
                          id={`note-${def.id}`}
                          placeholder="Tulis catatan untuk siswa…"
                          className="min-h-[72px]"
                          value={noteVal}
                          onChange={(e) =>
                            setDraftNotes((s) => ({ ...s, [def.id]: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        loading={isSaving}
                        onClick={() => void handleSaveGrade(def.id)}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {existingGrade ? "Update Nilai" : "Simpan Nilai"}
                      </Button>
                      {isSaved && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 animate-pulse">
                          <Check className="h-3.5 w-3.5" /> Tersimpan
                        </span>
                      )}
                      {existingGrade && !isSaved && (
                        <span className="text-xs text-slate-400">
                          Terakhir dinilai: {formatRelative(existingGrade.updatedAt ?? existingGrade.gradedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardBody>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
