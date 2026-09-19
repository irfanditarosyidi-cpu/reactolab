"use client";

import ClassPicker from "@/components/teacher/ClassPicker";

export default function TeacherScaffoldingIndex() {
  return (
    <ClassPicker
      title="Pengaturan Scaffolding"
      subtitle="Pilih kelas untuk mengaktifkan atau menonaktifkan pemeriksaan jawaban dan umpan balik bertahap."
      targetSub="scaffolding"
    />
  );
}
