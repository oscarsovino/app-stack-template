import en, { type Translations } from "./en"
import es from "./es"

export { en, es }
export type { Translations }
export type { TxKeyPath } from "./types"

export const supportedLanguages = [
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "en", name: "English", nativeName: "English" },
] as const

export type SupportedLanguageCode = (typeof supportedLanguages)[number]["code"]

export const resources = {
  es: { translation: es },
  en: { translation: en },
} as const

export const DEFAULT_LANGUAGE: SupportedLanguageCode = "es"
export const FALLBACK_LANGUAGE: SupportedLanguageCode = "en"
