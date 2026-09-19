"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const [item, setItem] = useState<ToastItem | null>(null);
  const idRef = useRef(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((text: string, kind: ToastKind = "info") => {
    const id = idRef.current++;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setItem({ id, kind, text });
    timeoutRef.current = setTimeout(() => {
      setItem((current) => (current?.id === id ? null : current));
      timeoutRef.current = null;
    }, 4200);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[92vw] max-w-md pointer-events-none">
        {item && (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg bg-white",
              item.kind === "success" && "border-emerald-200",
              item.kind === "error" && "border-red-200",
              item.kind === "info" && "border-brand-200"
            )}
          >
            {item.kind === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
            {item.kind === "error" && (
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            {item.kind === "info" && (
              <Info className="h-5 w-5 text-brand-600 shrink-0" />
            )}
            <span className="text-slate-700">{item.text}</span>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
