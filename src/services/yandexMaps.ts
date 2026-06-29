// Динамическая загрузка Яндекс.Карт JS API 2.1 с одноразовым кэшированием промиса.

let loaderPromise: Promise<any> | null = null

export function loadYandexMaps(): Promise<any> {
  if (loaderPromise) return loaderPromise

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY

  loaderPromise = new Promise((resolve, reject) => {
    if (window.ymaps && typeof window.ymaps.ready === 'function') {
      window.ymaps.ready(() => resolve(window.ymaps))
      return
    }

    if (!apiKey) {
      reject(
        new Error(
          'Не задан ключ Яндекс.Карт. Укажите VITE_YANDEX_MAPS_API_KEY в файле .env',
        ),
      )
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
      apiKey,
    )}&lang=ru_RU`
    script.async = true
    script.onerror = () => {
      loaderPromise = null
      reject(new Error('Не удалось загрузить скрипт Яндекс.Карт'))
    }
    script.onload = () => {
      window.ymaps.ready(() => resolve(window.ymaps))
    }
    document.head.appendChild(script)
  })

  return loaderPromise
}
