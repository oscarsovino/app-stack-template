import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import "intl-pluralrules"
import { resources, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from "@app-stack/shared-i18n"

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false },
})

export default i18n
