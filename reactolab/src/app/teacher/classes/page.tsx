"use client";

// Class management: create class + generated 6-char code (PR-CLASS-001/002).

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Plus, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/forms";
import Modal from "@/components/ui/Modal";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import {
  createClass,
  ensureDefaultDiscussionCases,
  listenTeacherClasses,
  readOnce,
} from "@/lib/db";
import { P } from "@/lib/paths";
import { formatDateTime } from "@/lib/utils";
import type { ClassInfo, ClassMembership } from "@/lib/types";

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Array<ClassInfo & { classId: string }> | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenTeacherClasses(user.uid, setClasses);
  }, [user]);

  useEffect(() => {
    if (!classes) return;
    void Promise.all(
      classes.map((item) => ensureDefaultDiscussionCases(item.classId))
    ).catch(() => undefined);
  }, [classes]);

  useEffect(() => {
    if (!classes) return;
    let alive = true;
    (async () => {
      const map: Record<string, number> = {};
      for (const c of classes) {
        const members = await readOnce<Record<string, ClassMembership>>(
          P.members(c.classId)
        );
        map[c.classId] = Object.keys(members ?? {}).length;
      }
      if (alive) setCounts(map);
    })();
    return () => {
      alive = false;
    };
  }, [classes]);

  const create = async () => {
    if (!user || name.trim().length < 3) return;
    setBusy(true);
    try {
      const res = await createClass(user.uid, name.trim());
      toast(`Kelas dibuat! Kode: ${res.classCode}`, "success");
      setOpen(false);
      setName("");
    } catch {
      toast("Gagal membuat kelas.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Daftar Kelas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat kelas dan bagikan kode kepada siswa.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Buat Kelas
        </Button>
      </div>

      {classes === null ? (
        <Spinner label="Memuat kelas…" />
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🏫"
            title="Belum ada kelas"
            desc="Buat kelas pertama Anda, lalu bagikan kode kelas kepada siswa untuk bergabung."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Buat Kelas
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {classes.map((c) => (
            <Card key={c.classId} className="hover:border-brand-300 transition-colors">
              <CardHeader
                title={
                  <Link
                    href={`/teacher/classes/${c.classId}`}
                    title="Buka detail dan administrasi kelas"
                    className="hover:text-brand-700 hover:underline"
                  >
                    {c.className}
                  </Link>
                }
                subtitle={`Dibuat ${formatDateTime(c.createdAt)}`}
                action={<Badge tone={c.status === "active" ? "green" : "slate"}>{c.status === "active" ? "Aktif" : "Arsip"}</Badge>}
              />
              <CardBody>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-black tracking-[0.25em] px-3 py-1.5">
                      {c.classCode}
                    </code>
                    <button
                      type="button"
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                      title="Salin kode"
                      onClick={() => {
                        void navigator.clipboard.writeText(c.classCode);
                        toast("Kode kelas disalin.", "success");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {counts[c.classId] ?? "…"} siswa
                  </span>
                </div>
                <div className="mt-4">
                  <Link href={`/teacher/classes/${c.classId}`}>
                    <Button full size="sm">
                      Kelola Kelas
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Kelas Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => void create()} loading={busy} disabled={name.trim().length < 3}>
              Buat Kelas
            </Button>
          </>
        }
      >
        <Label htmlFor="cname">Nama Kelas</Label>
        <Input
          id="cname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: XI IPA 2 — 2026/2027"
        />
      </Modal>
    </div>
  );
}
