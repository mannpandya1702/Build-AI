// Design tokens — single source of truth shared by CSS and the WebGL scene.
// Keep in sync with the @theme block in app/globals.css.

export const colors = {
  white: "#ffffff",
  mist: "#eef7f6", // faint teal-white for alternating sections
  teal: "#12b3ab", // accent, lines, rim light
  tealDeep: "#0b6b66", // headings accent, CTA, hover
  ink: "#0c1c26", // headings, strong text
  muted: "#5a7178", // body
  line: "#dbe9e8", // hairlines, card borders
  // enamel-specific
  enamel: "#f6fbfb", // base tooth color
  sheen: "#dff3f1", // soft teal-white sheen
} as const;

// Heartbeat: a calm resting pulse. ~52 bpm sits inside the 50–58 target.
export const HEARTBEAT_BPM = 52;

// Resting pulse value used when motion is reduced (a gentle, constant shine
// rather than a dead-flat zero).
export const PULSE_REST = 0.12;

export type ColorToken = keyof typeof colors;
