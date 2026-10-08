import { useEffect, useMemo, useRef, useState } from 'react'
import type { HourPoint } from '../lib/api'
import { AQI_LEVELS, levelFor } from '../lib/aqi'

const H = 220
const PAD = { top: 16, right: 12, bottom: 28, left: 34 }

const hourFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' })

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function ForecastChart({ hours }: { hours: HourPoint[] }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const now = Date.now()

  const { x, y, line, area, yMax, nowX, days, peak } = useMemo(() => {
    const t0 = hours[0].time.getTime()
    const t1 = hours[hours.length - 1].time.getTime()
    const maxAqi = Math.max(...hours.map((h) => h.aqi))
    const yMax = Math.max(100, Math.ceil((maxAqi + 20) / 50) * 50)
    const innerW = width - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * innerW
    const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH
    const pts = hours.map((h) => [x(h.time.getTime()), y(h.aqi)] as const)
    const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('')
    const area = `${line}L${pts[pts.length - 1][0]},${y(0)}L${pts[0][0]},${y(0)}Z`
    const days = hours.filter((h) => h.time.getHours() === 0)
    const future = hours.filter((h) => h.time.getTime() >= now)
    const peak = future.length ? future.reduce((a, b) => (b.aqi > a.aqi ? b : a)) : null
    return { x, y, line, area, yMax, nowX: x(Math.min(Math.max(now, t0), t1)), days, peak }
  }, [hours, width, now])

  // Gradiente vertical: cada faixa de AQI recebe a sua cor (offsets crescentes, do topo para a base).
  const stops = [...AQI_LEVELS].reverse().filter((l) => l.min <= yMax).flatMap((l) => {
    const top = 1 - Math.min(l.max, yMax) / yMax
    const bottom = 1 - l.min / yMax
    return [
      <stop key={`${l.key}-a`} offset={top} stopColor={l.color} />,
      <stop key={`${l.key}-b`} offset={bottom} stopColor={l.color} />,
    ]
  })

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    let best = 0
    hours.forEach((h, i) => {
      if (Math.abs(x(h.time.getTime()) - px) < Math.abs(x(hours[best].time.getTime()) - px)) best = i
    })
    setHover(best)
  }

  const hp = hover != null ? hours[hover] : null

  return (
    <div className="chart" ref={ref}>
      {peak && (
        <p className="chart__peak">
          Pico previsto: <strong style={{ color: levelFor(peak.aqi).color }}>{peak.aqi}</strong> em{' '}
          {dayFmt.format(peak.time)}, {hourFmt.format(peak.time)}
        </p>
      )}
      <svg
        width={width}
        height={H}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Previsão horária do índice de qualidade do ar"
      >
        <defs>
          <linearGradient id="aqiStroke" x1="0" y1={PAD.top} x2="0" y2={H - PAD.bottom} gradientUnits="userSpaceOnUse">
            {stops}
          </linearGradient>
          <linearGradient id="aqiFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="fillMask">
            <path d={area} fill="url(#aqiFill)" />
          </mask>
        </defs>

        {[0, 50, 100, 150, 200, 300].filter((v) => v <= yMax).map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="chart__grid" />
            <text x={PAD.left - 8} y={y(v)} className="chart__axis" textAnchor="end" dominantBaseline="middle">
              {v}
            </text>
          </g>
        ))}

        <rect x="0" y="0" width={nowX} height={H - PAD.bottom} className="chart__past" />

        {days.map((d) => (
          <g key={d.time.toISOString()}>
            <line x1={x(d.time.getTime())} x2={x(d.time.getTime())} y1={PAD.top} y2={H - PAD.bottom} className="chart__day" />
            <text x={x(d.time.getTime()) + 4} y={H - 8} className="chart__axis">
              {dayFmt.format(d.time)}
            </text>
          </g>
        ))}

        <rect x="0" y="0" width={width} height={H} fill="url(#aqiStroke)" mask="url(#fillMask)" />
        <path d={line} fill="none" stroke="url(#aqiStroke)" strokeWidth={2.5} strokeLinejoin="round" className="chart__line" />

        <line x1={nowX} x2={nowX} y1={PAD.top - 6} y2={H - PAD.bottom} className="chart__now" />
        <text x={nowX} y={PAD.top - 8} className="chart__now-label" textAnchor="middle">
          agora
        </text>

        {hp && (
          <g>
            <line x1={x(hp.time.getTime())} x2={x(hp.time.getTime())} y1={PAD.top} y2={H - PAD.bottom} className="chart__cursor" />
            <circle cx={x(hp.time.getTime())} cy={y(hp.aqi)} r={5} fill={levelFor(hp.aqi).color} stroke="var(--bg)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hp && (
        <div
          className="chart__tip"
          style={{ left: Math.min(Math.max(x(hp.time.getTime()), 80), width - 80), top: y(hp.aqi) }}
        >
          <span>
            {dayFmt.format(hp.time)} · {hourFmt.format(hp.time)}
          </span>
          <strong style={{ color: levelFor(hp.aqi).color }}>AQI {hp.aqi}</strong>
          <span>PM2.5 {hp.pm2_5.toFixed(1)} μg/m³</span>
        </div>
      )}
    </div>
  )
}
