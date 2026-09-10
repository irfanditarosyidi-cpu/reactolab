"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastCtx = createContext<{
  toast: (text: string, kind?: ToastKind) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    const id = idRef.current++;
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[92vw] max-w-md pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg bg-white",
              t.kind === "success" && "border-emerald-200",
              t.kind === "error" && "border-red-200",
              t.kind === "info" && "border-brand-200"
            )}
          >
            {t.kind === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
            {t.kind === "error" && <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
            {t.kind === "info" && <Info className="h-5 w-5 text-brand-600 shrink-0" />}
            <span className="text-slate-700">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
