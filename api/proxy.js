import https from 'node:https'

// Serverless-прокси (Vercel) к сервису дислокации ТрансКонтейнера.
// Решает две проблемы прямого запроса из браузера:
//   1) отсутствие CORS-заголовков у апстрима;
//   2) неполную цепочку TLS-сертификата апстрима.
//
// Используем встроенный node:https (без внешних зависимостей), чтобы передать
// rejectUnauthorized: false точечно только для этого запроса.
//
// Фронт обращается на /trcont-api/... , vercel.json переписывает это сюда.

const UPSTREAM_HOST = 'isales.trcont.com'
const UPSTREAM_PATH = '/api/unauthorized/dislocation'

export default function handler(req, res) {
  const searchType = req.query.search_type || 'equipment'
  const term = req.query.term

  if (!term) {
    res.status(400).json({ error: 'Параметр term обязателен' })
    return
  }

  const path = `${UPSTREAM_PATH}?search_type=${encodeURIComponent(
    searchType,
  )}&term=${encodeURIComponent(term)}`

  const upstreamReq = https.request(
    {
      host: UPSTREAM_HOST,
      path,
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Апстрим отдаёт неполную цепочку сертификата — отключаем проверку точечно.
      rejectUnauthorized: false,
    },
    (upstream) => {
      let data = ''
      upstream.setEncoding('utf8')
      upstream.on('data', (chunk) => {
        data += chunk
      })
      upstream.on('end', () => {
        res.status(upstream.statusCode || 502)
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
        res.send(data)
      })
    },
  )

  upstreamReq.on('error', (e) => {
    res
      .status(502)
      .json({ error: 'Ошибка обращения к сервису дислокации', detail: String(e) })
  })

  upstreamReq.end()
}
