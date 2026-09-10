"use client";

import AppShell from "@/components/layout/AppShell";
import RoleGuard from "@/components/layout/RoleGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <AppShell role="admin">{children}</AppShell>
    </RoleGuard>
  );
}
