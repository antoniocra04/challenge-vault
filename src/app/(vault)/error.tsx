"use client"

import { Button } from "@/components/ui/button"

export default function VaultError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const db = error.message.includes("DATABASE_URL") || error.message.includes("ECONNREFUSED")
  return (
    <div role="alert" className="frame mx-auto max-w-lg p-8 text-center">
      <h1 className="text-lg font-semibold">{db ? "Не удалось подключиться к базе данных" : "Что-то пошло не так"}</h1>
      <p className="mt-3 text-muted-foreground">
        {db
          ? "Проверьте, что контейнер с базой запущен (docker compose ps)."
          : "Попробуйте ещё раз. Подробности — в логах сервера."}
      </p>
      {error.digest && <p className="data mt-2 text-xs text-faint">код {error.digest}</p>}
      <Button variant="outline" className="mt-6" onClick={reset}>
        Повторить
      </Button>
    </div>
  )
}
