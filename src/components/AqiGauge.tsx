import { AQI_LEVELS, levelFor } from '../lib/aqi'

const MAX = 300
const R = 88
const CX = 110
const CY = 110

function polar(value: number, radius = R) {
  const angle = Math.PI * (1 - Math.min(value, MAX) / MAX)
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) }
}

function arc(from: number, to: number) {
  const a = polar(from)
  const b = polar(to)
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`
}

export function AqiGauge({ aqi }: { aqi: number }) {
  const level = levelFor(aqi)
  const segments = AQI_LEVELS.filter((l) => l.min < MAX)
  const rotation = -90 + (Math.min(aqi, MAX) / MAX) * 180

  return (
    <div className="gauge">
      <svg viewBox="0 0 220 128" role="img" aria-label={`Índice de qualidade do ar ${aqi}, ${level.label}`}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {segments.map((l) => {
          const active = l.key === level.key
          const d = arc(l.min === 0 ? 0 : l.min - 1, Math.min(l.max, MAX))
          return (
            <g key={l.key}>
              {active && <path d={d} stroke={l.color} strokeWidth={14} fill="none" filter="url(#glow)" opacity={0.7} />}
              <path
                d={d}
                stroke={l.color}
                strokeWidth={active ? 12 : 8}
                strokeOpacity={active ? 1 : 0.28}
                fill="none"
                strokeLinecap="butt"
              />
            </g>
          )
        })}
        {[0, 50, 100, 150, 200, 300].map((t) => {
          const p = polar(t, R - 25)
          return (
            <text key={t} x={p.x} y={p.y} className="gauge__tick" textAnchor="middle" dominantBaseline="middle">
              {t}
            </text>
          )
        })}
        <g className="gauge__needle" style={{ transform: `rotate(${rotation}deg)` }}>
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 4} stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r={6} fill="var(--bg)" stroke="var(--ink)" strokeWidth={2} />
      </svg>
      <div className="gauge__value" style={{ color: level.color }}>
        {aqi}
      </div>
      <div className="gauge__unit">US AQI</div>
    </div>
  )
}
