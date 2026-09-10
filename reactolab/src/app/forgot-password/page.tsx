"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/forms";
import { auth } from "@/lib/firebase/client";
import { authErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (error) {
      setErr(authErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Lupa Password"
      subtitle="Kami kirimkan tautan reset password ke email kamu."
      footer={
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">
          ← Kembali ke halaman masuk
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          Tautan reset password telah dikirim ke <b>{email}</b>. Periksa kotak masuk
          (dan folder spam), lalu ikuti instruksinya.
          <p className="mt-2 text-emerald-700">
            Tidak menerima email?{" "}
            <Link href="/reset-request" className="underline font-semibold">
              Minta reset ke admin
            </Link>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email terdaftar</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              required
            />
          </div>
          <FieldError>{err}</FieldError>
          <Button type="submit" full loading={busy}>
            Kirim Tautan Reset
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Email tidak bisa diakses?{" "}
            <Link href="/reset-request" className="text-brand-600 hover:underline">
              Minta reset ke admin
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
