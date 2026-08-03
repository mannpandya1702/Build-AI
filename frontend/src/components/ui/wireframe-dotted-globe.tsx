"use client";

// Adapted from the "wireframe-dotted-globe" component and tuned to the Maana
// system: near-black ocean, muted halftone land, and violet great-circle "call
// routes" with travelling pulses to suggest calls answered around the world.
// Differences from the source: bundled map data (same-origin, no runtime GitHub
// fetch), hemisphere culling so back-face dots don't bleed through, batched dot
// fill for performance, wheel-zoom removed (it hijacks page scroll in a
// section), and prefers-reduced-motion + in-view gating.

import { useEffect, useRef, useState } from "react";
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  geoBounds,
  geoInterpolate,
  geoDistance,
} from "d3-geo";
import { timer, type Timer } from "d3-timer";

const HALF_PI = Math.PI / 2;

// Hub cities [lng, lat] — endpoints for the illustrative call routes.
const CITIES: Record<string, [number, number]> = {
  sf: [-122.4, 37.8],
  ny: [-74.0, 40.7],
  toronto: [-79.4, 43.7],
  saopaulo: [-46.6, -23.5],
  london: [-0.1, 51.5],
  berlin: [13.4, 52.5],
  lagos: [3.4, 6.5],
  dubai: [55.3, 25.2],
  mumbai: [72.8, 19.1],
  singapore: [103.8, 1.35],
  tokyo: [139.7, 35.7],
  sydney: [151.2, -33.9],
};

const ROUTES: [keyof typeof CITIES, keyof typeof CITIES][] = [
  ["sf", "london"],
  ["ny", "lagos"],
  ["london", "mumbai"],
  ["dubai", "singapore"],
  ["tokyo", "sf"],
  ["sydney", "singapore"],
  ["saopaulo", "ny"],
  ["berlin", "dubai"],
  ["mumbai", "tokyo"],
  ["lagos", "london"],
  ["toronto", "berlin"],
];

interface RotatingEarthProps {
  className?: string;
  /** Max rendered width in px; the canvas is responsive up to this. */
  maxWidth?: number;
}

