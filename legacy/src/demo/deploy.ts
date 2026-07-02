// src/demo/deploy.ts — deploy a generated demo to a Vercel subdomain, screenshot the hero for the
// email body, and write demo_url + demo_screenshot back to the lead. Deploy is a spend + live
// action, so it REFUSES unless: the deploy config is filled, VERCEL_TOKEN is present, and the first
// deploy is explicitly confirmed (SETUP.md §9, §13). Nothing goes live silently.

import "../env";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { VERCEL_SCOPE, DEMO_DOMAIN_BASE, isPlaceholder } from "../../config";

const exec = promisify(execFile);

export interface DeployResult {
  deployed: boolean;
  url?: string;
  screenshot?: string;
  reason?: string;
}

function confirmed(): boolean {
  return process.argv.includes("--confirm-deploy") || process.env.DEPLOY_CONFIRMED === "1";
}

export async function deployDemo(demoDir: string, slug: string, placeId: string): Promise<DeployResult> {
  // --- Guards (refuse rather than deploy silently) ---
  const missing: string[] = [];
  if (isPlaceholder(VERCEL_SCOPE)) missing.push("VERCEL_SCOPE");
  if (isPlaceholder(DEMO_DOMAIN_BASE)) missing.push("DEMO_DOMAIN_BASE");
  if (missing.length) {
    return { deployed: false, reason: `deploy config not set: ${missing.join(", ")} (fill config.ts). Not deploying.` };
  }
  if (!process.env.VERCEL_TOKEN) {
    return { deployed: false, reason: "VERCEL_TOKEN is missing from .env.local. Not deploying." };
  }
  // Flat single-level alias, which the free .vercel.app domain allows (nested <a>.<b>.vercel.app
  // does not work without a custom domain). e.g. myriad-roofing-buildai.vercel.app
  const flatAlias = `${slug}-${DEMO_DOMAIN_BASE}.vercel.app`.toLowerCase();
  if (!confirmed()) {
    return {
      deployed: false,
      reason:
        `first deploy needs a one-time go-ahead. Target: https://${flatAlias}\n` +
        `  Review demos/${slug}/ then run:  npm run build-demo ${placeId} -- --confirm-deploy`,
    };
  }

  // --- Real deploy via the Vercel CLI ---
  // Pass the token through the child's env, not argv, so it never shows in process listings/logs.
  // The CLI reads VERCEL_TOKEN from the environment.
  const childEnv = { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN ?? "" };
  let deployUrl: string;
  try {
    const { stdout } = await exec(
      "vercel",
      ["deploy", "--prod", "--yes", "--scope", VERCEL_SCOPE, "--cwd", demoDir],
      { maxBuffer: 1024 * 1024 * 32, env: childEnv },
    );
    const match = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (!match) return { deployed: false, reason: `deploy finished but no URL was parsed:\n${stdout}` };
    deployUrl = match[0];
  } catch (err) {
    return { deployed: false, reason: `vercel deploy failed: ${(err as Error).message}` };
  }

  // Vercel enables SSO deployment protection by default on new projects, which puts a vercel.com
  // login wall in front of the demo. A demo behind a login is worse than no demo (CLAUDE.md §5d:
  // "no login wall"), so turn it off via the API right after deploy.
  await disableDeploymentProtection(slug).catch((err) =>
    console.warn(`  warning: could not disable deployment protection: ${(err as Error).message}`),
  );

  // Try the clean flat alias; if it fails (name taken/plan limit), fall back to the deployment URL
  // that Vercel returned, so we always report a URL that actually works.
  let liveUrl = deployUrl;
  const aliased = await exec("vercel", ["alias", "set", deployUrl, flatAlias, "--scope", VERCEL_SCOPE], { env: childEnv })
    .then(() => true)
    .catch(() => false);
  if (aliased) liveUrl = `https://${flatAlias}`;

  // Verify the demo is actually publicly reachable before reporting it live. A prospect must never
  // get a login page or a 404 from the link we send.
  const publicCheck = await fetch(liveUrl, { redirect: "manual" }).catch(() => null);
  if (!publicCheck || publicCheck.status !== 200) {
    return {
      deployed: false,
      reason: `deployed to ${liveUrl} but it is not publicly reachable (status ${publicCheck?.status ?? "unreachable"}). Check deployment protection in the Vercel dashboard.`,
    };
  }

  const screenshot = await screenshotHero(liveUrl, slug).catch(() => undefined);
  return { deployed: true, url: liveUrl, screenshot };
}

/**
 * Turn off Vercel's default SSO deployment protection for a project so the demo is public.
 * Uses the REST API with the same token; project name = the demo slug.
 */
async function disableDeploymentProtection(projectName: string): Promise<void> {
  const token = process.env.VERCEL_TOKEN as string;
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectName}?slug=${VERCEL_SCOPE}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ssoProtection: null }),
    },
  );
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
}

/**
 * Capture the hero at a mobile viewport, compress it for the email body.
 * All browser network requests are routed through Node's fetch via request interception, because
 * Chromium cannot reach external sites directly in restricted/proxied environments while Node's
 * fetch (proxy-aware) can. Chromium itself never touches the network.
 */
export async function screenshotHero(url: string, slug: string): Promise<string | undefined> {
  const puppeteer = (await import("puppeteer")).default;
  const outDir = resolve(process.cwd(), "demos", "_screenshots");
  mkdirSync(outDir, { recursive: true });
  const rawPath = resolve(outDir, `${slug}.png`);
  const outPath = resolve(outDir, `${slug}.webp`);

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    await page.setRequestInterception(true);
    page.on("request", async (req) => {
      try {
        const res = await fetch(req.url(), {
          method: req.method(),
          headers: req.headers(),
          body: req.postData(),
          redirect: "follow",
        });
        const body = Buffer.from(await res.arrayBuffer());
        const headers: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          if (!/^(content-encoding|transfer-encoding)$/i.test(k)) headers[k] = v;
        });
        await req.respond({ status: res.status, headers, body });
      } catch {
        await req.abort().catch(() => undefined);
      }
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500)); // let motion/images settle for a clean hero
    await page.screenshot({ path: rawPath as `${string}.png` });
  } finally {
    await browser.close();
  }

  try {
    const sharp = (await import("sharp")).default;
    await sharp(rawPath).resize({ width: 780, withoutEnlargement: true }).webp({ quality: 80 }).toFile(outPath);
    return outPath;
  } catch {
    return rawPath;
  }
}
