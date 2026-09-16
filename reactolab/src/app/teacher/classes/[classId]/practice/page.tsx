"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { Badge, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { listen, writePath } from "@/lib/db";
import { PRACTICE_BANK } from "@/lib/module-defs";
import { P } from "@/lib/paths";
import type {
  ClassInfo,
  PracticeConfig,
  PracticeMode,
  PracticeQuestion,
} from "@/lib/types";

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

function questionId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankQuestion(): PracticeQuestion {
  return {
    id: questionId(),
    q: "",
    options: ["", "", "", "", ""],
    answer: 0,
    explain: "",
  };
}

function normalizeQuestions(questions: PracticeQuestion[] | undefined): PracticeQuestion[] {
  const values = Array.isArray(questions)
    ? questions
    : Object.values((questions ?? {}) as Record<string, PracticeQuestion>);
  return values.map((question) => ({
    id: question.id || questionId(),
    q: question.q ?? "",
    options: Array.from({ length: 5 }, (_, index) => question.options?.[index] ?? ""),
    answer:
      Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 5
        ? question.answer
        : 0,
    explain: question.explain ?? "",
  }));
}

function isQuestionComplete(question: PracticeQuestion): boolean {
  const options = question.options.map((option) => option.trim());
  return (
    question.q.trim().length >= 5 &&
    options.length === 5 &&
    options.every(Boolean) &&
    new Set(options.map((option) => option.toLocaleLowerCase("id-ID"))).size === 5 &&
    question.answer >= 0 &&
    question.answer < 5 &&
    question.explain.trim().length >= 5
  );
}

