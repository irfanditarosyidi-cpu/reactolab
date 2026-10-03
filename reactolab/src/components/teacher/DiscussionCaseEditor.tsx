"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import DiscussionCasePreview from "@/components/teacher/DiscussionCasePreview";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Help, Input, Label, Textarea } from "@/components/ui/forms";
import { Badge, EmptyState, Spinner } from "@/components/ui/misc";
import ScientificTextarea, {
  type ScientificTextareaHandle,
} from "@/components/ui/ScientificTextarea";
import { useToast } from "@/components/ui/Toast";
import {
  readOnce,
  removeOrArchiveDiscussionCase,
  saveDiscussionCase,
} from "@/lib/db";
import {
  casePublishIssues,
  normalizedCase,
  sourceCitation,
} from "@/lib/discussion";
import { DISCUSSION_CASE_TEMPLATES } from "@/lib/discussion-templates";
import { P } from "@/lib/paths";
import type {
  DiscussionCase,
  DiscussionCaseScaffolding,
  DiscussionEvidence,
  DiscussionSource,
  EvidenceChartPoint,
  StakeholderPerspective,
} from "@/lib/types";

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const CASE_SCAFFOLD_FIELDS: Array<{
  key: keyof DiscussionCaseScaffolding;
  label: string;
  placeholder: string;
}> = [
  {
    key: "problemHints",
    label: "Petunjuk rumusan masalah",
    placeholder: "Contoh: Perhatikan faktor kimia yang paling menonjol pada kasus.",
  },
  {
    key: "hypothesisHints",
    label: "Petunjuk hipotesis",
    placeholder: "Contoh: Hubungkan dugaanmu dengan risiko yang dijelaskan dalam kasus.",
  },
  {
    key: "evidenceHints",
    label: "Petunjuk pemilihan data",
    placeholder: "Contoh: Bandingkan fungsi bukti ilmiah dan sosial-ekonomi.",
  },
  {
    key: "testingHints",
    label: "Petunjuk pengujian hipotesis",
    placeholder: "Contoh: Gunakan angka atau temuan pada bukti yang telah dipilih.",
  },
  {
    key: "conclusionHints",
    label: "Petunjuk kesimpulan",
    placeholder: "Contoh: Pertimbangkan manfaat dan konsekuensi solusi bagi pihak terkait.",
  },
];

function cleanScaffoldHints(
  value: DiscussionCaseScaffolding | undefined
): DiscussionCaseScaffolding {
  const clean = (hints: string[] | undefined) =>
    (hints ?? []).map((hint) => hint.trim()).filter(Boolean);
  return {
    problemHints: clean(value?.problemHints),
    hypothesisHints: clean(value?.hypothesisHints),
    evidenceHints: clean(value?.evidenceHints),
    testingHints: clean(value?.testingHints),
    conclusionHints: clean(value?.conclusionHints),
  };
}

function emptyCase(order: number): DiscussionCase {
  return {
    schemaVersion: 2,
    title: "",
    narrative: "",
    imageUrl: "",
    imageCaption: "",
    sources: [],
    phenomenonQuestion: "",
    stakeholderPerspectives: [],
    otherStakeholderPrompt:
      "Menurutmu, adakah pihak lain yang juga mempunyai kepentingan dalam kasus ini?",
    problemGuide:
      "Rangkai pertanyaanmu dari faktor kimia, risiko/dampak, dan pertimbangan sosial-ekonomi atau pihak yang kamu pilih.",
    hypothesisPrompt:
      "Tuliskan dugaan atau posisi awal beserta alasan yang merujuk rumusan masalahmu.",
    scientificEvidence: [],
    socioeconomicEvidence: [],
    evidencePrompt:
      "Pilih bukti yang relevan atau tambahkan bukti sendiri beserta asal dan alasan memilihnya. Belum perlu menilai hipotesis.",
    conclusionPrompt: "",
    scaffolding: cleanScaffoldHints(undefined),
    allowPeerReviewException: false,
    peerReviewExceptionNote: "",
    articleUrl: "",
    articleNote: "",
    question: "",
    decisionPrompt: "",
    published: false,
    order,
    createdAt: Date.now(),
  };
}

