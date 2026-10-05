export const SUGGESTED_CATEGORIES = [
  "AI",
  "Self-hosting",
  "Hardware",
  "Photography",
  "Music",
  "Automation",
  "Money",
  "Home",
  "Programming",
  "Experiment",
  "Other",
] as const

export const ABANDON_REASONS = [
  { value: "lost interest", label: "lost interest" },
  { value: "too expensive", label: "too expensive" },
  { value: "too complicated", label: "too complicated" },
  { value: "not interesting anymore", label: "not interesting anymore" },
  { value: "other", label: "other" },
] as const

export const ESTIMATE_PRESETS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "a day", minutes: 480 },
] as const

/** A running session longer than this probably means someone forgot to pause. */
export const LONG_SESSION_SECONDS = 8 * 60 * 60
