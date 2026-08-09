"use client";

import { useEffect, useState } from "react";

/**
 * True once the page has scrolled past `threshold` pixels.
 *
 * The listener is passive and rAF-throttled: scroll events can fire many times
 * per frame, and calling setState on each one costs a render per event and
 * shows up as a forced reflow in Lighthouse. Coalescing to one read per frame
 * keeps the main thread free during the scroll.
 */
export function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;
    let ticking = false;

    const read = () => {
      ticking = false;
      setPast(window.scrollY > threshold);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return past;
}
