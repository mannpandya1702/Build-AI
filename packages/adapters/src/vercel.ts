// Vercel deploy adapter (spec §3, §6.7). Ported from the proven legacy deploy.ts (which put real
// roofer demos live). Vercel builds the Next.js source server-side, so no local `next build` /
// node_modules is needed: we upload source and Vercel runs the build. After deploy it disables the
// default SSO protection (a demo behind a login wall is worse than no demo, CLAUDE.md §5d), aliases
// to a clean flat subdomain, and verifies the URL is publicly reachable before reporting it live.
// MOCK returns a local URL without touching the network or building.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MOCK } from "./config.js";

const exec = promisify(execFile);

export interface DeployResult {
  url: string;
  deploymentId: string;
  reachable: boolean;
}

export interface DeployOpts {
  scope: string;
  /** flat alias base: demo lives at {slug}-{aliasBase}.vercel.app (nested subdomains need a paid domain) */
  aliasBase: string;
}

export async function deployDir(dir: string, slug: string, opts: DeployOpts): Promise<DeployResult> {
  if (MOCK()) {
    return { url: `http://localhost:4310/${slug}`, deploymentId: `mock-${slug}`, reachable: true };
  }
  if (!process.env.VERCEL_TOKEN) throw new Error("VERCEL_TOKEN is not set");
  const childEnv = { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN };

  const { stdout } = await exec(
    "vercel",
    ["deploy", "--prod", "--yes", "--scope", opts.scope, "--cwd", dir],
    {
      maxBuffer: 1024 * 1024 * 32,
      env: childEnv,
    },
  );
  const match = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (!match) throw new Error(`deploy finished but no URL parsed:\n${stdout.slice(-400)}`);
  const deploymentUrl = match[0];
  const deploymentId = deploymentUrl.replace(/^https:\/\//, "").split(".")[0];

  // Turn off SSO deployment protection so the demo is public (project name = slug).
  await disableDeploymentProtection(slug, opts.scope).catch(() => undefined);

  // Try a clean flat alias; fall back to the deployment URL if it is taken / plan-limited.
  const flatAlias = `${slug}-${opts.aliasBase}.vercel.app`.toLowerCase();
  const aliased = await exec("vercel", ["alias", "set", deploymentUrl, flatAlias, "--scope", opts.scope], {
    env: childEnv,
  })
    .then(() => true)
    .catch(() => false);
  const url = aliased ? `https://${flatAlias}` : deploymentUrl;

  const check = await fetch(url, { redirect: "manual" }).catch(() => null);
  return { url, deploymentId, reachable: Boolean(check && check.status === 200) };
}

async function disableDeploymentProtection(projectName: string, scope: string): Promise<void> {
  const token = process.env.VERCEL_TOKEN as string;
  const res = await fetch(`https://api.vercel.com/v9/projects/${projectName}?slug=${scope}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ssoProtection: null }),
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${(await res.text()).slice(0, 120)}`);
}
