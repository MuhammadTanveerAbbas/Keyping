import { AlertTriangle, CheckCircle2, HelpCircle, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "md", className, showIcon = true }: StatusBadgeProps) {
  const isSmall = size === "sm";
  const iconSize = isSmall ? "h-3 w-3" : "h-3.5 w-3.5";
  const iconWrap = isSmall ? "h-4 w-4 rounded-full" : "h-4.5 w-4.5 rounded-full";
  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono font-semibold select-none shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    isSmall ? "text-[11px]" : "text-xs",
    className,
  );

  const variants: Record<string, { label: string; icon: LucideIcon; surface: string; iconSurface: string }> = {
    valid: {
      label: "Valid",
      icon: CheckCircle2,
      surface: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
      iconSurface: "bg-emerald-600 text-white shadow-sm",
    },
    invalid: {
      label: "Invalid",
      icon: XCircle,
      surface: "border-red-200 bg-red-50/90 text-red-700",
      iconSurface: "bg-red-600 text-white shadow-sm",
    },
    limited: {
      label: "Limited",
      icon: AlertTriangle,
      surface: "border-amber-200 bg-amber-50/90 text-amber-700",
      iconSurface: "bg-amber-600 text-white shadow-sm",
    },
    unknown: {
      label: "Unknown",
      icon: HelpCircle,
      surface: "border-slate-200 bg-slate-50 text-slate-600",
      iconSurface: "bg-slate-500 text-white shadow-sm",
    },
  };

  const normalized = (status || "").toLowerCase();
  const variant = variants[normalized] ?? variants["unknown"]!;
  const Icon = variant.icon;

  return (
    <span className={cn(base, variant.surface)}>
      {showIcon && (
        <span className={cn("flex shrink-0 items-center justify-center", iconWrap, variant.iconSurface)}>
          <Icon className={iconSize} strokeWidth={2.5} aria-hidden="true" />
        </span>
      )}
      <span className="leading-tight">{variant.label}</span>
    </span>
  );
}
