import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO (YYYY-MM-DD)
  author: string;
  tags: string[];
  readingMinutes: number;
};

export type Post = PostMeta & { content: string };

function readAll(): Post[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const words = content.split(/\s+/).filter(Boolean).length;
      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ""),
        date: String(data.date ?? "1970-01-01"),
        author: String(data.author ?? "Vocabric AI"),
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        readingMinutes: Math.max(1, Math.round(words / 200)),
        content,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPosts(): PostMeta[] {
  return readAll().map(({ content: _content, ...meta }) => meta);
}

export function getAllSlugs(): string[] {
  return readAll().map((p) => p.slug);
}

export function getPost(slug: string): Post | null {
  return readAll().find((p) => p.slug === slug) ?? null;
}

/** Human date like "22 Jul 2026" (locale-stable, no timezone surprises). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}
