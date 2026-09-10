"use client";

// Shared settings: profile name, change password (with re-auth), logout.
// Students additionally get "Reset Progres" with typed confirmation.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { AlertTriangle, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Help, Input, Label } from "@/components/ui/forms";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase/client";
import { resetStudentData, updateOwnProfile } from "@/lib/db";
import { authErrorMessage } from "@/lib/utils";

export default function SettingsPanel({ showReset = false }: { showReset?: boolean }) {
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(profile?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetting, setResetting] = useState(false);

  const saveName = async () => {
    if (!user || name.trim().length < 3) return;
    setSavingName(true);
    try {
      await updateOwnProfile(user.uid, { name: name.trim() });
      await updateAuthProfile(user, { displayName: name.trim() });
      toast("Nama berhasil diperbarui.", "success");
    } catch {
      toast("Gagal memperbarui nama.", "error");
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (!user || !user.email) return;
    if (newPass.length < 6) {
      toast("Password baru minimal 6 karakter.", "error");
      return;
    }
    setSavingPass(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, curPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      setCurPass("");
      setNewPass("");
      toast("Password berhasil diganti.", "success");
    } catch (e) {
      toast(authErrorMessage(e), "error");
    } finally {
      setSavingPass(false);
    }
  };

  const doReset = async () => {
    if (!user || !profile?.activeClassId) return;
    setResetting(true);
    try {
      await resetStudentData(profile.activeClassId, user.uid);
      toast("Progres berhasil direset. Selamat belajar dari awal!", "success");
      setResetOpen(false);
      setResetText("");
    } catch {
      toast("Gagal mereset progres.", "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola profil dan akunmu.</p>
      </div>

      <Card>
        <CardHeader title="Profil" />
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="s-name">Nama Lengkap</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
            <Help>Email tidak dapat diubah.</Help>
          </div>
          <Button onClick={() => void saveName()} loading={savingName} disabled={name.trim().length < 3}>
            Simpan Profil
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Ganti Password"
          subtitle="Masukkan password saat ini untuk verifikasi."
        />
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="s-cur">Password Saat Ini</Label>
            <Input
              id="s-cur"
              type="password"
              value={curPass}
              onChange={(e) => setCurPass(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="s-new">Password Baru</Label>
            <Input
              id="s-new"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button
            onClick={() => void savePassword()}
            loading={savingPass}
            disabled={!curPass || newPass.length < 6}
          >
            Ganti Password
          </Button>
        </CardBody>
      </Card>

      {showReset && (
        <Card className="border-red-200">
          <CardHeader
            title={
              <span className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Zona Berbahaya
              </span>
            }
            subtitle="Menghapus seluruh progres, jawaban, dan data eksperimenmu di kelas ini."
          />
          <CardBody>
            <Button variant="danger" onClick={() => setResetOpen(true)} disabled={!profile?.activeClassId}>
              Reset Progres Belajar
            </Button>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Keluar dari akun ini di perangkat ini.</p>
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Konfirmasi Reset Progres"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              loading={resetting}
              disabled={resetText !== "RESET"}
              onClick={() => void doReset()}
            >
              Reset Sekarang
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Seluruh progres modul, jawaban LKPD, dan data eksperimen akan{" "}
          <b className="text-red-600">dihapus permanen</b>. Kamu akan mulai lagi dari
          Modul 0. Ketik <b>RESET</b> untuk melanjutkan:
        </p>
        <Input
          className="mt-3 font-mono"
          value={resetText}
          onChange={(e) => setResetText(e.target.value.toUpperCase())}
          placeholder="RESET"
        />
      </Modal>
    </div>
  );
}
