"use client";

// Realtime monitoring matrix M0–M7 (PR-TCH-MON-001).
// Listeners attach to this class only and detach on unmount (PRD §32/§33).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { listen } from "@/lib/db";
import { MODULES } from "@/lib/module-defs";
import { P } from "@/lib/paths";
import { cn, formatRelative } from "@/lib/utils";
import type { ClassInfo, ClassMembership, StudentProgress } from "@/lib/types";

const CELL: Record<string, string> = {
  locked: "bg-slate-100 text-slate-400",
  unlocked: "bg-sky-50 text-sky-600 border border-sky-200",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-500 text-white",
};

export default function MonitoringPage() {
  const { classId } = useParams<{ classId: string }>();
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<Record<string, ClassMembership> | null>(null);
  const [progressAll, setProgressAll] = useState<Record<string, StudentProgress>>({});

  useEffect(() => {
    if (!classId) return;
    const u1 = listen<ClassInfo>(P.class(classId), setInfo);
    const u2 = listen<Record<string, ClassMembership>>(P.members(classId), (m) =>
      setMembers(m ?? {})
    );
    const u3 = listen<Record<string, StudentProgress>>(
      P.progressClass(classId),
      (p) => setProgressAll(p ?? {})
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, [classId]);

  if (members === null) return <Spinner label="Menghubungkan monitoring realtime…" />;

  const students = Object.entries(members).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/teacher/classes/${classId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> {info?.className ?? "Kelas"}
        </Link>
        <h1 className="text-2xl font-black text-slate-900 mt-2">
          Monitoring Realtime
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Status modul setiap siswa diperbarui langsung saat mereka belajar.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-slate-100 border border-slate-200" /> Terkunci
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-sky-50 border border-sky-200" /> Tersedia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-amber-100" /> Dikerjakan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded bg-emerald-500" /> Selesai
        </span>
      </div>

      <Card>
        <CardHeader title={`Matriks Progres (${students.length} siswa)`} />
        <CardBody className="px-0">
          {students.length === 0 ? (
            <EmptyState emoji="🧑‍🎓" title="Belum ada siswa di kelas ini" />
          ) : (
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-2.5 font-bold sticky left-0 bg-white">Siswa</th>
                    {MODULES.map((m) => (
                      <th key={m.id} className="px-1.5 py-2.5 font-bold text-center">
                        M{m.id}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 font-bold">Posisi</th>
                    <th className="px-3 py-2.5 font-bold text-right">Aktivitas</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(([uid, m]) => {
                    const p = progressAll[uid];
                    return (
                      <tr key={uid} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-2 sticky left-0 bg-white">
                          <Link
                            href={`/teacher/classes/${classId}/students/${uid}`}
                            className="font-semibold text-slate-800 hover:text-brand-700"
                          >
                            {m.name}
                          </Link>
                          <span className="block text-[11px] text-slate-400">
                            {p?.overallPercent ?? 0}% keseluruhan
                          </span>
                        </td>
                        {MODULES.map((mod) => {
                          const mp = p?.modules?.[String(mod.id)];
                          const st = mp?.status ?? "locked";
                          return (
                            <td key={mod.id} className="px-1.5 py-2 text-center">
                              <span
                                title={`Modul ${mod.id}: ${st} (${mp?.completionPercent ?? 0}%)`}
                                className={cn(
                                  "inline-flex h-8 w-9 items-center justify-center rounded-lg text-[11px] font-black",
                                  CELL[st]
                                )}
                              >
                                {st === "completed" ? "✓" : `${mp?.completionPercent ?? 0}`}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-xs font-semibold text-slate-600 whitespace-nowrap">
                          {p?.currentSection
                            ? `M${p.currentModule} · ${p.currentSection.replace("section", "Bag. ")}`
                            : p
                              ? `M${p.currentModule ?? 0}`
                              : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400 text-right whitespace-nowrap">
                          {formatRelative(p?.lastActivityAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
