"use client";

// Module 5 — Konfirmasi Materi (PRD §23): rate concept + interactive graph,
// rate equation, collision theory. All sections sequential, one page.

import { useMemo, useRef, useState } from "react";
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
import { Help } from "@/components/ui/forms";
import { M5_COLLISION_QUIZ, M5_EQUATION_QUIZ } from "@/lib/module-defs";
import CollisionTheoryAnimation from "@/components/module/CollisionTheoryAnimation";
import {
  BurningWoodCard,
  RustTimelapseCard,
} from "@/components/student/LearningMissionMap";
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
  const savedTime = typeof d.selectedTime === "number" ? d.selectedTime : 10;
  const savedInteractionCount =
    typeof d.interactionCount === "number" ? d.interactionCount : 0;
  const [t, setT] = useState(savedTime);
  const [hasInteracted, setHasInteracted] = useState(savedInteractionCount > 0);
  const interactionCountRef = useRef(savedInteractionCount);

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

  const handleTimeChange = (nextTime: number) => {
    setT(nextTime);
    if (readOnly) return;

    interactionCountRef.current += 1;
    setHasInteracted(true);
    updateDraft(sec.id, {
      concept5_1Viewed: true,
      interactionCount: interactionCountRef.current,
      selectedTime: nextTime,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
        <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-800 sm:text-base">
          “Ingat pertanyaan di awal tadi, kira-kira apa yang membuat reaksi kimia
          berlangsung dengan kecepatan berbeda-beda? Setelah menyelesaikan 4 misi
          laboratorium, sekarang saatnya kita jawab bersama.”
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <RustTimelapseCard />
          <BurningWoodCard />
        </div>
      </div>

      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed">
        <b>Laju reaksi</b> adalah ukuran seberapa cepat reaktan berkurang atau produk
        bertambah per satuan waktu. Secara matematis dapat dituliskan sebagai:
        <span className="mt-2 block font-mono text-base font-bold text-brand-800">
          v = +Δ[produk]/Δt &nbsp; atau &nbsp; v = −Δ[reaktan]/Δt
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="mb-2 text-xs font-bold text-slate-500">
          Grafik Konsentrasi terhadap Waktu — geser slider dan amati kedua kurva
        </p>
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
          <span className="text-blue-700">● Reaktan menurun</span>
          <span className="text-emerald-700">● Produk meningkat</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 18, left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="t"
                tick={{ fontSize: 11 }}
                height={42}
                label={{
                  value: "Waktu (s)",
                  position: "insideBottom",
                  offset: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  fill: "#475569",
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                width={58}
                label={{
                  value: "Konsentrasi (%)",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 10,
                  fontWeight: 600,
                  fill: "#475569",
                  style: { textAnchor: "middle" },
                }}
              />
              <Tooltip itemSorter={(item) => -Number(item.value ?? 0)} />
              <Line type="monotone" dataKey="A" name="[Reaktan]" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="P" name="[Produk]" stroke="#10b981" strokeWidth={2.5} dot={false} />
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
            onChange={(e) => handleTimeChange(Number(e.target.value))}
            aria-label="Waktu pengamatan reaksi"
            className="flex-1 accent-brand-600"
          />
          <div className="text-xs font-mono bg-slate-900 text-white rounded-lg px-3 py-1.5">
            t = {t}s · [reaktan] = {cur.A}% · [produk] = {cur.P}% · v ≈ {rate}/s
          </div>
        </div>
        <Help>
          Perhatikan: kemiringan kurva (laju) paling curam di awal, lalu melandai —
          laju reaksi makin kecil seiring pereaksi berkurang.
        </Help>
      </div>

      {!readOnly && (
        <>
          <Help>
            {hasInteracted
              ? "Pengamatan tersimpan. Kamu dapat melanjutkan ke materi berikutnya."
              : "Geser slider waktu minimal satu kali untuk melanjutkan."}
          </Help>
          <CompleteBtn valid={hasInteracted} secId={sec.id} />
        </>
      )}
    </div>
  );
}

// ---------- Section 2: Persamaan Laju ----------

const ORDER_GRAPH_DATA = {
  zero: [
    { concentration: 0, rate: 1 },
    { concentration: 1, rate: 1 },
    { concentration: 2, rate: 1 },
    { concentration: 3, rate: 1 },
    { concentration: 4, rate: 1 },
  ],
  one: [
    { concentration: 0, rate: 0 },
    { concentration: 1, rate: 1 },
    { concentration: 2, rate: 2 },
    { concentration: 3, rate: 3 },
    { concentration: 4, rate: 4 },
  ],
  two: [
    { concentration: 0, rate: 0 },
    { concentration: 1, rate: 1 },
    { concentration: 2, rate: 4 },
    { concentration: 3, rate: 9 },
    { concentration: 4, rate: 16 },
  ],
};

function OrderGraphCard({
  title,
  equation,
  graphNote,
  data,
  color,
}: {
  title: string;
  equation: string;
  graphNote: string;
  data: { concentration: number; rate: number }[];
  color: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-black text-slate-800">{title}</h4>
          <p className="font-mono text-xs font-semibold text-brand-700">{equation}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-600">
          v terhadap [A]
        </span>
      </div>
      <div className="mt-2 h-32" role="img" aria-label={`Grafik linear untuk ${title.toLowerCase()}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 18, left: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="concentration"
              tick={{ fontSize: 9 }}
              label={{ value: "Konsentrasi [A]", position: "insideBottom", offset: -8, fontSize: 9 }}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              labelFormatter={(value) => `[A] = ${value}`}
              formatter={(value) => [Number(value).toFixed(2), "Laju (v)"]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Laju (v)"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: color }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[11px] font-semibold text-slate-500">
        {graphNote}
      </p>
    </article>
  );
}

export function M5Equation({ sec, readOnly }: SectionProps) {
  const { drafts, updateDraft } = useEngine();
  const d = drafts[sec.id] ?? {};
  const answers = (d.quiz as Record<string, number>) ?? {};
  const allCorrect = M5_EQUATION_QUIZ.every((q, i) => answers[`q${i}`] === q.answer);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed">
        <p>
          Untuk reaksi <span className="font-mono font-bold">aA + bB → produk</span>,
          bentuk umum <b>persamaan laju reaksi</b> adalah:
        </p>
        <span className="my-3 block text-center font-mono text-xl font-black text-brand-800">
          v = k [A]<sup>m</sup> [B]<sup>n</sup>
        </span>
        <dl className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-white/80 p-3">
            <dt className="font-mono text-base font-black text-brand-800">k</dt>
            <dd className="mt-1 text-xs">
              Tetapan laju, yaitu konstanta khas suatu reaksi pada suhu tertentu.
            </dd>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <dt className="font-mono text-base font-black text-brand-800">m</dt>
            <dd className="mt-1 text-xs">Orde reaksi terhadap reaktan A.</dd>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <dt className="font-mono text-base font-black text-brand-800">n</dt>
            <dd className="mt-1 text-xs">Orde reaksi terhadap reaktan B.</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs font-semibold text-brand-900">
          Orde reaksi total = m + n. Nilai m dan n hanya dapat ditentukan melalui
          eksperimen, bukan diturunkan dari koefisien persamaan reaksi.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-black text-slate-800">
          Menentukan orde dari grafik data percobaan
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Hubungan antara konsentrasi reaktan dan laju reaksi menghasilkan bentuk grafik
          yang berbeda untuk setiap orde.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <OrderGraphCard
            title="Orde Nol"
            equation="v = k"
            graphNote="Garis horizontal: perubahan [A] tidak mengubah laju."
            data={ORDER_GRAPH_DATA.zero}
            color="#7c3aed"
          />
          <OrderGraphCard
            title="Orde Satu"
            equation="v = k[A]"
            graphNote="Garis lurus: laju sebanding dengan [A]."
            data={ORDER_GRAPH_DATA.one}
            color="#2563eb"
          />
          <OrderGraphCard
            title="Orde Dua"
            equation="v = k[A]²"
            graphNote="Kurva naik: laju sebanding dengan [A]²."
            data={ORDER_GRAPH_DATA.two}
            color="#059669"
          />
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className="text-sm font-black text-slate-800">
            Bandingkan hasil eksperimen berikut
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Kedua contoh dipasangkan untuk menunjukkan bahwa orde reaksi tidak selalu
            sama dengan koefisien pada persamaan reaksi.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="overflow-hidden rounded-xl border border-blue-200 bg-white">
            <div className="bg-blue-600 px-4 py-2 text-sm font-black text-white">
              Reaksi Kimia 1
            </div>
            <div className="space-y-3 p-4 text-sm text-slate-700">
              <p className="text-center font-mono text-base font-bold text-slate-900">
                H<sub>2</sub>(g) + I<sub>2</sub>(g) → 2HI(g)
              </p>
              <div className="rounded-lg bg-blue-50 p-3 text-xs leading-relaxed">
                <p><b>Koefisien:</b> H<sub>2</sub> = 1 dan I<sub>2</sub> = 1</p>
                <p><b>Hasil eksperimen:</b> orde H<sub>2</sub> = 1 dan orde I<sub>2</sub> = 1</p>
              </div>
              <p className="text-center font-mono text-base font-black text-blue-800">
                v = k[H<sub>2</sub>][I<sub>2</sub>]
              </p>
              <p className="text-xs text-slate-500">
                Pada contoh ini, orde reaksi kebetulan sama dengan koefisien reaksi.
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
            <div className="bg-emerald-600 px-4 py-2 text-sm font-black text-white">
              Reaksi Kimia 2
            </div>
            <div className="space-y-3 p-4 text-sm text-slate-700">
              <p className="text-center font-mono text-base font-bold text-slate-900">
                NO<sub>2</sub>(g) + CO(g) → CO<sub>2</sub>(g) + NO(g)
              </p>
              <div className="rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed">
                <p><b>Koefisien:</b> NO<sub>2</sub> = 1 dan CO = 1</p>
                <p><b>Hasil eksperimen:</b> orde NO<sub>2</sub> = 2 dan orde CO = 0</p>
              </div>
              <p className="text-center font-mono text-base font-black text-emerald-800">
                v = k[NO<sub>2</sub>]<sup>2</sup>[CO]<sup>0</sup> = k[NO<sub>2</sub>]<sup>2</sup>
              </p>
              <p className="text-xs text-slate-500">
                Walaupun koefisien keduanya 1, eksperimen menunjukkan orde NO<sub>2</sub>
                adalah 2 dan orde CO adalah 0.
              </p>
            </div>
          </article>
        </div>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-900">
          Kesimpulan: koefisien reaksi menunjukkan perbandingan stoikiometri, sedangkan
          orde reaksi menunjukkan pengaruh konsentrasi terhadap laju dan harus diperoleh
          dari data eksperimen.
        </div>
      </section>

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
  const savedEnergy = typeof d.collisionEnergy === "number" ? d.collisionEnergy : 45;
  const savedOrientation =
    typeof d.collisionOrientation === "number" ? d.collisionOrientation : 45;
  const [energy, setEnergy] = useState(savedEnergy);
  const [orientation, setOrientation] = useState(savedOrientation);
  const activationEnergy = 60;
  const idealOrientation = 0;
  const energyEnough = energy >= activationEnergy;
  const orientationCorrect = orientation === idealOrientation;
  const effective = energyEnough && orientationCorrect;

  const changeEnergy = (nextEnergy: number) => {
    setEnergy(nextEnergy);
    if (!readOnly) updateDraft(sec.id, { collisionEnergy: nextEnergy });
  };

  const changeOrientation = (nextOrientation: number) => {
    setOrientation(nextOrientation);
    if (!readOnly) updateDraft(sec.id, { collisionOrientation: nextOrientation });
  };

  const resultExplanation = effective
    ? "Energi melampaui Ea dan orientasi tepat. Kedua syarat terpenuhi, sehingga dua partikel menyatu membentuk satu partikel produk."
    : energyEnough
      ? "Energi sudah cukup, tetapi orientasinya salah. Partikel bertumbukan tanpa menghasilkan reaksi."
      : orientationCorrect
        ? "Orientasi sudah tepat, tetapi energinya belum mencapai Ea. Reaksi tetap tidak terjadi."
        : "Energi belum cukup dan orientasinya salah. Kedua syarat tumbukan efektif belum terpenuhi.";

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-slate-700 leading-relaxed">
        Menurut <b>teori tumbukan</b>, reaksi hanya terjadi jika partikel bertumbukan
        dengan <b>energi yang mencapai energi aktivasi (Ea)</b> dan memiliki{" "}
        <b>orientasi yang tepat</b>. Kedua syarat harus terpenuhi secara bersamaan.
        Energi cukup saja tidak menjamin reaksi jika orientasinya salah, begitu juga
        sebaliknya.
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-200">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-600 px-3 py-2 text-xs font-bold text-white">
          <span>Simulasi Syarat Tumbukan Efektif</span>
          <span className="flex gap-3 font-semibold">
            <span className="text-green-200">● Hijau: efektif</span>
            <span className="text-red-200">● Merah: tidak efektif</span>
          </span>
        </div>
        <div className="h-56 bg-[#071a38] sm:h-64">
          <CollisionTheoryAnimation
            energy={energy}
            orientation={orientation}
            effective={effective}
          />
        </div>
        <div className="grid gap-4 bg-brand-50 p-4 lg:grid-cols-2">
          <label className="rounded-xl border border-blue-200 bg-white p-3">
            <span className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
              <span>1. Energi partikel</span>
              <span className="rounded bg-slate-900 px-2 py-1 font-mono text-white">
                {energy} kJ/mol
              </span>
            </span>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={energy}
              onChange={(e) => changeEnergy(Number(e.target.value))}
              className="mt-3 w-full accent-blue-600"
            />
            <span className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500">
              <span>20</span>
              <span>Ambang Ea = {activationEnergy} kJ/mol</span>
              <span>100</span>
            </span>
          </label>

          <label className="rounded-xl border border-violet-200 bg-white p-3">
            <span className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
              <span>2. Penyimpangan orientasi</span>
              <span className="rounded bg-slate-900 px-2 py-1 font-mono text-white">
                {orientation}°
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={orientation}
              onChange={(e) => changeOrientation(Number(e.target.value))}
              className="mt-3 w-full accent-violet-600"
            />
            <span className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500">
              <span>0° (tepat)</span>
              <span>Orientasi tepat = {idealOrientation}°</span>
              <span>90° (salah)</span>
            </span>
          </label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className={`rounded-xl border p-3 ${
            energyEnough
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="text-xs font-black uppercase tracking-wide">Syarat Energi</p>
          <p className="mt-1 text-sm font-bold">
            {energyEnough ? "✓ Terpenuhi" : "✕ Belum terpenuhi"}
          </p>
          <p className="mt-1 font-mono text-xs">
            E = {energy} {energyEnough ? "≥" : "<"} Ea = {activationEnergy} kJ/mol
          </p>
        </div>
        <div
          className={`rounded-xl border p-3 ${
            orientationCorrect
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="text-xs font-black uppercase tracking-wide">Syarat Orientasi</p>
          <p className="mt-1 text-sm font-bold">
            {orientationCorrect ? "✓ Terpenuhi" : "✕ Belum terpenuhi"}
          </p>
          <p className="mt-1 text-xs">
            {orientationCorrect
              ? "Sisi reaktif partikel saling berhadapan."
              : "Sisi reaktif partikel tidak saling berhadapan."}
          </p>
        </div>
      </div>

      <div
        role="status"
        className={`rounded-xl border-2 p-4 text-center ${
          effective
            ? "border-green-400 bg-green-50 text-green-900"
            : "border-red-300 bg-red-50 text-red-900"
        }`}
      >
        <p className="text-base font-black">
          {effective
            ? "TUMBUKAN EFEKTIF — REAKSI TERJADI"
            : "TUMBUKAN TIDAK EFEKTIF — REAKSI TIDAK TERJADI"}
        </p>
        <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed">
          {resultExplanation}
        </p>
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
