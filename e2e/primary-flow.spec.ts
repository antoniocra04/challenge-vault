import { expect, test, type Page } from "@playwright/test"

// When the instance under test has APP_PASSWORD set, pass it as E2E_PASSWORD.
test.beforeEach(async ({ page }) => {
  const password = process.env.E2E_PASSWORD
  if (!password) return
  await page.goto("/login")
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Open the vault" }).click()
  await expect(page).toHaveURL("/")
})

const unique = () => Math.random().toString(36).slice(2, 8)

async function capture(page: Page, title: string, spark?: string) {
  await page.getByRole("button", { name: "+ Capture" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("What do you want to try?").fill(title)
  if (spark) await dialog.getByLabel(/Why does this seem interesting/).fill(spark)
  await dialog.getByRole("button", { name: "Save to vault" }).click()
  await expect(dialog).toBeHidden()
}

function backlogCard(page: Page, title: string) {
  return page.locator("article[data-backlog-card]", { has: page.getByRole("heading", { name: title, exact: true }) })
}

async function deleteChallenge(page: Page, title: string) {
  await page.goto("/")
  await page.getByLabel("Search challenges").fill(title)
  const link = page.getByRole("link", { name: title })
  const card = backlogCard(page, title)
  await expect(card.or(link).first()).toBeVisible()
  if (await card.count()) {
    await card.click()
    await card.getByRole("link", { name: "Open →" }).click()
  } else {
    await link.first().click()
  }
  await page.getByRole("button", { name: "Delete forever" }).click()
  await page.getByRole("dialog").getByRole("button", { name: "Delete forever" }).click()
  await expect(page).toHaveURL("/")
}

test("capture → start → log → return → start again → complete", async ({ page }) => {
  const title = `Сыграть Love You to Death ${unique()}`
  await page.goto("/")

  await capture(page, title, "Песня вызывает сильные эмоции")
  const card = backlogCard(page, title)
  await expect(card).toBeVisible()

  // Expand the card and start the challenge.
  await card.click()
  await expect(card.getByText("Песня вызывает сильные эмоции")).toBeVisible()
  await card.getByRole("button", { name: "Start challenge" }).click()

  const current = page.locator("article.ember-panel", { hasText: title })
  await expect(current).toBeVisible()
  await expect(current.getByText("⚡ Active")).toBeVisible()
  await expect(backlogCard(page, title)).toHaveCount(0)

  // Add a note from the current challenge panel.
  await current.getByRole("button", { name: "Add note" }).click()
  await page.getByRole("dialog").getByRole("textbox").fill("Выучил первый куплет")
  await page.getByRole("dialog").getByRole("button", { name: "Save note" }).click()
  await expect(current.getByText("Выучил первый куплет")).toBeVisible()

  // Return to the vault: back in the backlog, marked as explored.
  await current.getByRole("button", { name: "Return to vault" }).click()
  await expect(page.locator("article.ember-panel", { hasText: title })).toHaveCount(0)
  await expect(backlogCard(page, title).getByText(/explored/)).toBeVisible()

  // Start again and complete from the detail page.
  await backlogCard(page, title).click()
  await backlogCard(page, title).getByRole("link", { name: "Open →" }).click()
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
  await expect(page.getByText("Выучил первый куплет")).toBeVisible()
  await expect(page.getByText("Returned to the vault")).toBeVisible()
  await page.getByRole("button", { name: "Start challenge" }).click()
  await expect(page.getByText("Picked up again")).toBeVisible()

  await page.getByRole("button", { name: "Complete challenge" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("What happened?").fill("Сыграл от начала до конца")
  await dialog.getByRole("radio", { name: "9" }).click()
  await dialog.getByLabel(/how much time/).fill("1h 20m")
  await dialog.getByRole("button", { name: "Complete" }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText("✓ Completed").first()).toBeVisible()

  // It shows up in the completed collection.
  await page.getByRole("link", { name: "Completed", exact: true }).click()
  const artifact = page.getByRole("link", { name: new RegExp(title) })
  await expect(artifact).toBeVisible()
  await expect(artifact.getByText("Сыграл от начала до конца")).toBeVisible()
  await expect(artifact.getByText("1h 20m")).toBeVisible()
  await expect(artifact.getByText("9/10")).toBeVisible()

  await deleteChallenge(page, title)
})

test("abandon → archive → back to vault", async ({ page }) => {
  const title = `Сделать экранчик статуса сервера ${unique()}`
  await page.goto("/")
  await capture(page, title)
  await backlogCard(page, title).click()
  await backlogCard(page, title).getByRole("button", { name: "Start challenge" }).click()

  const current = page.locator("article.ember-panel", { hasText: title })
  await current.getByRole("button", { name: "Abandon" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "too complicated" }).click()
  await dialog.getByRole("button", { name: "Let it go" }).click()
  await expect(current).toHaveCount(0)

  await page.getByRole("link", { name: "Archive", exact: true }).click()
  const row = page.locator("li", { hasText: title })
  await expect(row.getByText("too complicated")).toBeVisible()
  await row.getByRole("button", { name: "Back to vault" }).click()
  await expect(row).toHaveCount(0)

  await page.getByRole("link", { name: "Vault", exact: true }).click()
  await expect(backlogCard(page, title)).toBeVisible()
  await deleteChallenge(page, title)
})

test("search finds log entries and filters narrow the backlog", async ({ page }) => {
  const word = `quasar${unique()}`
  const title = `Search target ${unique()}`
  await page.goto("/")
  await capture(page, title)
  await backlogCard(page, title).click()
  await backlogCard(page, title).getByRole("link", { name: "Open →" }).click()
  await page.getByLabel("New log entry").fill(`Нашёл ${word} в логах`)
  await page.getByRole("button", { name: "+ Add entry" }).click()
  await expect(page.getByText(`Нашёл ${word} в логах`)).toBeVisible()

  await page.goto("/")
  await page.getByLabel("Search challenges").fill(word)
  await expect(page).toHaveURL(new RegExp(`q=${word}`))
  await expect(backlogCard(page, title)).toBeVisible()
  await expect(page.locator("article[data-backlog-card]")).toHaveCount(1)

  // Shuffle keeps the same set, just reorders.
  await page.getByRole("button", { name: "Shuffle" }).click()
  await expect(page).toHaveURL(/sort=random/)
  await expect(backlogCard(page, title)).toBeVisible()

  await deleteChallenge(page, title)
})
