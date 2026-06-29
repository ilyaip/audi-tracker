<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadYandexMaps } from '../services/yandexMaps'
import type { TrackPoint } from '../types/dislocation'

const props = defineProps<{
  points: TrackPoint[]
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const mapError = ref<string | null>(null)
const isReady = ref(false)

let ymapsApi: any = null
let map: any = null

function render() {
  if (!map || !ymapsApi) return

  map.geoObjects.removeAll()

  const coords = props.points.map((p) => [p.latitude, p.longitude] as [number, number])

  if (coords.length === 0) {
    map.setCenter([55.751244, 37.618423], 3)
    return
  }

  // Линия маршрута.
  if (coords.length > 1) {
    const line = new ymapsApi.Polyline(
      coords,
      {},
      {
        strokeColor: '#e2231a',
        strokeWidth: 4,
        strokeOpacity: 0.85,
      },
    )
    map.geoObjects.add(line)
  }

  // Маркеры точек.
  props.points.forEach((p, idx) => {
    const isLast = idx === props.points.length - 1
    const placemark = new ymapsApi.Placemark(
      [p.latitude, p.longitude],
      {
        balloonContentHeader: `<strong>${p.stationNameRu}</strong>`,
        balloonContentBody: `${p.statusRu}<br/>${p.countryRu}`,
        balloonContentFooter: new Date(p.datetime).toLocaleString('ru-RU'),
        hintContent: p.stationNameRu,
      },
      {
        preset: isLast ? 'islands#redAutoIcon' : 'islands#grayCircleDotIcon',
        zIndex: isLast ? 1000 : 100,
      },
    )
    map.geoObjects.add(placemark)
  })

  // Подгоняем границы карты под маршрут.
  if (coords.length === 1) {
    map.setCenter(coords[0], 7)
  } else {
    map.setBounds(map.geoObjects.getBounds(), {
      checkZoomRange: true,
      zoomMargin: 40,
    })
  }
}

onMounted(async () => {
  try {
    ymapsApi = await loadYandexMaps()
    if (!mapEl.value) return
    map = new ymapsApi.Map(
      mapEl.value,
      {
        center: [55.751244, 37.618423],
        zoom: 3,
        controls: ['zoomControl', 'fullscreenControl', 'typeSelector'],
      },
      { suppressMapOpenBlock: true },
    )
    isReady.value = true
    render()
  } catch (e) {
    mapError.value = e instanceof Error ? e.message : 'Ошибка загрузки карты'
  }
})

onBeforeUnmount(() => {
  if (map) {
    map.destroy()
    map = null
  }
})

watch(
  () => props.points,
  () => {
    if (isReady.value) render()
  },
  { deep: true },
)
</script>

<template>
  <div class="map-wrap">
    <div ref="mapEl" class="map" :class="{ hidden: mapError }" />
    <div v-if="mapError" class="map-error">
      <div class="map-error__icon">🗺️</div>
      <p class="map-error__title">Карта недоступна</p>
      <p class="map-error__text">{{ mapError }}</p>
    </div>
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
}
.map {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
}
.map.hidden {
  display: none;
}
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  background: var(--surface-2);
  border-radius: 16px;
  border: 1px dashed var(--border);
}
.map-error__icon {
  font-size: 40px;
}
.map-error__title {
  font-weight: 600;
  color: var(--text);
}
.map-error__text {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 320px;
}
</style>
