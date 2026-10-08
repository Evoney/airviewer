import type { CurrentAir } from '../lib/api'
import { POLLUTANTS, ratioColor } from '../lib/aqi'

export function PollutantGrid({ current }: { current: CurrentAir }) {
  return (
    <div className="pollutants">
      {POLLUTANTS.map((p, i) => {
        const value = current[p.key]
        const ratio = value / p.guideline
        const color = ratioColor(ratio)
        const fill = Math.min(ratio / 3, 1) * 100
        return (
          <article key={p.key} className="pollutant" style={{ ['--c' as string]: color, animationDelay: `${0.05 * i}s` }}>
            <header>
              <span className="pollutant__formula">{p.formula}</span>
              <span className="pollutant__ratio" title="Relação com o valor-guia da OMS">
                {ratio < 0.1 ? '<0.1' : ratio.toFixed(1)}× OMS
              </span>
            </header>
            <div className="pollutant__value">
              {value >= 1000 ? Math.round(value).toLocaleString('pt-BR') : value.toFixed(1)}
              <small>{p.unit}</small>
            </div>
            <div className="pollutant__bar" aria-hidden>
              <span style={{ width: `${fill}%` }} />
              <i style={{ left: `${100 / 3}%` }} title="Valor-guia OMS" />
            </div>
            <p className="pollutant__name">{p.name}</p>
            <p className="pollutant__desc">{p.description}</p>
          </article>
        )
      })}
    </div>
  )
}
