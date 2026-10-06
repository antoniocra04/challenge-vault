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

/** "ждёт 3 месяца" — how long an idea has been waiting in the vault. */
export function waitingFor(d: Date): string {
  const diff = Date.now() - d.getTime()
  if (diff < 24 * 3600_000) return "поймана сегодня"
  return `ждёт ${formatDistanceToNowStrict(d, { locale: ru, roundingMethod: "floor" })}`
}

/** Accession number as printed on a specimen label: № 007. */
export function accession(n: number | null | undefined): string {
  if (n == null) return "№ —"
  return `№ ${String(n).padStart(3, "0")}`
}
