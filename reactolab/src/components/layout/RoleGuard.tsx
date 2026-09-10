"use client";

// Protected pages are not rendered before auth state is verified (PR-AUTH-001/005).

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardPathFor, useAuth } from "@/lib/auth-context";
import { FullPageSpinner } from "@/components/ui/misc";
import type { Role } from "@/lib/types";

export default function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile && profile.role !== role) {
      router.replace(dashboardPathFor(profile.role));
    }
  }, [loading, user, profile, role, router]);

  if (loading) return <FullPageSpinner label="Memverifikasi akun…" />;
  if (!user || !profile) return <FullPageSpinner label="Mengalihkan…" />;
  if (profile.role !== role) return <FullPageSpinner label="Mengalihkan…" />;

  return <>{children}</>;
}
