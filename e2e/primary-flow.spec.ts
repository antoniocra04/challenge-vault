import { expect, test, type Page } from "@playwright/test"

// When the instance under test has APP_PASSWORD set, pass it as E2E_PASSWORD.
test.beforeEach(async ({ page }) => {
  const password = process.env.E2E_PASSWORD
  if (!password) return
  await page.goto("/login")
  await page.getByLabel("Пароль").fill(password)
  await page.getByRole("button", { name: "Открыть хранилище" }).click()
  await expect(page).toHaveURL("/")
})

const unique = () => Math.random().toString(36).slice(2, 8)

async function capture(page: Page, title: string, spark?: string) {
  await page.getByRole("banner").getByRole("button", { name: "Поймать" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Что хочется попробовать?").fill(title)
  if (spark) await dialog.getByLabel(/Почему это кажется интересным/).fill(spark)
  await dialog.getByRole("button", { name: "В хранилище" }).click()
  await expect(dialog).toBeHidden()
}

function backlogCard(page: Page, title: string) {
  return page.locator("article[data-backlog-card]", { has: page.getByRole("heading", { name: title, exact: true }) })
}

async function openFromBacklog(page: Page, title: string) {
  const card = backlogCard(page, title)
  await card.getByRole("button", { name: title }).click()
  await card.getByRole("link", { name: "Открыть →" }).click()
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
}

async function deleteChallenge(page: Page, title: string) {
  await page.goto("/")
  await page.getByLabel("Искать в хранилище").fill(title)
  // Wait for the debounced search to land in the URL before navigating away.
  await expect(page).toHaveURL(/\?q=/)
  const link = page.getByRole("link", { name: title })
  const card = backlogCard(page, title)
  await expect(card.or(link).first()).toBeVisible()
  if (await card.count()) await openFromBacklog(page, title)
  else await link.first().click()
  await page.getByRole("button", { name: "Удалить навсегда" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Удалить навсегда" }).click()
  await expect(page).toHaveURL("/")
}

test("capture → start → note → set aside for later → start again → complete", async ({ page }) => {
  const title = `Сыграть Love You to Death ${unique()}`
  await page.goto("/")

  await capture(page, title, "Песня вызывает сильные эмоции")
  const card = backlogCard(page, title)
  await expect(card).toBeVisible()
  // The spark leads the specimen label.
  await expect(card.getByText("Песня вызывает сильные эмоции")).toBeVisible()

  await card.getByRole("button", { name: title }).click()
  await card.getByRole("button", { name: "Начать" }).click()

  // The vault shows a slim strip; the backlog no longer has the card.
  const strip = page.locator("article.ember-panel", { hasText: title })
  await expect(strip).toBeVisible()
  await expect(backlogCard(page, title)).toHaveCount(0)

  // Full panel lives on /active.
  await page.getByRole("link", { name: /^Сейчас/ }).click()
  const panel = page.locator("article.ember-panel", { hasText: title })
  await panel.getByRole("button", { name: "Заметка" }).click()
  await page.getByRole("dialog").getByLabel("Текст записи").fill("Выучил первый куплет")
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить запись" }).click()
  await expect(panel.getByText("Выучил первый куплет")).toBeVisible()

  // Set aside for later: back in the vault, marked as explored before.
  await panel.getByRole("button", { name: "Отложить" }).click()
  await page.getByRole("menuitem", { name: /На потом/ }).click()
  await expect(panel).toHaveCount(0)
  await page.getByRole("link", { name: "Хранилище", exact: true }).click()
  await expect(backlogCard(page, title).getByText("изучалась")).toBeVisible()

  // Start again and complete from the detail page.
  await openFromBacklog(page, title)
  await expect(page.getByText("Выучил первый куплет")).toBeVisible()
  await expect(page.getByText("Возвращено в хранилище")).toBeVisible()
  await page.getByRole("button", { name: "Начать" }).click()
  await expect(page.getByText("Снова в работе", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Завершить" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Что получилось?").fill("Сыграл от начала до конца")
  await dialog.getByRole("radio", { name: "9" }).click()
  await dialog.getByLabel(/Сколько примерно времени/).fill("1 ч 20 мин")
  await dialog.getByRole("button", { name: "Завершить" }).click()

  // The catalogued moment, then the collection with the new artifact highlighted.
  await expect(dialog.getByRole("heading", { name: "Каталогизировано" })).toBeVisible()
  await dialog.getByRole("button", { name: "Открыть коллекцию" }).click()
  await expect(page).toHaveURL(/\/completed\?new=/)
  const artifact = page.getByRole("link", { name: new RegExp(title) })
  await expect(artifact).toBeVisible()
  await expect(artifact.getByText("Сыграл от начала до конца")).toBeVisible()
  await expect(artifact.getByText("1 ч 20 мин")).toBeVisible()
  await expect(artifact.getByText("9/10")).toBeVisible()

  await deleteChallenge(page, title)
})

test("let go → archive → back to the vault", async ({ page }) => {
  const title = `Сделать экранчик статуса сервера ${unique()}`
  await page.goto("/")
  await capture(page, title)
  await backlogCard(page, title).getByRole("button", { name: title }).click()
  await backlogCard(page, title).getByRole("button", { name: "Начать" }).click()

  await page.getByRole("link", { name: /^Сейчас/ }).click()
  const panel = page.locator("article.ember-panel", { hasText: title })
  await panel.getByRole("button", { name: "Отложить" }).click()
  await page.getByRole("menuitem", { name: /Насовсем/ }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "слишком сложно" }).click()
  await dialog.getByRole("button", { name: "Отпустить" }).click()
  await expect(panel).toHaveCount(0)

  await page.getByRole("link", { name: "Архив", exact: true }).click()
  const row = page.locator("li", { hasText: title })
  await expect(row.getByText(/слишком сложно/)).toBeVisible()
  await row.getByRole("button", { name: "Вернуть в хранилище" }).click()
  await expect(row).toHaveCount(0)

  await page.getByRole("link", { name: "Хранилище", exact: true }).click()
  await expect(backlogCard(page, title)).toBeVisible()
  await deleteChallenge(page, title)
})

test("search finds log entries; shuffle keeps the same set", async ({ page }) => {
  const word = `quasar${unique()}`
  const title = `Search target ${unique()}`
  await page.goto("/")
  await capture(page, title)
  await openFromBacklog(page, title)
  await page.getByLabel("Новая запись в журнале").fill(`Нашёл ${word} в логах`)
  await page.getByRole("button", { name: "Добавить запись" }).click()
  await expect(page.getByText(`Нашёл ${word} в логах`)).toBeVisible()

  await page.goto("/")
  await page.getByLabel("Искать в хранилище").fill(word)
  await expect(page).toHaveURL(new RegExp(`q=${word}`))
  await expect(backlogCard(page, title)).toBeVisible()
  await expect(page.locator("article[data-backlog-card]")).toHaveCount(1)

  await page.getByRole("button", { name: "Перемешать" }).click()
  await expect(page).toHaveURL(/sort=random/)
  await expect(backlogCard(page, title)).toBeVisible()

  await deleteChallenge(page, title)
})
