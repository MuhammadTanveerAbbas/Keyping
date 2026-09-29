import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HealthScoreRingProps {
 score: number;
 size?: number;
 strokeWidth?: number;
 className?: string;
}

export function HealthScoreRing({ score, size = 100, strokeWidth = 8, className }: HealthScoreRingProps) {
 const safeScore = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
 const radius = (size - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference - (safeScore / 100) * circumference;
 const ringRef = useRef<SVGCircleElement>(null);

 const strokeColor =
  safeScore >= 80 ? "#22C55E" :
  safeScore >= 50 ? "#F59E0B" :
  "#EF4444";

 const glowColor =
  safeScore >= 80 ? "rgba(34,197,94,0.5)" :
  safeScore >= 50 ? "rgba(245,158,11,0.5)" :
  "rgba(239,68,68,0.5)";

 const textColor =
  safeScore >= 80 ? "text-emerald-600" :
  safeScore >= 50 ? "text-amber-600" :
  "text-red-600";

 useEffect(() => {
  if (!ringRef.current) return;
  ringRef.current.style.strokeDashoffset = String(circumference);
  const raf = requestAnimationFrame(() => {
   if (ringRef.current) {
    ringRef.current.style.transition = "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)";
    ringRef.current.style.strokeDashoffset = String(offset);
   }
  });
  return () => cancelAnimationFrame(raf);
 }, [safeScore, circumference, offset]);

 return (
  <div className={cn("relative inline-flex items-center justify-center", className)} role="img" aria-label={`Health score ${safeScore} out of 100`}>
   <svg
    width={size}
    height={size}
    className="-rotate-90"
    style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
   >
    {/* Track */}
    <circle
     cx={size / 2}
     cy={size / 2}
     r={radius}
     fill="none"
     stroke="rgba(59,130,246,0.08)"
     strokeWidth={strokeWidth}
    />
    {/* Progress */}
    <circle
     ref={ringRef}
     cx={size / 2}
     cy={size / 2}
     r={radius}
     fill="none"
     stroke={strokeColor}
     strokeWidth={strokeWidth}
     strokeDasharray={circumference}
     strokeDashoffset={circumference}
     strokeLinecap="round"
    />
   </svg>
   <div className="absolute inset-0 flex flex-col items-center justify-center">
    <span className={cn("font-mono font-bold leading-none", textColor, size >= 100 ? "text-2xl" : "text-lg")}>
     {safeScore}
    </span>
    <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Health</span>
   </div>
  </div>
 );
}
