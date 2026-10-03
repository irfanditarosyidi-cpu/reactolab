"use client";

// Keep the legacy students route alive by forwarding it to class monitoring.

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FullPageSpinner } from "@/components/ui/misc";

export default function StudentsRedirect() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/teacher/classes/${classId}/monitoring`);
  }, [classId, router]);
  return <FullPageSpinner label="Membuka Monitoring Siswa..." />;
}
