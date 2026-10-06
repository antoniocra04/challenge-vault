"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DownloadIcon,
  FileIcon,
  ImageIcon,
  LinkIcon,
  Loader2Icon,
  MusicIcon,
  NotebookPenIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"
import { addLinkAttachment, addTextAttachment, deleteAttachment } from "@/app/actions"
import { ConfirmInline } from "@/components/challenge/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Attachment } from "@/db/schema"
import { useAction } from "@/hooks/use-action"
import { cn } from "@/lib/utils"

type Mode = "link" | "note" | "file" | null

function fileUrl(a: Attachment, download = false) {
  return `/api/attachments/${a.id}${download ? "?download=1" : ""}`
}

function formatBytes(n: number | null) {
  if (n == null) return ""
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function AttachmentsSection({ challengeId, items }: { challengeId: string; items: Attachment[] }) {
  const [mode, setMode] = useState<Mode>(null)
  const images = items.filter((a) => a.kind === "image" && a.storageKey)
  const others = items.filter((a) => !(a.kind === "image" && a.storageKey))

  return (
    <div className="grid gap-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((a) => (
            <figure key={a.id} className="group relative overflow-hidden rounded-lg border border-border bg-black/30">
              <a href={fileUrl(a)} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl(a)}
                  alt={a.title ?? a.fileName ?? "вложение"}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </a>
              <figcaption className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-muted-foreground">
                <span className="truncate">{a.title ?? a.fileName}</span>
                <DeleteAttachment id={a.id} />
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <ul className="grid gap-2">
          {others.map((a) => (
            <AttachmentRow key={a.id} a={a} />
          ))}
        </ul>
      )}

      {items.length === 0 && mode == null && (
        <p className="text-sm text-muted-foreground">Референсы, ссылки, фото, запись рифа — всё, что поможет.</p>
      )}

      <div className="flex flex-wrap gap-1">
        {(
          [
            ["link", LinkIcon, "Ссылка"],
            ["note", NotebookPenIcon, "Заметка"],
            ["file", UploadIcon, "Файл"],
          ] as const
        ).map(([m, Icon, label]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(mode === m ? null : m)}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors pointer-coarse:min-h-11",
              mode === m
                ? "border-white/20 bg-white/5 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3" />
            {label}
          </button>
        ))}
      </div>

      {mode === "link" && <LinkForm challengeId={challengeId} onDone={() => setMode(null)} />}
      {mode === "note" && <NoteForm challengeId={challengeId} onDone={() => setMode(null)} />}
      {mode === "file" && <FileForm challengeId={challengeId} onDone={() => setMode(null)} />}
    </div>
  )
}

function AttachmentRow({ a }: { a: Attachment }) {
  const [open, setOpen] = useState(false)
  const base = "rounded-lg border border-border bg-white/[0.02] px-3 py-2.5"

  if (a.kind === "url" && a.url) {
    return (
      <li className={cn(base, "flex items-center gap-3")}>
        <LinkIcon className="size-4 shrink-0 text-faint" />
        <a href={a.url} target="_blank" rel="noreferrer noopener" className="min-w-0 flex-1 hover:text-ember">
          <span className="block truncate text-sm">{a.title ?? hostname(a.url)}</span>
          <span className="block truncate text-xs text-muted-foreground">{a.title ? hostname(a.url) : a.url}</span>
        </a>
        <DeleteAttachment id={a.id} />
      </li>
    )
  }

  if (a.kind === "text") {
    return (
      <li className={base}>
        <div className="flex items-center gap-3">
          <NotebookPenIcon className="size-4 shrink-0 text-faint" />
          <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 truncate text-left text-sm">
            {a.title ?? a.content?.split("\n")[0] ?? "Заметка"}
          </button>
          <DeleteAttachment id={a.id} />
        </div>
        {open && <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{a.content}</p>}
      </li>
    )
  }

  const missing = !a.storageKey
  const Icon = a.kind === "audio" ? MusicIcon : a.kind === "image" ? ImageIcon : FileIcon
  return (
    <li className={base}>
      <div className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-faint" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm">{a.title ?? a.fileName}</span>
          <span className="block text-xs text-muted-foreground">
            {missing ? "файл пропал из хранилища" : [a.mimeType, formatBytes(a.size)].filter(Boolean).join(" · ")}
          </span>
        </div>
        {!missing && (
          <a href={fileUrl(a, true)} className="text-faint hover:text-foreground" aria-label="Скачать">
            <DownloadIcon className="size-4" />
          </a>
        )}
        <DeleteAttachment id={a.id} />
      </div>
      {a.kind === "audio" && !missing && (
        <audio controls preload="none" src={fileUrl(a)} className="mt-2 h-10 w-full" />
      )}
    </li>
  )
}

function DeleteAttachment({ id }: { id: string }) {
  const { pending, run } = useAction()
  return <ConfirmInline label="Удалить вложение" disabled={pending} onConfirm={() => run(() => deleteAttachment(id))} />
}

function LinkForm({ challengeId, onDone }: { challengeId: string; onDone: () => void }) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const { pending, run } = useAction()
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => addLinkAttachment(challengeId, url, title || null), { onSuccess: onDone })
      }}
    >
      <Input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/…" aria-label="Ссылка" />
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название (необязательно)" aria-label="Название" />
      <Button type="submit" size="sm" disabled={pending || !url.trim()} className="justify-self-end">
        Прикрепить ссылку
      </Button>
    </form>
  )
}

function NoteForm({ challengeId, onDone }: { challengeId: string; onDone: () => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const { pending, run } = useAction()
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => addTextAttachment(challengeId, content, title || null), { onSuccess: onDone })
      }}
    >
      <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название (необязательно)" aria-label="Название" />
      <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Табы, аккорды, список деталей…" aria-label="Текст заметки" />
      <Button type="submit" size="sm" disabled={pending || !content.trim()} className="justify-self-end">
        Прикрепить заметку
      </Button>
    </form>
  )
}

function FileForm({ challengeId, onDone }: { challengeId: string; onDone: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const upload = async (files: FileList | File[]) => {
    const list = [...files]
    if (list.length === 0) return
    setUploading(true)
    try {
      for (const file of list) {
        const form = new FormData()
        form.set("challengeId", challengeId)
        form.set("file", file)
        const res = await fetch("/api/attachments", { method: "POST", body: form })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(`${file.name}: ${body.error ?? "не удалось загрузить"}`)
        }
      }
      router.refresh()
      onDone()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        void upload(e.dataTransfer.files)
      }}
      className={cn(
        "grid place-items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
        dragging ? "border-ember/60 bg-ember/5" : "border-white/10",
      )}
    >
      {uploading ? (
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Перетащи сюда фото, аудио или любой файл</p>
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            Выбрать файлы
          </Button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => e.target.files && void upload(e.target.files)}
      />
    </div>
  )
}
