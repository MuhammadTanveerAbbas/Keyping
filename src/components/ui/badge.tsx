import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200/80",
        destructive:
          "border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100",
        outline:
          "border-slate-200 text-slate-700 bg-white hover:bg-slate-50",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 shadow-sm",
        info:
          "border-blue-200 bg-blue-50 text-blue-700 shadow-sm",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge };
