"use client";

// Teacher Dashboard (PR-TCH-DASH-001): summary cards + recent activity.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, GraduationCap, Percent, Users } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, Spinner } from "@/components/ui/misc";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { listenTeacherClasses, readOnce } from "@/lib/db";
import { P } from "@/lib/paths";
import { formatRelative } from "@/lib/utils";
import type {
  ClassInfo,
  ClassMembership,
  StudentProgress,
} from "@/lib/types";

interface ActivityRow {
  name: string;
  className: string;
  classId: string;
  uid: string;
  at: number;
  where: string;
  percent: number;
}

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<Array<ClassInfo & { classId: string }> | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [avg, setAvg] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    return listenTeacherClasses(user.uid, setClasses);
  }, [user]);

  useEffect(() => {
    if (!classes) return;
    let alive = true;
    (async () => {
      setLoadingStats(true);
      let students = 0;
      let pctSum = 0;
      let pctN = 0;
      const rows: ActivityRow[] = [];
      for (const c of classes) {
        const [members, progressAll] = await Promise.all([
          readOnce<Record<string, ClassMembership>>(P.members(c.classId)),
          readOnce<Record<string, StudentProgress>>(P.progressClass(c.classId)),
        ]);
        const memberEntries = Object.entries(members ?? {});
        students += memberEntries.length;
        for (const [uid, m] of memberEntries) {
          const p = progressAll?.[uid];
          if (p) {
            pctSum += p.overallPercent ?? 0;
            pctN++;
            rows.push({
              name: m.name,
              className: c.className,
              classId: c.classId,
              uid,
              at: p.lastActivityAt ?? 0,
              where:
                p.currentSection && p.currentModule !== undefined
                  ? `Modul ${p.currentModule} · ${p.currentSection.replace("section", "Bagian ")}`
                  : `Modul ${p.currentModule ?? 1}`,
              percent: p.overallPercent ?? 0,
            });
          }
        }
      }
      if (!alive) return;
      rows.sort((a, b) => b.at - a.at);
      setStudentCount(students);
      setAvg(pctN ? Math.round(pctSum / pctN) : 0);
      setActivity(rows.slice(0, 8));
      setLoadingStats(false);
    })();
    return () => {
      alive = false;
    };
  }, [classes]);

  const cards = useMemo(
    () => [
      {
        icon: GraduationCap,
        label: "Jumlah Kelas",
        value: classes?.length ?? "…",
      },
      { icon: Users, label: "Siswa Terdaftar", value: studentCount },
      {
        icon: Percent,
        label: "Rata-rata Progres",
        value: avg === null ? "…" : `${avg}%`,
      },
      {
        icon: Activity,
        label: "Aktif Hari Ini",
        value: activity.filter((a) => Date.now() - a.at < 86400000).length,
      },
    ],
    [classes, studentCount, avg, activity]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Dashboard Guru</h1>
          <p className="text-sm text-slate-500 mt-1">
            Selamat datang, {profile?.name}. Pantau kelas dan progres siswa Anda.
          </p>
        </div>
        <Link href="/teacher/classes">
          <Button>Kelola Kelas</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardBody className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none">
                  {c.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{c.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Aktivitas Terbaru Siswa"
          subtitle="Posisi belajar terakhir setiap siswa."
        />
        <CardBody>
          {loadingStats ? (
            <Spinner label="Memuat aktivitas…" />
          ) : activity.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Belum ada aktivitas siswa. Buat kelas dan bagikan kode kelasnya.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {activity.map((a) => (
                <Link
                  key={`${a.classId}-${a.uid}`}
                  href={`/teacher/classes/${a.classId}/students/${a.uid}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-slate-50 rounded-lg px-2 -mx-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{a.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.className} · {a.where}
                    </p>
                  </div>
                  <Badge tone="blue">{a.percent}%</Badge>
                  <span className="text-xs text-slate-400 w-20 text-right">
                    {formatRelative(a.at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
