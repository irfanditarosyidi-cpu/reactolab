"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  CircleX,
  LockKeyhole,
  Plus,
  TestTube2,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/forms";
import { Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { adminFetch } from "@/lib/admin-api";
import {
  customScaffoldTerms,
  getDefaultScaffoldTerms,
  previewScaffoldAnswer,
  SCAFFOLD_FIELDS,
  type ScaffoldConfigMap,
  type ScaffoldFieldKey,
  type ScaffoldTerm,
} from "@/lib/scaffold-config";

interface ScaffoldResponse {
  ok: boolean;
  config: ScaffoldConfigMap;
}

const MODULE_LABELS: Record<number, string> = {
  1: "Konsentrasi",
  2: "Luas Permukaan",
  3: "Suhu",
  4: "Katalis",
};

export default function AdminScaffoldsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ScaffoldConfigMap | null>(null);
  const [moduleId, setModuleId] = useState(1);
  const [field, setField] = useState<ScaffoldFieldKey>("problem_independent");
  const [newTerm, setNewTerm] = useState("");
  const [preview, setPreview] = useState("");
  const [previewResult, setPreviewResult] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const result = await adminFetch<ScaffoldResponse>("/api/admin/scaffolds", {
        method: "GET",
      });
      setConfig(result.config ?? {});
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memuat konfigurasi.", "error");
      setConfig({});
    }
  }, [toast]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const moduleConfig = useMemo(
    () => config?.[String(moduleId)] ?? {},
    [config, moduleId]
  );
  const defaults = useMemo(
    () => getDefaultScaffoldTerms(moduleId, field),
    [moduleId, field]
  );
  const customEntries = useMemo(
    () =>
      Object.entries(moduleConfig[field] ?? {}).sort(
        ([, a], [, b]) => b.createdAt - a.createdAt
      ),
    [moduleConfig, field]
  );
  const customTerms = customScaffoldTerms(moduleConfig, field);
  const selectedField = SCAFFOLD_FIELDS.find((item) => item.key === field)!;
  const allTerms = [...defaults, ...customTerms];

  const changeContext = (nextModuleId: number, nextField: ScaffoldFieldKey) => {
    setModuleId(nextModuleId);
    setField(nextField);
    setNewTerm("");
    setPreview("");
    setPreviewResult(null);
  };

  const addTerm = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTerm.trim()) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/scaffolds", {
        method: "POST",
        body: { moduleId, field, text: newTerm },
      });
      setNewTerm("");
      await loadConfig();
      toast("Istilah toleransi berhasil ditambahkan.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menambahkan istilah.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTerm = async (termId: string, term: ScaffoldTerm) => {
    if (!window.confirm(`Hapus istilah tambahan “${term.text}”?`)) return;
    setDeletingId(termId);
    try {
      await adminFetch("/api/admin/scaffolds", {
        method: "DELETE",
        body: { moduleId, field, termId },
      });
      await loadConfig();
      toast("Istilah tambahan berhasil dihapus.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menghapus istilah.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (config === null) return <Spinner label="Memuat pengaturan scaffolding…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Pengaturan Scaffolding</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Tambahkan variasi kata, frasa, atau rumus yang tetap dianggap mengarah pada
          konsep yang benar. Istilah bawaan sistem tetap terlindungi.
        </p>
      </div>

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="scaffold-module">Modul</Label>
            <Select
              id="scaffold-module"
              value={moduleId}
              onChange={(event) => changeContext(Number(event.target.value), field)}
            >
              {Object.entries(MODULE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  Modul {id} — {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="scaffold-field">Bagian yang diperiksa</Label>
            <Select
              id="scaffold-field"
              value={field}
              onChange={(event) =>
                changeContext(moduleId, event.target.value as ScaffoldFieldKey)
              }
            >
              {SCAFFOLD_FIELDS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.section} — {item.label}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader
            title={`${selectedField.section} — ${selectedField.label}`}
            subtitle={selectedField.description}
          />
          <CardBody className="space-y-5">
            <section>
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-800">Istilah bawaan</h2>
                <span className="text-xs text-slate-400">({defaults.length})</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {defaults.map((term) => (
                  <span
                    key={term}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  >
                    {term}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Istilah bawaan tidak dapat dihapus dari halaman admin.
              </p>
            </section>

            <section className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-800">Istilah tambahan admin</h2>
                <span className="text-xs font-semibold text-slate-400">
                  {customEntries.length}/50
                </span>
              </div>

              <form onSubmit={addTerm} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newTerm}
                  onChange={(event) => setNewTerm(event.target.value)}
                  placeholder={
                    field === "symbolic_product"
                      ? "Contoh: gas hidrogen"
                      : "Masukkan kata atau frasa alternatif"
                  }
                  maxLength={100}
                  aria-label="Istilah toleransi baru"
                />
                <Button
                  type="submit"
                  loading={saving}
                  disabled={!newTerm.trim() || customEntries.length >= 50}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" /> Tambahkan
                </Button>
              </form>
              <p className="mt-2 text-xs text-amber-700">
                Hindari istilah yang terlalu umum karena dapat membuat jawaban tidak relevan
                ikut diterima.
              </p>

              {customEntries.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  Belum ada istilah tambahan pada bagian ini.
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {customEntries.map(([id, term]) => (
                    <li key={id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-700">
                        {term.text}
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === id}
                        disabled={Boolean(deletingId && deletingId !== id)}
                        onClick={() => void deleteTerm(id, term)}
                        aria-label={`Hapus ${term.text}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <TestTube2 className="h-4 w-4 text-brand-600" /> Uji Jawaban
              </span>
            }
            subtitle="Coba kalimat siswa dengan daftar toleransi saat ini."
          />
          <CardBody>
            <Label htmlFor="scaffold-preview">Contoh jawaban siswa</Label>
            <Input
              id="scaffold-preview"
              value={preview}
              onChange={(event) => {
                setPreview(event.target.value);
                setPreviewResult(null);
              }}
              placeholder="Ketik contoh jawaban…"
            />
            <Button
              variant="secondary"
              full
              className="mt-3"
              disabled={!preview.trim()}
              onClick={() =>
                setPreviewResult(previewScaffoldAnswer(field, preview, allTerms))
              }
            >
              Periksa Kecocokan
            </Button>

            {previewResult !== null && (
              <div
                role="status"
                className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${
                  previewResult
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {previewResult ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CircleX className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  {previewResult
                    ? "Jawaban cocok dengan salah satu istilah yang diterima."
                    : "Jawaban belum cocok dengan istilah yang tersedia."}
                </span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
