"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { spineStore, type Point } from "@/lib/spineStore";
import { prefersReducedMotion } from "@/lib/webgl";

type Node = { x: number; y: number; frac: number };

const SECTION_IDS = ["services", "why", "booking"];

function smoothVerticalPath(points: Point[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const dy = (cur.y - prev.y) * 0.5;
    d += ` C ${prev.x.toFixed(1)} ${(prev.y + dy).toFixed(1)}, ${cur.x.toFixed(
      1,
    )} ${(cur.y - dy).toFixed(1)}, ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
  }
  return d;
}

export default function FlowSpine() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const lenRef = useRef(0);
  const nodeEls = useRef<(SVGGElement | null)[]>([]);
  const [pathD, setPathD] = useState("");
  const [height, setHeight] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = prefersReducedMotion();

    const build = () => {
      if (typeof document === "undefined") return;
      const docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      const vw = window.innerWidth;
      const gutterX = Math.max(26, Math.min(vw * 0.06, 96));

      const anchor = spineStore.getState().rootAnchor;
      const root: Point = anchor ?? {
        x: vw * 0.72,
        y: window.innerHeight * 0.72,
      };

      // Node = vertical centre of each section.
      const sectionPoints: Point[] = [];
      const built: Node[] = [];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const y = rect.top + window.scrollY + rect.height / 2;
        sectionPoints.push({ x: gutterX, y });
      }
      if (sectionPoints.length === 0) return;

      const endY = Math.min(
        sectionPoints[sectionPoints.length - 1].y + 120,
        docH - 40,
      );
      const points: Point[] = [
        root,
        ...sectionPoints,
        { x: gutterX, y: endY },
      ];

      const span = endY - root.y || 1;
      for (const p of sectionPoints) {
        built.push({ x: p.x, y: p.y, frac: (p.y - root.y) / span });
      }

      const d = smoothVerticalPath(points);
      setPathD(d);
      setHeight(docH);
      setNodes(built);

      requestAnimationFrame(() => {
        if (!pathRef.current) return;
        const len = pathRef.current.getTotalLength();
        lenRef.current = len;
        pathRef.current.style.strokeDasharray = `${len}`;
        pathRef.current.style.strokeDashoffset = reduced ? "0" : `${len}`;
      });
    };

    const update = (progress: number) => {
      const len = lenRef.current;
      if (pathRef.current && len) {
        pathRef.current.style.strokeDashoffset = `${len * (1 - progress)}`;
      }
      nodeEls.current.forEach((g, i) => {
        if (!g) return;
        const frac = nodes[i]?.frac ?? 1;
        g.classList.toggle("lit", progress >= frac - 0.01);
      });
    };

    build();

    let st: ScrollTrigger | undefined;
    if (!reduced) {
      st = ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => update(self.progress),
      });
    } else {
      // Draw fully; light all nodes.
      requestAnimationFrame(() =>
        nodeEls.current.forEach((g) => g?.classList.add("lit")),
      );
    }

    const onResize = () => requestAnimationFrame(build);
    window.addEventListener("resize", onResize);
    const unsub = spineStore.subscribe(() => requestAnimationFrame(build));
    ScrollTrigger.addEventListener("refresh", build);

    return () => {
      window.removeEventListener("resize", onResize);
      unsub();
      ScrollTrigger.removeEventListener("refresh", build);
      st?.kill();
    };
    // We intentionally rebuild imperatively; nodes length is stable per layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute left-0 top-0 z-[5] w-full"
      height={height || undefined}
      width="100%"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spine-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12b3ab" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0b6b66" stopOpacity="0.85" />
        </linearGradient>
        <filter id="spine-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="url(#spine-grad)"
        strokeWidth={2.5}
        strokeLinecap="round"
        filter="url(#spine-glow)"
      />

      {nodes.map((n, i) => (
        <g
          key={i}
          ref={(el) => {
            nodeEls.current[i] = el;
          }}
          className="spine-node"
          transform={`translate(${n.x} ${n.y})`}
        >
          <circle r="11" className="spine-halo" />
          <circle r="5.5" className="spine-ring" />
          <circle r="2.5" className="spine-dot" />
        </g>
      ))}

      <style jsx>{`
        .spine-halo {
          fill: #12b3ab;
          opacity: 0;
          transition: opacity 400ms ease;
        }
        .spine-ring {
          fill: #ffffff;
          stroke: #dbe9e8;
          stroke-width: 1.5;
          transition:
            stroke 400ms ease,
            fill 400ms ease;
        }
        .spine-dot {
          fill: #dbe9e8;
          transition: fill 400ms ease;
        }
        .lit .spine-halo {
          opacity: 0.16;
        }
        .lit .spine-ring {
          stroke: #12b3ab;
        }
        .lit .spine-dot {
          fill: #0b6b66;
        }
      `}</style>
    </svg>
  );
}
