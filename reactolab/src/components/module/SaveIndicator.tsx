"use client";

// Lightweight save-status indicator (PR-LEARN-SAVE-006).

import { CheckCircle2, CloudUpload, RefreshCw } from "lucide-react";
import { useEngine } from "./engine";
import { cn } from "@/lib/utils";

export default function SaveIndicator() {
  const { saveState, retrySave } = useEngine();
  if (saveState === "idle") return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border bg-white px-3.5 py-2 text-xs font-semibold shadow-lg",
        saveState === "saving" && "border-brand-200 text-brand-700",
        saveState === "saved" && "border-emerald-200 text-emerald-700",
        saveState === "error" && "border-red-200 text-red-700"
      )}
    >
      {saveState === "saving" && (
        <>
          <CloudUpload className="h-4 w-4 animate-pulse" /> Menyimpan…
        </>
      )}
      {saveState === "saved" && (
        <>
          <CheckCircle2 className="h-4 w-4" /> Tersimpan
        </>
      )}
      {saveState === "error" && (
        <>
          Gagal menyimpan
          <button
            type="button"
            onClick={retrySave}
            className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2.5 py-1 hover:bg-red-700"
          >
            <RefreshCw className="h-3 w-3" /> Coba lagi
          </button>
        </>
      )}
    </div>
  );
}
