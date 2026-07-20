// Feature + power detection. All guarded for SSR (return safe defaults on the
// server so the static hero always renders first).

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function prefersReducedMotion(): boolean {
  if (!isBrowser() || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let cachedWebGL: boolean | null = null;

export function hasWebGL(): boolean {
  if (!isBrowser()) return false;
  if (cachedWebGL !== null) return cachedWebGL;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    cachedWebGL = !!gl;
  } catch {
    cachedWebGL = false;
  }
  return cachedWebGL;
}

// Best-effort low-power heuristic. We would rather under-promise the 3D on a
// weak device than jank. Coarse pointer (touch), low memory, or few cores all
// route to the stripped / static experience.
export function isLowPower(): boolean {
  if (!isBrowser()) return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const fewCores =
    typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const narrow = window.innerWidth < 768;
  return (coarse && narrow) || lowMem || fewCores;
}

// The single decision the rest of the app reads: which tier of hero to show.
export type HeroTier = "full" | "lite" | "static";

export function chooseHeroTier(): HeroTier {
  if (!hasWebGL()) return "static";
  if (prefersReducedMotion()) return "static";
  if (isLowPower()) return "lite";
  return "full";
}
