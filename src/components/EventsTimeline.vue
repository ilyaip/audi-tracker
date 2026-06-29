<script setup lang="ts">
import { computed } from 'vue'
import type { TrackPoint } from '../types/dislocation'
import { formatCoords, formatDateTime, formatDistance } from '../utils/format'

const props = defineProps<{
  points: TrackPoint[]
}>()

// Свежие события сверху.
const ordered = computed(() => [...props.points].reverse())
</script>

<template>
  <div class="timeline">
    <h2 class="timeline__title">История перемещений</h2>

    <p v-if="!ordered.length" class="timeline__empty">
      Пока нет данных. Нажмите «Обновить статус», чтобы зафиксировать первую точку маршрута.
    </p>

    <ol v-else class="timeline__list">
      <li
        v-for="(p, idx) in ordered"
        :key="p.eventId + p.recordedAt"
        class="event"
        :class="{ 'event--current': idx === 0 }"
      >
        <span class="event__dot" />
        <div class="event__body">
          <div class="event__head">
            <span class="event__station">{{ p.stationNameRu }}</span>
            <span v-if="idx === 0" class="event__badge">сейчас</span>
          </div>
          <div class="event__status">{{ p.statusRu }}</div>
          <div class="event__meta">
            <span>📅 {{ formatDateTime(p.datetime) }}</span>
            <span>🌍 {{ p.countryRu }}</span>
            <span>📍 {{ formatCoords(p.latitude, p.longitude) }}</span>
            <span>🛣 осталось {{ formatDistance(p.leftDistanceKm) }}</span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.timeline__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.timeline__empty {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
.timeline__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.event {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 0 0 20px 4px;
}
.event:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 16px;
  bottom: -4px;
  width: 2px;
  background: var(--border);
}
.event__dot {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 50%;
  background: var(--surface);
  border: 3px solid var(--text-muted);
}
.event--current .event__dot {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(226, 35, 26, 0.18);
}
.event__body {
  flex: 1;
  min-width: 0;
}
.event__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.event__station {
  font-weight: 600;
  font-size: 15px;
}
.event__badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--accent);
  border-radius: 999px;
  padding: 2px 8px;
}
.event__status {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}
.event__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
