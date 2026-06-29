<script setup lang="ts">
import { onMounted } from 'vue'
import TrackMap from './components/TrackMap.vue'
import StatusCard from './components/StatusCard.vue'
import EventsTimeline from './components/EventsTimeline.vue'
import { useTracking } from './composables/useTracking'
import { formatDateTime, timeAgo } from './utils/format'

const {
  containerNumber,
  routePoints,
  current,
  loading,
  error,
  lastUpdated,
  refresh,
  clearHistory,
} = useTracking()

onMounted(() => {
  // Автоматически тянем актуальный статус при первом запуске.
  refresh()
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
      <div class="topbar__actions">
        <span v-if="lastUpdated" class="updated">
          обновлено {{ timeAgo(lastUpdated) }}
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
