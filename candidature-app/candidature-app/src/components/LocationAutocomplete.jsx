import { useEffect, useId, useState } from 'react'
import worldCities from '../data/world-cities.json'

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
  ["Brescia","Brescia","Italia","Italy",["Brescia"]],
  ["Parma","Parma","Italia","Italy",["Parma"]],
  ["Modena","Modena","Italia","Italy",["Modena"]],
  ["Reggio Emilia","Reggio Emilia","Italia","Italy",["Reggio Emilia"]],
  ["Pisa","Pisa","Italia","Italy",["Pisa"]],
  ["Siena","Siena","Italia","Italy",["Siena"]],
  ["Perugia","Perugia","Italia","Italy",["Perugia"]],
  ["Lecce","Lecce","Italia","Italy",["Lecce"]],
  ["Messina","Messina","Italia","Italy",["Messina"]],
  ["Reggio Calabria","Reggio Calabria","Italia","Italy",["Reggio Calabria"]],
  ["Pescara","Pescara","Italia","Italy",["Pescara"]],
  ["Ancona","Ancona","Italia","Italy",["Ancona"]],
  ["Udine","Udine","Italia","Italy",["Udine"]],
  ["Bolzano","Bolzano","Italia","Italy",["Bolzano","Bozen"]],
  ["Cremona","Cremona","Italia","Italy",["Cremona"]],
  ["Ferrara","Ferrara","Italia","Italy",["Ferrara"]],
  ["Rimini","Rimini","Italia","Italy",["Rimini"]],
  ["Salerno","Salerno","Italia","Italy",["Salerno"]],
  ["Taranto","Taranto","Italia","Italy",["Taranto"]],
  ["Lyon","Lyon","Francia","France",["Lyon"]],
  ["Marsiglia","Marseille","Francia","France",["Marsiglia","Marseille"]],
  ["Nizza","Nice","Francia","France",["Nizza","Nice"]],
  ["Tolosa","Toulouse","Francia","France",["Tolosa","Toulouse"]],
  ["Bordeaux","Bordeaux","Francia","France",["Bordeaux"]],
  ["Porto","Porto","Portogallo","Portugal",["Porto"]],
  ["Valencia","Valencia","Spagna","Spain",["Valencia"]],
  ["Siviglia","Seville","Spagna","Spain",["Siviglia","Seville"]],
  ["Malaga","Málaga","Spagna","Spain",["Malaga","Málaga"]],
  ["Bilbao","Bilbao","Spagna","Spain",["Bilbao"]],
  ["Manchester","Manchester","Regno Unito","United Kingdom",["Manchester"]],
  ["Birmingham","Birmingham","Regno Unito","United Kingdom",["Birmingham"]],
  ["Edimburgo","Edinburgh","Regno Unito","United Kingdom",["Edimburgo","Edinburgh"]],
  ["Liverpool","Liverpool","Regno Unito","United Kingdom",["Liverpool"]],
  ["Francoforte","Frankfurt","Germania","Germany",["Francoforte","Frankfurt"]],
  ["Colonia","Cologne","Germania","Germany",["Colonia","Cologne"]],
  ["Stoccarda","Stuttgart","Germania","Germany",["Stoccarda","Stuttgart"]],
  ["Düsseldorf","Düsseldorf","Germania","Germany",["Düsseldorf","Duesseldorf"]],
  ["Ginevra","Geneva","Svizzera","Switzerland",["Ginevra","Geneva"]],
  ["Basilea","Basel","Svizzera","Switzerland",["Basilea","Basel"]],
  ["Cracovia","Krakow","Polonia","Poland",["Cracovia","Krakow","Kraków"]],
  ["Danzica","Gdansk","Polonia","Poland",["Danzica","Gdansk","Gdańsk"]],
  ["Bratislava","Bratislava","Slovacchia","Slovakia",["Bratislava"]],
  ["Lubiana","Ljubljana","Slovenia","Slovenia",["Lubiana","Ljubljana"]],
  ["Zagabria","Zagreb","Croazia","Croatia",["Zagabria","Zagreb"]],
  ["Belgrado","Belgrade","Serbia","Serbia",["Belgrado","Belgrade"]],
  ["Sofia","Sofia","Bulgaria","Bulgaria",["Sofia"]],
  ["Tallinn","Tallinn","Estonia","Estonia",["Tallinn"]],
  ["Riga","Riga","Lettonia","Latvia",["Riga"]],
  ["Vilnius","Vilnius","Lituania","Lithuania",["Vilnius"]],
  ["Reykjavik","Reykjavik","Islanda","Iceland",["Reykjavik","Reykjavík"]],
  ["Ankara","Ankara","Turchia","Türkiye",["Ankara"]],
  ["Antalya","Antalya","Turchia","Türkiye",["Antalya"]],
  ["Boston","Boston","Stati Uniti","United States",["Boston"]],
  ["Miami","Miami","Stati Uniti","United States",["Miami"]],
  ["Seattle","Seattle","Stati Uniti","United States",["Seattle"]],
  ["Washington","Washington, D.C.","Stati Uniti","United States",["Washington","Washington DC","Washington, D.C."]],
  ["Philadelphia","Philadelphia","Stati Uniti","United States",["Philadelphia"]],
  ["Austin","Austin","Stati Uniti","United States",["Austin"]],
  ["Dallas","Dallas","Stati Uniti","United States",["Dallas"]],
  ["Houston","Houston","Stati Uniti","United States",["Houston"]],
  ["Denver","Denver","Stati Uniti","United States",["Denver"]],
  ["Ottawa","Ottawa","Canada","Canada",["Ottawa"]],
  ["Calgary","Calgary","Canada","Canada",["Calgary"]],
  ["L'Avana","Havana","Cuba","Cuba",["L'Avana","Havana"]],
  ["Panama","Panama City","Panama","Panama",["Panama","Panama City"]],
  ["Montevideo","Montevideo","Uruguay","Uruguay",["Montevideo"]],
  ["Quito","Quito","Ecuador","Ecuador",["Quito"]],
  ["Medellín","Medellin","Colombia","Colombia",["Medellín","Medellin"]],
  ["Cartagena","Cartagena","Colombia","Colombia",["Cartagena"]],
  ["Brasilia","Brasilia","Brasile","Brazil",["Brasilia"]],
  ["Salvador","Salvador","Brasile","Brazil",["Salvador"]],
  ["Belo Horizonte","Belo Horizonte","Brasile","Brazil",["Belo Horizonte"]],
  ["Osaka","Osaka","Giappone","Japan",["Osaka"]],
  ["Kyoto","Kyoto","Giappone","Japan",["Kyoto"]],
  ["Yokohama","Yokohama","Giappone","Japan",["Yokohama"]],
  ["Busan","Busan","Corea del Sud","South Korea",["Busan"]],
  ["Guangzhou","Guangzhou","Cina","China",["Guangzhou","Canton"]],
  ["Shenzhen","Shenzhen","Cina","China",["Shenzhen"]],
  ["Chengdu","Chengdu","Cina","China",["Chengdu"]],
  ["Kuala Lumpur","Kuala Lumpur","Malaysia","Malaysia",["Kuala Lumpur"]],
  ["Chiang Mai","Chiang Mai","Thailandia","Thailand",["Chiang Mai"]],
  ["Ho Chi Minh","Ho Chi Minh City","Vietnam","Vietnam",["Ho Chi Minh","Ho Chi Minh City","Saigon"]],
  ["Kathmandu","Kathmandu","Nepal","Nepal",["Kathmandu"]],
  ["Karachi","Karachi","Pakistan","Pakistan",["Karachi"]],
  ["Lahore","Lahore","Pakistan","Pakistan",["Lahore"]],
  ["Hyderabad","Hyderabad","India","India",["Hyderabad"]],
  ["Chennai","Chennai","India","India",["Chennai","Madras"]],
  ["Kolkata","Kolkata","India","India",["Kolkata","Calcutta"]],
  ["Pune","Pune","India","India",["Pune"]],
  ["Tel Aviv","Tel Aviv","Israele","Israel",["Tel Aviv"]],
  ["Gerusalemme","Jerusalem","Israele","Israel",["Gerusalemme","Jerusalem"]],
  ["Amman","Amman","Giordania","Jordan",["Amman"]],
  ["Beirut","Beirut","Libano","Lebanon",["Beirut"]],
  ["Mascate","Muscat","Oman","Oman",["Mascate","Muscat"]],
  ["Casablanca","Casablanca","Marocco","Morocco",["Casablanca"]],
  ["Marrakech","Marrakech","Marocco","Morocco",["Marrakech"]],
  ["Tunisi","Tunis","Tunisia","Tunisia",["Tunisi","Tunis"]],
  ["Algeri","Algiers","Algeria","Algeria",["Algeri","Algiers"]],
  ["Accra","Accra","Ghana","Ghana",["Accra"]],
  ["Addis Abeba","Addis Ababa","Etiopia","Ethiopia",["Addis Abeba","Addis Ababa"]],
  ["Dar es Salaam","Dar es Salaam","Tanzania","Tanzania",["Dar es Salaam"]],
  ["Durban","Durban","Sudafrica","South Africa",["Durban"]],
  ["Brisbane","Brisbane","Australia","Australia",["Brisbane"]],
  ["Perth","Perth","Australia","Australia",["Perth"]],
  ["Adelaide","Adelaide","Australia","Australia",["Adelaide"]],
  ["Wellington","Wellington","Nuova Zelanda","New Zealand",["Wellington"]],
]

