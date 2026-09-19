"use client";

// Shared settings: profile name, change password (with re-auth), logout.
// Students additionally get "Reset Progres" with typed confirmation.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { AlertTriangle, LogOut, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Help, Input, Label, Select } from "@/components/ui/forms";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase/client";
import {
  listen,
  resetStudentData,
  resetStudentModuleData,
  updateOwnProfile,
} from "@/lib/db";
import { MODULES } from "@/lib/module-defs";
import { P } from "@/lib/paths";
import { MODULE_STATUS_LABEL } from "@/lib/progress";
import type { StudentProgress } from "@/lib/types";
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
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [moduleResetOpen, setModuleResetOpen] = useState(false);
  const [moduleResetText, setModuleResetText] = useState("");
  const [moduleResetting, setModuleResetting] = useState(false);

  useEffect(() => {
    if (!showReset || !user || !profile?.activeClassId) return;
    return listen<StudentProgress>(P.progress(profile.activeClassId, user.uid), (value) => {
      setProgress(value);
    });
  }, [showReset, user, profile?.activeClassId]);

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

  const selectedModule = selectedModuleId
    ? MODULES.find((module) => module.id === selectedModuleId) ?? null
    : null;
  const selectedModuleStatus = selectedModuleId
    ? progress?.modules[String(selectedModuleId)]?.status ?? "locked"
    : "locked";
  const canResetSelectedModule = Boolean(
    selectedModule && selectedModuleStatus !== "locked"
  );
  const moduleResetPhrase = selectedModuleId ? `RESET MODUL ${selectedModuleId}` : "";

  const doModuleReset = async () => {
    if (!user || !profile?.activeClassId || !selectedModuleId) return;
    setModuleResetting(true);
    try {
      await resetStudentModuleData(profile.activeClassId, user.uid, selectedModuleId);
      toast(`Progres Modul ${selectedModuleId} berhasil direset.`, "success");
      setModuleResetOpen(false);
      setModuleResetText("");
      router.push(`/student/modules/${selectedModuleId}`);
    } catch (error) {
      const message = error instanceof Error && error.message === "module-locked"
        ? "Modul yang masih terkunci belum dapat direset."
        : "Gagal mereset progres modul.";
      toast(message, "error");
    } finally {
      setModuleResetting(false);
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
        <>
          <Card className="border-amber-200">
            <CardHeader
              title={
                <span className="flex items-center gap-2 text-amber-800">
                  <RotateCcw className="h-4 w-4" /> Reset Satu Modul
                </span>
              }
              subtitle="Ulangi modul tertentu tanpa mengubah progres modul lainnya."
            />
            <CardBody className="space-y-3">
              <div>
                <Label htmlFor="reset-module">Pilih Modul</Label>
                <Select
                  id="reset-module"
                  value={selectedModuleId ?? ""}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSelectedModuleId(value || null);
                    setModuleResetText("");
                  }}
                  disabled={!profile?.activeClassId || progress === null}
                >
                  <option value="">Pilih modul yang ingin diulang…</option>
                  {MODULES.map((module) => {
                    const status = progress?.modules[String(module.id)]?.status ?? "locked";
                    return (
                      <option
                        key={module.id}
                        value={module.id}
                        disabled={status === "locked"}
                      >
                        Modul {module.id} — {module.title} ({MODULE_STATUS_LABEL[status]})
                      </option>
                    );
                  })}
                </Select>
                <Help>
                  Jawaban, progres bagian, dan data eksperimen hanya pada modul pilihan
                  akan dihapus.
                </Help>
              </div>
              <Button
                variant="danger"
                disabled={!canResetSelectedModule || !profile?.activeClassId}
                onClick={() => setModuleResetOpen(true)}
              >
                <RotateCcw className="h-4 w-4" /> Reset Modul Terpilih
              </Button>
            </CardBody>
          </Card>

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
                Reset Seluruh Progres Belajar
              </Button>
            </CardBody>
          </Card>
        </>
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
        open={moduleResetOpen}
        onClose={() => {
          if (!moduleResetting) setModuleResetOpen(false);
        }}
        title={`Reset Modul ${selectedModuleId ?? ""}?`}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={moduleResetting}
              onClick={() => setModuleResetOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              loading={moduleResetting}
              disabled={moduleResetText !== moduleResetPhrase}
              onClick={() => void doModuleReset()}
            >
              Reset Modul Ini
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Progres, jawaban, dan data eksperimen <b>{selectedModule?.title}</b> akan
          dihapus. Progres modul lainnya tetap dipertahankan.
        </p>
        {selectedModuleId && selectedModuleId <= 6 && (
          <p className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
            Modul 7 (Penutup) akan dikunci kembali dan baru tersedia setelah Modul
            1–6 kembali berstatus selesai seluruhnya.
          </p>
        )}
        {selectedModuleId && selectedModuleId <= 4 && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Snapshot LKPD lama akan dibatalkan dan dibuat ulang setelah Modul 1–4
            kembali lengkap.
          </p>
        )}
        {selectedModuleId === 6 && (
          <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            CER dan komentar yang sudah dipublikasikan tetap tersimpan sebagai rekam
            diskusi; hanya progres belajarnya yang diulang.
          </p>
        )}
        <p className="mt-3 text-sm text-slate-600">
          Ketik <b>{moduleResetPhrase}</b> untuk melanjutkan:
        </p>
        <Input
          className="mt-2 font-mono"
          value={moduleResetText}
          onChange={(event) => setModuleResetText(event.target.value.toUpperCase())}
          placeholder={moduleResetPhrase}
        />
      </Modal>

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
          Modul 1. Ketik <b>RESET</b> untuk melanjutkan:
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
