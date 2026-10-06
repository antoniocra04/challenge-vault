import { z } from "zod"
import { parseTags } from "./filters"

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => {
      const t = v?.trim()
      return t ? t : null
    })

const optionalMinutes = z
  .number()
  .int()
  .min(0)
  .max(1_000_000)
  .nullish()
  .transform((v) => v ?? null)

export const challengeInputSchema = z.object({
  title: z.string().trim().min(1, "Назови идею").max(300),
  description: optionalText(20_000),
  spark: optionalText(20_000),
  category: optionalText(60),
  tags: z
    .array(z.string())
    .max(50)
    .default([])
    .transform((tags) => parseTags(tags)),
  estimatedDuration: optionalMinutes,
  requiresLeavingHome: z.boolean().nullish().transform((v) => v ?? null),
  requiresMoney: z.boolean().nullish().transform((v) => v ?? null),
  favorite: z.boolean().optional(),
})

export type ChallengeInput = z.input<typeof challengeInputSchema>
export type ChallengeData = z.output<typeof challengeInputSchema>

export const completeInputSchema = z.object({
  result: optionalText(20_000),
  enjoymentScore: z.number().int().min(1).max(10).nullish().transform((v) => v ?? null),
  actualDuration: optionalMinutes,
})

export type CompleteInput = z.input<typeof completeInputSchema>

export const abandonInputSchema = z.object({
  reason: optionalText(500),
})

export const logEntryInputSchema = z.object({
  content: z.string().trim().min(1, "Сначала напиши что-нибудь").max(20_000),
})

export const linkAttachmentSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(4000)
    .transform((v) => (/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`))
    .pipe(z.url({ protocol: /^https?$/, message: "Это не похоже на ссылку" })),
  title: optionalText(300),
})

export const textAttachmentSchema = z.object({
  title: optionalText(300),
  content: z.string().trim().min(1, "Заметка пустая").max(100_000),
})

export const idSchema = z.uuid()
