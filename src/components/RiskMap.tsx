import { useEffect, useState } from 'react'
import L from 'leaflet'
import { Circle, MapContainer, Marker, Pane, Rectangle, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Coords, GridCell } from '../lib/api'
import { AQI_LEVELS, levelFor } from '../lib/aqi'
import type { RiskZone } from '../lib/zones'

interface Props {
  center: Coords
  cells: GridCell[]
  step: number
  zones: RiskZone[]
  focus: Coords | null
  loading: boolean
}

const userIcon = L.divIcon({
  className: 'user-pin',
  html: '<span class="user-pin__pulse"></span><span class="user-pin__dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function Recenter({ center, focus }: { center: Coords; focus: Coords | null }) {
  const map = useMap()
  useEffect(() => {
    // Telas estreitas precisam de um zoom menor para mostrar toda a grade de risco.
    map.flyTo([center.lat, center.lon], map.getSize().x < 600 ? 8 : 9, { duration: 1.2 })
  }, [map, center.lat, center.lon])
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lon], 10, { duration: 0.9 })
  }, [map, focus])
  return null
}

export function RiskMap({ center, cells, step, zones, focus, loading }: Props) {
  const [smooth, setSmooth] = useState(true)
  const half = step / 2
  const zoneCells = new Set(zones.flatMap((z) => z.cells))

  return (
    <div className={`map ${smooth ? 'map--smooth' : ''}`}>
      <MapContainer center={[center.lat, center.lon]} zoom={9} zoomControl={false} attributionControl className="map__leaflet">
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='Mapa &copy; Esri · Dados: <a href="https://open-meteo.com/">Open-Meteo</a> / CAMS'
          maxZoom={16}
        />
        <Pane name="heat" style={{ zIndex: 350 }} className="pane-heat">
          {cells.map((c) => {
            const color = levelFor(c.aqi).color
            return (
              <Rectangle
                key={`${c.lat},${c.lon}`}
                bounds={[
                  [c.lat - half, c.lon - half],
                  [c.lat + half, c.lon + half],
                ]}
                pathOptions={{ stroke: false, fillColor: color, fillOpacity: zoneCells.has(c) ? 0.55 : 0.3 }}
              >
                <Tooltip sticky className="map-tip">
                  <strong style={{ color }}>AQI {c.aqi}</strong> · {levelFor(c.aqi).label}
                  <br />
                  PM2.5 {c.pm2_5.toFixed(1)} μg/m³
                </Tooltip>
              </Rectangle>
            )
          })}
        </Pane>
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          pane="shadowPane"
        />
        {zones.map((z) => (
          <Circle
            key={z.id}
            center={[z.peak.lat, z.peak.lon]}
            radius={Math.max(1500, step * 111000 * 0.35)}
            pathOptions={{ color: z.level.color, weight: 1.5, dashArray: '4 6', fillOpacity: 0 }}
          />
        ))}
        <Marker position={[center.lat, center.lon]} icon={userIcon} />
        <Recenter center={center} focus={focus} />
      </MapContainer>

      <div className="map__legend">
        {AQI_LEVELS.map((l) => (
          <span key={l.key} title={`${l.min}–${l.max}`}>
            <i style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      <button className="map__toggle" onClick={() => setSmooth((s) => !s)} type="button">
        {smooth ? 'Ver grade' : 'Suavizar'}
      </button>

      {loading && <div className="map__loading">Mapeando zonas…</div>}
    </div>
  )
}
