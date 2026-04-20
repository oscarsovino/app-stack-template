import { colors, colorsDark } from "./colors"
import { spacing } from "./spacing"
import { fontSizes } from "./typography"

function toKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/**
 * Generate CSS variables from tokens. Intended for globals.css of a web app:
 *
 *   :root { ${toCssVariables("light")} }
 *   :root[data-theme="dark"] { ${toCssVariables("dark")} }
 *
 * Use with Tailwind v4's `@theme inline` block to expose the variables as
 * Tailwind tokens.
 */
export function toCssVariables(theme: "light" | "dark" = "light"): string {
  const palette = theme === "dark" ? colorsDark : colors
  const lines: string[] = []

  for (const [key, value] of Object.entries(palette)) {
    lines.push(`--color-${toKebab(key)}: ${value};`)
  }
  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`--space-${key}: ${value}px;`)
  }
  for (const [key, value] of Object.entries(fontSizes)) {
    lines.push(`--font-size-${key}: ${value}px;`)
  }

  return lines.join("\n  ")
}
