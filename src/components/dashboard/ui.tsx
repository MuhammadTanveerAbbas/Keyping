import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Shared form control styles - one source of truth for dashboard inputs */
export const dashInput =
 "h-10 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 font-medium transition-shadow";

export const dashSelectTrigger =
 "h-10 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium";

export const dashSelectContent =
 "bg-white border-slate-200 shadow-lg";

export const dashTextarea =
 "rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 font-medium transition-shadow";

export const dashPrimaryBtn =
 "bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg border-0 shadow-sm transition-all";

export const dashGhostBtn =
 "text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors";

const widthMap = {
 sm: "max-w-3xl",
 md: "max-w-4xl",
 lg: "max-w-5xl",
 full: "max-w-none",
} as const;

export function PageShell({
 children,
 width = "lg",
 className,
}: {
 children: ReactNode;
 width?: keyof typeof widthMap;
 className?: string;
}) {
 return (
  <div className={cn("mx-auto space-y-6", widthMap[width], className)}>
   {children}
  </div>
 );
}

export function PageHeader({
 title,
 description,
 action,
}: {
 title: string;
 description?: ReactNode;
 action?: ReactNode;
}) {
 return (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
   <div className="min-w-0">
    <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
     {title}
    </h1>
    {description && (
     <p className="mt-1 text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">
      {description}
     </p>
    )}
   </div>
   {action && <div className="shrink-0">{action}</div>}
  </div>
 );
}

export function Panel({
 title,
 description,
 children,
 className,
 headerAction,
 noPadding,
}: {
 title?: string;
 description?: ReactNode;
 children: ReactNode;
 className?: string;
 headerAction?: ReactNode;
 noPadding?: boolean;
}) {
 return (
  <section
   className={cn(
    "rounded-xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-200",
    className,
   )}
  >
   {(title || description) && (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
     <div>
      {title && (
       <h2 className="text-sm font-bold text-slate-900">
        {title}
       </h2>
      )}
      {description && (
       <p className="mt-0.5 text-xs font-medium text-slate-600">
        {description}
       </p>
      )}
     </div>
     {headerAction}
    </div>
   )}
   <div className={noPadding ? undefined : "p-5"}>{children}</div>
  </section>
 );
}

export function StatGrid({
 children,
 cols = 4,
}: {
 children: ReactNode;
 cols?: 2 | 3 | 4;
}) {
 const colClass =
  cols === 2
   ? "grid-cols-2"
   : cols === 3
    ? "grid-cols-1 sm:grid-cols-3"
    : "grid-cols-2 lg:grid-cols-4";
 return <div className={cn("grid gap-3", colClass)}>{children}</div>;
}

export function Stat({
 label,
 value,
 icon: Icon,
 tone = "default",
 subValue,
}: {
 label: string;
 value: string | number;
 icon?: LucideIcon;
 tone?: "default" | "success" | "danger" | "warning";
 subValue?: string;
}) {
 const valueTone = {
  default: "text-slate-900",
  success: "text-emerald-600",
  danger: "text-red-600",
  warning: "text-amber-600",
 }[tone];

 return (
   <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
    <div className="flex items-center gap-3">
     {Icon && (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 shadow-sm">
       <Icon className="h-5 w-5 text-slate-700" />
      </div>
     )}
     <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className={cn("text-xl font-bold tabular-nums truncate", valueTone)}>
       {value}
      </p>
      {subValue && (
       <p className="text-[11px] font-medium text-slate-500 mt-0.5">{subValue}</p>
      )}
     </div>
    </div>
   </div>
  );
}

export function EmptyState({
 icon: Icon,
 title,
 description,
 action,
}: {
 icon: LucideIcon;
 title: string;
 description?: string;
 action?: ReactNode;
}) {
 return (
   <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 shadow-sm">
     <Icon className="h-5 w-5 text-slate-500" />
    </div>
    <p className="text-sm font-bold text-slate-800">{title}</p>
    {description && (
     <p className="mt-1 text-sm font-medium text-slate-600 max-w-sm">
      {description}
     </p>
    )}
    {action && <div className="mt-4">{action}</div>}
   </div>
  );
}

export function Notice({
 variant = "info",
 children,
 className,
}: {
 variant?: "info" | "warning" | "success";
 children: ReactNode;
 className?: string;
}) {
 const styles = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
 }[variant];

 return (
  <div className={cn("rounded-lg border px-4 py-3 text-sm font-medium leading-relaxed", styles, className)}>
   {children}
  </div>
 );
}

export function SkeletonBlock({ className }: { className?: string }) {
 return (
  <div
   className={cn(
    "animate-pulse rounded-xl bg-slate-100",
    className,
   )}
  />
 );
}
