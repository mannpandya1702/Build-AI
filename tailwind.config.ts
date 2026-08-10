import type { Config } from "tailwindcss";

/**
 * Riwaaya design tokens.
 *
 * Palette is deliberately two-colour: pistachio + off-white, with ink for type.
 * Target ratio across a page is roughly 60% chandni / 25% pista (both tints) /
 * 13% ink / 2% everything else. Do not add hues here without a brand decision.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./content/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * chandni and pista are the exact values from the brand identity deck
         * — the pistachio-and-white pairing the client signed off on.
         *
         * The deck's other three (gulaab rose, baingani aubergine, sona gold)
         * are deliberately NOT here: the brief rules out purple and gold and
         * asks for a two-colour site. ink stays as the dark rather than the
         * deck's baingani for the same reason.
         */
        chandni: "#F8F4ED",
        pista: "#C7D4B2",
        "pista-deep": "#7E9470",
        ink: "#22271F",
        stone: "#6E7269",
        // Steps derived from the two brand colours only — no new hues.
        "pista-mist": "#ECECDE",
        "ink-soft": "#31382D",
        /**
         * Accessibility steps. The brand's pista-deep (#7E9470) measures
         * 3.16:1 on chandni — fine for focus rings, borders and large type
         * (WCAG needs 3:1 there) but short of the 4.5:1 small text requires.
         * These two are one step darker in the same hues and are what small
         * text and solid button fills use:
         *   pista-ink  on chandni 5.29:1 · on pista-mist 4.66:1
         *   chandni    on pista-ink 5.29:1  (solid buttons)
         *   stone-deep on chandni 6.75:1 · on pista-mist 5.94:1
         */
        "pista-ink": "#5C6E50",
        "stone-deep": "#565A52",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-mulish)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid display sizes. Tight tracking is applied at the large end only.
        "display-xl": ["clamp(3.25rem, 9vw, 8.5rem)", { lineHeight: "0.94", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.75rem, 6.5vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(2.25rem, 4.6vw, 4rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.75rem, 3vw, 2.75rem)", { lineHeight: "1.12", letterSpacing: "-0.015em" }],
        "lede": ["clamp(1.25rem, 2.1vw, 1.875rem)", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
        // Mulish sits at +0.01em and above at small sizes for legibility.
        "eyebrow": ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.18em" }],
        "micro": ["0.8125rem", { lineHeight: "1.55", letterSpacing: "0.01em" }],
        "body": ["1rem", { lineHeight: "1.65", letterSpacing: "0.01em" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.7", letterSpacing: "0.01em" }],
      },
      spacing: {
        // Spacious scale — marketing page, not a dashboard.
        section: "clamp(5rem, 11vw, 10rem)",
        "section-sm": "clamp(3.5rem, 7vw, 6rem)",
        gutter: "clamp(1.25rem, 4vw, 4.5rem)",
      },
      maxWidth: {
        shell: "88rem",
        prose: "38rem",
        measure: "34rem",
      },
      borderRadius: {
        // The taak niche: a pointed arch used as a photo crop, never as a logo.
        taak: "50% 50% 0 0 / 32% 32% 0 0",
      },
      boxShadow: {
        nav: "0 1px 0 0 rgba(34, 39, 31, 0.07), 0 8px 28px -18px rgba(34, 39, 31, 0.35)",
        lift: "0 24px 48px -32px rgba(34, 39, 31, 0.45)",
      },
      transitionTimingFunction: {
        riwaaya: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "70%": { transform: "scale(1.7)", opacity: "0" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        marquee: "marquee 42s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
