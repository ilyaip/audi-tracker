/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YANDEX_MAPS_API_KEY: string
  readonly VITE_API_BASE: string
  readonly VITE_CONTAINER_NUMBER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// Глобальный объект Яндекс.Карт, подгружаемый внешним скриптом.
declare const ymaps: any
interface Window {
  ymaps: any
}
