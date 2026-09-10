"use client";

// /teacher/classes/[classId]/students → the student list lives on the class
// detail page; keep the PRD route alive via redirect.

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FullPageSpinner } from "@/components/ui/misc";

export default function StudentsRedirect() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/teacher/classes/${classId}`);
  }, [classId, router]);
  return <FullPageSpinner label="Membuka daftar siswa…" />;
}
