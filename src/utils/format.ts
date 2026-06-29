const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d)
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '—'
  return `${km.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} км`
}

export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

/** «X дней / часов назад» от текущего момента. */
export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const min = Math.round(diffMs / 60000)
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.round(hours / 24)
  return `${days} дн назад`
}
