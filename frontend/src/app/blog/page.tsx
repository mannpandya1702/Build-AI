import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteNav, StickyBookBar } from "@/components/site/nav";
import { CalEmbedInit } from "@/components/site/cal-embed";
import { FooterCta } from "@/components/site/footer-cta";
import { Eyebrow } from "@/components/site/primitives";
import { getAllPosts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Vocabric AI",
  description:
    "Practical, no-hype writing on AI voice agents, chatbots, and automation for small teams that would rather ship than shout.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Vocabric AI — Blog",
    description:
      "Practical writing on AI voice agents, chatbots, and automation for small teams.",
    url: "https://vocabric.com/blog",
    type: "website",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <>
      <CalEmbedInit />
      <SiteNav />
      <main className="relative mx-auto max-w-[1400px] px-5 pt-36 sm:px-8">
        <Eyebrow label="Blog" />
        <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
          Notes on building AI that ships.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          No hype, no jargon — practical writing on voice agents, chatbots, and
          automation for teams that would rather ship than shout.
        </p>

        <div className="mb-4 mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-panel/50 p-6 transition-colors hover:border-line-strong sm:p-7"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span aria-hidden>·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-accent-soft">
                {post.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {post.description}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line bg-canvas/60 px-2.5 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
      </main>
      <FooterCta />
      <StickyBookBar />
    </>
  );
}
