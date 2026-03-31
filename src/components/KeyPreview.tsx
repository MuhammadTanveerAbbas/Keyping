import { cn } from "@/lib/utils";

interface KeyPreviewProps {
  keyString: string;
  className?: string;
}

export function KeyPreview({ keyString, className }: KeyPreviewProps) {
  const last4 = keyString.slice(-4);
  const masked = "••••••••••••";
  return (
    <span className={cn("font-mono text-sm text-slate-500", className)}>
      {masked}
      <span className="text-slate-300">{last4}</span>
    </span>
  );
}
