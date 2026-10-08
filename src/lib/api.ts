/**
 * Clientes das APIs públicas usadas pelo painel (nenhuma exige chave):
 * - Open-Meteo Air Quality (modelo CAMS) para poluentes e AQI
 * - Open-Meteo Geocoding para busca de cidades
 * - BigDataCloud para geocodificação reversa da posição do usuário
 */

const AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

export interface Coords {
  lat: number
  lon: number
}

export interface Place extends Coords {
  name: string
  region?: string
}

export interface CurrentAir {
  time: string
  us_aqi: number
  pm2_5: number
  pm10: number
  ozone: number
  nitrogen_dioxide: number
  sulphur_dioxide: number
  carbon_monoxide: number
  uv_index: number | null
}

export interface HourPoint {
  time: Date
  aqi: number
  pm2_5: number
}

export interface AirReport {
  current: CurrentAir
  hourly: HourPoint[]
}

export interface GridCell extends Coords {
  aqi: number
  pm2_5: number
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Falha na requisição (${res.status})`)
  return res.json() as Promise<T>
}

const CURRENT_VARS = 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,uv_index'

export async function fetchAirReport({ lat, lon }: Coords, signal?: AbortSignal): Promise<AirReport> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: CURRENT_VARS,
    hourly: 'us_aqi,pm2_5',
    past_days: '1',
    forecast_days: '3',
    timezone: 'auto',
  })
  const data = await getJson<{
    current: CurrentAir
    hourly: { time: string[]; us_aqi: (number | null)[]; pm2_5: (number | null)[] }
  }>(`${AQ_URL}?${params}`, signal)

  const hourly: HourPoint[] = data.hourly.time
    .map((t, i) => ({ time: new Date(t), aqi: data.hourly.us_aqi[i], pm2_5: data.hourly.pm2_5[i] }))
    .filter((p): p is HourPoint => p.aqi != null && p.pm2_5 != null)

  return { current: data.current, hourly }
}

/**
 * Amostra uma grade quadrada centrada em `center` e retorna o AQI atual de cada célula.
 * A API aceita várias coordenadas numa única requisição.
 */
export async function fetchAqiGrid(
  center: Coords,
  { size = 15, step = 0.1 }: { size?: number; step?: number } = {},
  signal?: AbortSignal,
): Promise<{ cells: GridCell[]; step: number }> {
  const half = Math.floor(size / 2)
  const lats: number[] = []
  const lons: number[] = []
  for (let i = -half; i <= half; i++) {
    for (let j = -half; j <= half; j++) {
      lats.push(+(center.lat + i * step).toFixed(4))
      lons.push(+(center.lon + j * step).toFixed(4))
    }
  }
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lons.join(','),
    current: 'us_aqi,pm2_5',
  })
  const data = await getJson<{ current: { us_aqi: number | null; pm2_5: number | null } }[]>(
    `${AQ_URL}?${params}`,
    signal,
  )
  const cells = data
    .map((d, i) => ({ lat: lats[i], lon: lons[i], aqi: d.current.us_aqi, pm2_5: d.current.pm2_5 }))
    .filter((c): c is GridCell => c.aqi != null && c.pm2_5 != null)
  return { cells, step }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '6', language: 'pt', format: 'json' })
  const data = await getJson<{
    results?: { name: string; latitude: number; longitude: number; admin1?: string; country?: string }[]
  }>(`https://geocoding-api.open-meteo.com/v1/search?${params}`, signal)
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude,
    lon: r.longitude,
  }))
}

export async function reverseGeocode({ lat, lon }: Coords): Promise<Place> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      localityLanguage: 'pt',
    })
    const data = await getJson<{ city?: string; locality?: string; principalSubdivision?: string; countryName?: string }>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
    )
    return {
      lat,
      lon,
      name: data.locality || data.city || 'Sua localização',
      region: [data.principalSubdivision, data.countryName].filter(Boolean).join(', '),
    }
  } catch {
    return { lat, lon, name: 'Sua localização', region: `${lat.toFixed(3)}, ${lon.toFixed(3)}` }
  }
}

export function getBrowserPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalização não suportada neste navegador'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Permissão de localização negada')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
