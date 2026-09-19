"use client";

// Public landing page — redirects authenticated users to their role dashboard.

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Atom,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  LineChart,
  Microscope,
  MousePointer2,
  Play,
  School,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { dashboardPathFor, useAuth } from "@/lib/auth-context";
import BrandLogo from "@/components/layout/BrandLogo";

const ReactionLab3D = dynamic(
  () => import("@/components/landing/ReactionLab3D"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[500px] items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-950 text-sm font-semibold text-blue-200 shadow-2xl">
        Menyiapkan laboratorium 3D…
      </div>
    ),
  }
);

const FEATURES = [
  {
    icon: Atom,
    title: "Simulasi Interaktif 3D",
    desc: "Putar ruang reaksi, amati gerak partikel, dan lihat tumbukan efektif dari sudut pandang submikroskopik.",
    tone: "from-blue-500 to-cyan-400",
  },
  {
    icon: FlaskConical,
    title: "Empat Misi Laboratorium",
    desc: "Uji pengaruh konsentrasi, luas permukaan, suhu, dan katalis melalui eksperimen virtual terarah.",
    tone: "from-violet-500 to-blue-500",
  },
  {
    icon: LineChart,
    title: "Data & Grafik Otomatis",
    desc: "Setiap hasil percobaan langsung berubah menjadi tabel dan grafik yang siap dianalisis.",
    tone: "from-cyan-500 to-emerald-400",
  },
  {
    icon: Microscope,
    title: "Tiga Level Representasi",
    desc: "Hubungkan perubahan makroskopik, perilaku partikel, dan persamaan kimia dalam satu alur.",
    tone: "from-amber-500 to-orange-400",
  },
  {
    icon: Users,
    title: "Forum Ilmiah CER",
    desc: "Bangun argumen berbasis Claim, Evidence, dan Reasoning dari kasus yang diberikan guru.",
    tone: "from-pink-500 to-violet-500",
  },
  {
    icon: BookOpenCheck,
    title: "Progres & LKPD Terintegrasi",
    desc: "Jawaban tersimpan otomatis, dapat dilanjutkan kapan saja, lalu dirangkum menjadi LKPD.",
    tone: "from-emerald-500 to-teal-400",
  },
];

const LEARNING_STEPS = [
  {
    no: "01",
    title: "Amati fenomena",
    desc: "Mulai dari peristiwa dekat dengan kehidupan sehari-hari dan temukan pertanyaan ilmiahnya.",
    icon: Sparkles,
  },
  {
    no: "02",
    title: "Susun hipotesis",
    desc: "Tentukan variabel dan buat dugaan yang dapat diuji, bukan sekadar menghafal konsep.",
    icon: BookOpenCheck,
  },
  {
    no: "03",
    title: "Lakukan eksperimen 3D",
    desc: "Ubah kondisi, jalankan simulasi, dan kumpulkan bukti kuantitatif secara mandiri.",
    icon: MousePointer2,
  },
  {
    no: "04",
    title: "Analisis & komunikasikan",
    desc: "Baca grafik, uji hipotesis, simpulkan, lalu pertahankan argumen dengan format CER.",
    icon: BarChart3,
  },
];

