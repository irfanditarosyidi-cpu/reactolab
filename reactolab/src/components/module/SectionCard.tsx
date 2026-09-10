"use client";

// Vertical section card with locked / active / completed states (PRD §10.4, §29.2).
// No clickable step navigation — order is enforced by the engine.

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SectionCard({
  id,
  index,
  title,
  status,
  children,
}: {
  id: string;
  index: number;
  title: string;
  status: "locked" | "active" | "completed";
  children: React.ReactNode;
}) {
  const [reopened, setReopened] = useState(false);

  return (
    <section
      id={`sec-${id}`}
      className={cn(
        "rounded-2xl border bg-white shadow-card scroll-mt-24 transition-colors",
        status === "active" && "border-brand-300 ring-1 ring-brand-200",
        status === "completed" && "border-emerald-200",
        status === "locked" && "border-slate-200 opacity-80"
      )}
    >
      <header className="flex items-center gap-3 px-5 py-4">
        <span
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-black shrink-0",
            status === "active" && "bg-brand-600 text-white",
            status === "completed" && "bg-emerald-500 text-white",
            status === "locked" && "bg-slate-200 text-slate-500"
          )}
        >
          {status === "completed" ? (
            <Check className="h-4 w-4" />
          ) : status === "locked" ? (
            <Lock className="h-3.5 w-3.5" />
          ) : (
            index
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Bagian {index}
          </p>
          <h2 className="font-bold text-slate-900 leading-snug">{title}</h2>
        </div>
        {status === "completed" && (
          <button
            type="button"
            onClick={() => setReopened((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 hover:bg-emerald-100"
          >
            {reopened ? (
              <>
                Tutup <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Lihat Kembali <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
        {status === "locked" && (
          <span className="text-xs font-semibold text-slate-400 hidden sm:block">
            Terkunci
          </span>
        )}
      </header>

      {status === "active" && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>
      )}
      {status === "completed" && reopened && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>
      )}
      {status === "locked" && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-sm text-slate-400">
            Selesaikan bagian sebelumnya untuk membuka bagian ini.
          </p>
        </div>
      )}
    </section>
  );
}
