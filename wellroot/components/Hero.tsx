"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import StaticTooth from "./StaticTooth";
import { chooseHeroTier, type HeroTier } from "@/lib/webgl";

// ssr:false is only valid inside a Client Component (this one).
const ToothCanvas = dynamic(() => import("./tooth/ToothCanvas"), {
  ssr: false,
});

export default function Hero() {
  // Start on the static tier for SSR + first paint; upgrade after mount.
  const [tier, setTier] = useState<HeroTier>("static");
  const [mountCanvas, setMountCanvas] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const chosen = chooseHeroTier();
    setTier(chosen);
    if (chosen === "static") return;

    // Defer mounting the WebGL canvas until the browser is idle so it never
    // blocks the LCP paint of the static hero.
    const idle =
      "requestIdleCallback" in window
        ? (window.requestIdleCallback as typeof requestIdleCallback)
        : (cb: IdleRequestCallback) =>
            window.setTimeout(() => cb({} as IdleDeadline), 300);
    const handle = idle(() => setMountCanvas(true));
    return () => {
      if ("cancelIdleCallback" in window && typeof handle === "number") {
        window.cancelIdleCallback(handle);
      }
    };
  }, []);

  const showLive = tier !== "static" && mountCanvas;

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden pt-24 md:pt-16"
      aria-label="Wellroot hero"
    >
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-8 px-6 md:grid-cols-[45%_55%] md:gap-4 md:px-10">
        {/* LEFT — text. On mobile it sits below the tooth. */}
        <div className="order-2 md:order-1">
          <p className="eyebrow mb-5">Family &amp; cosmetic dentistry</p>
          <h1
            className="mb-6"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Care that
            <br />
            runs deep.
          </h1>
          <p className="mb-9 max-w-[42ch] text-[17px] leading-relaxed text-muted">
            Gentle, unhurried care in Bengaluru. Same-day emergency slots,
            pricing you see before we start, and a team that explains every
            step.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#booking" className="btn btn-primary">
              Book a visit
            </a>
            <a href="#services" className="btn btn-ghost">
              See what we do
            </a>
          </div>

          <div className="mt-14 hidden items-center gap-3 text-muted md:flex">
            <span className="text-[12.5px] uppercase tracking-[0.16em]">
              Scroll
            </span>
            <span className="relative block h-8 w-px overflow-hidden bg-line">
              <span className="scroll-cue absolute inset-x-0 top-0 h-3 bg-teal-deep" />
            </span>
          </div>
        </div>

        {/* RIGHT — tooth. Reserved box (no CLS); nudged slightly off the edge. */}
        <div className="order-1 md:order-2">
          <div className="relative mx-auto h-[46vh] w-full max-w-[520px] md:h-[64vh] md:max-w-none md:translate-x-[6%]">
            {/* Static tooth — LCP element. Fades out once the canvas is live. */}
            <div
              className="fade-layer absolute inset-0 flex items-center justify-center"
              style={{ opacity: canvasReady ? 0 : 1 }}
              aria-hidden={canvasReady}
            >
              <StaticTooth className="h-full w-auto" />
            </div>

            {/* Live canvas — crossfades in when its first frame is ready. */}
            {showLive && (
              <div
                className="fade-layer absolute inset-0"
                style={{ opacity: canvasReady ? 1 : 0 }}
              >
                <ToothCanvas
                  tier={tier}
                  onReady={() => setCanvasReady(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scroll-cue {
          animation: scrollCue 2.4s ease-in-out infinite;
        }
        @keyframes scrollCue {
          0% {
            transform: translateY(-100%);
          }
          60%,
          100% {
            transform: translateY(320%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-cue {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
