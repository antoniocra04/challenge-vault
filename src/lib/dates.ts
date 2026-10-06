import { format, formatDistanceToNowStrict, isSameYear } from "date-fns"
import { ru } from "date-fns/locale"

export function shortDate(d: Date | null | undefined): string {
  if (!d) return ""
  return isSameYear(d, new Date()) ? format(d, "d MMM", { locale: ru }) : format(d, "d MMM yyyy", { locale: ru })
}

export function longDate(d: Date | null | undefined): string {
  if (!d) return ""
  return format(d, "d MMMM yyyy", { locale: ru })
}

export function dayAndTime(d: Date): string {
  return format(d, "d MMM · HH:mm", { locale: ru })
}

export function timeOfDay(d: Date): string {
  return format(d, "HH:mm")
}

export function ago(d: Date | null | undefined): string {
  if (!d) return ""
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return "только что"
  return `${formatDistanceToNowStrict(d, { locale: ru })} назад`
}

/** "добавлена 3 месяца назад" — how long an idea has been in the list. */
export function addedAgo(d: Date): string {
  const diff = Date.now() - d.getTime()
  if (diff < 24 * 3600_000) return "добавлена сегодня"
  return `добавлена ${formatDistanceToNowStrict(d, { locale: ru, roundingMethod: "floor" })} назад`
}
