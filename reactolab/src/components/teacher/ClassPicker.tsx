"use client";

// Sidebar entries "Monitoring Siswa" / "Forum Diskusi" land here: pick a class
// (auto-forward when the teacher has exactly one class).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Card, { CardBody } from "@/components/ui/Card";
import { EmptyState, Spinner } from "@/components/ui/misc";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { listenTeacherClasses } from "@/lib/db";
import type { ClassInfo } from "@/lib/types";

export default function ClassPicker({
  title,
  subtitle,
  targetSub,
}: {
  title: string;
  subtitle: string;
  targetSub: "monitoring" | "discussion";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Array<ClassInfo & { classId: string }> | null>(null);

  useEffect(() => {
    if (!user) return;
    return listenTeacherClasses(user.uid, setClasses);
  }, [user]);

  useEffect(() => {
    if (classes && classes.length === 1) {
      router.replace(`/teacher/classes/${classes[0].classId}/${targetSub}`);
    }
  }, [classes, router, targetSub]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>
      {classes === null ? (
        <Spinner label="Memuat kelas…" />
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🏫"
            title="Belum ada kelas"
            desc="Buat kelas terlebih dahulu di menu Kelas."
            action={
              <Link href="/teacher/classes">
                <Button>Ke Menu Kelas</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {classes.map((c) => (
            <Link key={c.classId} href={`/teacher/classes/${c.classId}/${targetSub}`}>
              <Card className="hover:border-brand-400 transition-colors">
                <CardBody className="flex items-center gap-3">
                  <span className="text-xl">🏫</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{c.className}</p>
                    <p className="text-xs text-slate-400">Kode: {c.classCode}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