const HIGHLIGHTS = [
  "Eksperimen aman dan dapat diulang",
  "Visualisasi partikel secara langsung",
  "Umpan balik dan progres tersimpan",
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
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="ChemSpace Beranda">
            <BrandLogo
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-12"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex" aria-label="Navigasi utama">
            <a href="#fitur" className="transition-colors hover:text-brand-600">Fitur</a>
            <a href="#alur" className="transition-colors hover:text-brand-600">Alur Belajar</a>
            <a href="#untuk-siapa" className="transition-colors hover:text-brand-600">Untuk Siapa</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-brand-700"
            >
              Daftar<span className="hidden sm:inline"> Gratis</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden pb-20 pt-12 sm:pb-28 sm:pt-20">
          <div className="landing-grid absolute inset-0 -z-20 opacity-70" />
          <div className="landing-orb landing-orb-blue absolute -left-40 top-10 -z-10 h-[30rem] w-[30rem] rounded-full" />
          <div className="landing-orb landing-orb-cyan absolute -right-48 top-4 -z-10 h-[34rem] w-[34rem] rounded-full" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:px-8">
            <div className="relative z-10 text-center lg:text-left">
              <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
                Lihat reaksinya.
                <br />
                <span className="bg-gradient-to-r from-brand-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Temukan alasannya.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
                ChemSpace mengubah materi laju reaksi menjadi pengalaman belajar aktif—dari
                fenomena sehari-hari, eksperimen virtual 3D, analisis data, hingga diskusi
                ilmiah berbasis bukti.
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-blue-500/20 transition-colors hover:bg-brand-700 sm:w-auto"
                >
                  Mulai Bereksperimen <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#fitur"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white/80 px-6 py-3 text-base font-semibold text-brand-700 transition-colors hover:bg-brand-50 sm:w-auto"
                >
                  <Play className="h-4 w-4 fill-current" /> Jelajahi Fitur
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 lg:justify-start">
                {HIGHLIGHTS.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                  </span>
                ))}
              </div>

              <dl className="mx-auto mt-10 grid max-w-xl grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-4 shadow-sm backdrop-blur lg:mx-0">
                <div className="px-2">
                  <dt className="text-2xl font-black text-slate-950">4</dt>
                  <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Eksperimen inti</dd>
                </div>
                <div className="px-2">
                  <dt className="text-2xl font-black text-slate-950">3</dt>
                  <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Level representasi</dd>
                </div>
                <div className="px-2">
                  <dt className="text-2xl font-black text-slate-950">7</dt>
                  <dd className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Modul terarah</dd>
                </div>
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
              <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 via-cyan-400/10 to-violet-500/20 blur-2xl" />
              <ReactionLab3D />
              <div className="landing-float absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur sm:flex lg:-left-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Zap className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-xs font-black text-slate-900">Bukan sekadar animasi</p>
                  <p className="text-[11px] text-slate-500">Kontrol variabel dan amati perubahannya</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Satu ekosistem belajar</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Dari rasa penasaran menjadi pemahaman
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Setiap fitur dirancang untuk membantu siswa melakukan proses ilmiah secara
                runtut, visual, dan bermakna.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.tone} opacity-70`} />
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.tone} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">0{index + 1}</span>
                    <span className="h-px flex-1 bg-slate-100" />
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{feature.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="alur" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-end gap-6 lg:grid-cols-2">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Inkuiri terbimbing</span>
                <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Belajar seperti ilmuwan, selangkah demi selangkah
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600 lg:justify-self-end">
                ChemSpace tidak memberikan jawaban di awal. Siswa diarahkan untuk mengamati,
                memprediksi, mencoba, membaca bukti, lalu membangun kesimpulan sendiri.
              </p>
            </div>

            <div className="relative mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block" />
              {LEARNING_STEPS.map((step) => (
                <article key={step.no} className="relative rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-blue-500/20">
                      <step.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-2xl font-black text-slate-100">{step.no}</span>
                  </div>
                  <h3 className="mt-5 font-black text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_82%_70%,rgba(6,182,212,0.22),transparent_30%)]" />
          <div className="landing-dark-grid absolute inset-0 opacity-30" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">
                <Atom className="h-3.5 w-3.5" /> Tiga dunia, satu pemahaman
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
                Apa yang terlihat hanyalah awal.
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-slate-300">
                Amati perubahan nyata, masuk ke dunia partikel, lalu terjemahkan prosesnya
                menjadi bahasa kimia. Ketiganya tersambung dalam satu pengalaman belajar.
              </p>
              <Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition-colors hover:text-cyan-200">
                Coba pengalaman belajarnya <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Makroskopik", text: "Amati gelembung, warna, waktu, dan perubahan yang dapat diukur.", icon: FlaskConical },
                { label: "Submikroskopik", text: "Lihat gerak partikel dan syarat terjadinya tumbukan efektif.", icon: Atom },
                { label: "Simbolik", text: "Hubungkan pengamatan dengan persamaan serta perhitungan laju.", icon: GraduationCap },
              ].map((level, index) => (
                <article key={level.label} className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition-colors hover:bg-white/[0.1]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-cyan-300">
                    <level.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">Level {index + 1}</p>
                    <h3 className="mt-0.5 font-black">{level.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{level.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="untuk-siapa" className="scroll-mt-20 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Belajar dan mengajar lebih terarah</span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Dibangun untuk satu kelas yang aktif</h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <article className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-7 sm:p-8">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-200/40 blur-2xl" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-blue-500/20">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <p className="relative mt-5 text-xs font-black uppercase tracking-[0.18em] text-brand-600">Untuk siswa</p>
                <h3 className="relative mt-2 text-2xl font-black text-slate-950">Eksperimen tanpa takut salah</h3>
                <p className="relative mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Coba berbagai kondisi, ulangi simulasi, dan bangun jawaban dari data. Progres
                  tetap tersimpan agar belajar dapat dilanjutkan kapan saja.
                </p>
              </article>

              <article className="relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-7 sm:p-8">
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-200/40 blur-2xl" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-500/20">
                  <School className="h-6 w-6" />
                </span>
                <p className="relative mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Untuk guru</p>
                <h3 className="relative mt-2 text-2xl font-black text-slate-950">Pantau proses, bukan hanya nilai akhir</h3>
                <p className="relative mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Kelola kelas, lihat progres dan jawaban, atur kasus diskusi serta latihan,
                  lalu berikan penilaian dan catatan secara terpusat.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-500 px-6 py-12 text-center text-white shadow-2xl shadow-blue-900/20 sm:px-12 sm:py-16">
            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full border-[40px] border-white/5" />
            <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full border-[48px] border-white/5" />
            <div className="relative">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <FlaskConical className="h-6 w-6" />
              </span>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Siap melihat laju reaksi dengan cara yang berbeda?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
                Buat akun siswa, bergabung ke kelas, dan mulai misi laboratorium pertamamu.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-700 shadow-sm transition-colors hover:bg-blue-50 sm:w-auto"
                >
                  Daftar Sekarang <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/20 sm:w-auto"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div>
              <Link
                href="/"
                className="inline-flex rounded-2xl bg-white px-3 py-1.5 shadow-lg shadow-black/10"
                aria-label="ChemSpace Beranda"
              >
                <BrandLogo className="h-10 w-auto" />
              </Link>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
                Media pembelajaran laju reaksi berbasis inkuiri terbimbing dengan eksperimen
                virtual 3D, analisis data, dan diskusi ilmiah.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Ruang belajar digital yang terarah
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">Jelajahi</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><a href="#fitur" className="transition-colors hover:text-white">Fitur unggulan</a></li>
                <li><a href="#alur" className="transition-colors hover:text-white">Alur pembelajaran</a></li>
                <li><a href="#untuk-siapa" className="transition-colors hover:text-white">Untuk siswa & guru</a></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">Akun</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li><Link href="/login" className="transition-colors hover:text-white">Masuk</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-white">Daftar siswa</Link></li>
                <li><Link href="/forgot-password" className="transition-colors hover:text-white">Lupa password</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} ChemSpace. Pembelajaran kimia yang lebih hidup.</p>
            <p>Versi 1.2 · Laju Reaksi · Inkuiri Terbimbing</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
