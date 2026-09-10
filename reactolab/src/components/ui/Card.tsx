import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export default function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="font-bold text-slate-900 leading-snug">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
