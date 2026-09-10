"use client";

// Landing page — redirects logged-in users to their role dashboard (PR-AUTH-005).

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Atom,
  FlaskConical,
  LineChart,
  MessagesSquare,
  Microscope,
  Save,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { dashboardPathFor, useAuth } from "@/lib/auth-context";

const FEATURES = [
  {
    icon: FlaskConical,
    title: "Eksperimen Virtual",
    desc: "Selidiki konsentrasi, luas permukaan, suhu, dan katalis lewat simulasi interaktif.",
  },
  {
    icon: Microscope,
    title: "Kaca Pembesar Partikel",
    desc: "Lihat tumbukan antar-partikel (submikroskopik) langsung di halaman eksperimen.",
  },
  {
    icon: LineChart,
    title: "Data & Grafik Otomatis",
    desc: "Tabel dan grafik tersusun otomatis dari setiap percobaanmu.",
  },
  {
    icon: MessagesSquare,
    title: "Forum Ilmiah CER",
    desc: "Berargumen dengan format Claim–Evidence–Reasoning bersama teman sekelas.",
  },
  {
    icon: Save,
    title: "Simpan & Lanjutkan",
    desc: "Berhenti kapan saja — progresmu tersimpan dan bisa dilanjutkan lain waktu.",
  },
  {
    icon: Atom,
    title: "Inkuiri Terbimbing",
    desc: "Belajar seperti ilmuwan: rumuskan masalah, berhipotesis, uji dengan data.",
  },
];

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      router.replace(dashboardPathFor(profile.role));
    }
  }, [loading, user, profile, router]);

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <FlaskConical className="h-5 w-5" />
          </span>
          <span className="font-black text-lg text-slate-900">
            Reacto<span className="text-brand-600">Lab</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/register" className="hidden sm:block">
            <Button size="sm">Daftar</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1">
          Kimia SMA · Laju Reaksi · Inkuiri Terbimbing
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
          Laboratorium Virtual
          <br />
          <span className="text-brand-600">Laju Reaksi</span>
        </h1>
        <p className="mt-5 text-slate-500 max-w-2xl mx-auto text-lg">
          Jelajahi mengapa reaksi bisa cepat atau lambat — dari fenomena sehari-hari,
          eksperimen virtual, hingga dunia partikel — lalu diskusikan temuanmu secara
          ilmiah.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">Mulai Belajar</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sudah punya akun
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card"
            >
              <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-slate-400">
        ReactoLab v1.2 — Media pembelajaran laju reaksi berbasis inkuiri terbimbing.
      </footer>
    </div>
  );
}
