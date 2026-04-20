export const colors = {
  primary: "#1e40af",
  primaryForeground: "#ffffff",
  secondary: "#64748b",
  secondaryForeground: "#ffffff",
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  border: "#e2e8f0",
  destructive: "#dc2626",
  destructiveForeground: "#ffffff",
  success: "#16a34a",
  warning: "#d97706",
} as const

export const colorsDark: typeof colors = {
  primary: "#3b82f6",
  primaryForeground: "#ffffff",
  secondary: "#94a3b8",
  secondaryForeground: "#0f172a",
  background: "#0f172a",
  foreground: "#f8fafc",
  muted: "#1e293b",
  mutedForeground: "#94a3b8",
  border: "#334155",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  success: "#22c55e",
  warning: "#f59e0b",
}

export type ColorToken = keyof typeof colors
