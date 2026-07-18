"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element first scrolls near the viewport. Used to
 * lazy-mount the expensive Three.js scene — nothing WebGL exists until the
 * user actually scrolls to it. `once` keeps it mounted afterwards.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "200px",
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
