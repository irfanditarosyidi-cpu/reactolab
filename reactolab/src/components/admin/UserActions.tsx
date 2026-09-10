"use client";

// Per-user admin actions: change role, activate/deactivate, reset password,
// delete. All mutations go through server-side /api/admin (Admin SDK).

import { useState } from "react";
import { KeyRound, Trash2, UserCheck, UserX } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/forms";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/admin-api";
import type { UserProfile } from "@/lib/types";

export default function UserActions({
  user,
  compact = false,
}: {
  user: UserProfile;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [delOpen, setDelOpen] = useState(false);

  if (user.role === "admin") {
    return <span className="text-xs text-slate-400 italic">akun admin</span>;
  }

  const run = async (key: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(key);
    try {
      await fn();
      toast(okMsg, "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={compact ? "flex items-center gap-1.5" : "flex flex-wrap items-center gap-2"}>
      <Select
        className="!w-auto !py-1.5 text-xs font-semibold"
        value={user.role}
        disabled={busy !== null}
        onChange={(e) =>
          void run(
            "role",
            () =>
              adminFetch(`/api/admin/users/${user.uid}`, {
                method: "PATCH",
                body: { role: e.target.value },
              }),
            `Role ${user.name} diubah menjadi ${e.target.value}.`
          )
        }
      >
        <option value="student">student</option>
        <option value="teacher">teacher</option>
      </Select>

      <Button
        size="sm"
        variant="secondary"
        loading={busy === "status"}
        title={user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
        onClick={() =>
          void run(
            "status",
            () =>
              adminFetch(`/api/admin/users/${user.uid}`, {
                method: "PATCH",
                body: { status: user.status === "active" ? "inactive" : "active" },
              }),
            user.status === "active"
              ? `${user.name} dinonaktifkan.`
              : `${user.name} diaktifkan kembali.`
          )
        }
      >
        {user.status === "active" ? (
          <UserX className="h-3.5 w-3.5" />
        ) : (
          <UserCheck className="h-3.5 w-3.5" />
        )}
        {!compact && (user.status === "active" ? "Nonaktifkan" : "Aktifkan")}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        title="Reset password"
        onClick={() => setPwOpen(true)}
      >
        <KeyRound className="h-3.5 w-3.5" />
        {!compact && "Reset Password"}
      </Button>

      <Button size="sm" variant="danger" title="Hapus" onClick={() => setDelOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />
        {!compact && "Hapus"}
      </Button>

      {/* reset password modal */}
      <Modal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title={`Reset Password — ${user.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwOpen(false)}>
              Batal
            </Button>
            <Button
              loading={busy === "pw"}
              disabled={pw.length < 6}
              onClick={() =>
                void run(
                  "pw",
                  async () => {
                    await adminFetch("/api/admin/reset-password", {
                      body: { uid: user.uid, newPassword: pw },
                    });
                    setPwOpen(false);
                    setPw("");
                  },
                  "Password baru berhasil di-set. Sampaikan ke pengguna secara aman."
                )
              }
            >
              Set Password
            </Button>
          </>
        }
      >
        <Label htmlFor="npw">Password baru untuk {user.email}</Label>
        <Input
          id="npw"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="min. 6 karakter"
        />
        <p className="text-xs text-slate-400 mt-2">
          Password lama tidak pernah dapat dilihat oleh admin.
        </p>
      </Modal>

      {/* delete modal */}
      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title={`Hapus Akun — ${user.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={busy === "del"}
              onClick={() =>
                void run(
                  "del",
                  async () => {
                    await adminFetch(`/api/admin/users/${user.uid}`, {
                      method: "DELETE",
                    });
                    setDelOpen(false);
                  },
                  "Akun dihapus."
                )
              }
            >
              Hapus Permanen
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Akun <b>{user.email}</b> akan dihapus dari sistem autentikasi dan daftar
          pengguna. Data pembelajaran lama tidak ikut terhapus otomatis. Lanjutkan?
        </p>
      </Modal>
    </div>
  );
}
