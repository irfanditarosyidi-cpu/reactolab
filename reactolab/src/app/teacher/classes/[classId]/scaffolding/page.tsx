"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, Spinner } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { listen, writePath } from "@/lib/db";
import { P } from "@/lib/paths";
import type { ClassInfo, ScaffoldSettings } from "@/lib/types";

export default function TeacherScaffoldingPage() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const stopClass = listen<ClassInfo>(P.class(classId), setClassInfo);
    const stopSettings = listen<ScaffoldSettings>(
      P.scaffoldSetting(classId),
      (settings) => {
        setEnabled(settings?.enabled ?? true);
        setLoaded(true);
      }
    );
    return () => {
      stopClass();
      stopSettings();
    };
  }, [classId]);

  const save = async () => {
    setSaving(true);
    try {
      await writePath(P.scaffoldSetting(classId), {
        enabled,
        updatedAt: Date.now(),
      } satisfies ScaffoldSettings);
      toast("Pengaturan scaffolding berhasil disimpan.", "success");
    } catch (error) {
      console.error("Gagal menyimpan pengaturan scaffolding", error);
      toast("Pengaturan scaffolding gagal disimpan.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !classInfo) {
    return <Spinner label="Memuat pengaturan scaffolding…" />;
  }

  return (
    <div className="space-y-5">
      <Link
        href="/teacher/classes"
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Kelas
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">Pengaturan Scaffolding</h1>
          <p className="mt-1 text-sm font-bold text-brand-700">
            {classInfo.className}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Atur pemeriksaan jawaban dan umpan balik untuk siswa kelas aktif.
          </p>
        </div>
        <Button loading={saving} onClick={() => void save()}>
          <Save className="h-4 w-4" /> Simpan Pengaturan
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Status Scaffolding"
          subtitle="Perubahan berlaku untuk seluruh siswa di kelas ini."
          action={
            <Badge tone={enabled ? "green" : "red"}>
              {enabled ? "Aktif" : "Nonaktif"}
            </Badge>
          }
        />
        <CardBody className="space-y-4">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((current) => !current)}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-brand-300"
          >
            <span>
              <span className="block text-sm font-bold text-slate-800">
                {enabled
                  ? "Pemeriksaan jawaban dan petunjuk diaktifkan"
                  : "Pemeriksaan jawaban dan petunjuk dinonaktifkan"}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                {enabled
                  ? "Sistem memeriksa jawaban dan memberikan peringatan serta petunjuk bertahap. Siswa tetap dapat melanjutkan."
                  : "Siswa dapat melanjutkan setelah mengisi jawaban minimum, tanpa validasi konsep dan umpan balik otomatis."}
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

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Pengaturan ini berlaku pada <b>Rumusan Masalah</b>, <b>Hipotesis</b>,
            <b> Representasi Simbolik</b>, <b>Uji Hipotesis</b>, dan <b>Kesimpulan</b>
            di Modul 1–4, serta rangkaian studi kasus di <b>Modul 5</b>. Scaffolding
            hanya berupa peringatan dan tidak mengunci tahap berikutnya. Jika belum
            pernah diatur, scaffolding otomatis aktif.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
