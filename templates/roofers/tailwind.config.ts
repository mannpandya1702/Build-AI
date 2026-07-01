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
    },
  },
  plugins: [],
};

export default config;
