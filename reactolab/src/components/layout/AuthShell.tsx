"use client";

import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6" aria-label="ChemSpace - Beranda">
        <BrandLogo className="h-14 w-auto" priority />
      </Link>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="mt-4 text-sm text-slate-500">{footer}</div> : null}
    </div>
  );
}
