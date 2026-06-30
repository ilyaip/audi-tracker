# AUDI Tracker

Веб-приложение для отслеживания контейнера с автомобилем и отрисовки его маршрута на Яндекс.Картах.

Стек: **Vue 3 (Composition API, `<script setup>`) + TypeScript + Vite**.

## Как это работает

Сервис дислокации ТрансКонтейнера возвращает только **текущее** положение контейнера, без истории. Поэтому приложение само накапливает точки маршрута: при каждом нажатии «Обновить статус» новая позиция (если событие изменилось) добавляется в историю и сохраняется в `localStorage`. По накопленным точкам строится линия маршрута и маркеры на карте.

## Запуск

```bash
npm install
npm run dev
```

Откройте адрес, который выведет Vite (обычно http://localhost:5173).

## Конфигурация (`.env`)

| Переменная | Назначение |
| --- | --- |
| `VITE_YANDEX_MAPS_API_KEY` | Ключ Яндекс.Карт (JavaScript API). Получить: https://developer.tech.yandex.ru/services/ |
| `VITE_API_BASE` | База API. В dev — `/trcont-api` (прокси Vite). |
| `VITE_CONTAINER_NUMBER` | Номер отслеживаемого контейнера. |

## CORS и прокси

API `isales.trcont.com` не отдаёт CORS-заголовки, поэтому прямой запрос из браузера невозможен.

- **Dev:** запросы идут через прокси Vite (`/trcont-api` → `https://isales.trcont.com/api`), см. `vite.config.ts`.
- **Prod:** соберите свой бэкенд-прокси и укажите его адрес в `VITE_API_BASE`, либо настройте reverse-proxy (nginx и т.п.). Прямое обращение к API из статики не заработает.

## Сборка

```bash
npm run build
npm run preview
```

## Деплой на Vercel (бесплатно)

В проекте уже есть всё необходимое:
- `api/proxy.js` — serverless-функция-прокси (обходит CORS и чинит проблему с TLS-сертификатом апстрима);
- `vercel.json` — переписывает `/trcont-api/unauthorized/dislocation` на эту функцию.

Шаги:

1. Залить репозиторий на GitHub.
2. На https://vercel.com → **Add New → Project** → импортировать репозиторий. Framework определится как **Vite** автоматически.
3. В **Settings → Environment Variables** добавить переменную:
   - `VITE_YANDEX_MAPS_API_KEY` = ваш ключ Яндекс.Карт.
   (Файл `.env` в репозиторий не попадает — он в `.gitignore`, поэтому ключ задаётся в настройках Vercel.)
4. Нажать **Deploy**.
5. После деплоя добавить выданный домен (`*.vercel.app`) в список разрешённых в [Кабинете разработчика Яндекса](https://developer.tech.yandex.ru/services/), иначе карта будет ругаться на запрещённый referer.

`VITE_API_BASE` менять не нужно — по умолчанию `/trcont-api`, и в dev (прокси Vite), и в проде (rewrite на функцию) путь один и тот же.

## Фоновый сбор (даже когда приложение закрыто)

Vercel на бесплатном тарифе запускает cron максимум раз в сутки, поэтому сбор раз в 15 минут вынесен в **GitHub Actions**:

- `.github/workflows/collect.yml` — поддерживает запуск по расписанию (`4,19,34,49 * * * *`, запасной вариант) и по внешнему триггеру (`workflow_dispatch`);
- `scripts/collect.mjs` — запрашивает текущее положение и дописывает точку (с дедупом по `event_id`);
- данные хранятся в файле `history.json` в отдельной ветке **`data`** (чтобы коммиты с данными не триггерили редеплой Vercel);
- фронт читает этот файл с `raw.githubusercontent.com` (`VITE_HISTORY_URL`) и **объединяет** с историей из localStorage — локальные точки не теряются.

Требования:
- Репозиторий должен быть **публичным**, иначе `raw.githubusercontent.com` не отдаст файл без токена.
- Workflow коммитит через `GITHUB_TOKEN` (права `contents: write` уже прописаны в workflow).
- Запустить можно вручную: вкладка **Actions → Collect container dislocation → Run workflow**.

### Надёжный триггер каждые 15 минут (cron-job.org)

Встроенное расписание GitHub Actions — best-effort: запуск может задержаться или быть пропущен. Для стабильного шага в 15 минут используется внешний планировщик, который вызывает `workflow_dispatch` через GitHub API.

1. Создать **fine-grained Personal Access Token**: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained. Доступ только к репозиторию `audi-tracker`, разрешение **Actions: Read and write**, задать срок действия.
2. Завести бесплатный аккаунт на https://cron-job.org и создать job:
   - **URL:** `https://api.github.com/repos/ilyaip/audi-tracker/actions/workflows/collect.yml/dispatches`
   - **Method:** `POST`
   - **Headers:**
     - `Authorization: Bearer <ТОКЕН>`
     - `Accept: application/vnd.github+json`
     - `X-GitHub-Api-Version: 2022-11-28`
   - **Body:** `{"ref":"main"}`
   - **Расписание:** каждые 15 минут.
3. Успешный ответ GitHub — `204 No Content` (тела нет, это нормально).

Токен хранится только в cron-job.org и в репозиторий не попадает.
