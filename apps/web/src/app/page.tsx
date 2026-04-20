"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">app-stack-template · web</h1>
      <Card className="space-y-4 p-6">
        <p className="text-[var(--color-muted-foreground)]">{t("common.loading")}</p>
        <div className="flex gap-2">
          <Button>{t("common.save")}</Button>
          <Button variant="secondary">{t("common.cancel")}</Button>
        </div>
      </Card>
    </main>
  )
}
