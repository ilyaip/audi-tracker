<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import TrackMap from './components/TrackMap.vue'
import StatusCard from './components/StatusCard.vue'
import EventsTimeline from './components/EventsTimeline.vue'
import { REFRESH_INTERVAL_MS, useTracking } from './composables/useTracking'
import { formatDateTime, timeAgo } from './utils/format'

const {
  containerNumber,
  routePoints,
  current,
  progress,
  loading,
  error,
  lastUpdated,
  syncStatus,
  serverCount,
  refresh,
  syncServerHistory,
  clearHistory,
} = useTracking()

let timer: number | undefined

const syncText = computed(() => {
  switch (syncStatus.value) {
    case 'syncing':
      return 'синхронизация…'
    case 'ok':
      return serverCount.value !== null
        ? `сервер: ${serverCount.value} точек`
        : 'синхронизировано'
    case 'error':
      return 'сервер недоступен'
    default:
      return 'сервер: нет данных'
  }
})

const syncTitle = computed(() =>
  syncStatus.value === 'idle'
    ? 'Серверная история ещё не собрана (GitHub Actions не отработал)'
    : 'Фоновый сбор данных через GitHub Actions',
)

function isStale(): boolean {
  if (!lastUpdated.value) return true
  return Date.now() - new Date(lastUpdated.value).getTime() >= REFRESH_INTERVAL_MS
}

function onVisibilityChange() {
  // При возврате на вкладку догоняем, если давно не обновлялись.
  if (document.visibilityState === 'visible' && isStale()) {
    syncServerHistory()
    refresh()
  }
}

onMounted(async () => {
  // Сначала подтягиваем фон, собранный пока приложение было закрыто,
  // затем запрашиваем актуальный статус прямо сейчас.
  await syncServerHistory()
  refresh()
  // Фоновый опрос раз в 30 минут, пока вкладка открыта.
  timer = window.setInterval(() => {
    syncServerHistory()
    refresh()
  }, REFRESH_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

function onClear() {
  if (confirm('Очистить накопленную историю маршрута?')) {
    clearHistory()
  }
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="brand__logo">AUDI</span>
        <span class="brand__title">Tracker</span>
      </div>
      <div class="container-badge">
        <span class="container-badge__label">Контейнер</span>
        <span class="container-badge__value">{{ containerNumber }}</span>
      </div>
      <div v-if="progress !== null" class="progress" title="Пройдено пути от начала наблюдения">
        <div class="progress__ring" :style="{ '--pct': progress }">
          <span class="progress__num">{{ progress }}%</span>
        </div>
        <span class="progress__caption">пройдено</span>
      </div>
      <div class="topbar__actions">
        <span class="sync" :class="`sync--${syncStatus}`" :title="syncTitle">
          <span class="sync__dot" />
          {{ syncText }}
        </span>
        <span v-if="lastUpdated" class="updated">
          обновлено {{ timeAgo(lastUpdated) }} · авто каждые 15 мин
        </span>
        <button class="btn btn--ghost" :disabled="loading" @click="onClear">
          Очистить
        </button>
        <button class="btn btn--primary" :disabled="loading" @click="refresh">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Обновляем…' : 'Обновить статус' }}
        </button>
      </div>
    </header>

    <p v-if="error" class="alert">⚠️ {{ error }}</p>

    <main class="layout">
      <section class="panel panel--map">
        <TrackMap :points="routePoints" />
      </section>

      <aside class="sidebar">
        <section class="panel">
          <h2 class="panel__title">Текущий статус</h2>
          <StatusCard :current="current" :points-count="routePoints.length" />
        </section>

        <section class="panel">
          <EventsTimeline :points="routePoints" />
        </section>
      </aside>
    </main>

    <footer class="footer">
      <span>Данные: сервис дислокации ТрансКонтейнер</span>
      <span v-if="lastUpdated">· последний запрос {{ formatDateTime(lastUpdated) }}</span>
    </footer>
  </div>
</template>

<style scoped>
.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.brand__logo {
  font-weight: 800;
  letter-spacing: 0.18em;
  font-size: 22px;
  color: var(--accent);
}
.brand__title {
  font-weight: 600;
  font-size: 18px;
  color: var(--text-muted);
}
.container-badge {
  display: flex;
  flex-direction: column;
  padding: 6px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.container-badge__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
.container-badge__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  font-size: 15px;
}
.progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress__ring {
  --pct: 0;
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: conic-gradient(
    var(--accent) calc(var(--pct) * 1%),
    var(--border) 0
  );
  display: grid;
  place-items: center;
}
.progress__ring::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--bg);
}
.progress__num {
  position: relative;
  font-size: 12px;
  font-weight: 700;
}
.progress__caption {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.topbar__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.updated {
  font-size: 12px;
  color: var(--text-muted);
}

.sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
}
.sync__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  flex: 0 0 auto;
}
.sync--ok .sync__dot {
  background: #2ecc71;
}
.sync--ok {
  color: #2ecc71;
}
.sync--error .sync__dot {
  background: var(--accent);
}
.sync--error {
  color: var(--accent);
}
.sync--syncing .sync__dot {
  background: #f1c40f;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.05s ease, background 0.15s ease, opacity 0.15s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn:not(:disabled):active {
  transform: translateY(1px);
}
.btn--primary {
  background: var(--accent);
  color: #fff;
}
.btn--primary:not(:disabled):hover {
  background: var(--accent-hover);
}
.btn--ghost {
  background: var(--surface);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn--ghost:not(:disabled):hover {
  color: var(--text);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  margin: 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(226, 35, 26, 0.08);
  border: 1px solid rgba(226, 35, 26, 0.25);
  color: var(--accent);
  font-size: 14px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
  gap: 16px;
  flex: 1;
}
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 20px;
}
.panel--map {
  padding: 10px;
  min-height: 560px;
  display: flex;
}
.panel__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.footer {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-muted);
  padding-top: 4px;
}

@media (max-width: 920px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .panel--map {
    min-height: 380px;
  }
  .topbar__actions {
    width: 100%;
    margin-left: 0;
  }
}
</style>
