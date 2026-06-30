import { computed, ref } from 'vue'
import { fetchDislocation } from '../services/api'
import type { DislocationEvent, TrackPoint } from '../types/dislocation'

const CONTAINER = import.meta.env.VITE_CONTAINER_NUMBER || 'TKRU4596490'
const STORAGE_KEY = `audi-tracker:history:${CONTAINER}`

function loadHistory(): TrackPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrackPoint[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist(points: TrackPoint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points))
  } catch {
    // localStorage может быть недоступен — игнорируем.
  }
}

function toTrackPoint(event: DislocationEvent): TrackPoint {
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

// Модуль-синглтон: состояние общее для всего приложения.
const history = ref<TrackPoint[]>(loadHistory())
const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)

const current = computed<TrackPoint | null>(() =>
  history.value.length ? history.value[history.value.length - 1] : null,
)

/**
 * Процент пройденного пути (0–100).
 * База — максимальный зафиксированный остаток (точка старта наблюдения),
 * прогресс считается относительно текущего остатка.
 */
const progress = computed<number | null>(() => {
  if (!history.value.length) return null
  const start = Math.max(...history.value.map((p) => p.leftDistanceKm))
  const currentLeft = history.value[history.value.length - 1].leftDistanceKm
  if (!Number.isFinite(start) || start <= 0) return null
  const pct = ((start - currentLeft) / start) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
})

/** Уникальные точки по координатам — для отрисовки линии маршрута без дублей подряд. */
const routePoints = computed<TrackPoint[]>(() => {
  const out: TrackPoint[] = []
  for (const p of history.value) {
    const prev = out[out.length - 1]
    if (!prev || prev.latitude !== p.latitude || prev.longitude !== p.longitude) {
      out.push(p)
    }
  }
  return out
})

let inFlight: AbortController | null = null

async function refresh(): Promise<void> {
  if (loading.value) return
  loading.value = true
  error.value = null
  inFlight?.abort()
  inFlight = new AbortController()

  try {
    const data = await fetchDislocation(CONTAINER, inFlight.signal)
    const event = data.result?.[0]
    if (!event) {
      error.value = 'Сервис не вернул данных о контейнере'
      return
    }

    const point = toTrackPoint(event)
    const last = history.value[history.value.length - 1]

    // Добавляем точку, только если событие новое (по event_id или времени).
    const isNew =
      !last || (last.eventId !== point.eventId && last.datetime !== point.datetime)

    if (isNew) {
      history.value = [...history.value, point]
      persist(history.value)
    } else {
      // Обновляем «свежесть» последней записи без дублирования точки.
      last.recordedAt = point.recordedAt
      persist(history.value)
    }

    lastUpdated.value = new Date().toISOString()
  } catch (e) {
    if ((e as Error).name === 'AbortError') return
    error.value = e instanceof Error ? e.message : 'Неизвестная ошибка запроса'
  } finally {
    loading.value = false
  }
}

function clearHistory(): void {
  history.value = []
  persist(history.value)
  lastUpdated.value = null
  error.value = null
}

export function useTracking() {
  return {
    containerNumber: CONTAINER,
    history,
    routePoints,
    current,
    progress,
    loading,
    error,
    lastUpdated,
    refresh,
    clearHistory,
  }
}