const normalize = value => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const WORLD_CITIES_INDEX = worldCities.map(([name, country, state], index) => ({
  id: `world-${index}`,
  name,
  country,
  state,
  normalized: normalize(name),
}))
const COUNTRY_NAMES_IT = {
  ...Object.fromEntries(POPULAR_PLACES.map(([, , countryIt, countryEn]) => [countryEn, countryIt])),
  'Russian Federation': 'Russia',
  'United States': 'Stati Uniti',
  'United Kingdom': 'Regno Unito',
  'Viet Nam': 'Vietnam',
  'Korea, Republic of': 'Corea del Sud',
  'Korea, Democratic People\'s Republic of': 'Corea del Nord',
  'Iran, Islamic Republic of': 'Iran',
  'Bolivia, Plurinational State of': 'Bolivia',
  'Venezuela, Bolivarian Republic of': 'Venezuela',
  'Tanzania, United Republic of': 'Tanzania',
  'Moldova, Republic of': 'Moldavia',
  'Syrian Arab Republic': 'Siria',
  'Lao People\'s Democratic Republic': 'Laos',
  'Brunei Darussalam': 'Brunei',
  'Czechia': 'Cechia',
  'Türkiye': 'Turchia',
}
const popularSuggestions = (query, language) => {
  const term = normalize(query)
  const curated = POPULAR_PLACES
    .filter(([it, en, , , aliases]) => [it, en, ...aliases].some(name => normalize(name).startsWith(term)))
    .map(([it, en, countryIt, countryEn, aliases]) => ({
      id: `popular-${normalize(en)}`,
      name: language === 'en' ? en : it,
      country: language === 'en' ? countryEn : countryIt,
      state: '',
      aliases: aliases.map(normalize),
    }))

  const seen = new Set()
  const results = []
  for (const place of curated) {
    const key = `${normalize(place.name)}|${normalize(place.country)}`
    if (!seen.has(key)) {
      seen.add(key)
      results.push(place)
    }
  }
  const curatedAliases = curated.flatMap(place => place.aliases)
  for (const place of WORLD_CITIES_INDEX) {
    if (!place.normalized.startsWith(term)) continue
    if (curatedAliases.some(alias => place.normalized.startsWith(alias) || alias.startsWith(place.normalized))) continue
    const country = language === 'en' ? place.country : (COUNTRY_NAMES_IT[place.country] || place.country)
    const key = `${place.normalized}|${normalize(country)}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push({ id: place.id, name: place.name, country, state: place.state })
    if (results.length >= 8) break
  }
  return results.slice(0, 8)
}

export default function LocationAutocomplete({ className, value, language = 'it', onChange, onSelect }) {
  const listId = useId()
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => setQuery(value || ''), [value])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setActiveIndex(-1)
      return
    }

    setResults(popularSuggestions(term, language))
    setActiveIndex(-1)
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
      aria-expanded={open && results.length > 0}
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
    {open && results.length > 0 && <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
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
    </div>}
  </div>
}
