import type { Translations } from "./en"

type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}.${Path<T[K]>}`
    : `${K}`
  : never

export type TxKeyPath = Path<Translations>
