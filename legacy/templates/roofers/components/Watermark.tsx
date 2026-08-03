import { site } from "../lib/content";

// Demo watermark bar (spec §6.7): a slim, honest "this is a preview we built for you" marker, shown
// only on demo builds and removed on the final client site. Fixed to the TOP so it never covers the
// mobile sticky tap-to-call bar (which is pinned to the bottom). Selective glass (CLAUDE.md §5b-bis).
// Not dismissible: it is proof the preview is ours, not a claim the business made.
export default function Watermark({ text }: { text: string | null }) {
  const label = text ?? `Demo preview built for ${site.businessName}`;
  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/70 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-1.5 text-center">
        <p className="truncate text-[11px] font-medium tracking-wide text-white/80">
          {label} · not published
        </p>
      </div>
    </div>
  );
}
