import { CircleCheck, CircleX, Info, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";

/** Shared form control styles - one source of truth for dashboard inputs */
export const dashInput =
  "h-10 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all";

export const dashSelectTrigger =
  "h-10 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all";

export const dashSelectContent =
  "bg-white border-slate-200 rounded-xl shadow-xl";

export const dashPrimaryBtn =
  "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl border-0 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

export const dashGhostBtn =
  "text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-medium transition-colors";

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
    <div className={cn("mx-auto w-full space-y-5 sm:space-y-6", widthMap[width], className)}>
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <div className="mt-1.5 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
            {description}
          </div>
        )}
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
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
  ariaLabel,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  noPadding?: boolean;
  ariaLabel?: string;
}) {
  const titleId = useId();

  return (
    <section
      aria-label={!title ? ariaLabel : undefined}
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-200",
        className,
      )}
    >
      {(title || description) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-sm font-bold text-slate-900">
                {title}
              </h2>
            )}
            {description && (
              <div className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                {description}
              </div>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export function StatGrid({
  children,
  cols = 4,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
}) {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
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
  loading = false,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "default" | "success" | "danger" | "warning";
  subValue?: string;
  loading?: boolean;
}) {
  const valueTone = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "text-amber-600",
  }[tone];

  const iconTone = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    danger: "bg-red-50 text-red-600 border border-red-100",
    warning: "bg-amber-50 text-amber-600 border border-amber-100",
  }[tone];

  return (
    <article
      aria-label={loading ? `${label}: loading` : `${label}: ${value}`}
      aria-busy={loading || undefined}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105", iconTone)} aria-hidden="true">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          {loading ? (
            <span className="mt-1 block h-6 w-20 animate-pulse rounded bg-slate-100" aria-hidden="true" />
          ) : (
            <p className={cn("truncate text-xl font-bold tracking-tight tabular-nums", valueTone)}>{value}</p>
          )}
          {subValue && <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{subValue}</p>}
        </div>
      </div>
    </article>
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
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center" role="status">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 shadow-sm" aria-hidden="true">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm font-medium leading-relaxed text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({
  variant = "info",
  children,
  className,
}: {
  variant?: "info" | "warning" | "success" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    danger: "border-red-200 bg-red-50 text-red-800",
  }[variant];
  const Icon = {
    info: Info,
    warning: TriangleAlert,
    success: CircleCheck,
    danger: CircleX,
  }[variant];

  return (
    <div
      className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed", styles, className)}
      role={variant === "danger" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "The data could not be loaded. Try again in a moment.",
  action,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center" role="alert">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600" aria-hidden="true">
        <TriangleAlert className="h-5 w-5" />
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm font-medium leading-relaxed text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-2xl bg-slate-100", className)} />;
}

/** Copy text with a browser fallback for contexts where the Clipboard API is unavailable. */
// eslint-disable-next-line react-refresh/only-export-components
export async function copyText(value: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the textarea fallback below.
    }
  }

  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
  }
  return copied;
}

/** Trigger a browser download and release the object URL after the click has been handled. */
// eslint-disable-next-line react-refresh/only-export-components
export function downloadBlob(blob: Blob, filename: string): boolean {
  if (typeof document === "undefined") return false;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
