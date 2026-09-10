"use client";

import ClassPicker from "@/components/teacher/ClassPicker";

export default function TeacherMonitoringIndex() {
  return (
    <ClassPicker
      title="Monitoring Siswa"
      subtitle="Pilih kelas yang ingin dipantau secara realtime."
      targetSub="monitoring"
    />
  );
}
