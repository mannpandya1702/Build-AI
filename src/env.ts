// src/env.ts — load secrets from .env.local (the canonical file per SETUP.md §5), then .env as a
// fallback. dotenv does not override values already present in process.env, so .env.local wins.
// Import this at the top of every entrypoint instead of "dotenv/config", so the repo-root
// .env.local is always used regardless of the current working directory.

import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });
