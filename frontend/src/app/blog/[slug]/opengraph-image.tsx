import { ImageResponse } from "next/og";
import { getAllSlugs, getPost } from "@/lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vocabric AI — Blog";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function BlogOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  const title = post?.title ?? "Vocabric AI — Blog";
  const tag = post?.tags?.[0] ?? "Writing";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(120% 90% at 15% 0%, #171436 0%, #0b0b10 55%)",
          padding: "80px",
          fontFamily: "sans-serif",
          color: "#ededf2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              border: "1px solid rgba(237,237,242,0.16)",
              background: "#101017",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#7b5cff" }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -1 }}>Vocabric AI</div>
          <div style={{ fontSize: 22, color: "#8a8a99", marginLeft: 8 }}>· Blog</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex" }}>
            <div
              style={{
                fontSize: 22,
                color: "#9b84ff",
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              {tag}
            </div>
          </div>
          <div
            style={{
              fontSize: title.length > 60 ? 58 : 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 24,
            color: "#8a8a99",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 999, background: "#7b5cff" }} />
          vocabric.com/blog
        </div>
      </div>
    ),
    { ...size },
  );
}
