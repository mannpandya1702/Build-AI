import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Buttons never flip colour on hover — a fill sweeps in from the left over
 * 250ms. The sweep lives in .sweep-fill (globals.css) and collapses to a fade
 * under prefers-reduced-motion.
 *
 * Height is 48px+ everywhere so touch targets clear 44px.
 */

type Variant = "solid" | "outline" | "ghost" | "onDark";
type Size = "md" | "lg";

const base =
  "sweep-fill inline-flex items-center justify-center gap-2 rounded-full border font-sans text-micro font-semibold uppercase tracking-[0.14em] transition-colors duration-[250ms] ease-riwaaya cursor-pointer disabled:cursor-not-allowed disabled:opacity-45";

const sizes: Record<Size, string> = {
  md: "min-h-[48px] px-6 py-3",
  lg: "min-h-[56px] px-8 py-4",
};

/**
 * Each variant defines its resting colours and what the ::before sweep paints,
 * plus the text colour once the sweep has covered the button.
 */
const variants: Record<Variant, string> = {
  solid:
    "border-pista-ink bg-pista-ink text-chandni before:bg-ink hover:text-chandni focus-visible:text-chandni",
  outline:
    "border-ink/25 bg-transparent text-ink before:bg-pista hover:border-ink/40 hover:text-ink focus-visible:border-ink/40",
  ghost:
    "border-transparent bg-transparent text-ink before:bg-pista-mist hover:text-ink",
  onDark:
    "border-chandni/35 bg-transparent text-chandni before:bg-chandni hover:text-ink focus-visible:text-ink",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

type ButtonAsButton = CommonProps & {
  href?: never;
  external?: never;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { children, variant = "solid", size = "md", className, ...rest } = props;
  const classes = cn(base, sizes[size], variants[variant], className);

  if ("href" in props && props.href) {
    const { href, external, ...anchorRest } = rest as ButtonAsLink;

    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          {...anchorRest}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const { ...buttonRest } = rest as ButtonAsButton;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
