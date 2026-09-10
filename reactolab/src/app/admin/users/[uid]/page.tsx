"use client";

// Admin — user detail (/admin/users/[uid]).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Avatar, Badge, Spinner } from "@/components/ui/misc";
import UserActions from "@/components/admin/UserActions";
import { listen, readOnce } from "@/lib/db";
import { P } from "@/lib/paths";
import { formatDateTime } from "@/lib/utils";
import type { ClassInfo, UserProfile } from "@/lib/types";

export default function AdminUserDetail() {
  const { uid } = useParams<{ uid: string }>();
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const [className, setClassName] = useState<string>("-");

  useEffect(() => {
    if (!uid) return;
    return listen<UserProfile>(P.user(uid), (u) =>
      setUser(u ? { ...u, uid } : null)
    );
  }, [uid]);

  useEffect(() => {
    if (!user?.activeClassId) {
      setClassName("-");
      return;
    }
    void readOnce<ClassInfo>(P.class(user.activeClassId)).then((c) =>
      setClassName(c?.className ?? "-")
    );
  }, [user?.activeClassId]);

  if (user === undefined) return <Spinner label="Memuat pengguna…" />;
  if (user === null)
    return (
      <div className="text-center py-16">
        <p className="text-3xl">🫥</p>
        <p className="mt-2 font-bold text-slate-700">Pengguna tidak ditemukan</p>
        <Link
          href="/admin/users"
          className="text-brand-600 font-semibold text-sm hover:underline mt-2 inline-block"
        >
          ← Kembali ke daftar pengguna
        </Link>
      </div>
    );

  return (
    <div className="space-y-5 max-w-2xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Pengguna
      </Link>

      <Card>
        <CardBody className="flex items-center gap-4">
          <Avatar name={user.name} size={56} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 truncate">{user.name}</h1>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
            <div className="flex gap-1.5 mt-2">
              <Badge tone={user.role === "admin" ? "amber" : user.role === "teacher" ? "blue" : "sky"}>
                {user.role}
              </Badge>
              <Badge tone={user.status === "active" ? "green" : "red"}>
                {user.status === "active" ? "aktif" : "nonaktif"}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Informasi Akun" />
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase">UID</dt>
              <dd className="font-mono text-xs text-slate-600 break-all mt-0.5">{user.uid}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase">Terdaftar</dt>
              <dd className="text-slate-700 mt-0.5">{formatDateTime(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase">Kelas Aktif</dt>
              <dd className="text-slate-700 mt-0.5">{className}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-400 uppercase">Terakhir Diubah</dt>
              <dd className="text-slate-700 mt-0.5">{formatDateTime(user.updatedAt)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Aksi Admin"
          subtitle="Perubahan role terbatas student ↔ teacher. Password lama tidak pernah terlihat."
        />
        <CardBody>
          <UserActions user={user} />
        </CardBody>
      </Card>
    </div>
  );
}
