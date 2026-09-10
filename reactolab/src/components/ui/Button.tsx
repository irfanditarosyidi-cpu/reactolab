"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
}

const variantCls: Record<Variant, string> = {
  // PRD §11: primary solid blue, secondary white w/ blue border
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm disabled:bg-slate-300 disabled:text-slate-500",
  secondary:
    "bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 active:bg-brand-100 disabled:text-slate-400 disabled:border-slate-200 disabled:bg-slate-50",
  ghost:
    "bg-transparent text-brand-700 hover:bg-brand-50 disabled:text-slate-400",
  danger:
    "bg-white text-red-600 border border-red-300 hover:bg-red-50 disabled:text-slate-400 disabled:border-slate-200",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500",
};

const sizeCls: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3 rounded-xl gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  full = false,
  className,
  children,
  disabled,
  type,
  ...rest
}: Props) {
  return (
    <button
      type={type ?? "button"}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed",
        variantCls[variant],
        sizeCls[size],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
