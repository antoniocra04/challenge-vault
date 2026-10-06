"use client"

import { useCapture } from "@/components/capture/capture-provider"
import { Button } from "@/components/ui/button"

export function EmptyVault() {
  const { open } = useCapture()
  return (
    <div className="frame px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">Идей пока нет</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        Добавьте первую: кнопка «Добавить» или клавиша <kbd className="data rounded border border-border px-1.5">C</kbd>.
      </p>
      <Button size="lg" className="mt-6" onClick={open}>
        Добавить идею
      </Button>
    </div>
  )
}
