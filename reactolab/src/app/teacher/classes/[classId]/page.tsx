"use client";

// Class detail: info, class code (+ regenerate, PR-CLASS-003), student list.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  MessagesSquare,
  MonitorCheck,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { Avatar, Badge, EmptyState, ProgressBar, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { listen, regenerateClassCode } from "@/lib/db";
import { P } from "@/lib/paths";
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
      (p) => setProgressAll(p ?? {})
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
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Kelas
      </Link>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <CardBody>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">{info.className}</h1>
              <Badge tone={info.status === "active" ? "green" : "slate"}>
                {info.status === "active" ? "Aktif" : "Arsip"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Dibuat {formatDateTime(info.createdAt)} · {students.length} siswa
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-black tracking-[0.25em] px-4 py-2 text-lg">
                {info.classCode}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(info.classCode);
                  toast("Kode kelas disalin.", "success");
                }}
              >
                <Copy className="h-4 w-4" /> Salin
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setRegenOpen(true)}>
                <RefreshCw className="h-4 w-4" /> Regenerasi Kode
              </Button>
            </div>
          </CardBody>
        </Card>
        <div className="flex lg:flex-col gap-3">
          <Link href={`/teacher/classes/${classId}/monitoring`} className="flex-1">
            <Button full>
              <MonitorCheck className="h-4 w-4" /> Monitoring
            </Button>
          </Link>
          <Link href={`/teacher/classes/${classId}/discussion`} className="flex-1">
            <Button variant="secondary" full>
              <MessagesSquare className="h-4 w-4" /> Forum Diskusi
            </Button>
          </Link>
          <Link href={`/teacher/classes/${classId}/practice`} className="flex-1">
            <Button variant="secondary" full>
              <ClipboardList className="h-4 w-4" /> Latihan Soal
            </Button>
          </Link>
          <Link href={`/teacher/classes/${classId}/scaffolding`} className="flex-1">
            <Button variant="secondary" full>
              <SlidersHorizontal className="h-4 w-4" /> Scaffolding
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Siswa (${students.length})`}
          subtitle="Klik siswa untuk melihat jawaban dan data eksperimennya (read-only)."
        />
        <CardBody>
          {students.length === 0 ? (
            <EmptyState
              emoji="🧑‍🎓"
              title="Belum ada siswa"
              desc={`Bagikan kode ${info.classCode} agar siswa dapat bergabung.`}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map(([uid, m]) => {
                const p = progressAll[uid];
                return (
                  <Link
                    key={uid}
                    href={`/teacher/classes/${classId}/students/${uid}`}
                    className="flex items-center gap-3 py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2"
                  >
                    <Avatar name={m.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {p?.lastActivityAt
                          ? `Aktif ${formatRelative(p.lastActivityAt)}`
                          : `Gabung ${formatDateTime(m.joinedAt)}`}
                      </p>
                    </div>
                    <div className="w-32 hidden sm:block">
                      <ProgressBar value={p?.overallPercent ?? 0} className="h-2" />
                    </div>
                    <Badge tone="blue">{p?.overallPercent ?? 0}%</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

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
