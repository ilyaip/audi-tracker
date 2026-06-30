// Сборщик дислокации для GitHub Actions (вариант фонового сбора).
// Запрашивает текущее положение контейнера и дописывает новую точку в JSON-историю.
// Использование: node scripts/collect.mjs <путь-к-history.json>
//
// Структура точки полностью совпадает с TrackPoint на фронте, чтобы мёрж был корректным.

import https from 'node:https'
import { readFileSync, writeFileSync } from 'node:fs'

const CONTAINER = process.env.CONTAINER_NUMBER || 'TKRU4596490'
const filePath = process.argv[2]

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