export default function TeacherPracticePage() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<PracticeMode>("default");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const stopClass = listen<ClassInfo>(P.class(classId), setClassInfo);
    const stopConfig = listen<PracticeConfig>(P.practiceConfig(classId), (config) => {
      // Existing classes have no record yet: active + default is the intended fallback.
      setEnabled(config?.enabled ?? true);
      setMode(config?.mode ?? "default");
      setQuestions(normalizeQuestions(config?.questions));
      setLoaded(true);
    });
    return () => {
      stopClass();
      stopConfig();
    };
  }, [classId]);

  const validCustomCount = useMemo(
    () => questions.filter(isQuestionComplete).length,
    [questions]
  );
  const customValid = questions.length > 0 && validCustomCount === questions.length;
  const canSave = mode === "default" || customValid || !enabled;

  const updateQuestion = (index: number, patch: Partial<PracticeQuestion>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) return question;
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      })
    );
  };

  const copyDefaultQuestions = () => {
    setQuestions(
      PRACTICE_BANK.map((question) => ({
        ...question,
        id: questionId(),
        options: [...question.options],
      }))
    );
    setMode("custom");
    toast("Soal default disalin dan siap diedit.", "success");
  };

  const save = async () => {
    if (!canSave) {
      toast("Lengkapi semua soal custom dan pastikan kelima opsi berbeda.", "error");
      return;
    }
    setSaving(true);
    try {
      await writePath(P.practiceConfig(classId), {
        enabled,
        mode,
        questions: questions.map((question) => ({
          ...question,
          q: question.q.trim(),
          options: question.options.map((option) => option.trim()),
          explain: question.explain.trim(),
        })),
        updatedAt: Date.now(),
      });
      toast("Pengaturan latihan soal berhasil disimpan.", "success");
    } catch (error) {
      console.error("Gagal menyimpan latihan soal", error);
      toast("Pengaturan latihan soal gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !classInfo) return <Spinner label="Memuat pengaturan latihan…" />;

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/classes/${classId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke {classInfo.className}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Latihan Soal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Atur ketersediaan dan bank soal untuk siswa kelas {classInfo.className}.
          </p>
        </div>
        <Button loading={saving} disabled={!canSave} onClick={() => void save()}>
          <Save className="h-4 w-4" /> Simpan Pengaturan
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Status Latihan"
          subtitle="Perubahan berlaku untuk seluruh siswa di kelas ini setelah disimpan."
          action={<Badge tone={enabled ? "green" : "red"}>{enabled ? "Aktif" : "Nonaktif"}</Badge>}
        />
        <CardBody>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((current) => !current)}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-brand-300"
          >
            <span>
              <span className="block text-sm font-bold text-slate-800">
                {enabled ? "Latihan dapat diakses siswa" : "Latihan tidak dapat diakses siswa"}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {enabled
                  ? "Siswa dapat membuka dan mengerjakan latihan dari menu Latihan Soal."
                  : "Siswa akan melihat pemberitahuan bahwa latihan sedang dinonaktifkan guru."}
              </span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                enabled ? "bg-brand-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Sumber Soal"
          subtitle="Pilih bank bawaan ReactoLab atau susun soal sendiri."
        />
        <CardBody className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("default")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              mode === "default"
                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                : "border-slate-200 hover:border-brand-300"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-black text-slate-900">Default</span>
              {mode === "default" && <Check className="h-5 w-5 text-brand-600" />}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              {PRACTICE_BANK.length} soal bawaan ReactoLab, masing-masing memiliki 5 opsi
              jawaban dan pembahasan.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              mode === "custom"
                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                : "border-slate-200 hover:border-brand-300"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-black text-slate-900">Custom</span>
              {mode === "custom" && <Check className="h-5 w-5 text-brand-600" />}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">
              Guru membuat pertanyaan, lima opsi jawaban, kunci, dan pembahasan sendiri.
            </span>
          </button>
        </CardBody>
      </Card>

      {mode === "default" ? (
        <Card>
          <CardHeader
            title={`Pratinjau Bank Default (${PRACTICE_BANK.length} soal)`}
            subtitle="Bank ini dikelola oleh sistem dan siap langsung digunakan."
          />
          <CardBody className="space-y-2">
            {PRACTICE_BANK.map((question, index) => (
              <div
                key={question.q}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-brand-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{question.q}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    5 opsi · Jawaban {OPTION_LABELS[question.answer]}: {question.options[question.answer]}
                  </p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-bold text-slate-800">Bank Soal Custom</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {validCustomCount}/{questions.length} soal lengkap. Setiap soal wajib memiliki
                  lima opsi yang berbeda.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={copyDefaultQuestions}>
                  <ClipboardCopy className="h-4 w-4" /> Salin Soal Default
                </Button>
                <Button
                  size="sm"
                  onClick={() => setQuestions((current) => [...current, blankQuestion()])}
                >
                  <Plus className="h-4 w-4" /> Tambah Soal
                </Button>
              </div>
            </CardBody>
          </Card>

          {questions.length === 0 && (
            <Card>
              <CardBody className="py-10 text-center">
                <p className="font-bold text-slate-800">Belum ada soal custom</p>
                <p className="mt-1 text-sm text-slate-500">
                  Tambahkan soal baru atau salin bank default sebagai titik awal.
                </p>
              </CardBody>
            </Card>
          )}

          {questions.map((question, questionIndex) => {
            const complete = isQuestionComplete(question);
            return (
              <Card key={question.id ?? questionIndex}>
                <CardHeader
                  title={`Soal ${questionIndex + 1}`}
                  subtitle={complete ? "Soal siap digunakan." : "Lengkapi pertanyaan, opsi, kunci, dan pembahasan."}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone={complete ? "green" : "amber"}>
                        {complete ? "Lengkap" : "Belum lengkap"}
                      </Badge>
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Hapus soal ${questionIndex + 1}`}
                        onClick={() =>
                          setQuestions((current) =>
                            current.filter((_, index) => index !== questionIndex)
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  }
                />
                <CardBody className="space-y-4">
                  <div>
                    <Label htmlFor={`question-${question.id}`}>Pertanyaan</Label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.q}
                      placeholder="Tuliskan pertanyaan latihan…"
                      onChange={(event) => updateQuestion(questionIndex, { q: event.target.value })}
                    />
                  </div>

                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-slate-700">
                      Opsi jawaban dan kunci benar
                    </legend>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                            question.answer === optionIndex
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`answer-${question.id}`}
                            aria-label={`Jadikan opsi ${OPTION_LABELS[optionIndex]} sebagai jawaban benar`}
                            checked={question.answer === optionIndex}
                            onChange={() => updateQuestion(questionIndex, { answer: optionIndex })}
                            className="h-4 w-4 accent-emerald-600"
                          />
                          <span className="w-5 text-sm font-black text-slate-500">
                            {OPTION_LABELS[optionIndex]}.
                          </span>
                          <Input
                            value={option}
                            className="bg-white"
                            aria-label={`Opsi ${OPTION_LABELS[optionIndex]} soal ${questionIndex + 1}`}
                            placeholder={`Opsi ${OPTION_LABELS[optionIndex]}`}
                            onChange={(event) =>
                              updateOption(questionIndex, optionIndex, event.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <Label htmlFor={`explain-${question.id}`}>Pembahasan jawaban</Label>
                    <Textarea
                      id={`explain-${question.id}`}
                      value={question.explain}
                      placeholder="Jelaskan mengapa jawaban tersebut benar…"
                      onChange={(event) =>
                        updateQuestion(questionIndex, { explain: event.target.value })
                      }
                    />
                  </div>
                </CardBody>
              </Card>
            );
          })}

          {questions.length > 0 && (
            <Button
              variant="secondary"
              full
              onClick={() => setQuestions((current) => [...current, blankQuestion()])}
            >
              <Plus className="h-4 w-4" /> Tambah Soal Berikutnya
            </Button>
          )}
        </div>
      )}

      {!canSave && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mode custom yang aktif membutuhkan minimal satu soal lengkap. Pastikan pertanyaan,
          lima opsi berbeda, kunci jawaban, dan pembahasan sudah terisi.
        </p>
      )}
    </div>
  );
}
