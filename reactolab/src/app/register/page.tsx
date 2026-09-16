"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import { FieldError, Help, Input, Label, PasswordInput } from "@/components/ui/forms";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/utils";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (name.trim().length < 3) {
      setErr("Nama minimal 3 karakter.");
      return;
    }
    if (password.length < 6) {
      setErr("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email, password);
      router.replace("/student/dashboard");
    } catch (error) {
      setErr(authErrorMessage(error));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Daftar Akun Siswa"
      subtitle="Akun baru otomatis terdaftar sebagai siswa."
      footer={
        <span>
          Sudah punya akun?{" "}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">
            Masuk
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth: Dewi Anggraini"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@sekolah.sch.id"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Help>Minimal 6 karakter.</Help>
        </div>
        <div>
          <Label htmlFor="confirm">Konfirmasi Password</Label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <FieldError>{err}</FieldError>
        <Button type="submit" full loading={busy}>
          Daftar
        </Button>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
      </form>
    </AuthShell>
  );
}
