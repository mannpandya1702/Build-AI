import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { SiteNav, StickyBookBar } from "@/components/site/nav";
import { CalEmbedInit } from "@/components/site/cal-embed";
import { FooterCta } from "@/components/site/footer-cta";
import { getAllSlugs, getPost, formatDate } from "@/lib/blog";
import { site } from "@/lib/site";

const SITE_URL = "https://vocabric.com";

// Only prerendered slugs are served; unknown slugs 404 (no runtime fs reads).
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${slug}`;
  return {
    title: `${post.title} — Vocabric AI`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author, url: SITE_URL },
    publisher: { "@type": "Organization", name: site.name, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <CalEmbedInit />
      <SiteNav />
      <main className="relative mx-auto max-w-[720px] px-5 pt-36 sm:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All posts
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
          {post.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.03] tracking-[-0.02em]">
          {post.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-line pb-8 font-mono text-xs text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
          <span aria-hidden>·</span>
          <span>{post.author}</span>
        </div>

        <article className="article mt-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FooterCta />
      <StickyBookBar />
    </>
  );
}
