import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

// Semantic badge (skill: color + text, never color alone). Tones map to the design tokens.
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-display text-[11px] font-medium ring-1",
  {
    variants: {
      tone: {
        neutral: "bg-surface2 text-muted ring-line",
        data: "bg-data/10 text-data ring-data/25",
        ok: "bg-ok/10 text-ok ring-ok/25",
        warn: "bg-warn/10 text-warn ring-warn/25",
        danger: "bg-danger/10 text-danger ring-danger/25",
        accent: "bg-accent/10 text-accent ring-accent/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export { badgeVariants };
