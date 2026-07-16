// Screenshot adapter (spec §6.4): capture a site at 3 viewports. Chromium routes every request
// through Node fetch via Puppeteer request interception, because headless browsers cannot reach
// external sites directly in this proxied environment while Node fetch can (proven in legacy
// deploy.ts). Screenshots are written to disk; paths returned. MOCK returns fixture paths.
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { HTTPRequest } from "puppeteer";
import { MOCK } from "./config.js";

export interface Shot {
  viewport: "mobile" | "tablet" | "desktop";
  width: number;
  path: string;
}

const VIEWPORTS: { name: Shot["viewport"]; width: number; height: number; mobile: boolean }[] = [
  { name: "mobile", width: 375, height: 812, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
];

export async function screenshotSite(url: string, slug: string): Promise<Shot[]> {
  const outDir = resolve(process.cwd(), "data", "screenshots", slug);
  if (MOCK()) {
    return VIEWPORTS.map((v) => ({ viewport: v.name, width: v.width, path: `${outDir}/${v.name}.png` }));
  }
  mkdirSync(outDir, { recursive: true });
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const shots: Shot[] = [];
  try {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: v.width, height: v.height, isMobile: v.mobile, deviceScaleFactor: 1 });
      await page.setRequestInterception(true);
      page.on("request", async (req: HTTPRequest) => {
        try {
          const res = await fetch(req.url(), {
            method: req.method(),
            headers: req.headers(),
            body: req.postData(),
            redirect: "follow",
          });
          const body = Buffer.from(await res.arrayBuffer());
          const headers: Record<string, string> = {};
          res.headers.forEach((val, k) => {
            if (!/^(content-encoding|transfer-encoding)$/i.test(k)) headers[k] = val;
          });
          await req.respond({ status: res.status, headers, body });
        } catch {
          await req.abort().catch(() => undefined);
        }
      });
      const path = resolve(outDir, `${v.name}.png`);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
        await new Promise((r) => setTimeout(r, 1500));
        await page.screenshot({ path: path as `${string}.png` });
        shots.push({ viewport: v.name, width: v.width, path });
      } catch {
        // unreachable at this viewport; skip but keep others
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return shots;
}
