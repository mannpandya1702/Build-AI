"use client";

import { MotionConfig } from "framer-motion";

/**
 * reducedMotion="user" makes every Framer Motion animation below respect the
 * OS "reduce motion" setting — it drops transform/layout animation but keeps
 * opacity fades, so nothing that starts at opacity:0 gets stuck hidden. This is
 * the only thing that reaches Framer; the CSS media query in globals.css cannot.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
