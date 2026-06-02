export const tokens = [
  "--cm-bg",
  "--cm-bg-deep",
  "--cm-surface",
  "--cm-surface-high",
  "--cm-cyan",
  "--cm-cyan-hot",
  "--cm-fuchsia",
  "--cm-fuchsia-hot",
  "--cm-text",
  "--cm-muted",
  "--cm-line",
  "--cm-purple-line",
  "--cm-radius",
  "--cm-font-display",
  "--cm-font-sans",
  "--cm-font-mono",
  "--cm-glow-cyan",
  "--cm-glow-fuchsia"
] as const;

export const classes = [
  "cm-grid",
  "cm-glass",
  "cm-cell",
  "cm-kicker",
  "cm-display",
  "cm-copy",
  "cm-button",
  "cm-button-primary",
  "cm-button-secondary",
  "cm-chip",
  "cm-icon"
] as const;

export const extraction = {
  source: "landing/src/brand.css",
  target: "packages/theme",
  note: "The cm-* primitives are intentionally page-agnostic; landing-specific layout remains in landing/src/style.css."
} as const;
