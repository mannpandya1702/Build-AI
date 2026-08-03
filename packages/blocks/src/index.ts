// @autopilot/blocks — the website block library (spec §6.7). Typed registry of the ≥12 blocks, the
// looks registry (palette + type pairing + hero variant per vertical), and the vertical presets that
// tie a niche to its block sequence and looks. The uiux agent selects from this; the builder composes
// the demo from it, driving the rendered template. See registry.ts for the CLAUDE.md §5 traceability.
export * from "./registry.js";
export * from "./looks.js";
export * from "./presets.js";
