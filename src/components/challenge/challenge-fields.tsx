"use client"

import { useId } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ESTIMATE_PRESETS, SUGGESTED_CATEGORIES } from "@/lib/constants"
import { formatMinutes, parseDuration } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { TagInput } from "./tag-input"

export type ChallengeFormState = {
  title: string
  spark: string
  description: string
  category: string
  tags: string[]
  estimate: string
  requiresLeavingHome: boolean | null
  requiresMoney: boolean | null
}

export const EMPTY_FORM: ChallengeFormState = {
  title: "",
  spark: "",
  description: "",
  category: "",
  tags: [],
  estimate: "",
  requiresLeavingHome: null,
  requiresMoney: null,
}

export function formStateFrom(c: {
  title: string
  spark: string | null
  description: string | null
  category: string | null
  tags: string[]
  estimatedDuration: number | null
  requiresLeavingHome: boolean | null
  requiresMoney: boolean | null
}): ChallengeFormState {
  return {
    title: c.title,
    spark: c.spark ?? "",
    description: c.description ?? "",
    category: c.category ?? "",
    tags: c.tags,
    estimate: c.estimatedDuration != null ? formatMinutes(c.estimatedDuration) : "",
    requiresLeavingHome: c.requiresLeavingHome,
    requiresMoney: c.requiresMoney,
  }
}

export function estimateError(state: ChallengeFormState): string | null {
  if (!state.estimate.trim()) return null
  return parseDuration(state.estimate) == null ? "Попробуй так: 30 мин, 2 ч или 1 ч 30 мин" : null
}

export function toChallengeInput(state: ChallengeFormState) {
  return {
    title: state.title,
    spark: state.spark,
    description: state.description,
    category: state.category,
    tags: state.tags,
    estimatedDuration: parseDuration(state.estimate),
    requiresLeavingHome: state.requiresLeavingHome,
    requiresMoney: state.requiresMoney,
  }
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground">
        {label} {hint && <span className="text-faint">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Choice<T>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-input p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-8 rounded-md px-3 text-sm transition-colors pointer-coarse:min-h-11",
            value === o.value ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Optional details: description, category, tags, estimate and context flags. */
export function ChallengeDetailFields({
  state,
  onChange,
  tagSuggestions = [],
  showDescription = true,
}: {
  state: ChallengeFormState
  onChange: (patch: Partial<ChallengeFormState>) => void
  tagSuggestions?: string[]
  showDescription?: boolean
}) {
  const uid = useId()
  const estimateErr = estimateError(state)
  return (
    <div className="grid gap-4">
      {showDescription && (
        <Field label="Подробнее об идее" htmlFor={`${uid}-desc`}>
          <Textarea
            id={`${uid}-desc`}
            rows={3}
            value={state.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Что именно хочется сделать или проверить"
          />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Категория" htmlFor={`${uid}-cat`}>
          <Input
            id={`${uid}-cat`}
            value={state.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="без категории"
          />
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_CATEGORIES.filter((c) => c.toLowerCase() !== state.category.trim().toLowerCase())
              .slice(0, 6)
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ category: c })}
                  className="min-h-7 rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:min-h-10"
                >
                  {c}
                </button>
              ))}
          </div>
        </Field>
        <Field label="Сколько примерно займёт" htmlFor={`${uid}-est`}>
          <Input
            id={`${uid}-est`}
            value={state.estimate}
            aria-invalid={estimateErr != null}
            onChange={(e) => onChange({ estimate: e.target.value })}
            placeholder="например, 2 ч"
            className="data"
          />
          <div className="flex flex-wrap gap-1">
            {ESTIMATE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange({ estimate: formatMinutes(p.minutes) })}
                className="data min-h-7 rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:min-h-10"
              >
                {p.label}
              </button>
            ))}
            {estimateErr && <span className="text-xs text-destructive">{estimateErr}</span>}
          </div>
        </Field>
      </div>
      <Field label="Теги" htmlFor={`${uid}-tags`}>
        <TagInput id={`${uid}-tags`} value={state.tags} onChange={(tags) => onChange({ tags })} suggestions={tagSuggestions} />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Field label="Где">
          <Choice
            value={state.requiresLeavingHome}
            onChange={(v) => onChange({ requiresLeavingHome: v })}
            options={[
              { value: null, label: "Не важно" },
              { value: false, label: "Дома" },
              { value: true, label: "Вне дома" },
            ]}
          />
        </Field>
        <Field label="Деньги">
          <Choice
            value={state.requiresMoney}
            onChange={(v) => onChange({ requiresMoney: v })}
            options={[
              { value: null, label: "Не важно" },
              { value: false, label: "Бесплатно" },
              { value: true, label: "Нужны деньги" },
            ]}
          />
        </Field>
      </div>
    </div>
  )
}
