"use client";

// Module 0 — Orientasi Awal (PRD §17): welcome, apersepsi animations, mission map.

import { useState } from "react";
import { Flame, Target } from "lucide-react";
import Button from "@/components/ui/Button";
import { MODULES } from "@/lib/module-defs";
import { useEngine } from "../engine";
import MCQ from "./MCQ";
import type { SectionProps } from "./InquirySections";

const GOALS = [
  "Menganalisis pengaruh konsentrasi terhadap laju reaksi melalui percobaan virtual.",
  "Menganalisis pengaruh luas permukaan terhadap laju reaksi melalui percobaan virtual.",
  "Menganalisis pengaruh suhu terhadap laju reaksi melalui percobaan virtual.",
  "Menganalisis pengaruh katalis terhadap laju reaksi melalui percobaan virtual.",
];

export function M0Welcome({ sec, readOnly }: SectionProps) {
  const { studentName, completeSection } = useEngine();
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6">
        <p className="text-brand-100 text-sm font-semibold">Selamat datang di ReactoLab,</p>
        <h3 className="text-2xl font-black mt-0.5">{studentName || "Ilmuwan Muda"}! 👋</h3>
        <p className="mt-3 text-sm text-brand-50 leading-relaxed">
          Di laboratorium virtual ini kamu akan menyelidiki misteri:{" "}
          <b>mengapa ada reaksi kimia yang berlangsung sangat cepat dan ada yang sangat
          lambat?</b>{" "}
          Kamu akan bekerja seperti ilmuwan sungguhan — mengamati, berhipotesis,
          bereksperimen, dan menyimpulkan.
        </p>
      </div>
      <div className="mt-4">
        <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <Target className="h-4 w-4 text-brand-600" /> Tujuan Pembelajaran
        </p>
        <ul className="mt-2 space-y-1.5">
          {GOALS.map((g, i) => (
            <li key={i} className="text-sm text-slate-600 flex gap-2">
              <span className="text-brand-600 font-black">{i + 1}.</span> {g}
            </li>
          ))}
        </ul>
      </div>
      {!readOnly && (
        <Button
          className="mt-5"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Mulai Petualangan
        </Button>
      )}
    </div>
  );
}

const APERSEPSI_QUIZ = {
  q: "Dari dua fenomena di atas, reaksi mana yang berlangsung LEBIH CEPAT?",
  options: [
    "Besi berkarat",
    "Kayu terbakar",
    "Keduanya sama cepat",
    "Keduanya tidak bereaksi",
  ],
  answer: 1,
  explain:
    "Pembakaran kayu selesai dalam hitungan menit, sedangkan perkaratan besi butuh berhari-hari bahkan berbulan-bulan. Kecepatan reaksi inilah yang disebut LAJU REAKSI.",
};

export function M0Apersepsi({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft, completeSection } = useEngine();
  const d = drafts[sec.id] ?? {};
  const chosen = d.quiz as number | undefined;
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Amati dua peristiwa kimia dari kehidupan sehari-hari berikut:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* rusting iron — slow */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="h-36 bg-gradient-to-b from-sky-50 to-slate-100 relative flex items-end justify-center">
            <div className="relative mb-6">
              <div className="w-40 h-5 rounded-full bg-slate-400" />
              <div className="absolute top-0 left-4 w-8 h-5 rounded-full bg-orange-700/80 anim-rust" />
              <div
                className="absolute top-0 right-6 w-10 h-5 rounded-full bg-orange-800/70 anim-rust"
                style={{ animationDelay: "1.2s" }}
              />
              <div
                className="absolute top-0 left-16 w-6 h-5 rounded-full bg-amber-700/70 anim-rust"
                style={{ animationDelay: "2.1s" }}
              />
            </div>
          </div>
          <div className="p-3 bg-white">
            <p className="text-sm font-bold text-slate-800">🕰️ Besi Berkarat</p>
            <p className="text-xs text-slate-500 mt-0.5">
              4Fe + 3O₂ → 2Fe₂O₃ · berlangsung berhari-hari hingga berbulan-bulan.
            </p>
          </div>
        </div>
        {/* burning wood — fast */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="h-36 bg-gradient-to-b from-orange-50 to-slate-100 relative flex items-end justify-center">
            <div className="relative mb-5">
              <div className="w-32 h-4 rounded bg-amber-900" />
              <div className="w-24 h-4 rounded bg-amber-800 rotate-6 -mt-2 ml-6" />
              <Flame
                className="absolute -top-12 left-8 h-12 w-12 text-orange-500 anim-flame"
                fill="#fb923c"
              />
              <Flame
                className="absolute -top-9 left-16 h-9 w-9 text-red-500 anim-flame"
                fill="#f87171"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
          <div className="p-3 bg-white">
            <p className="text-sm font-bold text-slate-800">🔥 Kayu Terbakar</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Pembakaran · selesai dalam hitungan menit.
            </p>
          </div>
        </div>
      </div>

      <MCQ
        item={APERSEPSI_QUIZ}
        chosen={chosen}
        readOnly={readOnly}
        onChoose={(i) => updateDraft(sec.id, { quiz: i })}
      />

      {!readOnly && (
        <Button
          disabled={chosen !== APERSEPSI_QUIZ.answer}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Simpan &amp; Lanjut
        </Button>
      )}
    </div>
  );
}

export function M0Missions({ sec, readOnly }: SectionProps) {
  const { completeSection } = useEngine();
  const [busy, setBusy] = useState(false);
  const missions = MODULES.filter((m) => m.id >= 1 && m.id <= 4);

  return (
    <div>
      <p className="text-sm text-slate-600">
        Untuk memecahkan misteri laju reaksi, kamu akan menjalankan{" "}
        <b>empat misi penyelidikan</b>. Setiap misi menyelidiki satu faktor:
      </p>
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        {missions.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 flex items-start gap-3"
          >
            <span className="text-2xl">{m.emoji}</span>
            <div>
              <p className="text-xs font-black text-brand-600 uppercase tracking-wide">
                Misi {m.id}
              </p>
              <p className="font-bold text-slate-800 text-sm">{m.short}</p>
              <p className="text-xs text-slate-500 mt-1">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Setelah keempat misi selesai: finalisasi LKPD → konfirmasi materi → forum
        diskusi ilmiah → penutup. Progresmu tersimpan otomatis — kamu bisa berhenti dan
        melanjutkan kapan saja.
      </p>
      {!readOnly && (
        <Button
          className="mt-4"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await completeSection(sec.id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Selesaikan Orientasi &amp; Buka Misi 1
        </Button>
      )}
    </div>
  );
}
