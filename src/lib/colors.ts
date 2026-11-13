// Category colors: a validated categorical palette (light/dark steps) plus a neutral.
// Text never uses these colors; they mark identity next to the label.
export const CATEGORY_COLORS = {
  blue: { light: "#2a78d6", dark: "#3987e5" },
  orange: { light: "#eb6834", dark: "#d95926" },
  aqua: { light: "#1baf7a", dark: "#199e70" },
  yellow: { light: "#eda100", dark: "#c98500" },
  magenta: { light: "#e87ba4", dark: "#d55181" },
  green: { light: "#008300", dark: "#008300" },
  violet: { light: "#6250d6", dark: "#9085e9" },
  red: { light: "#e34948", dark: "#e66767" },
  gray: { light: "#8a8984", dark: "#8f8e88" },
} as const;

export type CategoryColor = keyof typeof CATEGORY_COLORS;
export const CATEGORY_COLOR_KEYS = Object.keys(CATEGORY_COLORS) as CategoryColor[];

export function isCategoryColor(v: string): v is CategoryColor {
  return v in CATEGORY_COLORS;
}

/** CSS variable reference so light/dark resolve via globals.css. */
export function colorVar(key: string) {
  return `var(--cat-${isCategoryColor(key) ? key : "gray"})`;
}
