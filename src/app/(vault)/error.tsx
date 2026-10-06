"use client"

import { Button } from "@/components/ui/button"

export default function VaultError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const db = error.message.includes("DATABASE_URL") || error.message.includes("ECONNREFUSED")
  return (
    <div role="alert" className="specimen mx-auto max-w-lg p-8 text-center">
      <h1 className="text-lg font-semibold">{db ? "Нет связи с базой данных" : "Что-то сломалось"}</h1>
      <p className="mt-3 text-muted-foreground">
        {db
          ? "Проверь, что контейнер с базой запущен (docker compose ps), и попробуй ещё раз."
          : "Ничего из сохранённого не потерялось. Попробуй ещё раз; если повторится — подробности в логах сервера."}
      </p>
      {error.digest && <p className="data mt-2 text-xs text-faint">код {error.digest}</p>}
      <Button variant="outline" className="mt-6" onClick={reset}>
        Попробовать ещё раз
      </Button>
    </div>
  )
}
