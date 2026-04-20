import type { Metadata } from "next"
import type { ReactNode } from "react"
import { QueryProvider } from "@/lib/providers/query-provider"
import { I18nProvider } from "@/lib/i18n/provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "App Stack — Web",
  description: "Powered by app-stack-template",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <I18nProvider>{children}</I18nProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
