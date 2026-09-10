"use client";

// Module 5 — Konfirmasi Materi (PRD §23): rate concept + interactive graph,
// rate equation, collision theory. All sections sequential, one page.

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@/components/ui/Button";
import { Help, Label, Textarea } from "@/components/ui/forms";
import { M5_COLLISION_QUIZ, M5_EQUATION_QUIZ } from "@/lib/module-defs";
import ParticleView from "@/components/experiment/ParticleView";
import { useEngine } from "../engine";
import MCQ from "./MCQ";
import type { SectionProps } from "./InquirySections";

function CompleteBtn({
  valid,
  secId,
  label = "Simpan & Lanjut",
}: {
  valid: boolean;
  secId: string;
  label?: string;
}) {
  const { completeSection } = useEngine();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      className="mt-4"
      disabled={!valid}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await completeSection(secId);
        } finally {
          setBusy(false);
        }
      }}
    >
      {label}
    </Button>
  );
}

// ---------- Section 1: Konsep Dasar + slider waktu ----------

export function M5Concept({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft } = useEngine();
  const d = drafts[sec.id] ?? {};
  const [t, setT] = useState(10);

  const data = useMemo(() => {
    const rows: { t: number; A: number; P: number }[] = [];
    for (let x = 0; x <= 60; x += 2) {
      const A = Math.round(100 * Math.exp(-x / 18) * 10) / 10;
      rows.push({ t: x, A, P: Math.round((100 - A) * 10) / 10 });
    }
    return rows;
  }, []);
  const cur = data.reduce((best, r) => (Math.abs(r.t - t) < Math.abs(best.t - t) ? r : best), data[0]);
  const rate = Math.round(((100 * Math.exp(-t / 18)) / 18) * 100) / 100;
  const answer = (d.answer as string) ?? "";

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed">
        <b>Laju reaksi</b> adalah berkurangnya konsentrasi pereaksi (atau bertambahnya
        konsentrasi produk) tiap satuan waktu. Secara matematis untuk reaksi A → P:
        <span className="block mt-2 font-mono font-bold text-brand-800">
          v = −Δ[A]/Δt = +Δ[P]/Δt &nbsp; (satuan: M/s)
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-500 mb-2">
          Grafik Konsentrasi vs Waktu — geser slider waktu dan amati
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="t" tick={{ fontSize: 11 }} label={{ value: "t (s)", position: "insideBottomRight", offset: -2, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "[%]", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="A" name="[Pereaksi A]" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="P" name="[Produk P]" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <ReferenceDot x={cur.t} y={cur.A} r={6} fill="#2563eb" stroke="#fff" />
              <ReferenceDot x={cur.t} y={cur.P} r={6} fill="#10b981" stroke="#fff" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="range"
            min={0}
            max={60}
            step={2}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="flex-1 accent-brand-600"
          />
          <div className="text-xs font-mono bg-slate-900 text-white rounded-lg px-3 py-1.5">
            t = {t}s · [A] = {cur.A}% · [P] = {cur.P}% · v ≈ {rate}/s
          </div>
        </div>
        <Help>
          Perhatikan: kemiringan kurva (laju) paling curam di awal, lalu melandai —
          laju reaksi makin kecil seiring pereaksi berkurang.
        </Help>
      </div>

      <div>
        <Label>
          Berdasarkan grafik: mengapa laju reaksi paling besar di awal reaksi dan makin
          lama makin kecil?
        </Label>
        <Textarea
          rows={2}
          value={answer}
          disabled={readOnly}
          onChange={(e) => updateDraft(sec.id, { answer: e.target.value })}
          placeholder="Hubungkan dengan jumlah partikel pereaksi yang tersedia…"
        />
      </div>

      {!readOnly && <CompleteBtn valid={answer.trim().length >= 10} secId={sec.id} />}
    </div>
  );
}

// ---------- Section 2: Persamaan Laju ----------

export function M5Equation({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft } = useEngine();
  const d = drafts[sec.id] ?? {};
  const answers = (d.quiz as Record<string, number>) ?? {};
  const allCorrect = M5_EQUATION_QUIZ.every((q, i) => answers[`q${i}`] === q.answer);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed">
        Untuk reaksi <span className="font-mono font-bold">aA + bB → produk</span>,
        hubungan laju dengan konsentrasi dinyatakan sebagai <b>persamaan laju</b>:
        <span className="block mt-2 font-mono font-bold text-brand-800 text-base">
          v = k [A]<sup>m</sup> [B]<sup>n</sup>
        </span>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• k = tetapan laju (naik jika suhu naik / ada katalis)</li>
          <li>• m, n = orde reaksi terhadap A dan B — ditentukan dari EKSPERIMEN</li>
          <li>• m + n = orde reaksi total</li>
        </ul>
      </div>
      <div className="space-y-3">
        {M5_EQUATION_QUIZ.map((q, i) => (
          <MCQ
            key={i}
            index={i + 1}
            item={q}
            chosen={answers[`q${i}`]}
            readOnly={readOnly}
            onChoose={(c) => updateDraft(sec.id, { quiz: { ...answers, [`q${i}`]: c } })}
          />
        ))}
      </div>
      {!readOnly && (
        <>
          <CompleteBtn valid={allCorrect} secId={sec.id} />
          {!allCorrect && (
            <p className="text-xs text-slate-400 mt-2">
              Jawab ketiga soal dengan benar untuk melanjutkan.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Section 3: Teori Tumbukan ----------

export function M5Collision({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft } = useEngine();
  const d = drafts[sec.id] ?? {};
  const answers = (d.quiz as Record<string, number>) ?? {};
  const allCorrect = M5_COLLISION_QUIZ.every((q, i) => answers[`q${i}`] === q.answer);
  const [temp, setTemp] = useState(30);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed">
        Menurut <b>teori tumbukan</b>, reaksi terjadi ketika partikel pereaksi
        bertumbukan dengan <b>energi cukup (≥ energi aktivasi, Ea)</b> dan{" "}
        <b>orientasi yang tepat</b> — inilah <b>tumbukan efektif</b>. Semua faktor laju
        (konsentrasi, luas permukaan, suhu, katalis) bekerja dengan memperbanyak
        tumbukan efektif tiap detik.
      </div>

      <div className="rounded-xl border border-brand-200 overflow-hidden">
        <div className="bg-brand-600 text-white text-xs font-bold px-3 py-1.5">
          Simulasi Partikel — ubah suhu, amati frekuensi tumbukan efektif (kilat kuning)
        </div>
        <div className="h-44 bg-[#0f2a5e]">
          <ParticleView
            cfg={{ kind: "temperature", factor: temp, maxFactor: 50 }}
            width={640}
            height={176}
          />
        </div>
        <div className="bg-brand-50 px-3 py-2 flex items-center gap-3">
          <span className="text-xs font-bold text-brand-800">Suhu:</span>
          <input
            type="range"
            min={10}
            max={50}
            step={10}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="flex-1 accent-brand-600"
          />
          <span className="text-xs font-mono bg-slate-900 text-white rounded px-2 py-1">
            {temp} °C
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {M5_COLLISION_QUIZ.map((q, i) => (
          <MCQ
            key={i}
            index={i + 1}
            item={q}
            chosen={answers[`q${i}`]}
            readOnly={readOnly}
            onChoose={(c) => updateDraft(sec.id, { quiz: { ...answers, [`q${i}`]: c } })}
          />
        ))}
      </div>

      {!readOnly && (
        <>
          <CompleteBtn valid={allCorrect} secId={sec.id} label="Selesaikan Modul 5" />
          {!allCorrect && (
            <p className="text-xs text-slate-400 mt-2">
              Jawab ketiga soal dengan benar untuk menyelesaikan modul.
            </p>
          )}
        </>
      )}
    </div>
  );
}
