"use client";

// Per-class practice bank with teacher-controlled availability and source.

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody } from "@/components/ui/Card";
import { Badge, EmptyState, ProgressBar, Spinner } from "@/components/ui/misc";
import MCQ from "@/components/module/sections/MCQ";
import { useAuth } from "@/lib/auth-context";
import { listen } from "@/lib/db";
import { PRACTICE_BANK } from "@/lib/module-defs";
import { P } from "@/lib/paths";
import type { PracticeConfig, PracticeQuestion } from "@/lib/types";

function configQuestions(config: PracticeConfig): PracticeQuestion[] {
  if (Array.isArray(config.questions)) return config.questions;
  return Object.values(
    (config.questions ?? {}) as Record<string, PracticeQuestion>
  );
}

export default function PracticePage() {
  const { profile } = useAuth();
  const classId = profile?.activeClassId ?? null;
  const [config, setConfig] = useState<PracticeConfig | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (!classId) {
      setConfig(null);
      return;
    }
    setConfig(undefined);
    return listen<PracticeConfig>(P.practiceConfig(classId), (value) => {
      setConfig(value);
      setAnswers({});
      setSession((current) => current + 1);
    });
  }, [classId]);

  // Missing settings mean an existing class has not been configured yet:
  // keep the original behavior (active + default bank).
  const enabled = config?.enabled ?? true;
  const mode = config?.mode ?? "default";
  const bank = useMemo<PracticeQuestion[]>(() => {
    if (mode === "default" || !config) return PRACTICE_BANK;
    return configQuestions(config);
  }, [config, mode]);
  const answered = Object.keys(answers).length;
  const correct = bank.filter((question, index) => answers[index] === question.answer).length;

  if (!profile) return <Spinner label="Memuat profil siswa…" />;

  if (!classId) {
    return (
      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Latihan Soal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Latihan soal mengikuti pengaturan kelas aktifmu.
          </p>
        </div>
        <Card>
          <EmptyState
            emoji="🏫"
            title="Belum tergabung dalam kelas"
            desc="Gabung ke kelas terlebih dahulu melalui Dashboard Siswa untuk mengakses latihan."
          />
        </Card>
      </div>
    );
  }

  if (config === undefined) return <Spinner label="Memuat latihan soal…" />;

  if (!enabled) {
    return (
      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Latihan Soal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ketersediaan latihan diatur oleh guru kelasmu.
          </p>
        </div>
        <Card>
          <CardBody className="py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <LockKeyhole className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-black text-slate-800">Latihan sedang dinonaktifkan</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Guru belum membuka latihan soal untuk kelas ini. Silakan kembali lagi setelah
              guru mengaktifkannya.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (bank.length === 0) {
    return (
      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Latihan Soal</h1>
          <p className="mt-1 text-sm text-slate-500">Bank soal custom sedang disiapkan guru.</p>
        </div>
        <Card>
          <EmptyState
            emoji="📝"
            title="Soal belum tersedia"
            desc="Guru sudah memilih mode custom, tetapi belum mempublikasikan soal latihan."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Latihan Soal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Uji pemahamanmu tentang laju reaksi. Jawaban salah dapat dicoba lagi sampai
            benar—lengkap dengan pembahasan.
          </p>
        </div>
        <Badge tone={mode === "custom" ? "amber" : "blue"}>
          {mode === "custom" ? "Soal dari Guru" : "Soal Default"}
        </Badge>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <ProgressBar value={(correct / bank.length) * 100} className="flex-1" />
          <span className="text-sm font-bold text-brand-700">
            {correct}/{bank.length} benar
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setAnswers({});
              setSession((current) => current + 1);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Ulangi
          </Button>
        </div>
      </div>

      <div key={session} className="space-y-4">
        {bank.map((question, index) => (
          <MCQ
            key={question.id ?? `${index}-${question.q}`}
            index={index + 1}
            item={question}
            chosen={answers[index]}
            readOnly={false}
            onChoose={(choice) =>
              setAnswers((current) => ({ ...current, [index]: choice }))
            }
          />
        ))}
      </div>

      {answered === bank.length && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <p className="text-3xl">{correct === bank.length ? "🏆" : "💪"}</p>
          <p className="mt-2 font-black text-slate-900">
            Skor akhir: {correct}/{bank.length}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {correct === bank.length
              ? "Sempurna! Kamu benar-benar memahami laju reaksi."
              : "Perbaiki jawaban yang salah sampai semua benar, ya!"}
          </p>
        </div>
      )}
    </div>
  );
}
