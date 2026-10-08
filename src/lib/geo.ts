import type { Coords } from './api'

const R = 6371

const rad = (d: number) => (d * Math.PI) / 180

/** Distância em km (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const DIRECTIONS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO']

/** Direção cardeal (em português) de `a` para `b`. */
export function bearing(a: Coords, b: Coords): string {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat))
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon))
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return DIRECTIONS[Math.round(deg / 45) % 8]
}
