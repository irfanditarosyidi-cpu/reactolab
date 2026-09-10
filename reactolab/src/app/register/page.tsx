"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import { FieldError, Help, Input, Label } from "@/components/ui/forms";
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
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Help>Minimal 6 karakter.</Help>
        </div>
        <div>
          <Label htmlFor="confirm">Konfirmasi Password</Label>
          <Input
            id="confirm"
            type="password"
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
      </form>
    </AuthShell>
  );
}
