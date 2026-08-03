import { cn } from "@/lib/utils";
import * as React from "react";

// Elevated surface card on the design tokens. A hairline border + soft shadow reads premium without
// heavy chrome; hover lift is opt-in via `interactive`.
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card border border-line bg-surface shadow-[0_1px_2px_0_rgb(0_0_0/0.25)]",
      interactive && "transition-colors duration-150 hover:border-faint/40 hover:bg-surface2/40",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-sm font-semibold leading-none tracking-tight text-ink", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}
