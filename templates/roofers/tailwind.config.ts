import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // <alpha-value> wiring makes Tailwind opacity modifiers (bg-ink/80) work with the CSS vars.
        brand: "rgb(var(--brand) / <alpha-value>)",
        brandink: "rgb(var(--brand-ink) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        paper2: "rgb(var(--paper-2) / <alpha-value>)",
      },
      fontFamily: {
        // Wired to next/font CSS variables in layout.tsx (CLAUDE.md §5b-bis: no system fonts).
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      minHeight: {
        tap: "44px", // buttons min 44px (CLAUDE.md §5b)
      },
      boxShadow: {
        // Layered two-part shadows read as physical depth; single flat shadows read as template.
        card: "0 1px 2px rgb(var(--ink) / 0.05), 0 10px 28px -10px rgb(var(--ink) / 0.14)",
        cardhover: "0 2px 4px rgb(var(--ink) / 0.06), 0 18px 40px -12px rgb(var(--ink) / 0.2)",
        cta: "0 2px 6px rgb(var(--brand) / 0.35), 0 14px 32px -8px rgb(var(--brand) / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
