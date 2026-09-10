"use client";

// User management table (PR-ADM-002/003/004): search, create, actions.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/forms";
import { Avatar, Badge, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import UserActions from "@/components/admin/UserActions";
import { adminFetch } from "@/lib/admin-api";
import { listen } from "@/lib/db";
import { P } from "@/lib/paths";
import type { UserProfile } from "@/lib/types";

const ROLE_TONE = { student: "sky", teacher: "blue", admin: "amber" } as const;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Record<string, UserProfile> | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [busy, setBusy] = useState(false);

  useEffect(() => listen<Record<string, UserProfile>>(P.users, (v) => setUsers(v ?? {})), []);

  const list = useMemo(() => {
    if (!users) return [];
    const needle = q.trim().toLowerCase();
    return Object.entries(users)
      .map(([uid, u]) => ({ ...u, uid }))
      .filter((u) => roleFilter === "all" || u.role === roleFilter)
      .filter(
        (u) =>
          !needle ||
          u.name?.toLowerCase().includes(needle) ||
          u.email?.toLowerCase().includes(needle)
      )
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [users, q, roleFilter]);

  const create = async () => {
    setBusy(true);
    try {
      await adminFetch("/api/admin/users", { body: form });
      toast(`Akun ${form.email} dibuat.`, "success");
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "", role: "student" });
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl font-black text-slate-900">Pengguna</h1>
          <p className="text-sm text-slate-500 mt-1">
            {users ? Object.keys(users).length : "…"} akun terdaftar.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Buat Akun
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama atau email…"
            />
          </div>
          <Select
            className="sm:!w-44"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Semua role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </Select>
        </CardBody>
      </Card>

      {users === null ? (
        <Spinner label="Memuat pengguna…" />
      ) : (
        <Card>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-bold">Pengguna</th>
                  <th className="px-3 py-3 font-bold">Role</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.uid} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${u.uid}`} className="flex items-center gap-2.5 group">
                        <Avatar name={u.name} size={32} />
                        <span>
                          <span className="block font-bold text-slate-800 group-hover:text-brand-700">
                            {u.name}
                          </span>
                          <span className="block text-xs text-slate-400">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={ROLE_TONE[u.role] ?? "slate"}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={u.status === "active" ? "green" : "red"}>
                        {u.status === "active" ? "aktif" : "nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end">
                        <UserActions user={u} compact />
                      </div>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada pengguna yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Akun Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              loading={busy}
              disabled={
                form.name.trim().length < 3 ||
                !/^\S+@\S+\.\S+$/.test(form.email) ||
                form.password.length < 6
              }
              onClick={() => void create()}
            >
              Buat Akun
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Nama Lengkap</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Password Awal</Label>
            <Input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="min. 6 karakter"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </Select>
            <p className="text-xs text-slate-400 mt-1.5">
              Akun admin hanya dapat dibuat melalui seed script (lihat README).
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
