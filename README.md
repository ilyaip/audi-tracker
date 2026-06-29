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
