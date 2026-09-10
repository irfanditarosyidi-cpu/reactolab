"use client";

import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseField =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 " +
  "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-semibold text-slate-700 mb-1.5", className)}
    >
      {children}
    </label>
  );
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(baseField, "min-h-[96px] leading-relaxed", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseField, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-600 mt-1.5">{children}</p>;
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-500 mt-1.5">{children}</p>;
}
