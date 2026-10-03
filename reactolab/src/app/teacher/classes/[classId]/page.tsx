"use client";

// Class detail: info, class code (+ regenerate, PR-CLASS-003), student list.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  Copy,
  RefreshCw,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { Avatar, ProgressBar, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { listen, regenerateClassCode } from "@/lib/db";
import { P } from "@/lib/paths";
import { normalizeProgress } from "@/lib/progress";
import { formatDateTime, formatRelative } from "@/lib/utils";
import type { ClassInfo, ClassMembership, StudentProgress } from "@/lib/types";

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [members, setMembers] = useState<Record<string, ClassMembership> | null>(null);
  const [progressAll, setProgressAll] = useState<Record<string, StudentProgress>>({});
  const [regenOpen, setRegenOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const u1 = listen<ClassInfo>(P.class(classId), setInfo);
    const u2 = listen<Record<string, ClassMembership>>(P.members(classId), (m) =>
      setMembers(m ?? {})
    );
    const u3 = listen<Record<string, StudentProgress>>(
      P.progressClass(classId),
      (p) =>
        setProgressAll(
          Object.fromEntries(
            Object.entries(p ?? {}).map(([uid, progress]) => [
              uid,
              normalizeProgress(progress),
            ])
          )
        )
    );
    return () => {
      u1();
      u2();
      u3();
    };
  }, [classId]);

  if (!info || members === null) return <Spinner label="Memuat kelas…" />;

  const students = Object.entries(members).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );
  const totalStudents = students.length;
  const averageProgress = totalStudents
    ? Math.round(
        students.reduce(
          (sum, [uid]) => sum + (progressAll[uid]?.overallPercent ?? 0),
          0
        ) / totalStudents
      )
    : 0;
  const completedStudents = students.filter(
    ([uid]) => (progressAll[uid]?.overallPercent ?? 0) >= 100
  ).length;
  const inProgressStudents = students.filter(([uid]) => {
    const percent = progressAll[uid]?.overallPercent ?? 0;
    return percent > 0 && percent < 100;
  }).length;
  const notStartedStudents = totalStudents - completedStudents - inProgressStudents;
  const activeThreshold = Date.now() - 24 * 60 * 60 * 1000;
  const activeToday = students.filter(
    ([uid]) => (progressAll[uid]?.lastActivityAt ?? 0) >= activeThreshold
  ).length;
  const recentActivity = students
    .map(([uid, member]) => ({ uid, member, progress: progressAll[uid] }))
    .filter((item) => Boolean(item.progress?.lastActivityAt))
    .sort(
      (a, b) =>
        (b.progress?.lastActivityAt ?? 0) - (a.progress?.lastActivityAt ?? 0)
    )
    .slice(0, 5);

  const summaryCards = [
    {
      label: "Jumlah Siswa",
      value: totalStudents,
      note: "siswa terdaftar",
      icon: Users,
    },
    {
      label: "Rata-rata Progres",
      value: `${averageProgress}%`,
      note: "seluruh modul",
      icon: BarChart3,
    },
    {
      label: "Siswa Selesai",
      value: completedStudents,
      note: "progres 100%",
      icon: CheckCircle2,
    },
    {
      label: "Aktif Hari Ini",
      value: activeToday,
      note: "24 jam terakhir",
      icon: Clock3,
    },
  ];

  const regen = async () => {
    setBusy(true);
    try {
      const newCode = await regenerateClassCode(classId, info.classCode);
      toast(`Kode baru: ${newCode}. Kode lama tidak berlaku lagi.`, "success");
      setRegenOpen(false);
    } catch {
      toast("Gagal meregenerasi kode.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href="/teacher/classes"
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Kelas
      </Link>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-600 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-indigo-300/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-100">
                Dashboard Kelas
              </p>
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold">
                {info.status === "active" ? "Kelas Aktif" : "Kelas Diarsipkan"}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black sm:text-3xl">{info.className}</h1>
            <p className="mt-2 text-sm text-brand-100">
              Dibuat {formatDateTime(info.createdAt)} · {totalStudents} siswa terdaftar
            </p>
          </div>

          <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm lg:w-auto lg:min-w-[330px]">
            <p className="text-xs font-semibold text-brand-100">Kode bergabung kelas</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-lg font-black tracking-[0.28em] text-brand-700 shadow-sm">
                {info.classCode}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(info.classCode);
                  toast("Kode kelas disalin.", "success");
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                <Copy className="h-4 w-4" /> Salin
              </button>
            </div>
            <button
              type="button"
              onClick={() => setRegenOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-100 transition-colors hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerasi kode kelas
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardBody className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-black leading-none text-slate-900 sm:text-2xl">
                    {item.value}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                    {item.label}
                  </p>
                  <p className="hidden text-[11px] text-slate-400 sm:block">{item.note}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Ringkasan Progres Kelas"
            subtitle="Gambaran umum perkembangan belajar seluruh siswa."
          />
          <CardBody className="space-y-5">
            <div>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Progres rata-rata</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{averageProgress}%</p>
                </div>
                <Activity className="h-8 w-8 text-brand-200" />
              </div>
              <ProgressBar value={averageProgress} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              {[
                {
                  label: "Belum mulai",
                  value: notStartedStudents,
                  color: "bg-slate-400",
                },
                {
                  label: "Sedang belajar",
                  value: inProgressStudents,
                  color: "bg-amber-400",
                },
                {
                  label: "Selesai",
                  value: completedStudents,
                  color: "bg-emerald-500",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">{item.value}</p>
                  <p className="text-[11px] text-slate-400">siswa</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Aktivitas Terbaru"
            subtitle="Aktivitas belajar terakhir di kelas ini."
          />
          <CardBody>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Belum ada aktivitas siswa
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Aktivitas akan muncul saat siswa mulai belajar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivity.map(({ uid, member, progress }) => (
                  <div key={uid} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar name={member.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        Modul {progress?.currentModule ?? 1} · {progress?.overallPercent ?? 0}%
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-slate-400">
                      {formatRelative(progress?.lastActivityAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        title="Regenerasi Kode Kelas"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegenOpen(false)}>
              Batal
            </Button>
            <Button loading={busy} onClick={() => void regen()}>
              Ya, Regenerasi
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Kode lama <b>{info.classCode}</b> akan langsung tidak berlaku. Siswa yang
          sudah tergabung tidak terpengaruh. Lanjutkan?
        </p>
      </Modal>
    </div>
  );
}
