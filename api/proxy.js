import { Agent } from 'undici'

// Serverless-прокси (Vercel) к сервису дислокации ТрансКонтейнера.
// Решает две проблемы прямого запроса из браузера:
//   1) отсутствие CORS-заголовков у апстрима;
//   2) неполную цепочку TLS-сертификата апстрима.
//
// Фронт обращается на /trcont-api/... , vercel.json переписывает это сюда.

const UPSTREAM = 'https://isales.trcont.com/api/unauthorized/dislocation'

// Агент с отключённой проверкой сертификата — точечно только для этого апстрима.
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } })

export default async function handler(req, res) {
  const searchType = req.query.search_type || 'equipment'
  const term = req.query.term

  if (!term) {
    res.status(400).json({ error: 'Параметр term обязателен' })
    return
  }

  const url = `${UPSTREAM}?search_type=${encodeURIComponent(
    searchType,
  )}&term=${encodeURIComponent(term)}`

  try {
    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      dispatcher: insecureAgent,
    })

    const body = await upstream.text()
    res
      .status(upstream.status)
      .setHeader('Content-Type', 'application/json; charset=utf-8')
    // Небольшое кэширование на CDN, чтобы не долбить апстрим при перезагрузках.
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    res.send(body)
  } catch (e) {
    res
      .status(502)
      .json({ error: 'Ошибка обращения к сервису дислокации', detail: String(e) })
  }
}
