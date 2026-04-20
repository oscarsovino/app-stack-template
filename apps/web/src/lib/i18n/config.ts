import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { resources, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from "@app-stack/shared-i18n"

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
  })
}

export default i18n
