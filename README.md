# Challenge Vault

Личное хранилище идей с быстрым сохранением, таймером, журналом и вложениями. Go 1.26 и SQLite обслуживают встроенный интерфейс на React 19, TypeScript и Vite.

## Запуск

```sh
cp .env.example .env
docker compose up -d --build
```

Откройте [Vault на порту 3000](http://localhost:3000). Compose собирает один образ для `linux/arm64` и запускает один сервис. SQLite хранится в томе `vault-data`, прикреплённые файлы в томе `uploads`. Для проверки процесса доступен `/api/health`.

Для запуска с готовым образом скачайте `challenge-vault-arm64.tar.gz` из GitHub Actions для той же версии проекта. Загрузите его командой `docker load -i challenge-vault-arm64.tar.gz` и выполните `docker compose up -d --no-build --pull never`. Если переносите существующие данные, после загрузки образа сначала выполните команду `docker compose run … app migrate` из раздела ниже.

- `APP_PORT` задаёт внешний порт.
- `APP_PASSWORD` включает вход по паролю. При HTTPS установите `COOKIE_SECURE=true`.
- `MAX_UPLOAD_MB` и `MAX_IMPORT_MB` задают ограничения на размер вложения и JSON-импорта.
- `SEED_DEMO_DATA=true` добавляет четыре примера в пустое хранилище.
- `TZ` задаёт часовой пояс дат в экспорте Markdown. В интерфейсе даты отображаются в часовом поясе браузера.

Клавиша **C** открывает захват идеи. По умолчанию Vault использует светлое оформление. В разделе **Данные** можно переключиться на графитовое оформление, экспортировать или импортировать идеи. Выбранное оформление сохраняется в браузере.

## Миграция с PostgreSQL

Исходники Next.js и Drizzle сохранены в репозитории для сверки. Старый рабочий Dockerfile и Compose доступны в ревизии `e2c4f42ca5238f599f97cd859378bbae1875b184`. Перед переносом сохраните исходный PostgreSQL и копию тома `uploads`, которую можно восстановить независимо от новой установки.

В командах `VAULT_PROJECT` — фактическое имя действующего проекта Compose. Сохраните старый Compose и его `.env` рядом со старым приложением. Это позволяет остановить старое приложение, сохранив доступ к контейнеру базы для экспорта.

```sh
export VAULT_PROJECT=challenge-vault
export LEGACY_COMPOSE=/absolute/path/to/old/docker-compose.yml
export LEGACY_ENV=/absolute/path/to/old/.env

docker compose -p "$VAULT_PROJECT" --env-file "$LEGACY_ENV" -f "$LEGACY_COMPOSE" stop app

(umask 077
 docker compose -p "$VAULT_PROJECT" --env-file "$LEGACY_ENV" -f "$LEGACY_COMPOSE" exec -T db \
   sh -c 'psql -Atq -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
   < scripts/export-vault-postgres.sql > vault-postgres.json
)
```

Скрипт читает все три таблицы в одной транзакции PostgreSQL. В JSON сохраняются ID, исходные даты, накопленные секунды, время начала текущего сеанса, журнал и ключи вложений. Время таймера продолжает идти с сохранённой даты начала. Подойдёт и JSON версии 1, экспортированный из предыдущего приложения до переноса.

Запустите миграцию с тем же именем проекта Compose. Скрипт ожидает новую пустую базу SQLite и существующий том `uploads`. Он проверяет записи, ссылки на файлы, размеры и байты при их наличии в экспорте. При ошибке транзакция откатывается. Строгая миграция сохраняет исходные ключи и оставляет файлы в томе.

```sh
docker compose -p "$VAULT_PROJECT" build app
docker compose -p "$VAULT_PROJECT" run --rm --no-deps -T app migrate - < vault-postgres.json
docker compose -p "$VAULT_PROJECT" up -d --no-build --pull never app
```

Сверьте итоговые счётчики с экспортом и проверьте несколько вложений, идеи во всех состояниях и активный таймер. При включённом пароле потребуется войти заново. После проверки остановите старый контейнер PostgreSQL командой `docker compose -p "$VAULT_PROJECT" --env-file "$LEGACY_ENV" -f "$LEGACY_COMPOSE" stop db`. Старая база остаётся в томе `db-data`. Для отката остановите новый сервис, восстановите резервную копию `uploads`, если Vault уже изменял вложения, и запустите старую конфигурацию Compose с прежним именем проекта. Во время переноса и отката сохраняйте тома.

## Локальная разработка

В первом терминале запустите API с Go 1.26, во втором — Vite с Node.js 24.

```sh
go run ./cmd/vault
```

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
```

Путь к локальной базе можно изменить через `SQLITE_PATH`, рабочей папке файлов через `UPLOAD_DIR`. Интерфейс разработки по умолчанию проксирует API на порт 3000. Для проверки production-сборки соберите Vite и встроенный бинарный файл.

```sh
npm --prefix frontend run build
go test -tags embedspa ./...
go build -tags embedspa -o /tmp/challenge-vault ./cmd/vault
/tmp/challenge-vault
```
