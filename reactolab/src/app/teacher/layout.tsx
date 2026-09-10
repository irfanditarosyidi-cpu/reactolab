"use client";

import AppShell from "@/components/layout/AppShell";
import RoleGuard from "@/components/layout/RoleGuard";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="teacher">
      <AppShell role="teacher">{children}</AppShell>
    </RoleGuard>
  );
}
