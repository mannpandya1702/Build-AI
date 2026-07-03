# Setup

This repo is configured with UI/UX design tooling for AI coding assistants
(Claude Code, Cursor, etc.).

## 1. UI/UX Pro Max skill

Installed under [`.claude/skills/`](.claude/skills/) via the official
`ui-ux-pro-max-cli` installer. It bundles several skills — the flagship
`ui-ux-pro-max` (design-system intelligence: styles, palettes, typography,
charts, UX rules across many stacks) plus `design`, `design-system`,
`brand`, `ui-styling`, `banner-design`, and `slides`.

**Requirement:** Python 3.x (the skills' search scripts use it). Verify:

```bash
python3 --version
```

Quick check that the skill works:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism dashboard" --domain style
```

To update later: `npx ui-ux-pro-max-cli@latest init --ai claude`

## 2. 21st.dev Magic MCP server

Configured in [`.mcp.json`](.mcp.json) as the `21st` HTTP MCP server
(component search / generation / theming — https://21st.dev).

The API key is **not** stored in this repo. `.mcp.json` reads it from the
`TWENTYFIRST_API_KEY` environment variable:

```json
"headers": { "x-api-key": "${TWENTYFIRST_API_KEY}" }
```

### Set the key

- **Claude Code on the web:** add `TWENTYFIRST_API_KEY` to your environment's
  Environment Variables in the session/environment settings so it persists
  across sessions.
- **Local shell:** export it (e.g. in your shell profile or a local `.env`
  that is gitignored):

  ```bash
  export TWENTYFIRST_API_KEY="21st_sk_xxxxxxxx"
  ```

Get / manage keys at https://21st.dev.

### Approve the server

Project-scoped `.mcp.json` servers require a one-time approval. Start
`claude` in this directory and approve `21st` when prompted (or run
`claude mcp list` to check status). Restart the assistant after setting the
env var so the server connects.

> Security note: never commit the raw API key. If a key has been shared in
> plaintext (chat, screenshots, logs), rotate it at https://21st.dev.
