"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<"merge" | "replace">("merge")
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const submit = async () => {
    if (!file) return
    if (
      mode === "replace" &&
      !confirm("Заменить всё? Сначала будут удалены все текущие идеи, журналы и вложения.")
    ) {
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.set("file", file)
      const res = await fetch(`/api/import?mode=${mode}`, { method: "POST", body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Импорт не удался.")
        return
      }
      const r = body.result
      toast.success(
        `Импортировано: идей — ${r.challenges}, записей журнала — ${r.logEntries}, вложений — ${r.attachments}.`,
      )
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="specimen grid gap-5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <UploadIcon />
          Выбрать JSON-файл
        </Button>
        <span className="truncate text-sm text-muted-foreground">{file ? file.name : "файл не выбран"}</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm text-muted-foreground">Как импортировать</legend>
        {(
          [
            ["merge", "Добавить", "Добавить идеи из файла. Уже существующие (с тем же id) заменятся версией из файла."],
            ["replace", "Заменить всё", "Очистить хранилище и восстановить его из файла. Для восстановления из резервной копии."],
          ] as const
        ).map(([value, label, desc]) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              mode === value ? "border-white/20 bg-white/[0.04]" : "border-border",
            )}
          >
            <input
              type="radio"
              name="mode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="mt-1 accent-[var(--cabinet)]"
            />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-sm text-muted-foreground">{desc}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Button onClick={submit} disabled={!file || busy} className="justify-self-start">
        {busy && <Loader2Icon className="animate-spin" />}
        Импортировать
      </Button>
    </div>
  )
}
