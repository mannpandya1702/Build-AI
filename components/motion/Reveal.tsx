"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ElementType, ReactNode } from "react";

import { STAGGER, VIEWPORT, fadeVariants, revealVariants, staggerParent } from "@/lib/motion";

/**
 * The site's one scroll-reveal primitive: opacity 0→1, y 24→0, 0.7s on the
 * house easing, fired once 80px before the element reaches the viewport edge.
 *
 * Under prefers-reduced-motion it becomes a plain fade with no travel.
 */

/**
 * Motion components are built once at module scope, never during render — a
 * fresh component identity on any pass would unmount and remount the children,
 * losing their state and restarting their animation.
 *
 * Add a tag here if a section needs one; anything unlisted falls back to div.
 */
const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  footer: motion.footer,
  aside: motion.aside,
  nav: motion.nav,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  p: motion.p,
  span: motion.span,
  h2: motion.h2,
  h3: motion.h3,
  figure: motion.figure,
  fieldset: motion.fieldset,
} as const;

type MotionPassthrough = Omit<
  HTMLMotionProps<"div">,
  "children" | "variants" | "initial" | "whileInView"
>;

type MotionTagName = keyof typeof MOTION_TAGS;

/**
 * Indexing the map yields a union of motion components whose DOM-specific
 * event handlers are mutually incompatible, so TypeScript rejects any single
 * prop object. The props we pass are the DOM-agnostic motion ones, so widen
 * the lookup once here rather than casting at each call site.
 */
const TAGS = MOTION_TAGS as unknown as Record<
  MotionTagName,
  (props: MotionPassthrough & Record<string, unknown>) => ReactNode
>;

function tagKey(tag: ElementType): MotionTagName {
  const key = typeof tag === "string" ? tag : "div";
  return (key in MOTION_TAGS ? key : "div") as MotionTagName;
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Seconds of delay before this element reveals. */
  delay?: number;
  /** Set when the parent is a <Stagger>, so the parent owns the timing. */
  asChild?: boolean;
} & MotionPassthrough;

export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  asChild = false,
  ...rest
}: RevealProps) {
  const shouldReduce = useReducedMotion();
  const variants = shouldReduce ? fadeVariants : revealVariants;
  const MotionTag = TAGS[tagKey(as)];

  // Inside a <Stagger>, the parent drives visibility — don't attach a viewport.
  if (asChild) {
    return (
      <MotionTag className={className} variants={variants} {...rest}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants}
      transition={delay ? { delay } : undefined}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

type StaggerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Seconds between children. Defaults to the house 0.08s. */
  stagger?: number;
  delayChildren?: number;
} & MotionPassthrough;

/**
 * Wraps a group whose children each carry <Reveal asChild>. Children reveal
 * 0.08s apart. Reduced motion keeps a shortened stagger but drops the travel,
 * which reads as a soft cascade rather than movement.
 */
export function Stagger({
  children,
  as = "div",
  className,
  stagger = STAGGER,
  delayChildren = 0,
  ...rest
}: StaggerProps) {
  const shouldReduce = useReducedMotion();
  const MotionTag = TAGS[tagKey(as)];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={staggerParent(shouldReduce ? 0.04 : stagger, delayChildren)}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
