import type { ReactNode } from "react";

import { Reveal, Stagger } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Shared section header: a small tracked eyebrow over a large Cormorant title,
 * with optional supporting copy. Keeps vertical rhythm identical section to
 * section, which is most of what makes a page feel designed rather than
 * assembled.
 */
export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
  tone = "ink",
  as = "h2",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  tone?: "ink" | "chandni";
  as?: "h1" | "h2";
  className?: string;
}) {
  const Title = as;

  return (
    <Stagger
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <Reveal asChild>
          <p
            className={cn(
              "font-sans text-eyebrow font-semibold uppercase",
              tone === "ink" ? "text-pista-ink" : "text-pista",
            )}
          >
            {eyebrow}
          </p>
        </Reveal>
      )}

      <Reveal asChild>
        <Title
          className={cn(
            "font-display text-display-md font-light",
            tone === "ink" ? "text-ink" : "text-chandni",
            align === "center" ? "max-w-3xl" : "max-w-2xl",
          )}
        >
          {title}
        </Title>
      </Reveal>

      {children && (
        <Reveal asChild>
          <div
            className={cn(
              "max-w-measure font-sans text-body",
              tone === "ink" ? "text-stone-deep" : "text-chandni/70",
            )}
          >
            {children}
          </div>
        </Reveal>
      )}
    </Stagger>
  );
}
