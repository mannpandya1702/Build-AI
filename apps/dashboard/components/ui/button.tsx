"use client";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

// Premium button on the existing design tokens. `primary` uses the amber accent (the one CTA color,
// used sparingly); `default` is a surface control; `ghost`/`outline`/`danger` for secondary actions.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-display text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accentink shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_1px_2px_0_rgb(0_0_0/0.3)] hover:brightness-110 active:brightness-95",
        default: "border border-line bg-surface2 text-ink hover:border-faint/50 hover:bg-surface2/80",
        outline: "border border-line text-ink hover:bg-surface2",
        ghost: "text-muted hover:bg-surface2 hover:text-ink",
        danger: "bg-danger/15 text-danger ring-1 ring-danger/30 hover:bg-danger/25",
      },
      size: {
        sm: "h-8 px-2.5 text-[13px]",
        md: "h-9 px-3.5",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        // default to type="button" so a button never accidentally submits a form (a11y/correctness)
        type={asChild ? undefined : (type ?? "button")}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
