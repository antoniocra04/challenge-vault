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
  { value: "пропал интерес", label: "пропал интерес" },
  { value: "слишком дорого", label: "слишком дорого" },
  { value: "слишком сложно", label: "слишком сложно" },
  { value: "уже не актуально", label: "уже не актуально" },
  { value: "другое", label: "другое" },
] as const

export const ESTIMATE_PRESETS = [
  { label: "30 мин", minutes: 30 },
  { label: "1 ч", minutes: 60 },
  { label: "2 ч", minutes: 120 },
  { label: "4 ч", minutes: 240 },
  { label: "день", minutes: 480 },
] as const

/** A running session longer than this probably means someone forgot to pause. */
export const LONG_SESSION_SECONDS = 8 * 60 * 60