export default function RotatingEarth({
  className = "",
  maxWidth = 720,
}: RotatingEarthProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let baseRadius = 0;

    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath().projection(projection).context(context);
    const graticule = geoGraticule();

    const measure = () => {
      const w = Math.min(maxWidth, wrapper.clientWidth || maxWidth);
      const h = Math.min(620, Math.round(w * 0.92));
      W = w;
      H = h;
      baseRadius = Math.min(w, h) / 2.2;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      projection.scale(baseRadius).translate([w / 2, h / 2]);
    };

    // ---- point-in-polygon land dot generation (once) --------------------
    const pointInPolygon = (point: [number, number], polygon: number[][]) => {
      const [x, y] = point;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };

    const pointInFeature = (point: [number, number], feature: any) => {
      const g = feature.geometry;
      if (g.type === "Polygon") {
        if (!pointInPolygon(point, g.coordinates[0])) return false;
        for (let i = 1; i < g.coordinates.length; i++) {
          if (pointInPolygon(point, g.coordinates[i])) return false;
        }
        return true;
      }
      if (g.type === "MultiPolygon") {
        for (const poly of g.coordinates) {
          if (pointInPolygon(point, poly[0])) {
            let inHole = false;
            for (let i = 1; i < poly.length; i++) {
              if (pointInPolygon(point, poly[i])) {
                inHole = true;
                break;
              }
            }
            if (!inHole) return true;
          }
        }
      }
      return false;
    };

    const dots: [number, number][] = [];
    let landFeatures: any = null;

    const buildDots = (features: any[], dotSpacing = 18) => {
      const step = dotSpacing * 0.08;
      for (const feature of features) {
        const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(feature);
        for (let lng = minLng; lng <= maxLng; lng += step) {
          for (let lat = minLat; lat <= maxLat; lat += step) {
            const p: [number, number] = [lng, lat];
            if (pointInFeature(p, feature)) dots.push(p);
          }
        }
      }
    };

    // ---- call routes (great-circle line strings + travelling pulses) ----
    const routes = ROUTES.map(([a, b], i) => {
      const from = CITIES[a];
      const to = CITIES[b];
      const interp = geoInterpolate(from, to);
      const coords: [number, number][] = [];
      const N = 48;
      for (let k = 0; k <= N; k++) coords.push(interp(k / N) as [number, number]);
      return {
        line: { type: "LineString", coordinates: coords } as any,
        interp,
        t: (i * 0.13) % 1,
        speed: 0.0022 + (i % 4) * 0.0009,
      };
    });

    const markerPoints = Object.values(CITIES);

    // ---- render ---------------------------------------------------------
    const render = () => {
      context.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const s = projection.scale();
      const rot = projection.rotate();
      const center: [number, number] = [-rot[0], -rot[1]];
      const isVisible = (ll: [number, number]) =>
        geoDistance(ll, center) < HALF_PI - 0.02;

      // ocean disc — subtle top-left lit gradient
      const grd = context.createRadialGradient(
        cx - s * 0.35,
        cy - s * 0.35,
        s * 0.1,
        cx,
        cy,
        s,
      );
      grd.addColorStop(0, "#181824");
      grd.addColorStop(1, "#0b0b10");
      context.beginPath();
      context.arc(cx, cy, s, 0, 2 * Math.PI);
      context.fillStyle = grd;
      context.fill();
      context.lineWidth = 1.1;
      context.strokeStyle = "rgba(123,92,255,0.35)";
      context.stroke();

      if (!landFeatures) return;

      // graticule
      context.beginPath();
      path(graticule());
      context.strokeStyle = "rgba(237,237,242,0.06)";
      context.lineWidth = 0.6;
      context.stroke();

      // land outlines
      context.beginPath();
      for (const f of landFeatures.features) path(f);
      context.strokeStyle = "rgba(237,237,242,0.14)";
      context.lineWidth = 0.8;
      context.stroke();

      // halftone land dots — culled to the visible hemisphere, one batched fill
      context.beginPath();
      const r = 1.1;
      for (const d of dots) {
        if (geoDistance(d, center) < HALF_PI - 0.02) {
          const p = projection(d);
          if (p) {
            context.moveTo(p[0] + r, p[1]);
            context.arc(p[0], p[1], r, 0, 2 * Math.PI);
          }
        }
      }
      context.fillStyle = "rgba(138,138,153,0.55)";
      context.fill();

      // faint route arcs (auto-clipped to the front hemisphere)
      context.beginPath();
      for (const route of routes) path(route.line);
      context.strokeStyle = "rgba(123,92,255,0.20)";
      context.lineWidth = 1;
      context.stroke();

      // travelling pulses with a short comet trail + glowing head
      for (const route of routes) {
        context.beginPath();
        let started = false;
        const TN = 16;
        for (let k = 0; k <= TN; k++) {
          const tt = route.t - (k / TN) * 0.14;
          if (tt < 0) break;
          const ll = route.interp(tt) as [number, number];
          if (!isVisible(ll)) break;
          const p = projection(ll);
          if (!p) break;
          if (!started) {
            context.moveTo(p[0], p[1]);
            started = true;
          } else {
            context.lineTo(p[0], p[1]);
          }
        }
        context.strokeStyle = "rgba(155,132,255,0.85)";
        context.lineWidth = 1.5;
        context.stroke();

        const head = route.interp(route.t) as [number, number];
        if (isVisible(head)) {
          const p = projection(head);
          if (p) {
            context.beginPath();
            context.arc(p[0], p[1], 2.1, 0, 2 * Math.PI);
            context.shadowColor = "#7b5cff";
            context.shadowBlur = 12;
            context.fillStyle = "#cdc0ff";
            context.fill();
            context.shadowBlur = 0;
          }
        }
      }

      // city markers
      for (const m of markerPoints) {
        if (isVisible(m as [number, number])) {
          const p = projection(m as [number, number]);
          if (p) {
            context.beginPath();
            context.arc(p[0], p[1], 3.4, 0, 2 * Math.PI);
            context.fillStyle = "rgba(123,92,255,0.18)";
            context.fill();
            context.beginPath();
            context.arc(p[0], p[1], 1.5, 0, 2 * Math.PI);
            context.fillStyle = "#9b84ff";
            context.fill();
          }
        }
      }
    };

    // ---- rotation / interaction ----------------------------------------
    const rotation: [number, number] = [0, -12];
    projection.rotate(rotation);
    let autoRotate = !reduce;

    const tick = () => {
      if (autoRotate) rotation[0] += 0.16;
      projection.rotate(rotation);
      if (!reduce) for (const route of routes) route.t = (route.t + route.speed) % 1;
      render();
    };

    let rotationTimer: Timer | null = null;
    const start = () => {
      if (!rotationTimer && !reduce) rotationTimer = timer(tick);
    };
    const stop = () => {
      rotationTimer?.stop();
      rotationTimer = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      autoRotate = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const start0 = rotation[0];
      const start1 = rotation[1];

      const onMove = (e: PointerEvent) => {
        rotation[0] = start0 + (e.clientX - startX) * 0.4;
        rotation[1] = Math.max(-90, Math.min(90, start1 - (e.clientY - startY) * 0.4));
        projection.rotate(rotation);
        render();
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!reduce) setTimeout(() => (autoRotate = true), 400);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
    canvas.addEventListener("pointerdown", onPointerDown);

    // ---- load data ------------------------------------------------------
    let cancelled = false;
    (async () => {
      try {
        measure();
        render();
        const res = await fetch("/ne_110m_land.json");
        if (!res.ok) throw new Error("map fetch failed");
        const data = await res.json();
        if (cancelled) return;
        landFeatures = data;
        buildDots(data.features);
        setIsLoading(false);
        render();
      } catch {
        if (!cancelled) {
          setError("Couldn't load the map.");
          setIsLoading(false);
        }
      }
    })();

    // pause the loop when scrolled off-screen
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) start();
          else stop();
        }
      },
      { rootMargin: "100px" },
    );
    io.observe(wrapper);

    const ro = new ResizeObserver(() => {
      measure();
      render();
    });
    ro.observe(wrapper);

    return () => {
      cancelled = true;
      stop();
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [maxWidth]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="mx-auto block h-auto max-w-full cursor-grab touch-none active:cursor-grabbing"
      />
      {isLoading && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="font-mono text-xs text-muted">loading map…</span>
        </div>
      )}
      {error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="font-mono text-xs text-muted">{error}</span>
        </div>
      )}
      {!error && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[11px] text-muted/70">
          drag to rotate
        </div>
      )}
    </div>
  );
}
