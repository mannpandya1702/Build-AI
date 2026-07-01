// src/demo/deploy.ts — deploy a generated demo to a Vercel subdomain, screenshot the hero for the
// email body, and write demo_url + demo_screenshot back to the lead. Deploy is a spend + live
// action, so it REFUSES unless: the deploy config is filled, VERCEL_TOKEN is present, and the first
// deploy is explicitly confirmed (SETUP.md §9, §13). Nothing goes live silently.

import "dotenv/config";
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
  const targetSubdomain = `${slug}.${DEMO_DOMAIN_BASE}.vercel.app`;
  if (!confirmed()) {
    return {
      deployed: false,
      reason:
        `first deploy needs a one-time go-ahead. Target: https://${targetSubdomain}\n` +
        `  Review demos/${slug}/ then run:  npm run build-demo ${placeId} -- --confirm-deploy`,
    };
  }

  // --- Real deploy via the Vercel CLI ---
  const token = process.env.VERCEL_TOKEN as string;
  let url: string;
  try {
    const { stdout } = await exec(
      "vercel",
      ["deploy", "--prod", "--yes", "--token", token, "--scope", VERCEL_SCOPE, "--cwd", demoDir],
      { maxBuffer: 1024 * 1024 * 32 },
    );
    const match = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (!match) return { deployed: false, reason: `deploy finished but no URL was parsed:\n${stdout}` };
    url = match[0];
    // Best-effort alias to the per-prospect subdomain; ignore alias failures (raw URL still works).
    await exec("vercel", ["alias", "set", url, targetSubdomain, "--token", token, "--scope", VERCEL_SCOPE]).catch(() => undefined);
  } catch (err) {
    return { deployed: false, reason: `vercel deploy failed: ${(err as Error).message}` };
  }

  const liveUrl = `https://${targetSubdomain}`;
  const screenshot = await screenshotHero(liveUrl, slug).catch(() => undefined);
  return { deployed: true, url: liveUrl, screenshot };
}

/** Capture the hero at a mobile viewport, compress it for the email body. */
async function screenshotHero(url: string, slug: string): Promise<string | undefined> {
  const puppeteer = (await import("puppeteer")).default;
  const outDir = resolve(process.cwd(), "demos", "_screenshots");
  mkdirSync(outDir, { recursive: true });
  const rawPath = resolve(outDir, `${slug}.png`);
  const outPath = resolve(outDir, `${slug}.webp`);

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
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
