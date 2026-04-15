// ─── STATUS SYSTEM ───────────────────────────────────────────────

export const STATI = ['Inviata','Spontanea','Vista','Prima call','Colloquio','Secondo colloquio','In attesa risposta','Non mi piace','Rifiutata','GHOSTED','Offerta ricevuta']
export const PRIORITA = ['Alta','Media','Bassa']
export const FONTI = ['LinkedIn','Indeed','InfoJobs','Glassdoor','Email','Referral','Sito aziendale','Spontanea','Altro']

export const WELFARE_OPTIONS = [
  'Smart working', 'Smart working parziale', 'Mensa aziendale', 'Ticket restaurant',
  'Assicurazione sanitaria', 'Welfare aziendale', 'Formazione continua', 'Auto aziendale',
  'Stock options', 'Bonus performance', 'Asilo nido', 'Palestra', 'Flessibilità oraria',
  'Settimana corta', 'Telefono aziendale', 'PC aziendale', 'Budget formazione',
]
export const TIPI_COLLOQUIO = ['📞 Telefonico','💻 Video','🏢 In presenza']
export const FEELING_OPTIONS = ['😍','🙂','😐','😬','🤷']

export const STATUS_CONFIG = {
  'Offerta ricevuta':   { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  emoji: '🏆', label: 'Offerta' },
  'Assunta':            { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  emoji: '🌟', label: 'Assunta', labelM: 'Assunto', labelNB: 'Assunt*' },
  'Spontanea':          { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', emoji: '💡', label: 'Spontanea' },
  'Inviata':            { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  emoji: '📤', label: 'Inviata' },
  'Vista':              { color: '#F97316', bg: 'rgba(249,115,22,0.15)',  emoji: '👀', label: 'Vista' },
  'Prima call':         { color: '#A855F7', bg: 'rgba(168,85,247,0.15)',  emoji: '📞', label: 'Prima call' },
  'Colloquio':          { color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   emoji: '🎙️', label: 'Colloquio' },
  'In attesa risposta': { color: '#EAB308', bg: 'rgba(234,179,8,0.15)',   emoji: '⏳', label: 'In attesa' },
  'Secondo colloquio':  { color: '#16A34A', bg: 'rgba(22,163,74,0.15)',   emoji: '🎙️🎙️', label: '2° Colloquio' },
  'Rifiutata':          { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   emoji: '❌', label: 'Rifiutata' },
  'Non mi piace':       { color: '#6D28D9', bg: 'rgba(109,40,217,0.15)',  emoji: '😕', label: 'Non mi piace' },
  'GHOSTED':            { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', emoji: '👻', label: 'GHOSTED' },
  'Archiviate':         { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', emoji: '📁', label: 'Archiviate' },
}

export const PRIORITA_CONFIG = {
  'Alta':  { emoji: '🔥', color: '#F87171' },
  'Media': { emoji: '⚡', color: '#FBBF24' },
  'Bassa': { emoji: '🌱', color: '#34D399' },
}

export const STATUS_GROUP_ORDER = ['Assunta','Offerta ricevuta','Secondo colloquio','Colloquio','Prima call','In attesa risposta','Vista','Inviata','Spontanea','Non mi piace','Rifiutata','GHOSTED', 'Archiviate']

// ─── SMART URL PARSER ────────────────────────────────────────────

export function parseJobUrl(url) {
  if (!url) return {}
  const lower = url.toLowerCase()
  let fonte = 'Altro'
  if (lower.includes('linkedin.com'))      fonte = 'LinkedIn'
  else if (lower.includes('indeed.'))      fonte = 'Indeed'
  else if (lower.includes('infojobs.'))    fonte = 'InfoJobs'
  else if (lower.includes('glassdoor.'))   fonte = 'Glassdoor'
  else if (lower.includes('monster.'))     fonte = 'Monster'
  else if (lower.includes('jobteaser.'))   fonte = 'JobTeaser'
  else if (lower.includes('welcometothejungle.')) fonte = 'Welcome to the Jungle'
  else fonte = 'Sito aziendale'
  return { fonte }
}

export async function fetchJobDataFromUrl(url) {
  const proxies = [
    async (u) => {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(6000) })
      const data = await res.json()
      return data.contents || ''
    },
    async (u) => {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(6000) })
      return await res.text()
    },
    async (u) => {
      const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(6000) })
      return await res.text()
    },
  ]
  let html = ''
  for (const proxy of proxies) {
    try {
      html = await proxy(url)
      if (html && html.length > 100) break
    } catch { /* try next */ }
  }
  if (!html) return { fonte: parseJobUrl(url).fonte, success: false }
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const rawTitle = titleMatch ? titleMatch[1].trim() : ''
    const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
    const ogTitle = ogMatch ? ogMatch[1].trim() : ''
    const title = ogTitle || rawTitle
    let azienda = '', ruolo = ''
    const lower = url.toLowerCase()
    if (lower.includes('linkedin.com')) {
      const parts = title.replace(/\s*\|\s*LinkedIn.*$/i, '').split(/ at /i)
      ruolo = parts[0]?.trim() || ''; azienda = parts[1]?.trim() || ''
    } else if (lower.includes('indeed.')) {
      const clean = title.replace(/\s*[-–]\s*Indeed.*$/i, '')
      const parts = clean.split(/\s*[-–]\s/)
      ruolo = parts[0]?.trim() || ''; azienda = parts[1]?.trim() || ''
    } else {
      const parts = title.split(/\s*[-|–]\s/)
      ruolo = parts[0]?.trim() || ''; azienda = parts[1]?.trim() || ''
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
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

// ─── XP & GAMIFICATION ───────────────────────────────────────────

export const XP_EVENTS = {
  FIRST_CANDIDATURA: 10, ADD_CANDIDATURA: 5, GOT_COLLOQUIO: 15,
  CHECKLIST_ITEM: 5, CHECKLIST_FULL: 10, OFFERTA: 20,
  FEELING_ADDED: 3, NOTE_ADDED: 3, SMART_PARSE: 2,
}

export const LEVELS = [
  { lv: 1, min: 0,    max: 99,   name: 'novizio', emoji: '👶' },
  { lv: 2, min: 100,  max: 299,  name: 'apprendista', emoji: '📜' },
  { lv: 3, min: 300,  max: 599,  name: 'esploratore', emoji: '🗺️' },
  { lv: 4, min: 600,  max: 999,  name: 'cacciatore', emoji: '🎯' },
  { lv: 5, min: 1000, max: 9999, name: 'esperto', emoji: '🏆' },
]

export function getLevel(xp = 0) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getXpProgress(xp = 0) {
  const level = getLevel(xp)
  return Math.min(((xp - level.min) / (level.max - level.min)) * 100, 100)
}

export const BADGES = [
  { id: 'first', emoji: '🚀', name: 'Prima Candidatura', desc: 'Hai aggiunto la tua prima candidatura!', color: '#7B2FFF', bg: '#1a0a3a', check: (s) => s.total >= 1 },
  { id: 'ten', emoji: '🎯', name: 'Cecchin*', desc: '10 candidature inviate — mira che non erra.', color: '#EF4444', bg: '#2a0a0a', check: (s) => s.total >= 10 },
  { id: 'twentyfive', emoji: '💫', name: 'Instancabile', desc: '25 candidature — non ti ferma nessuno.', color: '#F59E0B', bg: '#2a1a00', check: (s) => s.total >= 25 },
  { id: 'fifty', emoji: '👑', name: 'Leggenda', desc: '50 candidature — sei inarrestabile.', color: '#FFD700', bg: '#1a1500', check: (s) => s.total >= 50 },
  { id: 'colloquio1', emoji: '🎙️', name: 'In the Game', desc: 'Hai ottenuto il tuo primo colloquio!', color: '#22C55E', bg: '#0a2a0a', check: (s) => s.colloqui >= 1 },
  { id: 'fire', emoji: '🔥', name: 'On Fire', desc: '3+ colloqui in un mese — sei caldissim*.', color: '#F97316', bg: '#2a1000', check: (s) => s.colloquiThisMonth >= 3 },
  { id: 'offer', emoji: '🏆', name: 'Ce l\'hai fatta!', desc: 'Hai ricevuto un\'offerta. Meritata. 🎉', color: '#FFD700', bg: '#1a1200', check: (s) => s.offerte >= 1 },
  { id: 'assunta', emoji: '🌟', name: 'Ce l\'hai fatta davvero!', desc: 'Hai accettato un\'offerta. Finisce qui, inizia tutto. 💜', color: '#FFD700', bg: '#1a1500', check: (s) => s.assunta >= 1 },
]

// ─── MOTIVATION & TIPS ───────────────────────────────────────────

export const LOADING_TIPS = [
  "Prepara una 'elevator pitch' di 30 secondi. ⏱️",
  "Personalizza sempre la lettera di presentazione. ✍️",
  "Ricerca l'azienda prima di ogni colloquio. 🔍",
  "Tieni traccia di ogni contatto HR. 📱",
  "Il 'no' fa parte del processo, non arrenderti. 💪",
  "Controlla il tuo profilo LinkedIn regolarmente. 🔗",
  "Ogni colloquio è un'opportunità di networking. 🤝",
  "Prepara 2-3 domande intelligenti per l'intervistatore. 💡"
];

export const LOADING_TIPS_EN = [
  "Prepare a 30-second elevator pitch. ⏱️",
  "Always customize your cover letter. ✍️",
  "Research the company before every interview. 🔍",
  "Keep track of every HR contact. 📱",
  "A 'no' is part of the process, don't give up. 💪",
  "Check your LinkedIn profile regularly. 🔗",
  "Every interview is a networking opportunity. 🤝",
  "Prepare 2-3 smart questions for the interviewer. 💡"
];

export const MOTTOS_MATTINO = ['Buona giornata. Ogni candidatura inviata oggi è un passo avanti. 🌅','Il mattino ha l\'oro in bocca — e tu hai il CV pronto. 💛','Una nuova giornata, nuove opportunità da non lasciarsi sfuggire. 🚀']
export const MOTTOS_POMERIGGIO = ['Stai costruendo qualcosa, candidatura dopo candidatura. 🧱','Ogni no ti avvicina al sì giusto. ✨','Il tuo prossimo lavoro esiste già. Lo stai trovando. 💡']
export const MOTTOS_SERA = ['Brava giornata. Domani si ricomincia, più forti di oggi. 🌙','Ogni giorno che passa sei più vicin* alla risposta giusta. 🌟','Ghostat*? Capita ai migliori. Vai avant*. 👻']

export function getMotto(lang = 'it') {
  const h = new Date().getHours();
  const day = new Date().getDate();
  const list = (h >= 5 && h < 12) ? MOTTOS_MATTINO : (h >= 12 && h < 18) ? MOTTOS_POMERIGGIO : MOTTOS_SERA;
  return list[day % list.length];
}

export function getGreeting(lang = 'it') {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return lang === 'en' ? 'Good morning' : 'Buongiorno';
  if (h >= 12 && h < 18) return lang === 'en' ? 'Good afternoon' : 'Buon pomeriggio';
  return lang === 'en' ? 'Good evening' : 'Buonasera';
}

export function getRandomTip(lang = 'it') {
  const tips = lang === 'en' ? LOADING_TIPS_EN : LOADING_TIPS;
  return tips[Math.floor(Math.random() * tips.length)];
}

export const DEFAULT_CHECKLIST = [
  { id: '1', text: 'Rileggere l\'annuncio e i requisiti', completed: false },
  { id: '2', text: 'Preparare una breve presentazione di sé', completed: false },
  { id: '3', text: 'Ricercare l\'azienda e i suoi valori', completed: false },
  { id: '4', text: 'Preparare almeno due domande da fare', completed: false },
  { id: '5', text: 'Controllare connessione/microfono o indirizzo', completed: false },
]