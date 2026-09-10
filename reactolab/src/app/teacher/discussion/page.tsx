"use client";

import ClassPicker from "@/components/teacher/ClassPicker";

export default function TeacherDiscussionIndex() {
  return (
    <ClassPicker
      title="Forum Diskusi"
      subtitle="Pilih kelas untuk mengelola studi kasus, forum CER, dan kesimpulan."
      targetSub="discussion"
    />
  );
}
