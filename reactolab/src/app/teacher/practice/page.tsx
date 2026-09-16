"use client";

import ClassPicker from "@/components/teacher/ClassPicker";

export default function TeacherPracticeIndex() {
  return (
    <ClassPicker
      title="Latihan Soal"
      subtitle="Pilih kelas untuk mengaktifkan latihan dan menentukan bank soal default atau custom."
      targetSub="practice"
    />
  );
}
