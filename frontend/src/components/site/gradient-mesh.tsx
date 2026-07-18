/**
 * GPU-cheap animated gradient mesh. No WebGL — three large blurred radial
 * blobs drifting on CSS keyframes. Paints instantly with the hero text.
 * The one accent (violet) is the only saturated color; the rest is cool grey.
 */
export function GradientMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* base wash so the blobs never sit on pure canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(123,92,255,0.10),transparent_60%)]" />

      <div
        className="mesh-blob mesh-a absolute left-[8%] top-[-6%] h-[46vw] w-[46vw] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(123,92,255,0.55), transparent 62%)",
        }}
      />
      <div
        className="mesh-blob mesh-b absolute right-[-4%] top-[18%] h-[38vw] w-[38vw] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(155,132,255,0.38), transparent 60%)",
        }}
      />
      <div
        className="mesh-blob mesh-c absolute bottom-[-14%] left-[28%] h-[42vw] w-[42vw] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(80,70,140,0.5), transparent 65%)",
        }}
      />

      {/* fade to canvas at the bottom so the section blends into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
    </div>
  );
}
