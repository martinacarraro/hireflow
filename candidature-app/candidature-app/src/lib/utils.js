// ─── STATUS SYSTEM ───────────────────────────────────────────────

export const STATI = ['Inviata','Colloquio','In attesa','Offerta ricevuta','GHOSTED','Ritirata']
export const PRIORITA = ['Alta','Media','Bassa']
export const FONTI = ['LinkedIn','Indeed','InfoJobs','Glassdoor','Referral','Sito aziendale','Altro']
export const TIPI_COLLOQUIO = ['📞 Telefonico','💻 Video','🏢 In presenza']
export const FEELING_OPTIONS = ['😍','🙂','😐','😬','🤷']

export const STATUS_CONFIG = {
  'Inviata':          { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',  emoji: '📤', label: 'Inviata' },
  'Colloquio':        { color: '#34D399', bg: 'rgba(52,211,153,0.15)',  emoji: '🎙️', label: 'Colloquio' },
  'In attesa':        { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  emoji: '⏳', label: 'In attesa' },
  'Offerta ricevuta': { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)', emoji: '🎉', label: 'Offerta!' },
  'GHOSTED':          { color: '#F87171', bg: 'rgba(248,113,113,0.15)', emoji: '👻', label: 'GHOSTED' },
  'Ritirata':         { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', emoji: '🚫', label: 'Ritirata' },
}

export const PRIORITA_CONFIG = {
  'Alta':  { emoji: '🔥', color: '#F87171' },
  'Media': { emoji: '⚡', color: '#FBBF24' },
  'Bassa': { emoji: '🌱', color: '#34D399' },
}

export const STATUS_GROUP_ORDER = ['Colloquio','Offerta ricevuta','Inviata','In attesa','GHOSTED','Ritirata']

// ─── SMART URL PARSER ────────────────────────────────────────────

export function parseJobUrl(url) {
  if (!url) return {}
  const lower = url.toLowerCase()
  let fonte = 'Altro'
  if (lower.includes('linkedin.com'))   fonte = 'LinkedIn'
  else if (lower.includes('indeed.'))   fonte = 'Indeed'
  else if (lower.includes('infojobs.')) fonte = 'InfoJobs'
  else if (lower.includes('glassdoor.'))fonte = 'Glassdoor'
  else if (lower.includes('monster.'))  fonte = 'Monster'
  else if (lower.includes('jobteaser.'))fonte = 'JobTeaser'
  else if (lower.includes('welcometothejungle.')) fonte = 'Welcome to the Jungle'
  else fonte = 'Sito aziendale'
  return { fonte }
}

export async function fetchJobDataFromUrl(url) {
  // Try to fetch page title via allorigins CORS proxy
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    const res = await fetch(proxy, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    const html = data.contents || ''
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const rawTitle = titleMatch ? titleMatch[1].trim() : ''

    let azienda = '', ruolo = ''
    const lower = url.toLowerCase()

    if (lower.includes('linkedin.com')) {
      // "Ruolo at Azienda | LinkedIn"
      const parts = rawTitle.replace(/\s*\|\s*LinkedIn.*$/i, '').split(' at ')
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    } else if (lower.includes('indeed.')) {
      // "Ruolo - Azienda - Indeed"
      const clean = rawTitle.replace(/\s*[-–]\s*Indeed.*$/i, '')
      const parts = clean.split(/\s*[-–]\s/)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    } else if (lower.includes('infojobs.')) {
      // "Ruolo en Azienda"
      const parts = rawTitle.split(/\s+en\s+/i)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.replace(/\s*[-|].*$/, '').trim() || ''
    } else if (lower.includes('glassdoor.')) {
      // "Ruolo Jobs at Azienda"
      const parts = rawTitle.replace(/ jobs?/i, '').split(/\s+at\s+/i)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.replace(/\s*[-|].*$/, '').trim() || ''
    } else {
      // Generic: take first part of title
      const clean = rawTitle.replace(/\s*[-|–]\s*.*$/, '').trim()
      ruolo = clean || ''
    }

    return { azienda, ruolo, fonte: parseJobUrl(url).fonte, success: !!(azienda || ruolo) }
  } catch {
    return { fonte: parseJobUrl(url).fonte, success: false }
  }
}

// ─── DATE HELPERS ────────────────────────────────────────────────

export function daysSince(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / 86400000)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return ''
  const d = formatDate(dateStr)
  return timeStr ? `${d} alle ${timeStr.slice(0,5)}` : d
}

export function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export function isTomorrow(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.toDateString() === tomorrow.toDateString()
}

export function isYesterday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

// ─── XP & GAMIFICATION ───────────────────────────────────────────

export const XP_EVENTS = {
  FIRST_CANDIDATURA: 10,
  ADD_CANDIDATURA:   5,
  GOT_COLLOQUIO:     15,
  CHECKLIST_ITEM:    5,
  CHECKLIST_FULL:    10,
  OFFERTA:           20,
  FEELING_ADDED:     3,
  NOTE_ADDED:        3,
  SMART_PARSE:       2,
}

export const LEVELS = [
  { min: 0,    max: 49,   lv: 1, name: 'In cerca',         emoji: '🌱' },
  { min: 50,   max: 149,  lv: 2, name: 'Determinata',      emoji: '⚡' },
  { min: 150,  max: 299,  lv: 3, name: 'In forma',         emoji: '🔥' },
  { min: 300,  max: 499,  lv: 4, name: 'Warrior',          emoji: '⚔️' },
  { min: 500,  max: 999,  lv: 5, name: 'Pro della Ricerca',emoji: '🎯' },
  { min: 1000, max: 99999,lv: 6, name: 'Leggenda',         emoji: '👑' },
]

export function getLevel(xp = 0) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getXpProgress(xp = 0) {
  const level = getLevel(xp)
  const range = level.max - level.min
  const progress = xp - level.min
  return Math.min((progress / range) * 100, 100)
}

export const BADGES = [
  { id: 'first',       emoji: '🚀', name: 'Prima Candidatura',    desc: 'Hai aggiunto la tua prima candidatura!',            check: (s) => s.total >= 1 },
  { id: 'ten',         emoji: '🎯', name: 'Cecchina',             desc: '10 candidature totali inviate.',                   check: (s) => s.total >= 10 },
  { id: 'twentyfive',  emoji: '💫', name: 'Instancabile',         desc: '25 candidature totali.',                           check: (s) => s.total >= 25 },
  { id: 'fifty',       emoji: '👑', name: 'Leggenda',             desc: '50 candidature — sei inarrestabile.',              check: (s) => s.total >= 50 },
  { id: 'colloquio1',  emoji: '🎙️', name: 'In the Game',          desc: 'Hai ottenuto il tuo primo colloquio!',             check: (s) => s.colloqui >= 1 },
  { id: 'fire',        emoji: '🔥', name: 'On Fire',              desc: '3 colloqui in un mese.',                           check: (s) => s.colloquiThisMonth >= 3 },
  { id: 'checklist',   emoji: '📋', name: 'Organizzatissima',     desc: 'Checklist completa prima di un colloquio.',        check: (s) => s.checklistComplete >= 1 },
  { id: 'resilient',   emoji: '💜', name: 'Resiliente',           desc: 'Hai continuato dopo 3 ghosting.',                  check: (s) => s.ghosted >= 3 && s.total > s.ghosted },
  { id: 'offer',       emoji: '🏆', name: 'Ce l\'hai fatta!',     desc: 'Hai ricevuto un\'offerta. Meritata. 🎉',           check: (s) => s.offerte >= 1 },
  { id: 'ghosthunter', emoji: '👻', name: 'Ghost Hunter',         desc: '5 aziende marchiate GHOSTED. Classici.',           check: (s) => s.ghosted >= 5 },
  { id: 'writer',      emoji: '✍️', name: 'Scrittrice',           desc: 'Note aggiunte a 10 candidature.',                  check: (s) => s.withNotes >= 10 },
  { id: 'smart',       emoji: '🔗', name: 'Smart Applier',        desc: '5 candidature via smart link parser.',             check: (s) => s.smartParsed >= 5 },
  { id: 'dates',       emoji: '📅', name: 'Puntuale',             desc: 'Data aggiunta a 5 colloqui.',                      check: (s) => s.withDates >= 5 },
  { id: 'world',       emoji: '🌍', name: 'Cosmopolita',          desc: 'Candidature in 3+ paesi diversi.',                 check: (s) => s.countries >= 3 },
]

// ─── MOTIVATIONAL PHRASES ────────────────────────────────────────

export const MOTTOS = [
  "Daje, la prossima è quella giusta. ✨",
  "Organizzazione è metà della vittoria. 💪",
  "Ogni no ti avvicina al sì perfetto. 🎯",
  "Il ghosting dice più su di loro che su di te. 👻",
  "Stai costruendo qualcosa di grande. Continua. 🌟",
  "Un colloquio è una conversazione tra pari. Ricordatelo. 🤝",
  "Il mercato è strano, tu non lo sei. ❤️",
  "Roma non è stata costruita in un giorno. Nemmeno una carriera. 🏛️",
  "Una pausa non è fermarsi. Ricarica e riparte. ☕",
  "Sii la persona che il tuo CV promette. Ci sei quasi. 💜",
]

// ─── LOADING TIPS ────────────────────────────────────────────────

export const LOADING_TIPS = [
  { cat: '🎙️ Colloquio', text: "Arrivare 5 minuti prima (non 20) dimostra organizzazione, non ansia." },
  { cat: '🎙️ Colloquio', text: "La domanda 'Hai domande per noi?' NON è retorica. Preparane almeno 2." },
  { cat: '🎙️ Colloquio', text: "Parla dei risultati con numeri: 'Ho aumentato X del 30%' batte 'Lavoravo su X'." },
  { cat: '🎙️ Colloquio', text: "Se non capisci una domanda, chiedi di ripeterla. È attenzione, non ignoranza." },
  { cat: '🎙️ Colloquio', text: "Fine colloquio: chiedi sempre 'Quali sono i prossimi passi?' Ti posiziona come proattiva." },
  { cat: '🎙️ Colloquio', text: "Dopo il colloquio, manda una mail di ringraziamento entro 24h. Pochi lo fanno. Quei pochi si ricordano." },
  { cat: '🎙️ Colloquio', text: "Sul salario: cerca la media su LinkedIn o Glassdoor prima di rispondere. Non sparare alla cieca." },
  { cat: '📄 CV',         text: "Il CV perfetto è su una pagina (se hai meno di 10 anni di esperienza). Meno è più." },
  { cat: '📄 CV',         text: "Personalizza ogni CV. Copia le parole chiave dall'annuncio — gli ATS ti ringraziano." },
  { cat: '📄 CV',         text: "Candidati anche se non hai il 100% dei requisiti. Le aziende scrivono la lista dei sogni." },
  { cat: '📄 CV',         text: "LinkedIn con 'Open to work' visibile solo ai recruiter = candidature che arrivano da sole." },
  { cat: '📄 CV',         text: "Gap nel CV? Non nasconderlo. Preparati a raccontarlo in modo positivo." },
  { cat: '💜 Mindset',   text: "La ricerca di lavoro è un funnel. Più candidature mandi, più colloqui ottieni. È matematica." },
  { cat: '💜 Mindset',   text: "Un no non è un giudizio su di te. È solo un mismatch. Spesso nemmeno quello." },
  { cat: '💜 Mindset',   text: "Il ghosting è una scortesia aziendale, non una tua mancanza. Punto." },
  { cat: '💜 Mindset',   text: "La media di risposta è sotto il 10%. Se ottieni più del 5%, stai già vincendo." },
  { cat: '💜 Mindset',   text: "Trattare la ricerca di lavoro come un lavoro vero (ore fisse, pause) la rende meno stressante." },
  { cat: '💜 Mindset',   text: "Parlare della tua ricerca con amici e familiari aiuta. Il 70% dei lavori si trova tramite network." },
  { cat: '🏆 Offerta',   text: "Hai ricevuto un'offerta? Puoi negoziare. L'85% delle aziende si aspetta una controfferta." },
  { cat: '🏆 Offerta',   text: "Prima di firmare, leggi il contratto completo. È normale, è professionale, è il tuo diritto." },
  { cat: '🏆 Offerta',   text: "Confronta il pacchetto totale: RAL, benefit, ferie, smart working. Lo stipendio è solo una parte." },
  { cat: '🚀 Pro tip',   text: "Tenere traccia delle candidature (come fai qui!) riduce l'ansia del 'chissà quante ne ho mandate'." },
  { cat: '🚀 Pro tip',   text: "Stai usando questa app? Sei già più organizzata del 90% delle persone in cerca di lavoro." },
  { cat: '🚀 Pro tip',   text: "Candidarsi alle 9-11 di mattina aumenta le chance di essere visti. I recruiter iniziano la giornata freschi." },
  { cat: '🚀 Pro tip',   text: "Un messaggio diretto al recruiter su LinkedIn dopo la candidatura può fare la differenza." },
]

// ─── CHECKLIST DEFAULT TASKS ─────────────────────────────────────

export const DEFAULT_CHECKLIST = [
  "📱 Conferma la data e l'orario via mail",
  "🔍 Studia il sito e i valori aziendali",
  "💼 Rileggi CV e lettera di presentazione",
  "❓ Prepara 3 domande da fare a loro",
  "👗 Prepara l'outfit (anche per video!)",
  "📍 Controlla come arrivare / testa il link Zoom",
  "😴 Dormi bene la sera prima",
  "⏰ Sveglia con 30 minuti di margine",
]

// ─── MISC ─────────────────────────────────────────────────────────

export function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function getGreeting(name = '') {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)  return `Buongiorno ${name} ☀️`
  if (h >= 12 && h < 18) return `Ciao ${name} 👋`
  return `Buonasera ${name} 🌙`
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
