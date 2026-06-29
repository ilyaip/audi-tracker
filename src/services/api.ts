import type { DislocationResponse } from '../types/dislocation'

const API_BASE = import.meta.env.VITE_API_BASE || '/trcont-api'

/**
 * Запрашивает текущую дислокацию контейнера по номеру.
 * Запрос идёт через dev-прокси Vite (см. vite.config.ts), чтобы обойти CORS.
 */
export async function fetchDislocation(
  containerNumber: string,
  signal?: AbortSignal,
): Promise<DislocationResponse> {
  const url = new URL(`${API_BASE}/unauthorized/dislocation`, window.location.origin)
  url.searchParams.set('search_type', 'equipment')
  url.searchParams.set('term', containerNumber)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Сервис вернул ошибку ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as DislocationResponse
}
