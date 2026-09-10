"use client";

// Latihan Soal — practice quiz bank with instant feedback (local session state).

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/misc";
import MCQ from "@/components/module/sections/MCQ";
import { PRACTICE_BANK } from "@/lib/module-defs";

export default function PracticePage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [session, setSession] = useState(0);

  const bank = useMemo(() => PRACTICE_BANK, []);
  const answered = Object.keys(answers).length;
  const correct = bank.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Latihan Soal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Uji pemahamanmu tentang laju reaksi. Jawaban salah dapat dicoba lagi sampai
          benar — lengkap dengan pembahasan.
        </p>
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
              setSession((s) => s + 1);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Ulangi
          </Button>
        </div>
      </div>

      <div key={session} className="space-y-4">
        {bank.map((q, i) => (
          <MCQ
            key={i}
            index={i + 1}
            item={q}
            chosen={answers[i]}
            readOnly={false}
            onChoose={(c) => setAnswers((a) => ({ ...a, [i]: c }))}
          />
        ))}
      </div>

      {answered === bank.length && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <p className="text-3xl">{correct === bank.length ? "🏆" : "💪"}</p>
          <p className="mt-2 font-black text-slate-900">
            Skor akhir: {correct}/{bank.length}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {correct === bank.length
              ? "Sempurna! Kamu benar-benar memahami laju reaksi."
              : "Perbaiki jawaban yang salah sampai semua benar, ya!"}
          </p>
        </div>
      )}
    </div>
  );
}
