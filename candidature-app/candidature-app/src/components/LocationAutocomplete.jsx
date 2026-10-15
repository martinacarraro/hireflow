import { useEffect, useId, useState } from 'react'

export default function LocationAutocomplete({ className, value, language = 'it', onChange, onSelect }) {
  const listId = useId()
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => setQuery(value || ''), [value])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      setSearchError(false)
      return
    }

    const controller = new AbortController()
    let requestTimeout
    let timedOut = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setSearchError(false)
      requestTimeout = window.setTimeout(() => {
        timedOut = true
        controller.abort()
      }, 7000)
      try {
        const url = new URL('https://photon.komoot.io/api/')
        url.searchParams.set('q', term)
        url.searchParams.set('limit', '6')
        url.searchParams.set('lang', language)
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error('Location search failed')
        const data = await response.json()
        const seen = new Set()
        const places = (data.features || []).flatMap(feature => {
          const properties = feature.properties || {}
          const name = properties.city || properties.name
          const country = properties.country
          if (!name || !country) return []
          const key = `${name.toLocaleLowerCase()}|${country.toLocaleLowerCase()}|${(properties.state || '').toLocaleLowerCase()}`
          if (seen.has(key)) return []
          seen.add(key)
          return [{ id: key, name, country, state: properties.state || '' }]
        })
        if (!controller.signal.aborted) {
          setResults(places)
          setActiveIndex(-1)
        }
      } catch {
        if (!controller.signal.aborted || timedOut) {
          setResults([])
          setSearchError(true)
        }
      } finally {
        window.clearTimeout(requestTimeout)
        if (!controller.signal.aborted || timedOut) setLoading(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(requestTimeout)
      controller.abort()
    }
  }, [query, language])

  const choose = place => {
    const fullName = `${place.name}, ${place.country}`
    setQuery(fullName)
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    onChange(fullName)
    onSelect?.({ name: fullName, country: place.country })
  }

  const handleKeyDown = event => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex(index => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      setActiveIndex(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault()
      choose(results[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return <div className="relative mt-1">
    <input
      className={className}
      value={query}
      placeholder={language === 'en' ? 'E.g. Rome, Italy · Remote' : 'Es. Roma, Italia · Da remoto'}
      autoComplete="off"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open && (results.length > 0 || loading || searchError)}
      aria-controls={listId}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 120)}
      onKeyDown={handleKeyDown}
      onChange={event => {
        setQuery(event.target.value)
        setOpen(true)
        setActiveIndex(-1)
        onChange(event.target.value)
      }}
    />
    {open && (results.length > 0 || loading || searchError) && <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
      {loading && results.length === 0 && <p className="px-3 py-2 text-xs text-muted">{language === 'en' ? 'Searching places…' : 'Cerco la località…'}</p>}
      {searchError && <p role="status" className="px-3 py-2 text-xs text-muted">{language === 'en' ? 'Suggestions are unavailable. You can type the location manually.' : 'Suggerimenti non disponibili. Puoi scrivere la località a mano.'}</p>}
      {results.length > 0 && <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
        {results.map((place, index) => <li key={place.id} role="option" aria-selected={activeIndex === index}>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
            onMouseDown={event => event.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => choose(place)}
          >
            <span className="block text-txt">{place.name}, {place.country}</span>
            {place.state && place.state.toLocaleLowerCase() !== place.name.toLocaleLowerCase() && <span className="block text-xs text-muted">{place.state}</span>}
          </button>
        </li>)}
      </ul>}
      <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted">
        © <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a className="underline" href="https://github.com/komoot/photon" target="_blank" rel="noreferrer">Photon</a>
      </p>
    </div>}
  </div>
}
