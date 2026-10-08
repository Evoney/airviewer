import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type Place } from '../lib/api'

interface Props {
  onSelect: (p: Place) => void
  onLocate: () => void
  locating: boolean
}

export function LocationSearch({ onSelect, onLocate, locating }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchPlaces(query.trim(), ctrl.signal)
        .then((r) => {
          setResults(r)
          setActive(0)
          setOpen(true)
        })
        .catch(() => {})
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (p: Place) => {
    onSelect(p)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') setActive((a) => (a + 1) % results.length)
    else if (e.key === 'ArrowUp') setActive((a) => (a - 1 + results.length) % results.length)
    else if (e.key === 'Enter') choose(results[active])
    else if (e.key === 'Escape') setOpen(false)
    else return
    e.preventDefault()
  }

  return (
    <div className="search" ref={boxRef}>
      <div className="search__field">
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKey}
          placeholder="Buscar cidade…"
          aria-label="Buscar cidade"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
        />
      </div>
      <button type="button" className="search__locate" onClick={onLocate} disabled={locating}>
        <svg viewBox="0 0 24 24" aria-hidden className={locating ? 'spin' : ''}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="7" />
        </svg>
        <span>{locating ? 'Localizando…' : 'Minha localização'}</span>
      </button>
      {open && results.length > 0 && (
        <ul className="search__results" id="search-results" role="listbox">
          {results.map((r, i) => (
            <li
              key={`${r.lat},${r.lon}`}
              role="option"
              aria-selected={i === active}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(r)}
            >
              <strong>{r.name}</strong>
              <span>{r.region}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
