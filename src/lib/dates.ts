import { format, formatDistanceToNowStrict, isSameYear } from "date-fns"

export function shortDate(d: Date | null | undefined): string {
  if (!d) return ""
  return isSameYear(d, new Date()) ? format(d, "MMM d") : format(d, "MMM d, yyyy")
}

export function longDate(d: Date | null | undefined): string {
  if (!d) return ""
  return format(d, "MMMM d, yyyy")
}

export function timeOfDay(d: Date): string {
  return format(d, "HH:mm")
}

export function ago(d: Date | null | undefined): string {
  if (!d) return ""
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return "just now"
  return `${formatDistanceToNowStrict(d)} ago`
}