function casePayload(
  value: DiscussionCase,
  published: boolean = value.published
): DiscussionCase {
  return {
    ...value,
    scaffolding: cleanScaffoldHints(value.scaffolding),
    articleUrl: value.articleUrl || value.sources?.[0]?.url || "",
    question: value.phenomenonQuestion || value.question,
    decisionPrompt: value.conclusionPrompt || value.decisionPrompt,
    published,
    createdAt: value.createdAt ?? Date.now(),
  };
}

function SourceEditor({
  values,
  onChange,
}: {
  values: DiscussionSource[];
  onChange: (values: DiscussionSource[]) => void;
}) {
  const patch = (id: string, citation: string) =>
    onChange(
      values.map((item) =>
        item.id === id
          ? { ...item, label: citation, url: "", note: "" }
          : item
      )
    );

  return (
    <div className="space-y-3">
      {values.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <b className="text-xs text-slate-500">Sumber {index + 1}</b>
            <button
              type="button"
              aria-label={`Hapus sumber ${index + 1}`}
              onClick={() => onChange(values.filter((value) => value.id !== item.id))}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
          <Textarea
            rows={3}
            value={sourceCitation(item)}
            onChange={(event) => patch(item.id, event.target.value)}
            aria-label={`Referensi sumber ${index + 1}`}
            placeholder={'Contoh: A. A. Penulis, “Judul artikel,” Nama Jurnal, vol. 1, no. 2, pp. 1–10, 2026. [Online]. Available: https://contoh.com'}
          />
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() =>
          onChange([
            ...values,
            { id: makeId("source"), label: "", url: "", note: "" },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Tambah Sumber
      </Button>
    </div>
  );
}

function PerspectiveEditor({
  values,
  onChange,
}: {
  values: StakeholderPerspective[];
  onChange: (values: StakeholderPerspective[]) => void;
}) {
  const patch = (id: string, value: Partial<StakeholderPerspective>) =>
    onChange(values.map((item) => (item.id === id ? { ...item, ...value } : item)));

  return (
    <div className="space-y-3">
      {values.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2 flex justify-between">
            <b className="text-xs text-slate-500">Perspektif {index + 1}</b>
            <button
              type="button"
              aria-label={`Hapus perspektif ${index + 1}`}
              onClick={() => onChange(values.filter((value) => value.id !== item.id))}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
          <Input
            value={item.stakeholder}
            onChange={(event) => patch(item.id, { stakeholder: event.target.value })}
            placeholder="Nama pemangku kepentingan"
          />
          <Textarea
            className="mt-2"
            rows={2}
            value={item.argument}
            onChange={(event) => patch(item.id, { argument: event.target.value })}
            placeholder="Contoh perspektif (jelaskan bahwa ini contoh, bukan kutipan nyata)"
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          onChange([
            ...values,
            { id: makeId("perspective"), stakeholder: "", argument: "" },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Tambah Perspektif
      </Button>
    </div>
  );
}

function EvidenceEditor({
  values,
  onChange,
}: {
  values: DiscussionEvidence[];
  onChange: (values: DiscussionEvidence[]) => void;
}) {
  const patch = (id: string, value: Partial<DiscussionEvidence>) =>
    onChange(values.map((item) => (item.id === id ? { ...item, ...value } : item)));
  const patchPoint = (
    item: DiscussionEvidence,
    index: number,
    value: Partial<EvidenceChartPoint>
  ) => {
    const points = [...(item.chartPoints ?? [])];
    points[index] = { ...points[index], ...value };
    patch(item.id, { chartPoints: points });
  };

  return (
    <div className="space-y-3">
      {values.map((item, index) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-3">
          <div className="mb-2 flex justify-between">
            <b className="text-xs text-slate-500">Bukti {index + 1}</b>
            <button
              type="button"
              aria-label={`Hapus bukti ${index + 1}`}
              onClick={() => onChange(values.filter((value) => value.id !== item.id))}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
          <Input
            value={item.title}
            onChange={(event) => patch(item.id, { title: event.target.value })}
            placeholder="Judul bukti"
          />
          <Textarea
            className="mt-2"
            rows={2}
            value={item.content}
            onChange={(event) => patch(item.id, { content: event.target.value })}
            placeholder="Isi data/bukti dan batas konteksnya"
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Input
              value={item.sourceLabel ?? ""}
              onChange={(event) => patch(item.id, { sourceLabel: event.target.value })}
              placeholder="Label sumber"
            />
            <Input
              value={item.sourceUrl ?? ""}
              onChange={(event) => patch(item.id, { sourceUrl: event.target.value })}
              placeholder="URL sumber"
            />
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 p-3">
            <Label>Grafik data (opsional)</Label>
            <Input
              value={item.chartTitle ?? ""}
              onChange={(event) => patch(item.id, { chartTitle: event.target.value })}
              placeholder="Judul grafik"
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Judul sumbu X</Label>
                <Input
                  value={item.chartXAxisTitle ?? ""}
                  onChange={(event) =>
                    patch(item.id, { chartXAxisTitle: event.target.value })
                  }
                  placeholder="Contoh: Ukuran partikel"
                />
              </div>
              <div>
                <Label>Judul sumbu Y</Label>
                <Input
                  value={item.chartYAxisTitle ?? ""}
                  onChange={(event) =>
                    patch(item.id, { chartYAxisTitle: event.target.value })
                  }
                  placeholder="Contoh: Konsentrasi (g/m³)"
                />
              </div>
            </div>
            {(item.chartPoints ?? []).map((point, pointIndex) => (
              <div
                key={pointIndex}
                className="mt-2 grid grid-cols-[minmax(0,1fr)_90px] gap-2 sm:grid-cols-[1fr_100px_90px_auto]"
              >
                <Input
                  value={point.label}
                  onChange={(event) =>
                    patchPoint(item, pointIndex, { label: event.target.value })
                  }
                  placeholder="Label sumbu X"
                />
                <Input
                  type="number"
                  value={point.value}
                  onChange={(event) =>
                    patchPoint(item, pointIndex, { value: Number(event.target.value) })
                  }
                  placeholder="Nilai sumbu Y"
                />
                <Input
                  value={point.unit ?? ""}
                  onChange={(event) =>
                    patchPoint(item, pointIndex, { unit: event.target.value })
                  }
                  placeholder="Satuan"
                />
                <button
                  type="button"
                  aria-label={`Hapus titik data ${pointIndex + 1}`}
                  onClick={() =>
                    patch(item.id, {
                      chartPoints: (item.chartPoints ?? []).filter(
                        (_, currentIndex) => currentIndex !== pointIndex
                      ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
            <Button
              className="mt-2"
              size="sm"
              variant="ghost"
              onClick={() =>
                patch(item.id, {
                  chartPoints: [
                    ...(item.chartPoints ?? []),
                    { label: "", value: 0, unit: "" },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4" /> Titik Data
            </Button>
          </div>
        </div>
      ))}
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          onChange([
            ...values,
            {
              id: makeId("evidence"),
              title: "",
              content: "",
              sourceLabel: "",
              sourceUrl: "",
              chartPoints: [],
            },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Tambah Bukti
      </Button>
    </div>
  );
}

function EditorSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        className="rounded-t-2xl border-b border-brand-200 bg-brand-50"
        title={<span className="text-brand-800">{title}</span>}
        subtitle={
          subtitle ? <span className="text-brand-700/80">{subtitle}</span> : undefined
        }
      />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export default function DiscussionCaseEditor({
  classId,
  caseId,
  templateId,
}: {
  classId: string;
  caseId: string;
  templateId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const narrativeEditorRef = useRef<ScientificTextareaHandle>(null);
  const [form, setForm] = useState<DiscussionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const isNew = caseId === "new";
  const listHref = `/teacher/classes/${classId}/discussion`;

  useEffect(() => {
    let active = true;

    const loadCase = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const cases =
          (await readOnce<Record<string, DiscussionCase>>(P.cases(classId))) ?? {};
        if (!active) return;

        if (!isNew) {
          const existing = cases[caseId];
          if (!existing) {
            setLoadError("Studi kasus tidak ditemukan atau sudah dihapus.");
            return;
          }
          setForm(normalizedCase(existing));
          return;
        }

        const nextOrder =
          Math.max(
            0,
            ...Object.values(cases)
              .filter((item) => !item.archivedAt)
              .map((item) => item.order ?? 0)
          ) + 1;
        const template = templateId
          ? DISCUSSION_CASE_TEMPLATES.find((item) => item.templateId === templateId)
          : undefined;

        if (template) {
          const { templateId: _templateId, templateLabel: _templateLabel, ...value } =
            template;
          setForm(
            normalizedCase({
              ...JSON.parse(JSON.stringify(value)),
              published: false,
              order: nextOrder,
              createdAt: Date.now(),
            } as DiscussionCase)
          );
        } else {
          setForm(emptyCase(nextOrder));
        }
      } catch {
        if (active) setLoadError("Studi kasus gagal dimuat. Silakan coba lagi.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCase();
    return () => {
      active = false;
    };
  }, [caseId, classId, isNew, templateId]);

  const insertNarrativeScript = (script: "subscript" | "superscript") => {
    narrativeEditorRef.current?.formatSelection(script);
  };

  const saveCase = async () => {
    if (!form) return;
    if (!form.title.trim()) {
      toast("Judul kasus harus diisi.", "error");
      return;
    }

    const issues = casePublishIssues(form);
    const payload = casePayload(form, form.published && issues.length === 0);

    setBusy(true);
    try {
      await saveDiscussionCase(classId, payload, isNew ? undefined : caseId);
      toast(
        form.published && issues.length
          ? `Kasus disimpan sebagai draft karena belum lengkap: ${issues.join(", ")}.`
          : isNew
            ? "Kasus dibuat sebagai draft."
            : "Kasus diperbarui.",
        form.published && issues.length ? "error" : "success"
      );
      router.replace(listHref);
    } catch {
      toast("Gagal menyimpan kasus.", "error");
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async () => {
    if (!form || isNew) return;
    const publishing = !form.published;
    const publishIssues = casePublishIssues(form);

    if (publishing && publishIssues.length > 0) {
      toast(
        `Belum dapat diterbitkan. Lengkapi: ${publishIssues.join(", ")}.`,
        "error"
      );
      return;
    }

    setBusy(true);
    try {
      const payload = casePayload(form, publishing);
      await saveDiscussionCase(classId, payload, caseId);
      setForm(normalizedCase(payload));
      toast(
        publishing
          ? "Kasus diterbitkan ke Modul 5."
          : "Kasus disembunyikan dari siswa.",
        "success"
      );
    } catch {
      toast("Status publikasi kasus gagal diperbarui.", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeCase = async () => {
    if (!form || isNew) return;
    if (form.defaultKey) {
      toast(
        "Kasus bawaan tidak dapat dihapus. Anda tetap dapat menyembunyikannya dari siswa.",
        "error"
      );
      return;
    }
    if (
      !window.confirm(
        `Hapus atau arsipkan kasus “${form.title}”? Kasus yang sudah memiliki respons akan diarsipkan.`
      )
    )
      return;

    setBusy(true);
    try {
      const result = await removeOrArchiveDiscussionCase(classId, {
        ...casePayload(form, false),
        id: caseId,
      });
      toast(
        result === "archived"
          ? "Kasus diarsipkan karena sudah memiliki respons siswa."
          : "Kasus draft dihapus.",
        "success"
      );
      router.replace(listHref);
    } catch {
      toast("Gagal menghapus atau mengarsipkan kasus.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Memuat editor studi kasus…" />;

  if (loadError || !form) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            emoji="⚠️"
            title="Editor tidak dapat dibuka"
            desc={loadError || "Data studi kasus tidak tersedia."}
            action={
              <Button onClick={() => router.replace(listHref)}>
                <ArrowLeft className="h-4 w-4" /> Kembali ke Studi Kasus
              </Button>
            }
          />
        </CardBody>
      </Card>
    );
  }

  const issues = casePublishIssues(form);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-[240px] flex-1">
          <Link
            href={listHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Studi Kasus
          </Link>
          <h1 className="mt-1.5 text-2xl font-black text-slate-900">
            {isNew ? "Buat Studi Kasus" : "Kelola Studi Kasus"}
          </h1>
          {form.defaultKey && (
            <Badge tone="slate" className="mt-2">
              Kasus Bawaan
            </Badge>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {isNew
              ? "Susun kasus baru dan periksa pratinjau siswa sebelum menyimpannya."
              : `Mengatur kasus: ${form.title || "Tanpa judul"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.replace(listHref)}>
            Batal
          </Button>
          <Button loading={busy} disabled={!form.title.trim()} onClick={() => void saveCase()}>
            <Save className="h-4 w-4" /> Simpan Kasus
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
        <div className="space-y-5">
          <EditorSection title="Identitas dan Orientasi">
            <div>
              <Label>Judul kasus</Label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, title: event.target.value } : current
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="case-narrative">Narasi kasus</Label>
              <ScientificTextarea
                ref={narrativeEditorRef}
                id="case-narrative"
                rows={6}
                value={form.narrative ?? ""}
                onValueChange={(narrative) =>
                  setForm((current) => (current ? { ...current, narrative } : current))
                }
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertNarrativeScript("subscript")}
                >
                  Subskrip H<sub>2</sub>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertNarrativeScript("superscript")}
                >
                  Superskrip x<sup>2</sup>
                </Button>
              </div>
              <Help>
                Blok teks lalu pilih tombol format. Hasil subskrip atau superskrip
                langsung terlihat di kolom narasi.
              </Help>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>URL foto</Label>
                <Input
                  value={form.imageUrl ?? ""}
                  onChange={(event) =>
                    setForm((current) =>
                      current ? { ...current, imageUrl: event.target.value } : current
                    )
                  }
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label>Caption foto</Label>
                <Input
                  value={form.imageCaption ?? ""}
                  onChange={(event) =>
                    setForm((current) =>
                      current ? { ...current, imageCaption: event.target.value } : current
                    )
                  }
                  placeholder="Keterangan singkat foto"
                />
              </div>
            </div>
            <div>
              <Label>Pertanyaan pemantik</Label>
              <Textarea
                rows={2}
                value={form.phenomenonQuestion ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          phenomenonQuestion: event.target.value,
                          question: event.target.value,
                        }
                      : current
                  )
                }
              />
            </div>
            <div>
              <Label>Pertanyaan pihak lain</Label>
              <Textarea
                rows={2}
                value={form.otherStakeholderPrompt ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? { ...current, otherStakeholderPrompt: event.target.value }
                      : current
                  )
                }
              />
            </div>
          </EditorSection>

          <EditorSection
            title="Sumber Kasus"
            subtitle="Satu kotak untuk satu sumber. Tulis referensi mengikuti format IEEE; nomor [1], [2], dan seterusnya ditambahkan otomatis."
          >
            <SourceEditor
              values={form.sources ?? []}
              onChange={(sources) =>
                setForm((current) =>
                  current ? { ...current, bibliography: "", sources } : current
                )
              }
            />
          </EditorSection>

          <EditorSection
            title="Contoh Perspektif Pemangku Kepentingan"
            subtitle="Nyatakan sebagai contoh perspektif, bukan kutipan nyata, kecuali memang bersumber."
          >
            <PerspectiveEditor
              values={form.stakeholderPerspectives ?? []}
              onChange={(stakeholderPerspectives) =>
                setForm((current) =>
                  current ? { ...current, stakeholderPerspectives } : current
                )
              }
            />
          </EditorSection>

          <EditorSection title="Panduan Penalaran">
            <div>
              <Label>Panduan rumusan masalah</Label>
              <Textarea
                rows={2}
                value={form.problemGuide ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, problemGuide: event.target.value } : current
                  )
                }
              />
            </div>
            <div>
              <Label>Panduan hipotesis</Label>
              <Textarea
                rows={2}
                value={form.hypothesisPrompt ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, hypothesisPrompt: event.target.value } : current
                  )
                }
              />
            </div>
            <div>
              <Label>Panduan pemilihan bukti</Label>
              <Textarea
                rows={2}
                value={form.evidencePrompt ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, evidencePrompt: event.target.value } : current
                  )
                }
              />
            </div>
            <div>
              <Label>Prompt kesimpulan/keputusan</Label>
              <Textarea
                rows={2}
                value={form.conclusionPrompt ?? ""}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          conclusionPrompt: event.target.value,
                          decisionPrompt: event.target.value,
                        }
                      : current
                  )
                }
              />
            </div>
          </EditorSection>

          <EditorSection
            title="Scaffolding Siswa"
            subtitle="Petunjuk muncul bertahap sebagai peringatan dan tidak menghalangi siswa melanjutkan. Tulis satu tingkat petunjuk per baris."
          >
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-900">
              Sistem tetap melakukan pemeriksaan struktur secara otomatis. Petunjuk
              berikut digunakan berurutan ketika jawaban masih perlu diperjelas dan
              tidak berfungsi sebagai kunci benar-salah.
            </div>
            {CASE_SCAFFOLD_FIELDS.map((field) => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Textarea
                  rows={3}
                  value={(form.scaffolding?.[field.key] ?? []).join("\n")}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            scaffolding: {
                              ...current.scaffolding,
                              [field.key]: event.target.value.split(/\r?\n/),
                            },
                          }
                        : current
                    )
                  }
                  placeholder={field.placeholder}
                />
                <Help>
                  Baris pertama untuk peringatan awal; baris berikutnya muncul pada
                  percobaan selanjutnya. Kosongkan untuk memakai petunjuk bawaan.
                </Help>
              </div>
            ))}
          </EditorSection>

          <EditorSection title="Data Ilmiah dan Grafik">
            <EvidenceEditor
              values={form.scientificEvidence ?? []}
              onChange={(scientificEvidence) =>
                setForm((current) =>
                  current ? { ...current, scientificEvidence } : current
                )
              }
            />
          </EditorSection>

          <EditorSection title="Data Sosial-Ekonomi">
            <EvidenceEditor
              values={form.socioeconomicEvidence ?? []}
              onChange={(socioeconomicEvidence) =>
                setForm((current) =>
                  current ? { ...current, socioeconomicEvidence } : current
                )
              }
            />
          </EditorSection>

          <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <label className="flex items-start gap-2 text-sm font-semibold text-sky-900">
              <input
                type="checkbox"
                className="mt-1 accent-brand-600"
                checked={Boolean(form.allowPeerReviewException)}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? { ...current, allowPeerReviewException: event.target.checked }
                      : current
                  )
                }
              />
              Izinkan pengecualian eksplisit bila dua penulis teman belum tersedia
            </label>
            {form.allowPeerReviewException && (
              <div className="mt-3">
                <Label>Alasan/catatan pengecualian</Label>
                <Textarea
                  rows={2}
                  value={form.peerReviewExceptionNote ?? ""}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, peerReviewExceptionNote: event.target.value }
                        : current
                    )
                  }
                />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-4">
          <DiscussionCasePreview discussionCase={form} />
          {issues.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <b>Komponen sebelum terbit:</b> {issues.join(", ")}.
            </div>
          )}
          {!isNew && (
            <Card>
              <CardHeader
                title="Pengelolaan Kasus"
                subtitle={
                  form.published
                    ? "Kasus sedang terlihat oleh siswa."
                    : "Kasus masih berupa draft."
                }
              />
              <CardBody className="space-y-2">
                <Button
                  full
                  variant={form.published ? "secondary" : "primary"}
                  loading={busy}
                  onClick={() => void togglePublish()}
                >
                  {form.published ? (
                    <>
                      <EyeOff className="h-4 w-4" /> Sembunyikan dari Siswa
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" /> Terbitkan ke Siswa
                    </>
                  )}
                </Button>
                {form.defaultKey ? (
                  <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    Kasus bawaan dapat diedit atau disembunyikan, tetapi tidak
                    dapat dihapus agar kelas selalu memiliki materi siap pakai.
                  </p>
                ) : (
                  <Button
                    full
                    variant="danger"
                    disabled={busy}
                    onClick={() => void removeCase()}
                  >
                    <Trash2 className="h-4 w-4" /> Hapus atau Arsipkan Kasus
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </aside>
      </div>

      <div className="sticky bottom-4 z-20 ml-auto flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur">
        <Button variant="secondary" onClick={() => router.replace(listHref)}>
          Batal
        </Button>
        <Button loading={busy} disabled={!form.title.trim()} onClick={() => void saveCase()}>
          <Save className="h-4 w-4" /> Simpan Kasus
        </Button>
      </div>
    </div>
  );
}
