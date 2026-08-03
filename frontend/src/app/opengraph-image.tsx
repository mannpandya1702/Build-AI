import { ImageResponse } from "next/og";

export const alt = "Maana — AI, engineered with restraint";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
        {/* wordmark */}
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
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#7b5cff",
              }}
            />
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
            Maana
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -3,
              maxWidth: 980,
            }}
          >
            <span>The AI layer for teams who&apos;d rather&nbsp;</span>
            <span style={{ color: "#7b5cff" }}>ship&nbsp;</span>
            <span>than shout.</span>
          </div>
          <div style={{ fontSize: 30, color: "#8a8a99", maxWidth: 820 }}>
            Websites · Chatbots · Voice agents · Automations
          </div>
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#8a8a99",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#7b5cff",
              }}
            />
            AI agency, engineered with restraint
          </div>
          <div style={{ color: "#ededf2" }}>maana.agency</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
