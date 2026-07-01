import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        brandink: "var(--brand-ink)",
      },
      minHeight: {
        tap: "44px", // buttons min 44px (CLAUDE.md §5b)
      },
    },
  },
  plugins: [],
};

export default config;
