"use client";

import { useEffect, useState } from "react";
import { Clapperboard, RotateCcw, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/forms";
import { useToast } from "@/components/ui/Toast";
import {
  removeOrientationMedia,
  saveOrientationMedia,
} from "@/lib/db";
import { MODULES } from "@/lib/module-defs";
import type { ClassInfo } from "@/lib/types";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type TeacherClass = ClassInfo & { classId: string };

const ORIENTATION_MODULES = MODULES.filter(
  (module) => module.id >= 1 && module.id <= 4
);

export default function OrientationVideoManager({
  classInfo,
}: {
  classInfo: TeacherClass;
}) {
  const { toast } = useToast();
  const selectedClassId = classInfo.classId;
  const [moduleId, setModuleId] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const stored = classInfo.orientationMedia?.[String(moduleId)];

  useEffect(() => {
    setYoutubeUrl(stored?.youtubeUrl ?? "");
    setCaption(stored?.caption ?? "");
  }, [moduleId, selectedClassId, stored?.youtubeUrl, stored?.caption]);

  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
  const invalidUrl = youtubeUrl.trim().length > 0 && !embedUrl;
  const captionValid = caption.trim().length > 0;

  async function handleSave() {
    if (!selectedClassId || !embedUrl || !captionValid) {
      toast("Masukkan link YouTube dan caption orientasi.", "error");
      return;
    }
    setBusy(true);
    try {
      await saveOrientationMedia(selectedClassId, moduleId, {
        youtubeUrl,
        caption,
      });
      toast(`Video orientasi Modul ${moduleId} berhasil disimpan.`, "success");
    } catch {
      toast("Video orientasi gagal disimpan.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!selectedClassId || !stored) return;
    if (!window.confirm(`Kembalikan orientasi Modul ${moduleId} ke konten bawaan?`)) {
      return;
    }
    setBusy(true);
    try {
      await removeOrientationMedia(selectedClassId, moduleId);
      toast(`Modul ${moduleId} kembali memakai konten orientasi bawaan.`, "success");
    } catch {
      toast("Pengaturan video gagal dihapus.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-brand-600" />
            Video Orientasi Modul 1–4
          </span>
        }
        subtitle="Caption tampil sebagai informasi di bawah video tanpa kolom jawaban siswa."
      />
      <CardBody className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Pilih modul</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {ORIENTATION_MODULES.map((module) => {
              const configured = Boolean(
                classInfo.orientationMedia?.[String(module.id)]?.youtubeUrl
              );
              const active = module.id === moduleId;
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setModuleId(module.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/40"
                  }`}
                >
                  <span className="block text-xs font-bold uppercase tracking-wide">
                    Modul {module.id}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold">
                    {module.short}
                  </span>
                  <span
                    className={`mt-2 inline-block text-[11px] font-semibold ${
                      configured ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {configured ? "Video terpasang" : "Konten bawaan"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="orientation-youtube">Link atau embed YouTube</Label>
              <Input
                id="orientation-youtube"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-invalid={invalidUrl}
              />
              <p
                className={`mt-1.5 text-xs ${
                  invalidUrl ? "text-red-600" : "text-slate-500"
                }`}
              >
                {invalidUrl
                  ? "Link tidak dikenali sebagai video YouTube."
                  : "Bisa berupa link tontonan, link youtu.be, link embed, atau kode iframe YouTube."}
              </p>
            </div>

            <div>
              <Label htmlFor="orientation-caption">Caption orientasi</Label>
              <Textarea
                id="orientation-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Tuliskan konteks atau petunjuk pengamatan untuk siswa…"
              />
              <p
                className={`mt-1.5 text-right text-xs ${
                  captionValid ? "text-slate-400" : "text-red-600"
                }`}
              >
                {captionValid ? `${caption.length}/500` : "Caption wajib diisi"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSave}
                loading={busy}
                disabled={!embedUrl || !captionValid}
              >
                <Save className="h-4 w-4" /> Simpan video
              </Button>
              {stored ? (
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={busy}
                >
                  <RotateCcw className="h-4 w-4" /> Konten bawaan
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Pratinjau siswa
            </p>
            <div className="relative aspect-video rounded-xl border border-slate-200 bg-slate-950 shadow-sm">
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title={`Pratinjau video orientasi Modul ${moduleId}`}
                  className="pointer-events-auto absolute inset-0 z-10 block h-full w-full touch-manipulation rounded-xl border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                  Masukkan link YouTube untuk melihat pratinjau.
                </div>
              )}
            </div>
            {caption.trim() ? (
              <p className="mt-4 whitespace-pre-line rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700">
                {caption.trim()}
              </p>
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
