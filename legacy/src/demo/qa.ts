// src/demo/qa.ts — the CLAUDE.md §5e QA + security pass. Runs on a generated demo BEFORE deploy.
// A demo that fails does not go live. These are static checks (no build required) plus optional
// Lighthouse if it is available; they replicate the intent of a pre-publish scan.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

export interface QaCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface QaResult {
  passed: boolean;
  checks: QaCheck[];
}

// Patterns that would mean a real secret leaked into client-shipped code (CLAUDE.md §5e).
const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "Google API key", re: /AIza[0-9A-Za-z_\-]{35}/ },
  { name: "Vercel token", re: /\bVERCEL_TOKEN\s*[:=]\s*["'][A-Za-z0-9]{20,}/ },
  { name: "generic secret assignment", re: /(api[_-]?key|secret|token|password)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i },
  { name: "private key block", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

const TEXT_EXT = /\.(t|j)sx?$|\.css$|\.json$|\.html$|\.mjs$|\.cjs$|\.env(\.[\w-]+)?$/;
const SKIP_DIR = /node_modules|\.next|[/\\]out$|[/\\]public[/\\]photos/;

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_DIR.test(full)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (TEXT_EXT.test(full)) files.push(full);
  }
  return files;
}

export async function runQa(demoDir: string): Promise<QaResult> {
  const checks: QaCheck[] = [];
  const files = walk(demoDir);
  const read = (f: string) => {
    try {
      return readFileSync(f, "utf8");
    } catch {
      return "";
    }
  };
  const allSource = files.map(read).join("\n");

  // 1. No leaked secrets in anything that could ship (env files included, so a stray key is caught).
  const leaks: string[] = [];
  for (const f of files) {
    const src = read(f);
    for (const p of SECRET_PATTERNS) {
      if (p.re.test(src)) leaks.push(`${p.name} in ${f.replace(demoDir, ".")}`);
    }
  }
  checks.push({
    name: "no secrets in bundle-bound source",
    ok: leaks.length === 0,
    detail: leaks.length ? leaks.join("; ") : "clean",
  });

  // 1b. No .env* files in the demo directory at all: they must never ship with a deploy.
  const envFiles = files.filter((f) => /(^|[/\\])\.env(\.[\w-]+)?$/.test(f));
  checks.push({
    name: "no .env files in the demo",
    ok: envFiles.length === 0,
    detail: envFiles.length ? envFiles.map((f) => f.replace(demoDir, ".")).join("; ") : "none",
  });

  // 2. A real tap-to-call link exists (the single highest-ROI element, CLAUDE.md §5b).
  const hasTelLink = /href=\{?["'`]tel:/.test(allSource) || /tel:\$\{/.test(allSource);
  checks.push({
    name: "tap-to-call (tel:) link present",
    ok: hasTelLink,
    detail: hasTelLink ? "found tel: link" : "no tel: link found",
  });

  // 3. The quote form is short (<= 5 inputs) per CLAUDE.md §5b.
  const formFile = files.find((f) => /QuoteForm|contact|quote/i.test(f) && /\.(t|j)sx$/.test(f));
  let inputCount = 0;
  if (formFile) {
    const src = read(formFile);
    inputCount = (src.match(/<input\b/g) ?? []).length + (src.match(/<textarea\b/g) ?? []).length + (src.match(/<select\b/g) ?? []).length;
  }
  checks.push({
    name: "quote form is 3-5 fields",
    ok: formFile ? inputCount >= 3 && inputCount <= 5 : false,
    detail: formFile ? `${inputCount} fields in ${formFile.replace(demoDir, ".")}` : "no form file found",
  });

  // 4. The form API route validates input server-side (zod) and does not echo raw HTML.
  const apiRoute = files.find((f) => /api[/\\].*route\.(t|j)s$/.test(f));
  let apiValidates = false;
  let apiSafe = true;
  if (apiRoute) {
    const src = read(apiRoute);
    apiValidates = /zod|z\.object|\.parse\(|safeParse/.test(src);
    apiSafe = !/dangerouslySetInnerHTML|eval\(|child_process|exec\(/.test(src);
  }
  checks.push({
    name: "form endpoint validates input server-side",
    ok: apiRoute ? apiValidates && apiSafe : false,
    detail: apiRoute ? `validates=${apiValidates}, safe=${apiSafe} (${apiRoute.replace(demoDir, ".")})` : "no api route found",
  });

  // 5. No unsanitized dangerouslySetInnerHTML anywhere in the UI. The one allowed use is the
  //    JSON-LD schema script, which is serialized from our own object (no user input).
  const dangerous = files.filter((f) => {
    if (!/\.(t|j)sx$/.test(f)) return false;
    const src = read(f);
    if (!/dangerouslySetInnerHTML/.test(src)) return false;
    return !/application\/ld\+json/.test(src);
  });
  checks.push({
    name: "no dangerouslySetInnerHTML in components",
    ok: dangerous.length === 0,
    detail: dangerous.length ? dangerous.map((f) => f.replace(demoDir, ".")).join("; ") : "none",
  });

  // 6. prefers-reduced-motion is respected somewhere (CLAUDE.md §5c).
  const respectsRM = /prefers-reduced-motion|useReducedMotion/.test(allSource);
  checks.push({
    name: "respects prefers-reduced-motion",
    ok: respectsRM,
    detail: respectsRM ? "found reduced-motion handling" : "no reduced-motion handling found",
  });

  // 7. Schema markup present for SEO / AI search (CLAUDE.md §5b).
  const hasSchema = /application\/ld\+json|schema\.org/.test(allSource);
  checks.push({
    name: "structured data / schema markup",
    ok: hasSchema,
    detail: hasSchema ? "found JSON-LD" : "no JSON-LD found",
  });

  // 8. content.json has no fabricated review/claim left where a [NEEDS] should be.
  const contentPath = resolve(demoDir, "content.json");
  let contentOk = true;
  let contentDetail = "no content.json";
  if (existsSync(contentPath)) {
    try {
      const c = JSON.parse(read(contentPath));
      const emptyButUnflagged =
        (!c.reviews || c.reviews.length === 0) &&
        !(c.needs ?? []).some((n: string) => /reviews/i.test(n));
      contentOk = !emptyButUnflagged;
      contentDetail = contentOk
        ? `${c.reviews?.length ?? 0} real reviews, ${c.needs?.length ?? 0} [NEEDS] flags`
        : "missing reviews are not flagged as [NEEDS]";
    } catch (err) {
      contentOk = false;
      contentDetail = `unreadable content.json: ${(err as Error).message}`;
    }
  }
  checks.push({ name: "no unflagged missing facts (no fabrication)", ok: contentOk, detail: contentDetail });

  // Optional: Lighthouse, best-effort. Never blocks (it needs a running build); informational only.
  checks.push({
    name: "lighthouse (manual before send)",
    ok: true,
    detail: "run `npx lighthouse <url> --preset=desktop` and a mobile pass after deploy",
  });

  const passed = checks.filter((c) => c.name !== "lighthouse (manual before send)").every((c) => c.ok);
  return { passed, checks };
}
