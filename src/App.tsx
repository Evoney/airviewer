import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchAirReport,
  fetchAqiGrid,
  getBrowserPosition,
  reverseGeocode,
  type AirReport,
  type Coords,
  type GridCell,
  type Place,
} from './lib/api'
import { levelFor } from './lib/aqi'
import { buildRiskZones } from './lib/zones'
import { AqiGauge } from './components/AqiGauge'
import { ForecastChart } from './components/ForecastChart'
import { HealthAdvice } from './components/HealthAdvice'
import { LocationSearch } from './components/LocationSearch'
import { PollutantGrid } from './components/PollutantGrid'
import { RiskMap } from './components/RiskMap'
import { RiskZones } from './components/RiskZones'

const FALLBACK: Place = { name: 'São Paulo', region: 'São Paulo, Brasil', lat: -23.5505, lon: -46.6333 }
const REFRESH_MS = 15 * 60 * 1000

const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function uvLabel(uv: number) {
  if (uv < 3) return 'Baixo'
  if (uv < 6) return 'Moderado'
  if (uv < 8) return 'Alto'
  if (uv < 11) return 'Muito alto'
  return 'Extremo'
}

export default function App() {
  const [place, setPlace] = useState<Place | null>(null)
  const [locating, setLocating] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [report, setReport] = useState<AirReport | null>(null)
  const [grid, setGrid] = useState<{ cells: GridCell[]; step: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gridLoading, setGridLoading] = useState(false)
  const [focus, setFocus] = useState<Coords | null>(null)
  const [tick, setTick] = useState(0)

  const locate = useCallback(async () => {
    setLocating(true)
    try {
      const coords = await getBrowserPosition()
      setPlace(await reverseGeocode(coords))
      setNotice(null)
    } catch (e) {
      setPlace((p) => p ?? FALLBACK)
      setNotice(`Não foi possível obter sua localização (${(e as Error).message}). Busque uma cidade acima.`)
    } finally {
      setLocating(false)
    }
  }, [])

  useEffect(() => {
    locate()
  }, [locate])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!place) return
    const ctrl = new AbortController()
    setError(null)
    setFocus(null)
    fetchAirReport(place, ctrl.signal)
      .then(setReport)
      .catch((e: Error) => e.name !== 'AbortError' && setError(e.message))

    setGridLoading(true)
    fetchAqiGrid(place, {}, ctrl.signal)
      .then(setGrid)
      .catch((e: Error) => e.name !== 'AbortError' && setGrid(null))
      .finally(() => !ctrl.signal.aborted && setGridLoading(false))
    return () => ctrl.abort()
  }, [place, tick])

  const zones = useMemo(
    () => (grid && place ? buildRiskZones(grid.cells, grid.step, place) : []),
    [grid, place],
  )

  const aqi = report?.current.us_aqi ?? null
  const level = levelFor(aqi)

  useEffect(() => {
    document.documentElement.style.setProperty('--aqi', aqi == null ? '#5b7a99' : level.color)
  }, [aqi, level.color])

  const nearbyRisk = zones.filter((z) => !z.containsUser).length
  const insideZone = zones.find((z) => z.containsUser)

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            <svg viewBox="0 0 32 32">
              <path d="M5 12h14a3.5 3.5 0 1 0-3.5-3.5M5 18h18a3.5 3.5 0 1 1-3.5 3.5M5 24h8" />
            </svg>
          </span>
          <span className="brand__name">
            Air<em>viewer</em>
          </span>
        </div>
        <LocationSearch onSelect={setPlace} onLocate={locate} locating={locating} />
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice(null)} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="notice notice--error" role="alert">
          Erro ao carregar dados: {error}
          <button type="button" onClick={() => setTick((t) => t + 1)}>
            Tentar novamente
          </button>
        </div>
      )}

      <main className="layout">
        <section className="card hero" style={{ animationDelay: '0s' }}>
          <div className="hero__place">
            <span className="eyebrow">Você está em</span>
            <h1>{place?.name ?? 'Localizando…'}</h1>
            <p>{place?.region}</p>
          </div>

          {report ? (
            <>
              <AqiGauge aqi={report.current.us_aqi} />
              <div className="hero__level" style={{ ['--c' as string]: level.color }}>
                <span className="pill">{level.label}</span>
                <p>{level.summary}</p>
              </div>
              <dl className="hero__stats">
                <div>
                  <dt>Zona atual</dt>
                  <dd style={{ color: insideZone ? insideZone.level.color : 'var(--good)' }}>
                    {insideZone ? 'Em risco' : 'Segura'}
                  </dd>
                </div>
                <div>
                  <dt>Riscos próximos</dt>
                  <dd>{gridLoading && !grid ? '—' : nearbyRisk}</dd>
                </div>
                <div>
                  <dt>Índice UV</dt>
                  <dd>
                    {report.current.uv_index != null ? (
                      <>
                        {report.current.uv_index.toFixed(1)} <small>{uvLabel(report.current.uv_index)}</small>
                      </>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
              <p className="hero__updated">
                Atualizado às {timeFmt.format(new Date(report.current.time))} · modelo CAMS
              </p>
            </>
          ) : (
            <div className="hero__skeleton shimmer" />
          )}
        </section>

        <section className="card card--map" style={{ animationDelay: '0.08s' }}>
          <header className="card__head">
            <div>
              <span className="eyebrow">Mapa de risco</span>
              <h2>Zonas ao seu redor</h2>
            </div>
            <span className="card__meta">raio ~75 km</span>
          </header>
          {place && (
            <RiskMap
              center={place}
              cells={grid?.cells ?? []}
              step={grid?.step ?? 0.1}
              zones={zones}
              focus={focus}
              loading={gridLoading}
            />
          )}
        </section>

        <section className="card card--zones" style={{ animationDelay: '0.16s' }}>
          <header className="card__head">
            <div>
              <span className="eyebrow">Alertas</span>
              <h2>Zonas de risco</h2>
            </div>
            <span className="card__meta">AQI ≥ 101</span>
          </header>
          <RiskZones zones={zones} loading={gridLoading} onFocus={setFocus} />
        </section>

        <section className="card card--forecast" style={{ animationDelay: '0.24s' }}>
          <header className="card__head">
            <div>
              <span className="eyebrow">Tendência</span>
              <h2>Últimas 24 h e próximos 3 dias</h2>
            </div>
          </header>
          {report && report.hourly.length > 1 ? <ForecastChart hours={report.hourly} /> : <div className="shimmer chart-skeleton" />}
        </section>

        <section className="card card--advice" style={{ animationDelay: '0.32s' }}>
          <header className="card__head">
            <div>
              <span className="eyebrow">Saúde</span>
              <h2>Recomendações</h2>
            </div>
          </header>
          <HealthAdvice level={level} />
        </section>

        <section className="card card--pollutants" style={{ animationDelay: '0.4s' }}>
          <header className="card__head">
            <div>
              <span className="eyebrow">Composição do ar</span>
              <h2>Poluentes agora</h2>
            </div>
            <span className="card__meta">barra marca o valor-guia da OMS</span>
          </header>
          {report ? <PollutantGrid current={report.current} /> : <div className="shimmer chart-skeleton" />}
        </section>
      </main>

      <footer className="footer">
        Dados de <a href="https://open-meteo.com/en/docs/air-quality-api">Open-Meteo Air Quality</a> (Copernicus CAMS).
        Estimativas de modelo — podem diferir de estações locais de monitoramento.
      </footer>
    </div>
  )
}
