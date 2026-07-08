import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
 status: string;
 size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
 const isSmall = size === "sm";
 const iconSize = isSmall ? "h-3 w-3" : "h-3.5 w-3.5";
 const base = cn(
  "inline-flex items-center gap-1 font-mono rounded-md border px-2 py-0.5",
  isSmall ? "text-[10px]" : "text-xs"
 );

 if (status === "valid") {
  return (
   <span className={cn(base, "bg-green-50 text-green-700 border-green-200")}>
    <CheckCircle2 className={iconSize} /> Valid
   </span>
  );
 }
 if (status === "invalid") {
  return (
   <span className={cn(base, "bg-red-50 text-red-700 border-red-200")}>
    <XCircle className={iconSize} /> Invalid
   </span>
  );
 }
 return (
  <span className={cn(base, "bg-amber-50 text-amber-700 border-amber-200")}>
   <AlertTriangle className={iconSize} /> Limited
  </span>
 );
}
