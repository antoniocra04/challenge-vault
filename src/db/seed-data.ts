import type { ChallengeInput } from "@/lib/challenges/schemas"

/** Development / demo seed — the challenges from the original spec. */
export const SEED_CHALLENGES: ChallengeInput[] = [
  {
    title: "Smart Apartment",
    description:
      "Сделать мониторинг энергопотребления квартиры в реальном времени и попробовать понять, на чём можно экономить.",
    spark:
      "Впервые начал самостоятельно платить ЖКХ, увидел большую сумму и захотел понять, куда конкретно уходят деньги.",
    category: "Home",
    tags: ["home", "hardware", "measurement", "optimization"],
    estimatedDuration: 360,
    requiresLeavingHome: false,
    requiresMoney: true,
  },
  {
    title: "Photo Archive Experiment",
    description:
      "Попробовать прогнать свой фотоархив через локальную vision-модель и посмотреть, что она сможет в нём найти.",
    category: "AI",
    tags: ["photography", "AI", "experiment"],
    estimatedDuration: 240,
    requiresLeavingHome: false,
    requiresMoney: false,
  },
  {
    title: "Love You to Death",
    description: "Сыграть басовую партию Type O Negative — Love You to Death от начала до конца.",
    spark: "Песня вызывает сильные эмоции, и захотелось самому её сыграть.",
    category: "Music",
    tags: ["music", "bass"],
    estimatedDuration: 60,
    requiresLeavingHome: false,
    requiresMoney: false,
  },
  {
    title: "Home Server Dashboard",
    description: "Сделать красивый dashboard состояния домашнего Raspberry Pi сервера.",
    category: "Self-hosting",
    tags: ["raspberry", "self-hosting", "hardware"],
    estimatedDuration: 120,
    requiresLeavingHome: false,
    requiresMoney: false,
  },
]
