"use client";

// Module list — cards only; every module itself is ONE page (INV-02).

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/misc";
import { ReactionRatePrompt } from "@/components/student/LearningMissionMap";
import ModuleGrid from "@/components/student/ModuleGrid";
import { useAuth } from "@/lib/auth-context";
import { listen, listenMyGrades } from "@/lib/db";
import { P } from "@/lib/paths";
import type { StudentProgress, TeacherGrade } from "@/lib/types";

export default function StudentModulesPage() {
  const { user, profile } = useAuth();
  const classId = profile?.activeClassId ?? null;
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [grades, setGrades] = useState<Record<string, TeacherGrade>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !classId) {
      setLoaded(true);
      return;
    }
    const unsub = listen<StudentProgress>(P.progress(classId, user.uid), (p) => {
      setProgress(p);
      setLoaded(true);
    });
    return unsub;
  }, [user, classId]);

  useEffect(() => {
    if (!user || !classId) return;
    return listenMyGrades(classId, user.uid, setGrades);
  }, [user, classId]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Modul Pembelajaran</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kerjakan modul secara berurutan. Setiap modul adalah satu halaman dengan
          bagian-bagian yang terbuka bertahap — progresmu tersimpan otomatis.
        </p>
      </div>
      {!classId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-3xl">🔑</p>
          <p className="mt-2 font-bold text-slate-700">Belum tergabung kelas</p>
          <p className="text-sm text-slate-500">
            Gabung kelas dari Dashboard untuk membuka modul.
          </p>
        </div>
      ) : !loaded ? (
        <Spinner label="Memuat progres…" />
      ) : (
        <div className="space-y-6">
          <ReactionRatePrompt />
          <div>
            <h2 className="mb-3 text-lg font-black text-slate-900">
              Daftar Modul
            </h2>
            <ModuleGrid progress={progress} grades={grades} />
          </div>
        </div>
      )}
    </div>
  );
}
