"use client";

// Admin dashboard (PR-ADM-001): user statistics + shortcuts.

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap, KeyRound, UserCheck, UserX, Users } from "lucide-react";
import Card, { CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Spinner } from "@/components/ui/misc";
import { listen } from "@/lib/db";
import { P } from "@/lib/paths";
import type { PasswordResetRequest, UserProfile } from "@/lib/types";

export default function AdminDashboard() {
  const [users, setUsers] = useState<Record<string, UserProfile> | null>(null);
  const [requests, setRequests] = useState<Record<string, PasswordResetRequest>>({});

  useEffect(() => {
    const u1 = listen<Record<string, UserProfile>>(P.users, (v) => setUsers(v ?? {}));
    const u2 = listen<Record<string, PasswordResetRequest>>(P.resetRequests, (v) =>
      setRequests(v ?? {})
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  if (users === null) return <Spinner label="Memuat statistik…" />;

  const list = Object.values(users);
  const pending = Object.values(requests).filter((r) => r.status === "pending").length;
  const stats = [
    { icon: Users, label: "Total Pengguna", value: list.length, tone: "text-brand-600 bg-brand-50" },
    {
      icon: GraduationCap,
      label: "Siswa",
      value: list.filter((u) => u.role === "student").length,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      icon: Users,
      label: "Guru",
      value: list.filter((u) => u.role === "teacher").length,
      tone: "text-violet-600 bg-violet-50",
    },
    {
      icon: UserCheck,
      label: "Aktif",
      value: list.filter((u) => u.status === "active").length,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: UserX,
      label: "Nonaktif",
      value: list.filter((u) => u.status === "inactive").length,
      tone: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola akun dan keamanan ReactoLab.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3">
              <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {pending > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardBody className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-white text-amber-600 border border-amber-200 flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-amber-900">
                {pending} permintaan reset password menunggu
              </p>
              <p className="text-sm text-amber-800">
                Proses permintaan agar pengguna dapat kembali masuk.
              </p>
            </div>
            <Link href="/admin/password-reset-requests">
              <Button>Proses Sekarang</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card className="hover:border-brand-400 transition-colors">
            <CardBody>
              <p className="font-bold text-slate-800">👥 Kelola Pengguna</p>
              <p className="text-sm text-slate-500 mt-1">
                Cari, buat, nonaktifkan, ubah role student ↔ teacher.
              </p>
            </CardBody>
          </Card>
        </Link>
        <Link href="/admin/audit">
          <Card className="hover:border-brand-400 transition-colors">
            <CardBody>
              <p className="font-bold text-slate-800">📜 Audit Log</p>
              <p className="text-sm text-slate-500 mt-1">
                Jejak seluruh aksi administratif pada sistem.
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}
