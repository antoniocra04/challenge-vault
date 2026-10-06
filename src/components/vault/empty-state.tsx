"use client"

import { useCapture } from "@/components/capture/capture-provider"
import { Button } from "@/components/ui/button"

export function EmptyVault() {
  const { open } = useCapture()
  return (
    <div className="specimen border-dashed px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">Хранилище пусто</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        В следующий раз, когда подумаешь «о, а вот это было бы интересно попробовать», — сохрани это сюда, пока
        мысль не улетучилась.
      </p>
      <Button variant="cabinet" size="lg" className="mt-6" onClick={open}>
        Поймать первую идею
      </Button>
      <p className="mt-3 text-xs text-faint">
        или нажми <kbd className="data rounded border border-border px-1.5">C</kbd> где угодно
      </p>
    </div>
  )
}
