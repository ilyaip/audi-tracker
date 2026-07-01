// Сборщик дислокации для GitHub Actions (вариант фонового сбора).
// Запрашивает текущее положение контейнера и дописывает новую точку в JSON-историю.
// Использование: node scripts/collect.mjs <путь-к-history.json>
//
// Структура точки полностью совпадает с TrackPoint на фронте, чтобы мёрж был корректным.

import https from 'node:https'
import { readFileSync, writeFileSync } from 'node:fs'

const CONTAINER = process.env.CONTAINER_NUMBER || 'TKRU4596490'
const filePath = process.argv[2]
const TG_TOKEN = process.env.TG_BOT_TOKEN || ''
const TG_CHAT = process.env.TG_CHAT_ID || ''

if (!filePath) {
  console.error('Не указан путь к файлу истории. Пример: node scripts/collect.mjs out/history.json')
  process.exit(1)
}

function fetchDislocation() {
  const path = `/api/unauthorized/dislocation?search_type=equipment&term=${encodeURIComponent(
    CONTAINER,
  )}`
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: 'isales.trcont.com',
        path,
        method: 'GET',
        headers: { Accept: 'application/json' },
        // У апстрима неполная цепочка TLS-сертификата — отключаем проверку точечно.
        rejectUnauthorized: false,
      },
      (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
            return
          }
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.end()
  })
}

function toTrackPoint(event) {
  return {
    eventId: event.event_id,
    datetime: event.datetime,
    recordedAt: new Date().toISOString(),
    stationId: event.station_id,
    sequence: event.sequence,
    latitude: event.position.latitude,
    longitude: event.position.longitude,
    stationNameRu: event.position.name_ru,
    stationNameEn: event.position.name_en,
    countryRu: event.country.name_ru,
    statusRu: event.status.name_ru,
    leftDistanceKm: event.position.left_distance_leg,
  }
}

function loadHistory(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Форматирует число с разделителем тысяч (8878 → «8 878»). */
function fmtNum(n) {
  return Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

/** Считает % пройденного по всей накопленной истории. */
function calcProgress(history, current) {
  const start = Math.max(...history.map((p) => p.leftDistanceKm))
  if (!isFinite(start) || start <= 0) return null
  const pct = ((start - current.leftDistanceKm) / start) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

/**
 * Отправляет сообщение в Telegram.
 * Если токен/chat_id не заданы — молча пропускает.
 */
function sendTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT) return Promise.resolve()

  const body = JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' })

  return new Promise((resolve) => {
    const req = https.request(
      {
        host: 'api.telegram.org',
        path: `/bot${TG_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.warn(`Telegram ответил ${res.statusCode}: ${data.slice(0, 200)}`)
          }
          resolve()
        })
      },
    )
    req.on('error', (e) => {
      console.warn('Ошибка отправки в Telegram:', String(e))
      resolve()
    })
    req.write(body)
    req.end()
  })
}

const data = await fetchDislocation()
const event = data?.result?.[0]

if (!event) {
  console.log('Сервис не вернул данных — пропускаем')
  process.exit(0)
}

const point = toTrackPoint(event)
const history = loadHistory(filePath)

const exists = history.some(
  (p) => p.eventId === point.eventId || p.datetime === point.datetime,
)

if (exists) {
  console.log(`Новых событий нет (текущее: ${point.stationNameRu})`)
  process.exit(0)
}

history.push(point)
history.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
writeFileSync(filePath, JSON.stringify(history, null, 2) + '\n')
console.log(`Добавлена точка: ${point.stationNameRu} @ ${point.datetime}`)

// Отправляем уведомление в Telegram.
const pct = calcProgress(history, point)
const pctStr = pct !== null ? ` (${pct}% пройдено)` : ''
const dt = new Date(point.datetime).toLocaleString('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/Moscow',
})

const message = [
  `🚂 <b>Новая точка маршрута</b>`,
  ``,
  `📍 <b>${point.stationNameRu}</b> (${point.stationNameEn})`,
  `📅 ${dt}`,
  `🌍 ${point.countryRu}`,
  `🔄 ${point.statusRu}`,
  `🛣 Осталось: ${fmtNum(point.leftDistanceKm)} км${pctStr}`,
].join('\n')

await sendTelegram(message)
console.log('Уведомление отправлено в Telegram')
