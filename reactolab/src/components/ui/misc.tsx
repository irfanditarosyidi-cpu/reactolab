"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "blue" | "green" | "amber" | "slate" | "red" | "sky";

const toneCls: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-700 border-brand-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        toneCls[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function moduleStatusTone(status: string): Tone {
  switch (status) {
    case "completed":
      return "green";
    case "in_progress":
      return "amber";
    case "unlocked":
      return "blue";
    default:
      return "slate";
  }
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn("h-2.5 w-full rounded-full bg-slate-100 overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full bg-brand-600 transition-all", barClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500 py-10">
      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function FullPageSpinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
      <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-lg shadow-card">
        R
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> {label}
      </div>
    </div>
  );
}

export function EmptyState({
  emoji = "📭",
  title,
  desc,
  action,
}: {
  emoji?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-bold text-slate-800">{title}</h3>
      {desc ? <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{desc}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Avatar({ name, size = 40 }: { name?: string | null; size?: number }) {
  const init = (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {init || "?"}
    </div>
  );
}
