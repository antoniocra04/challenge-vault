import { expect, test, type Page } from "@playwright/test"

// When the instance under test has APP_PASSWORD set, pass it as E2E_PASSWORD.
test.beforeEach(async ({ page }) => {
  const password = process.env.E2E_PASSWORD
  if (!password) return
  await page.goto("/login")
  await page.getByLabel("Пароль").fill(password)
  await page.getByRole("button", { name: "Войти" }).click()
  await expect(page).toHaveURL("/")
})

const unique = () => Math.random().toString(36).slice(2, 8)

async function capture(page: Page, title: string, spark?: string) {
  await page.getByRole("banner").getByRole("button", { name: "Добавить" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Что хочется попробовать").fill(title)
  if (spark) await dialog.getByLabel(/Почему захотелось/).fill(spark)
  await dialog.getByRole("button", { name: "Сохранить" }).click()
  await expect(dialog).toBeHidden()
}

function backlogCard(page: Page, title: string) {
  return page.locator("article[data-backlog-card]", { has: page.getByRole("heading", { name: title, exact: true }) })
}

async function openFromBacklog(page: Page, title: string) {
  const card = backlogCard(page, title)
  await card.getByRole("button", { name: title }).click()
  await card.getByRole("link", { name: "Подробнее" }).click()
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
}

async function deleteChallenge(page: Page, title: string) {
  await page.goto("/")
  await page.getByRole("searchbox", { name: "Поиск" }).fill(title)
  // Wait for the debounced search to land in the URL before navigating away.
  await expect(page).toHaveURL(/\?q=/)
  const link = page.getByRole("link", { name: title })
  const card = backlogCard(page, title)
  await expect(card.or(link).first()).toBeVisible()
  if (await card.count()) await openFromBacklog(page, title)
  else await link.first().click()
  await page.getByRole("button", { name: "Удалить", exact: true }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Удалить", exact: true }).click()
  await expect(page).toHaveURL("/")
}

const inProgress = (page: Page, title: string) => page.locator("article:not([data-backlog-card])", { hasText: title })

test("add → start → note → back to the list → start again → complete", async ({ page }) => {
  const title = `Сыграть Love You to Death ${unique()}`
  await page.goto("/")

  await capture(page, title, "Песня вызывает сильные эмоции")
  const card = backlogCard(page, title)
  await expect(card).toBeVisible()
  // Why it was wanted shows on the frame itself.
  await expect(card.getByText("Песня вызывает сильные эмоции")).toBeVisible()

  await card.getByRole("button", { name: title }).click()
  await card.getByRole("button", { name: "Начать" }).click()

  // In progress: a circled frame on top, gone from the list.
  await expect(inProgress(page, title)).toBeVisible()
  await expect(backlogCard(page, title)).toHaveCount(0)

  await page.getByRole("link", { name: /^В работе/ }).click()
  const panel = inProgress(page, title)
  await panel.getByRole("button", { name: "Заметка" }).click()
  await page.getByRole("dialog").getByLabel("Текст заметки").fill("Выучил первый куплет")
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить" }).click()
  await expect(panel.getByText("Выучил первый куплет")).toBeVisible()

  await panel.getByRole("button", { name: "Отложить" }).click()
  await page.getByRole("menuitem", { name: /Вернуть в идеи/ }).click()
  await expect(panel).toHaveCount(0)
  await page.getByRole("link", { name: "Идеи", exact: true }).click()
  await backlogCard(page, title).getByRole("button", { name: title }).click()
  await expect(backlogCard(page, title).getByText("уже начиналась")).toBeVisible()

  // Start again and complete from the detail page.
  await backlogCard(page, title).getByRole("link", { name: "Подробнее" }).click()
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
  await expect(page.getByText("Выучил первый куплет")).toBeVisible()
  await expect(page.getByText("Возвращено в список")).toBeVisible()
  await page.getByRole("button", { name: "Начать" }).click()
  await expect(page.getByText("Начато снова", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Завершить" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel(/Что получилось/).fill("Сыграл от начала до конца")
  await dialog.getByRole("radio", { name: "9" }).click()
  await dialog.getByLabel(/Сколько времени ушло/).fill("1 ч 20 мин")
  await dialog.getByRole("button", { name: "Завершить" }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole("button", { name: "Открыть", exact: true }).click()
  await expect(page).toHaveURL(/\/completed\?new=/)
  const done = page.getByRole("link", { name: new RegExp(title) })
  await expect(done).toBeVisible()
  await expect(done.getByText("Сыграл от начала до конца")).toBeVisible()
  await expect(done.getByText(/1 ч 20 мин/)).toBeVisible()
  await expect(done.getByText(/понравилось на 9 из 10/)).toBeVisible()

  await deleteChallenge(page, title)
})

test("archive → back to the list", async ({ page }) => {
  const title = `Сделать экранчик статуса сервера ${unique()}`
  await page.goto("/")
  await capture(page, title)
  await backlogCard(page, title).getByRole("button", { name: title }).click()
  await backlogCard(page, title).getByRole("button", { name: "Начать" }).click()

  await page.getByRole("link", { name: /^В работе/ }).click()
  const panel = inProgress(page, title)
  await panel.getByRole("button", { name: "Отложить" }).click()
  await page.getByRole("menuitem", { name: /В архив/ }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "сложно" }).click()
  await dialog.getByRole("button", { name: "В архив", exact: true }).click()
  await expect(panel).toHaveCount(0)

  await page.getByRole("link", { name: "Архив", exact: true }).click()
  const row = page.locator("li", { hasText: title })
  await expect(row.getByText(/сложно/)).toBeVisible()
  await row.getByRole("button", { name: "Вернуть в идеи" }).click()
  await expect(row).toHaveCount(0)

  await page.getByRole("link", { name: "Идеи", exact: true }).click()
  await expect(backlogCard(page, title)).toBeVisible()
  await deleteChallenge(page, title)
})

test("search finds notes; shuffle keeps the same set", async ({ page }) => {
  const word = `quasar${unique()}`
  const title = `Search target ${unique()}`
  await page.goto("/")
  await capture(page, title)
  await openFromBacklog(page, title)
  await page.getByLabel("Новая заметка").fill(`Нашёл ${word} в логах`)
  await page.getByRole("main").getByRole("button", { name: "Добавить", exact: true }).click()
  await expect(page.getByText(`Нашёл ${word} в логах`)).toBeVisible()

  await page.goto("/")
  await page.getByRole("searchbox", { name: "Поиск" }).fill(word)
  await expect(page).toHaveURL(new RegExp(`q=${word}`))
  await expect(backlogCard(page, title)).toBeVisible()
  await expect(page.locator("article[data-backlog-card]")).toHaveCount(1)

  await page.getByRole("button", { name: "Перемешать" }).click()
  await expect(page).toHaveURL(/sort=random/)
  await expect(backlogCard(page, title)).toBeVisible()

  await deleteChallenge(page, title)
})
