"use client";

import { useMemo } from "react";
import { HEARTBEAT_BPM, PULSE_REST } from "@/lib/tokens";
import { prefersReducedMotion } from "@/lib/webgl";

/**
 * A heartbeat-shaped waveform, NOT a sine. One cycle = a sharp systole spike
 * followed by a softer dicrotic bump and a rest, so the shine reads as a calm
 * living pulse rather than a strobe or a throb. Two offset gaussians per cycle.
 *
 * Returns a value in [PULSE_REST, 1]: PULSE_REST between beats (a gentle
 * constant floor so the tooth never goes fully dead) rising to 1 at systole.
 */
export function heartbeat(t: number, bpm: number = HEARTBEAT_BPM): number {
  const period = 60 / bpm;
  const phase = (t % period) / period; // 0..1 within the beat

  // Sharp primary contraction (systole).
  const d1 = phase - 0.1;
  const g1 = Math.exp(-(d1 * d1) / (2 * 0.0016)); // sigma ~0.04

  // Softer, later secondary bump (dicrotic).
  const d2 = phase - 0.3;
  const g2 = 0.42 * Math.exp(-(d2 * d2) / (2 * 0.006)); // sigma ~0.077

  const raw = Math.min(1, g1 + g2);
  return PULSE_REST + (1 - PULSE_REST) * raw;
}

/**
 * Frame-time sampler. Each consumer samples the same deterministic waveform
 * from the shared clock, so no cross-component frame-ordering matters. When the
 * visitor prefers reduced motion, the pulse is frozen at its resting value.
 */
export function useHeartbeat() {
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const sample = useMemo(() => {
    if (reduced) return (_t: number) => PULSE_REST;
    return (t: number) => heartbeat(t);
  }, [reduced]);

  return { sample, reduced, rest: PULSE_REST };
}
