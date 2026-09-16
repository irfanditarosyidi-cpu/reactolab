"use client";

// Role-aware application shell: white sidebar + topbar (PRD §9).

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Clapperboard,
  ClipboardList,
  FlaskConical,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  MonitorCheck,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: Record<Role, NavItem[]> = {
  student: [
    { href: "/student/dashboard", label: "Dashboard Siswa", icon: LayoutDashboard },
    { href: "/student/modules", label: "Modul Pembelajaran", icon: BookOpen },
    { href: "/student/practice", label: "Latihan Soal", icon: ClipboardList },
    { href: "/student/settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { href: "/teacher/dashboard", label: "Dashboard Guru", icon: LayoutDashboard },
    { href: "/teacher/classes", label: "Kelas", icon: Users },
    { href: "/teacher/practice", label: "Latihan Soal", icon: ClipboardList },
    {
      href: "/teacher/orientation-videos",
      label: "Video Orientasi",
      icon: Clapperboard,
    },
    { href: "/teacher/monitoring", label: "Monitoring Siswa", icon: MonitorCheck },
    { href: "/teacher/discussion", label: "Forum Diskusi", icon: MessagesSquare },
    { href: "/teacher/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard Admin", icon: LayoutDashboard },
    { href: "/admin/users", label: "Pengguna", icon: Users },
    {
      href: "/admin/password-reset-requests",
      label: "Permintaan Reset Password",
      icon: KeyRound,
    },
    { href: "/admin/audit", label: "Audit Log", icon: History },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
};

function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;

  // Teacher special sub-route handling:
  // Monitoring can be /teacher/monitoring or /teacher/classes/[classId]/monitoring
  if (href === "/teacher/monitoring") {
    return (
      pathname.startsWith("/teacher/monitoring/") ||
      /\/teacher\/classes\/[^/]+\/monitoring(\/.*)?$/.test(pathname)
    );
  }

  // Forum Diskusi can be /teacher/discussion or /teacher/classes/[classId]/discussion
  if (href === "/teacher/discussion") {
    return (
      pathname.startsWith("/teacher/discussion/") ||
      /\/teacher\/classes\/[^/]+\/discussion(\/.*)?$/.test(pathname)
    );
  }

  // Practice settings can be opened from the global picker or a class detail.
  if (href === "/teacher/practice") {
    return (
      pathname.startsWith("/teacher/practice/") ||
      /\/teacher\/classes\/[^/]+\/practice(\/.*)?$/.test(pathname)
    );
  }

  // Kelas should NOT be active when viewing a feature under a class.
  if (href === "/teacher/classes") {
    if (
      /\/teacher\/classes\/[^/]+\/(monitoring|discussion|practice)(\/.*)?$/.test(pathname)
    ) {
      return false;
    }
    return pathname.startsWith("/teacher/classes/");
  }

  return pathname.startsWith(href + "/");
}

export default function AppShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = NAV[role];

  const sidebar = (
    <div className="flex flex-col h-full">
      <Link
        href={`/${role}/dashboard`}
        className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100"
      >
        <span className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
          <FlaskConical className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-black text-slate-900 leading-none">
            Reacto<span className="text-brand-600">Lab</span>
          </span>
          <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
            Laju Reaksi · {ROLE_LABEL[role]}
          </span>
        </span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile?.name} size={38} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">
              {profile?.name ?? "-"}
            </p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
          <button
            type="button"
            title="Keluar"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              type="button"
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Mobile topbar */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-black text-slate-900">
          Reacto<span className="text-brand-600">Lab</span>
        </span>
      </header>

      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
