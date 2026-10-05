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
  return parseDuration(state.estimate) == null ? "Try 30m, 2h or 1h 30m" : null
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
    <div className="grid gap-1.5">
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
            "rounded-md px-2.5 py-1 text-xs transition-colors",
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
        <Field label="More about the idea" htmlFor={`${uid}-desc`}>
          <Textarea
            id={`${uid}-desc`}
            rows={3}
            value={state.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="CPU / RAM / температура / uptime / storage."
          />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor={`${uid}-cat`}>
          <Input
            id={`${uid}-cat`}
            list={`${uid}-cats`}
            value={state.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="Hardware"
          />
          <datalist id={`${uid}-cats`}>
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Estimated time" htmlFor={`${uid}-est`}>
          <Input
            id={`${uid}-est`}
            value={state.estimate}
            aria-invalid={estimateErr != null}
            onChange={(e) => onChange({ estimate: e.target.value })}
            placeholder="2h"
            className="font-mono"
          />
          <div className="flex flex-wrap gap-1">
            {ESTIMATE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange({ estimate: formatMinutes(p.minutes) })}
                className="rounded px-1.5 py-0.5 font-mono text-[11px] text-faint transition-colors hover:bg-white/5 hover:text-muted-foreground"
              >
                {p.label}
              </button>
            ))}
            {estimateErr && <span className="text-xs text-destructive">{estimateErr}</span>}
          </div>
        </Field>
      </div>
      <Field label="Tags" htmlFor={`${uid}-tags`}>
        <TagInput id={`${uid}-tags`} value={state.tags} onChange={(tags) => onChange({ tags })} suggestions={tagSuggestions} />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Field label="Where">
          <Choice
            value={state.requiresLeavingHome}
            onChange={(v) => onChange({ requiresLeavingHome: v })}
            options={[
              { value: null, label: "—" },
              { value: false, label: "🏠 Home" },
              { value: true, label: "🚶 Outside" },
            ]}
          />
        </Field>
        <Field label="Money">
          <Choice
            value={state.requiresMoney}
            onChange={(v) => onChange({ requiresMoney: v })}
            options={[
              { value: null, label: "—" },
              { value: false, label: "Free" },
              { value: true, label: "💰 Costs money" },
            ]}
          />
        </Field>
      </div>
    </div>
  )
}
