"use client";

import { useEffect, useState } from "react";
import OrientationVideoManager from "@/components/teacher/OrientationVideoManager";
import { Spinner } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth-context";
import { listenTeacherClasses } from "@/lib/db";
import type { ClassInfo } from "@/lib/types";

type TeacherClass = ClassInfo & { classId: string };

export default function TeacherOrientationVideosPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return listenTeacherClasses(user.uid, setClasses);
  }, [user]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Manajemen Video Orientasi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Atur video dan caption orientasi untuk setiap modul di masing-masing kelas.
        </p>
      </div>

      {classes === null ? (
        <Spinner label="Memuat kelas…" />
      ) : (
        <OrientationVideoManager classes={classes} />
      )}
    </div>
  );
}
