import type { Coords } from '../lib/api'
import type { RiskZone } from '../lib/zones'

interface Props {
  zones: RiskZone[]
  loading: boolean
  onFocus: (c: Coords) => void
}

export function RiskZones({ zones, loading, onFocus }: Props) {
  if (loading && !zones.length) {
    return <div className="zones__empty shimmer">Analisando a região…</div>
  }

  if (!zones.length) {
    return (
      <div className="zones__empty zones__empty--ok">
        <span className="zones__check" aria-hidden>✓</span>
        <div>
          <strong>Nenhuma zona de risco</strong>
          <p>Todas as áreas num raio de ~75 km estão com AQI abaixo de 101.</p>
        </div>
      </div>
    )
  }

  return (
    <ol className="zones">
      {zones.slice(0, 6).map((z, i) => (
        <li key={z.id} style={{ ['--c' as string]: z.level.color, animationDelay: `${0.06 * i}s` }}>
          <button type="button" onClick={() => onFocus(z.peak)}>
            <span className="zones__aqi">{z.peakAqi}</span>
            <span className="zones__body">
              <strong>{z.level.label}</strong>
              <span>
                {z.containsUser ? 'Você está nesta zona' : `${z.distanceKm.toFixed(0)} km a ${z.direction}`} · ~
                {z.areaKm2.toLocaleString('pt-BR')} km²
              </span>
            </span>
            <span className="zones__arrow" aria-hidden>
              →
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
