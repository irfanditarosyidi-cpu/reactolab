"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import OrientationVideoManager from "@/components/teacher/OrientationVideoManager";
import { Spinner } from "@/components/ui/misc";
import { listen } from "@/lib/db";
import { P } from "@/lib/paths";
import type { ClassInfo } from "@/lib/types";

export default function ClassOrientationVideosPage() {
  const { classId } = useParams<{ classId: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

  useEffect(() => {
    if (!classId) return;
    return listen<ClassInfo>(P.class(classId), setClassInfo);
  }, [classId]);

  if (!classInfo) return <Spinner label="Memuat video orientasi…" />;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Semua Kelas
        </Link>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          Video Orientasi
        </h1>
        <p className="mt-1 text-sm font-bold text-brand-700">
          {classInfo.className}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Atur video dan caption orientasi Modul 1–4 untuk kelas aktif.
        </p>
      </div>

      <OrientationVideoManager classInfo={{ ...classInfo, classId }} />
    </div>
  );
}
