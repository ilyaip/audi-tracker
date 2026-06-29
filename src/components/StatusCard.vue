<script setup lang="ts">
import type { TrackPoint } from '../types/dislocation'
import { formatCoords, formatDateTime, formatDistance } from '../utils/format'

defineProps<{
  current: TrackPoint | null
  pointsCount: number
}>()
</script>

<template>
  <div class="status">
    <template v-if="current">
      <div class="status__row">
        <div class="status__label">Текущая станция</div>
        <div class="status__value status__value--big">{{ current.stationNameRu }}</div>
        <div class="status__sub">{{ current.stationNameEn }}</div>
      </div>

      <div class="status__status-pill">{{ current.statusRu }}</div>

      <div class="status__grid">
        <div class="metric">
          <div class="metric__label">Страна</div>
          <div class="metric__value">{{ current.countryRu }}</div>
        </div>
        <div class="metric">
          <div class="metric__label">Осталось пути</div>
          <div class="metric__value">{{ formatDistance(current.leftDistanceKm) }}</div>
        </div>
        <div class="metric">
          <div class="metric__label">Время события</div>
          <div class="metric__value">{{ formatDateTime(current.datetime) }}</div>
        </div>
        <div class="metric">
          <div class="metric__label">Координаты</div>
          <div class="metric__value metric__value--mono">
            {{ formatCoords(current.latitude, current.longitude) }}
          </div>
        </div>
        <div class="metric">
          <div class="metric__label">Точек в маршруте</div>
          <div class="metric__value">{{ pointsCount }}</div>
        </div>
        <div class="metric">
          <div class="metric__label">ID станции</div>
          <div class="metric__value metric__value--mono">{{ current.stationId }}</div>
        </div>
      </div>
    </template>

    <p v-else class="status__empty">
      Данных ещё нет. Нажмите «Обновить статус» — приложение запросит текущее положение
      контейнера и начнёт строить маршрут.
    </p>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.status__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.status__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.status__value--big {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
}
.status__sub {
  font-size: 13px;
  color: var(--text-muted);
}
.status__status-pill {
  align-self: flex-start;
  background: rgba(226, 35, 26, 0.1);
  color: var(--accent);
  font-weight: 600;
  font-size: 14px;
  padding: 8px 14px;
  border-radius: 12px;
}
.status__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.metric {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
}
.metric__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.metric__value {
  font-size: 15px;
  font-weight: 600;
}
.metric__value--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.status__empty {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
</style>
