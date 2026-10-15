import { useEffect, useId, useState } from 'react'

const POPULAR_PLACES = [
  ['Roma', 'Rome', 'Italia', 'Italy', ['Roma', 'Rome']],
  ['Milano', 'Milan', 'Italia', 'Italy', ['Milano', 'Milan']],
  ['Napoli', 'Naples', 'Italia', 'Italy', ['Napoli', 'Naples']],
  ['Torino', 'Turin', 'Italia', 'Italy', ['Torino', 'Turin']],
  ['Bologna', 'Bologna', 'Italia', 'Italy', ['Bologna']],
  ['Firenze', 'Florence', 'Italia', 'Italy', ['Firenze', 'Florence']],
  ['Venezia', 'Venice', 'Italia', 'Italy', ['Venezia', 'Venice']],
  ['Palermo', 'Palermo', 'Italia', 'Italy', ['Palermo']],
  ['Genova', 'Genoa', 'Italia', 'Italy', ['Genova', 'Genoa']],
  ['Bari', 'Bari', 'Italia', 'Italy', ['Bari']],
  ['Catania', 'Catania', 'Italia', 'Italy', ['Catania']],
  ['Verona', 'Verona', 'Italia', 'Italy', ['Verona']],
  ['Padova', 'Padua', 'Italia', 'Italy', ['Padova', 'Padua']],
  ['Trieste', 'Trieste', 'Italia', 'Italy', ['Trieste']],
  ['Cagliari', 'Cagliari', 'Italia', 'Italy', ['Cagliari']],
  ['Londra', 'London', 'Regno Unito', 'United Kingdom', ['Londra', 'London']],
  ['Parigi', 'Paris', 'Francia', 'France', ['Parigi', 'Paris']],
  ['Berlino', 'Berlin', 'Germania', 'Germany', ['Berlino', 'Berlin']],
  ['Madrid', 'Madrid', 'Spagna', 'Spain', ['Madrid']],
  ['Barcellona', 'Barcelona', 'Spagna', 'Spain', ['Barcellona', 'Barcelona']],
  ['Lisbona', 'Lisbon', 'Portogallo', 'Portugal', ['Lisbona', 'Lisbon']],
  ['Amsterdam', 'Amsterdam', 'Paesi Bassi', 'Netherlands', ['Amsterdam']],
  ['Bruxelles', 'Brussels', 'Belgio', 'Belgium', ['Bruxelles', 'Brussels']],
  ['Vienna', 'Vienna', 'Austria', 'Austria', ['Vienna']],
  ['Praga', 'Prague', 'Cechia', 'Czechia', ['Praga', 'Prague']],
  ['Varsavia', 'Warsaw', 'Polonia', 'Poland', ['Varsavia', 'Warsaw']],
  ['Budapest', 'Budapest', 'Ungheria', 'Hungary', ['Budapest']],
  ['Bucarest', 'Bucharest', 'Romania', 'Romania', ['Bucarest', 'Bucharest']],
  ['Atene', 'Athens', 'Grecia', 'Greece', ['Atene', 'Athens']],
  ['Istanbul', 'Istanbul', 'Turchia', 'Türkiye', ['Istanbul']],
  ['Kyiv', 'Kyiv', 'Ucraina', 'Ukraine', ['Kyiv', 'Kiev']],
  ['Mosca', 'Moscow', 'Russia', 'Russia', ['Mosca', 'Moscow', 'Moskva']],
  ['Stoccolma', 'Stockholm', 'Svezia', 'Sweden', ['Stoccolma', 'Stockholm']],
  ['Oslo', 'Oslo', 'Norvegia', 'Norway', ['Oslo']],
  ['Copenaghen', 'Copenhagen', 'Danimarca', 'Denmark', ['Copenaghen', 'Copenhagen']],
  ['Helsinki', 'Helsinki', 'Finlandia', 'Finland', ['Helsinki']],
  ['Dublino', 'Dublin', 'Irlanda', 'Ireland', ['Dublino', 'Dublin']],
  ['Zurigo', 'Zurich', 'Svizzera', 'Switzerland', ['Zurigo', 'Zurich']],
  ['Monaco di Baviera', 'Munich', 'Germania', 'Germany', ['Monaco di Baviera', 'Munich']],
  ['Amburgo', 'Hamburg', 'Germania', 'Germany', ['Amburgo', 'Hamburg']],
  ['New York', 'New York', 'Stati Uniti', 'United States', ['New York']],
  ['Los Angeles', 'Los Angeles', 'Stati Uniti', 'United States', ['Los Angeles']],
  ['San Francisco', 'San Francisco', 'Stati Uniti', 'United States', ['San Francisco']],
  ['Chicago', 'Chicago', 'Stati Uniti', 'United States', ['Chicago']],
  ['Toronto', 'Toronto', 'Canada', 'Canada', ['Toronto']],
  ['Montreal', 'Montreal', 'Canada', 'Canada', ['Montreal', 'Montréal']],
  ['Vancouver', 'Vancouver', 'Canada', 'Canada', ['Vancouver']],
  ['Città del Messico', 'Mexico City', 'Messico', 'Mexico', ['Città del Messico', 'Mexico City']],
  ['San Paolo', 'São Paulo', 'Brasile', 'Brazil', ['San Paolo', 'Sao Paulo', 'São Paulo']],
  ['Rio de Janeiro', 'Rio de Janeiro', 'Brasile', 'Brazil', ['Rio de Janeiro']],
  ['Buenos Aires', 'Buenos Aires', 'Argentina', 'Argentina', ['Buenos Aires']],
  ['Santiago', 'Santiago', 'Cile', 'Chile', ['Santiago']],
  ['Lima', 'Lima', 'Perù', 'Peru', ['Lima']],
  ['Bogotà', 'Bogota', 'Colombia', 'Colombia', ['Bogotà', 'Bogota']],
  ['Tokyo', 'Tokyo', 'Giappone', 'Japan', ['Tokyo']],
  ['Seul', 'Seoul', 'Corea del Sud', 'South Korea', ['Seul', 'Seoul']],
  ['Pechino', 'Beijing', 'Cina', 'China', ['Pechino', 'Beijing']],
  ['Shanghai', 'Shanghai', 'Cina', 'China', ['Shanghai']],
  ['Hong Kong', 'Hong Kong', 'Hong Kong', 'Hong Kong', ['Hong Kong']],
  ['Taipei', 'Taipei', 'Taiwan', 'Taiwan', ['Taipei']],
  ['Singapore', 'Singapore', 'Singapore', 'Singapore', ['Singapore']],
  ['Bangkok', 'Bangkok', 'Thailandia', 'Thailand', ['Bangkok']],
  ['Hanoi', 'Hanoi', 'Vietnam', 'Vietnam', ['Hanoi']],
  ['Giacarta', 'Jakarta', 'Indonesia', 'Indonesia', ['Giacarta', 'Jakarta']],
  ['Manila', 'Manila', 'Filippine', 'Philippines', ['Manila']],
  ['Nuova Delhi', 'New Delhi', 'India', 'India', ['Nuova Delhi', 'New Delhi']],
  ['Mumbai', 'Mumbai', 'India', 'India', ['Mumbai', 'Bombay']],
  ['Bengaluru', 'Bengaluru', 'India', 'India', ['Bengaluru', 'Bangalore']],
  ['Dubai', 'Dubai', 'Emirati Arabi Uniti', 'United Arab Emirates', ['Dubai']],
  ['Abu Dhabi', 'Abu Dhabi', 'Emirati Arabi Uniti', 'United Arab Emirates', ['Abu Dhabi']],
  ['Riad', 'Riyadh', 'Arabia Saudita', 'Saudi Arabia', ['Riad', 'Riyadh']],
  ['Doha', 'Doha', 'Qatar', 'Qatar', ['Doha']],
  ['Il Cairo', 'Cairo', 'Egitto', 'Egypt', ['Il Cairo', 'Cairo']],
  ['Lagos', 'Lagos', 'Nigeria', 'Nigeria', ['Lagos']],
  ['Nairobi', 'Nairobi', 'Kenya', 'Kenya', ['Nairobi']],
  ['Johannesburg', 'Johannesburg', 'Sudafrica', 'South Africa', ['Johannesburg']],
  ['Città del Capo', 'Cape Town', 'Sudafrica', 'South Africa', ['Città del Capo', 'Cape Town']],
  ['Sydney', 'Sydney', 'Australia', 'Australia', ['Sydney']],
  ['Melbourne', 'Melbourne', 'Australia', 'Australia', ['Melbourne']],
  ['Auckland', 'Auckland', 'Nuova Zelanda', 'New Zealand', ['Auckland']],
]

const normalize = value => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const popularSuggestions = (query, language) => {
  const term = normalize(query)
  return POPULAR_PLACES
    .filter(([it, en, , , aliases]) => [it, en, ...aliases].some(name => normalize(name).startsWith(term)))
    .slice(0, 6)
    .map(([it, en, countryIt, countryEn]) => ({
      id: `popular-${normalize(en)}`,
      name: language === 'en' ? en : it,
      country: language === 'en' ? countryEn : countryIt,
      state: '',
    }))
}

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

    const localPlaces = popularSuggestions(term, language)
    setResults(localPlaces)
    setSearchError(false)
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
          const known = new Set(localPlaces.map(place => `${normalize(place.name)}|${normalize(place.country)}`))
          const merged = [...localPlaces, ...places.filter(place => {
            const key = `${normalize(place.name)}|${normalize(place.country)}`
            if (known.has(key)) return false
            known.add(key)
            return true
          })].slice(0, 8)
          setResults(merged)
          setActiveIndex(-1)
        }
      } catch {
        if (!controller.signal.aborted || timedOut) {
          setResults(localPlaces)
          setSearchError(localPlaces.length === 0)
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
