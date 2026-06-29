// Типы ответа сервиса дислокации ТрансКонтейнера.

export interface LocalizedName {
  name_ru: string
  name_en: string
  name_zh: string
}

export interface Position extends LocalizedName {
  latitude: number
  longitude: number
  /** Оставшееся расстояние до пункта назначения, км. */
  left_distance_leg: number
}

export interface DislocationEvent {
  event_id: string
  station_id: string
  /** ISO-дата события (с таймзоной). */
  datetime: string
  equipment_number: string
  /** Порядковый номер события в маршруте. */
  sequence: number
  position: Position
  country: LocalizedName
  status: LocalizedName
}

export interface DislocationMeta {
  search_type: string
  term: string
}

export interface DislocationResponse {
  result: DislocationEvent[]
  meta: DislocationMeta
}

/**
 * Точка маршрута, сохранённая локально.
 * API отдаёт только текущее положение, поэтому историю накапливаем сами.
 */
export interface TrackPoint {
  /** Уникальный идентификатор события из API. */
  eventId: string
  /** Время события из API (ISO). */
  datetime: string
  /** Когда точка была зафиксирована в нашем приложении (ISO). */
  recordedAt: string
  stationId: string
  sequence: number
  latitude: number
  longitude: number
  stationNameRu: string
  stationNameEn: string
  countryRu: string
  statusRu: string
  leftDistanceKm: number
}
