"use client";

// Niche prop field (operator reference: cula.tech's floating trucks): the trade's own objects —
// hammers, nails, plywood for roofing; wrenches and pipes for plumbing — drift through the page
// as brand-tinted line illustrations. Pure SVG + transforms: tintable per look via currentColor,
// zero image bytes, zero WebGL. Restraint per §5c: props are atmosphere behind content, never
// clutter over it; every field is aria-hidden and inert under reduced motion.
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "./Motion";
import { setForNiche } from "../lib/props";
export { propIdByIndex } from "../lib/props";

export function Prop({ id, size = 64, className }: { id: string; size?: number; className?: string }) {
  const spec = setForNiche()[id];
  if (!spec) return null;
  return (
    <svg
      viewBox={spec.viewBox}
      width={size}
      height={size}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {spec.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ?? "none"}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          opacity={p.opacity}
        />
      ))}
    </svg>
  );
}

export interface Placement {
  prop: string;
  /** CSS position values, e.g. { left: "6%", top: "18%" } or { right: "-2%", bottom: "10%" } */
  at: React.CSSProperties;
  size: number;
  /** 0.3 (far, faint, slow) .. 1 (near, stronger, faster parallax) */
  depth: number;
  rotate?: number;
  /** seconds offset so fields never move in lockstep */
  delay?: number;
}

function FloatingProp({ p, tone, i }: { p: Placement; tone: "dark" | "light"; i: number }) {
  const reduce = useReducedMotionSafe();
  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, [0, 1600], [0, reduce ? 0 : -110 * p.depth]);
  const dur = 9 + (i % 3) * 2.5;
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute ${tone === "dark" ? "text-white" : "text-ink"}`}
      style={{
        ...p.at,
        y: drift,
        opacity: 0.06 + p.depth * 0.08,
        filter: p.depth < 0.55 ? "blur(1.1px)" : undefined,
        rotate: p.rotate ?? 0,
      }}
    >
      <motion.div
        animate={
          reduce
            ? undefined
            : {
                y: [0, -12, 0],
                rotateX: [8, -8, 8],
                rotateY: [-10, 10, -10],
                rotate: [-3, 3, -3],
              }
        }
        transition={{ duration: dur, delay: p.delay ?? i * 0.9, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformPerspective: 700, transformStyle: "preserve-3d" }}
      >
        <Prop id={p.prop} size={p.size} />
      </motion.div>
    </motion.div>
  );
}

/** A field of floating niche props. Parent must be relative + overflow-hidden. */
export function PropField({ placements, tone = "dark" }: { placements: Placement[]; tone?: "dark" | "light" }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {placements.map((p, i) => (
        <FloatingProp key={`${p.prop}-${i}`} p={p} tone={tone} i={i} />
      ))}
    </div>
  );
}
