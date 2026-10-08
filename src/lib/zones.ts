import type { Coords, GridCell } from './api'
import { AQI_LEVELS, RISK_THRESHOLD, levelFor, type AqiLevel } from './aqi'
import { bearing, distanceKm } from './geo'

export interface RiskZone {
  id: string
  level: AqiLevel
  peakAqi: number
  meanAqi: number
  center: Coords
  peak: Coords
  areaKm2: number
  cells: GridCell[]
  distanceKm: number
  direction: string
  containsUser: boolean
}

const key = (lat: number, lon: number) => `${lat.toFixed(4)}|${lon.toFixed(4)}`

/**
 * Agrupa células vizinhas (4-conectividade) que compartilham o mesmo nível de risco
 * (AQI ≥ RISK_THRESHOLD) em zonas contíguas.
 */
export function buildRiskZones(cells: GridCell[], step: number, user: Coords): RiskZone[] {
  const byKey = new Map(cells.map((c) => [key(c.lat, c.lon), c]))
  const seen = new Set<string>()
  const zones: RiskZone[] = []

  // Célula mais próxima do usuário, para saber se ele está dentro de uma zona.
  let userCell: GridCell | undefined
  let best = Infinity
  for (const c of cells) {
    const d = distanceKm(c, user)
    if (d < best) {
      best = d
      userCell = c
    }
  }

  for (const start of cells) {
    const k0 = key(start.lat, start.lon)
    if (seen.has(k0) || start.aqi < RISK_THRESHOLD) continue
    const level = levelFor(start.aqi)
    const members: GridCell[] = []
    const queue = [start]
    seen.add(k0)
    while (queue.length) {
      const c = queue.pop()!
      members.push(c)
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = key(+(c.lat + dy * step).toFixed(4), +(c.lon + dx * step).toFixed(4))
        const n = byKey.get(k)
        if (n && !seen.has(k) && levelFor(n.aqi).key === level.key) {
          seen.add(k)
          queue.push(n)
        }
      }
    }

    const center = {
      lat: members.reduce((s, c) => s + c.lat, 0) / members.length,
      lon: members.reduce((s, c) => s + c.lon, 0) / members.length,
    }
    const peakCell = members.reduce((a, b) => (b.aqi > a.aqi ? b : a))
    const cellKm2 = (step * 111) * (step * 111 * Math.cos((center.lat * Math.PI) / 180))
    const containsUser = !!userCell && members.includes(userCell)
    zones.push({
      id: `${level.key}-${k0}`,
      level,
      peakAqi: peakCell.aqi,
      meanAqi: Math.round(members.reduce((s, c) => s + c.aqi, 0) / members.length),
      center,
      peak: { lat: peakCell.lat, lon: peakCell.lon },
      areaKm2: Math.round(members.length * cellKm2),
      cells: members,
      distanceKm: containsUser ? 0 : distanceKm(user, nearest(members, user)),
      direction: bearing(user, center),
      containsUser,
    })
  }

  const rank = (z: RiskZone) => AQI_LEVELS.indexOf(z.level)
  return zones.sort((a, b) => rank(b) - rank(a) || b.peakAqi - a.peakAqi || a.distanceKm - b.distanceKm)
}

function nearest(cells: GridCell[], p: Coords): GridCell {
  return cells.reduce((a, b) => (distanceKm(b, p) < distanceKm(a, p) ? b : a))
}
