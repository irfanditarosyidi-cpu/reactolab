"use client";

// Student Dashboard (PRD §13) — identity, global progress, join class,
// module grid, and the Mulai/Lanjutkan primary CTA (resume, PR-LEARN-SAVE-003).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, School, Trophy } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/forms";
import { Avatar, ProgressBar, Spinner, Badge } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import ModuleGrid from "@/components/student/ModuleGrid";
import { useAuth } from "@/lib/auth-context";
import { joinClassByCode, listen, listenMyGrades, readOnce } from "@/lib/db";
import { downloadLkpdPdf } from "@/lib/lkpd-pdf";
import { P } from "@/lib/paths";
import { resumeTarget } from "@/lib/progress";
import type { ClassInfo, StudentProgress, TeacherGrade } from "@/lib/types";

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [dl, setDl] = useState(false);
  const [grades, setGrades] = useState<Record<string, TeacherGrade>>({});

  const classId = profile?.activeClassId ?? null;

  // realtime own progress (PRD §33)
  useEffect(() => {
    if (!user || !classId) {
      setProgress(null);
      setProgressLoaded(true);
      return;
    }
    setProgressLoaded(false);
    const unsub = listen<StudentProgress>(P.progress(classId, user.uid), (p) => {
      setProgress(p);
      setProgressLoaded(true);
    });
    return unsub;
  }, [user, classId]);

  useEffect(() => {
    if (!classId) {
      setClassInfo(null);
      return;
    }
    void readOnce<ClassInfo>(P.class(classId)).then(setClassInfo);
  }, [classId]);

  useEffect(() => {
    if (!user || !classId) return;
    return listenMyGrades(classId, user.uid, setGrades);
  }, [user, classId]);

  const join = async () => {
    if (!user || !profile) return;
    setJoining(true);
    try {
      const res = await joinClassByCode(user.uid, profile.name, profile.email, code);
      toast(`Berhasil bergabung ke kelas ${res.className}! 🎉`, "success");
      setCode("");
    } catch (e) {
      toast((e as Error).message || "Gagal bergabung ke kelas.", "error");
    } finally {
      setJoining(false);
    }
  };

  const target = resumeTarget(progress);
  const allDone = Boolean(progress?.courseCompletedAt);
  const overall = allDone ? 100 : (progress?.overallPercent ?? 0);

  return (
    <div className="space-y-6">
      {/* identity + CTA */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={profile?.name} size={56} />
          <div className="flex-1 min-w-0">
            <p className="text-brand-100 text-sm">Halo, selamat belajar! 👋</p>
            <h1 className="text-2xl font-black truncate">{profile?.name}</h1>
            <p className="text-sm text-brand-100 mt-0.5 flex items-center gap-1.5">
              <School className="h-4 w-4" />
              {classInfo ? `Kelas: ${classInfo.className}` : "Belum tergabung kelas"}
            </p>
          </div>
          {classId && target && (
            <Button
              size="lg"
              className="bg-white !text-brand-700 hover:bg-brand-50 shadow-lg"
              onClick={() => router.push(`/student/modules/${target.moduleId}`)}
            >
              {target.label} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {classId && !target && allDone && (
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-3">
              <Trophy className="h-5 w-5 text-yellow-300" />
              <span className="font-bold">Pembelajaran Tuntas!</span>
            </div>
          )}
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs font-bold text-brand-100 mb-1.5">
            <span>Progres Keseluruhan</span>
            <span>{overall}%</span>
          </div>
          <ProgressBar value={overall} className="bg-white/20" barClassName="bg-white" />
        </div>
      </div>

      {/* join class */}
      {!classId && (
        <Card>
          <CardHeader
            title="Gabung Kelas"
            subtitle="Masukkan kode kelas 6 karakter dari gurumu untuk mulai belajar."
          />
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="code">Kode Kelas</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="cth: AB3D7K"
                  maxLength={6}
                  className="font-mono tracking-[0.3em] uppercase text-center font-bold"
                />
              </div>
              <Button onClick={() => void join()} loading={joining} disabled={code.length !== 6}>
                Gabung
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* LKPD download */}
      {progress?.lkpdFinalizedAt && (
        <Card>
          <CardBody className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="font-bold text-slate-800 flex items-center gap-2">
                📄 LKPD Modul 1–4 <Badge tone="green">Terfinalisasi</Badge>
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                Jawaban terkunci dan tersimpan. Unduh sebagai PDF kapan saja.
              </p>
            </div>
            <Button
              variant="secondary"
              loading={dl}
              onClick={async () => {
                if (!user || !classId) return;
                setDl(true);
                try {
                  await downloadLkpdPdf(classId, user.uid);
                } finally {
                  setDl(false);
                }
              }}
            >
              <Download className="h-4 w-4" /> Unduh LKPD
            </Button>
          </CardBody>
        </Card>
      )}

      {/* modules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-slate-900 text-lg">Modul Pembelajaran</h2>
          <Link
            href="/student/modules"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            Lihat semua →
          </Link>
        </div>
        {!classId ? (
          <Card>
            <CardBody className="text-center py-10">
              <p className="text-3xl">🔑</p>
              <p className="mt-2 font-bold text-slate-700">
                Gabung kelas terlebih dahulu
              </p>
              <p className="text-sm text-slate-500">
                Modul pembelajaran terbuka setelah kamu tergabung dalam kelas.
              </p>
            </CardBody>
          </Card>
        ) : !progressLoaded ? (
          <Spinner label="Memuat progres…" />
        ) : (
          <ModuleGrid progress={progress} grades={grades} />
        )}
      </div>
    </div>
  );
}
