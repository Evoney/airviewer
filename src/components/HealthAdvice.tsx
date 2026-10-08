import type { AqiLevel } from '../lib/aqi'

const ITEMS: { key: keyof AqiLevel['advice']; title: string; icon: string }[] = [
  { key: 'general', title: 'População geral', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' },
  { key: 'sensitive', title: 'Grupos sensíveis', icon: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z' },
  { key: 'activity', title: 'Atividade física', icon: 'M13 4a2 2 0 1 1 0 .01M7 21l3-6 3 2v4m-3-6 1-5 4 3h3M8 11l3-2' },
  { key: 'mask', title: 'Proteção', icon: 'M4 9c3-2 13-2 16 0v4c0 3-4 6-8 6s-8-3-8-6V9Zm4 3h8' },
]

export function HealthAdvice({ level }: { level: AqiLevel }) {
  return (
    <ul className="advice" style={{ ['--c' as string]: level.color }}>
      {ITEMS.map((item) => (
        <li key={item.key}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d={item.icon} />
          </svg>
          <div>
            <strong>{item.title}</strong>
            <p>{level.advice[item.key]}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
