"use client";

const items = [
  "Next.js",
  "React Three Fiber",
  "OpenAI",
  "Claude",
  "Retell Voice",
  "Twilio",
  "Supabase",
  "Vercel",
  "n8n",
  "Stripe",
  "Postgres",
  "LangGraph",
];

export function Marquee() {
  return (
    <section id="work" className="relative overflow-hidden border-y border-line py-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-canvas to-transparent" />

      <p className="mb-6 px-5 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted sm:px-8">
        Built on the tools your stack already trusts
      </p>

      <div className="flex w-max animate-marquee gap-4 pl-4">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="whitespace-nowrap rounded-full border border-line bg-panel/50 px-5 py-2 font-mono text-sm text-muted"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
