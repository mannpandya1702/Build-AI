import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        brandink: "var(--brand-ink)",
        ink: "var(--ink)",
        paper: "var(--paper)",
        paper2: "var(--paper-2)",
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
