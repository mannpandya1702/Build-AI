import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

/**
 * The shared Open Graph card: chandni ground, the gold arch, the page's title
 * in Cormorant. One builder so every page's link preview is unmistakably the
 * same site — WhatsApp is where these links actually get shared in this
 * business, and WhatsApp reads og:image.
 *
 * The fonts are static-instance TTF subsets cut from the same Google Fonts
 * files the site itself serves (satori reads TTF, not woff2, and renders a
 * variable font at its default instance — Mulish defaults to 200, which is
 * why these are pinned). They live in assets/fonts and are pulled into the
 * serverless bundle by outputFileTracingIncludes in next.config.ts.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const palette = {
  chandni: "#F8F4ED",
  ink: "#22271F",
  stone: "#565A52",
  pistaInk: "#5C6E50",
  sona: "#C2A05E",
  rule: "rgba(34, 39, 31, 0.16)",
};

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 300 | 400 | 600 }[]> | null = null;

function loadFonts() {
  fontsPromise ??= Promise.all(
    (
      [
        ["Cormorant Garamond", "cormorant-300.ttf", 300],
        ["Mulish", "mulish-400.ttf", 400],
        ["Mulish", "mulish-600.ttf", 600],
      ] as const
    ).map(async ([name, file, weight]) => ({
      name,
      data: await readFile(path.join(process.cwd(), "assets", "fonts", file)),
      weight,
    })),
  );
  return fontsPromise;
}

export async function brandOgImage(
  title: string,
  eyebrow = "Luxury & destination wedding planner — Chandigarh",
): Promise<ImageResponse> {
  const fonts = await loadFonts();
  // Long titles step down a size instead of wrapping to a third line.
  const titleSize = title.length > 34 ? 60 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: palette.chandni,
          padding: "64px 80px 56px",
          fontFamily: "Mulish",
        }}
      >
        {/* The arch, drawn rather than embedded — satori renders it crisply. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 108,
            height: 140,
            border: `3px solid ${palette.sona}`,
            borderTopLeftRadius: 999,
            borderTopRightRadius: 999,
          }}
        >
          <span
            style={{
              fontFamily: "Cormorant Garamond",
              fontSize: 64,
              fontWeight: 300,
              color: palette.sona,
              // Optical centring inside the arch — the glyph sits high without it.
              marginTop: 10,
            }}
          >
            R
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: palette.pistaInk,
            }}
          >
            {eyebrow}
          </span>
          <span
            style={{
              fontFamily: "Cormorant Garamond",
              fontSize: titleSize,
              fontWeight: 300,
              lineHeight: 1.08,
              color: palette.ink,
              maxWidth: 980,
              marginTop: 22,
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${palette.rule}`,
            marginTop: 44,
            paddingTop: 28,
          }}
        >
          <span
            style={{
              fontFamily: "Cormorant Garamond",
              fontSize: 34,
              fontWeight: 300,
              letterSpacing: 10,
              color: palette.ink,
            }}
          >
            riwaaya
          </span>
          <span style={{ fontSize: 20, fontWeight: 400, color: palette.stone }}>riwaaya.in</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: fonts.map((font) => ({
        name: font.name,
        data: font.data,
        weight: font.weight,
        style: "normal" as const,
      })),
    },
  );
}
