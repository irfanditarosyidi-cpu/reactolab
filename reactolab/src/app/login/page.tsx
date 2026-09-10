"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/forms";
import { dashboardPathFor, useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr("Format email tidak valid.");
      return;
    }
    setBusy(true);
    try {
      const profile = await login(email, password);
      router.replace(dashboardPathFor(profile.role));
    } catch (error) {
      setErr(
        (error as Error & { code?: string }).code
          ? authErrorMessage(error)
          : (error as Error).message || authErrorMessage(error)
      );
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Masuk ke ReactoLab"
      subtitle="Gunakan akun email dan password kamu."
      footer={
        <span>
          Belum punya akun?{" "}
          <Link href="/register" className="text-brand-600 font-semibold hover:underline">
            Daftar di sini
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@sekolah.sch.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <FieldError>{err}</FieldError>
        <Button type="submit" full loading={busy}>
          Masuk
        </Button>
        <div className="flex items-center justify-between text-sm pt-1">
          <Link href="/forgot-password" className="text-brand-600 hover:underline">
            Lupa password?
          </Link>
          <Link href="/reset-request" className="text-slate-500 hover:underline">
            Minta reset ke admin
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
