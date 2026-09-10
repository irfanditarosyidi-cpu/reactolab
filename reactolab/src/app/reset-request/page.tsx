"use client";

// PR-AUTH-004 — request a manual password reset processed by the admin.

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import Button from "@/components/ui/Button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/forms";
import { createResetRequest } from "@/lib/db";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
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
      await createResetRequest(email, name, message);
      setDone(true);
    } catch {
      setErr("Gagal mengirim permintaan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Minta Reset ke Admin"
      subtitle="Admin akan mengatur ulang password akunmu secara manual."
      footer={
        <Link href="/login" className="text-brand-600 font-semibold hover:underline">
          ← Kembali ke halaman masuk
        </Link>
      }
    >
      {done ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          Permintaan terkirim. Hubungi guru/admin kamu untuk mendapatkan password baru
          setelah permintaan diproses.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email akun</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              required
            />
          </div>
          <div>
            <Label htmlFor="msg">Pesan (opsional)</Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="cth: Saya lupa password dan email saya tidak aktif."
              rows={3}
            />
          </div>
          <FieldError>{err}</FieldError>
          <Button type="submit" full loading={busy}>
            Kirim Permintaan
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
