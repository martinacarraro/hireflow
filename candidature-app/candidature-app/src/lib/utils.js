// ─── STATUS SYSTEM ───────────────────────────────────────────────

// ─── STATUS & CONFIG ───────────────────────────────────────────────

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

export const STATUS_GROUP_ORDER = ['Assunta','Offerta ricevuta','Secondo colloquio','Colloquio','Prima call','In attesa risposta','Vista','Inviata','Spontanea','Non mi piace','Rifiutata','GHOSTED', 'Archiviate']

// ─── DATE & MATH HELPERS ───────────────────────────────────────────

export function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((new Date() - new Date(dateStr)) / 86400000)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function isToday(dateStr) {
  return dateStr && new Date(dateStr).toDateString() === new Date().toDateString()
}

export function isTomorrow(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr); const t = new Date(); t.setDate(t.getDate() + 1)
  return d.toDateString() === t.toDateString()
}

export function isYesterday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr); const y = new Date(); y.setDate(y.getDate() - 1)
  return d.toDateString() === y.toDateString()
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── XP & GAMIFICATION ───────────────────────────────────────────

export const XP_EVENTS = { FIRST_CANDIDATURA: 10, ADD_CANDIDATURA: 5, GOT_COLLOQUIO: 15, CHECKLIST_ITEM: 5, OFFERTA: 20 }

export const LEVELS = [
  { lv: 1, min: 0, max: 99, name: 'novizio', emoji: '👶' },
  { lv: 2, min: 100, max: 299, name: 'apprendista', emoji: '📜' },
  { lv: 3, min: 300, max: 599, name: 'esploratore', emoji: '🗺️' },
  { lv: 4, min: 600, max: 999, name: 'cacciatore', emoji: '🎯' },
  { lv: 5, min: 1000, max: 9999, name: 'esperto', emoji: '🏆' },
]

export function getLevel(xp = 0) { return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0] }

export const BADGES = [
  { id: 'first', emoji: '🚀', name: 'Prima Candidatura', check: (s) => s.total >= 1 },
  { id: 'ten', emoji: '🎯', name: 'Cecchin*', check: (s) => s.total >= 10 },
  { id: 'colloquio1', emoji: '🎙️', name: 'In the Game', check: (s) => s.colloqui >= 1 },
  { id: 'offer', emoji: '🏆', name: 'Ce l\'hai fatta!', check: (s) => s.offerte >= 1 },
]

export const DEFAULT_CHECKLIST = [
  { id: 1, text: 'Rileggere l\'annuncio', completed: false },
  { id: 2, text: 'Preparare domande per HR', completed: false },
  { id: 3, text: 'Controllare connessione/microfono', completed: false }
]

// ─── MOTIVATIONAL PHRASES (IT & EN) ──────────────────────────────

export const MOTTOS_MATTINO = ['Ogni candidatura inviata oggi è un passo avanti. 🌅', 'Il mattino ha l\'oro in bocca. 💛']
export const MOTTOS_POMERIGGIO = ['Stai costruendo il tuo futuro. 🧱', 'Ogni no ti avvicina al sì giusto. ✨']
export const MOTTOS_SERA = ['Brava giornata. Domani si ricomincia. 🌙', 'Riposati, hai dato il massimo. 🌟']

export const MOTTOS_MATTINO_EN = ['Every application sent today is a step forward. 🌅', 'The early bird catches the worm. 💛']
export const MOTTOS_POMERIGGIO_EN = ['You are building your future. 🧱', 'Every "no" brings you closer to the right "yes". ✨']
export const MOTTOS_SERA_EN = ['Good job today. Tomorrow we start again. 🌙', 'Rest, you did your best. 🌟']

export function getMotto(lang = 'it') {
  const h = new Date().getHours(); const day = new Date().getDate(); const isEn = lang === 'en';
  let list = (h >= 5 && h < 12) ? (isEn ? MOTTOS_MATTINO_EN : MOTTOS_MATTINO) :
             (h >= 12 && h < 18) ? (isEn ? MOTTOS_POMERIGGIO_EN : MOTTOS_POMERIGGIO) :
             (isEn ? MOTTOS_SERA_EN : MOTTOS_SERA);
  return list[day % list.length];
}

export function getGreeting(name = '', lang = 'it') {
  const h = new Date().getHours(); const isEn = lang === 'en'; const cleanName = name ? ` ${name}` : '';
  if (h >= 5 && h < 12) return isEn ? `Good morning${cleanName} 🌞` : `Buongiorno${cleanName} 🌞`;
  if (h >= 12 && h < 18) return isEn ? `Hello${cleanName} 👋` : `Ciao${cleanName} 👋`;
  return isEn ? `Good evening${cleanName} 🌙` : `Buonasera${cleanName} 🌙`;
}

// ─── LOADING TIPS ────────────────────────────────────────────────

export const LOADING_TIPS = [
  { cat: '🎙️ Colloquio', text: "Arrivare 5 minuti prima dimostra organizzazione." },
  { cat: '📄 CV', text: "Personalizza ogni CV per l'annuncio." }
]
export const LOADING_TIPS_EN = [
  { cat: '🎙️ Interview', text: "Arriving 5 minutes early shows organization." },
  { cat: '📄 CV', text: "Tailor every CV to the job description." }
]

export function getRandomTip(lang = 'it') {
  const list = lang === 'en' ? LOADING_TIPS_EN : LOADING_TIPS;
  return list[Math.floor(Math.random() * list.length)];
}

// ─── URL PARSER ──────────────────────────────────────────────────

export function parseJobUrl(url) {
  if (!url) return { fonte: 'Altro' }
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com')) return { fonte: 'LinkedIn' }
  if (lower.includes('indeed.')) return { fonte: 'Indeed' }
  if (lower.includes('infojobs.')) return { fonte: 'InfoJobs' }
  if (lower.includes('glassdoor.')) return { fonte: 'Glassdoor' }
  return { fonte: 'Sito aziendale' }
}

export const MOTTOS = [...MOTTOS_MATTINO, ...MOTTOS_POMERIGGIO, ...MOTTOS_SERA]

export function getMotto(lang = 'it') {
  const h = new Date().getHours()
  const day = new Date().getDate()
  const isEn = lang === 'en'

  let list
  if (h >= 5 && h < 12) list = isEn ? MOTTOS_MATTINO_EN : MOTTOS_MATTINO
  else if (h >= 12 && h < 18) list = isEn ? MOTTOS_POMERIGGIO_EN : MOTTOS_POMERIGGIO
  else list = isEn ? MOTTOS_SERA_EN : MOTTOS_SERA

  if (!list || list.length === 0) return isEn ? 'Keep going! 🚀' : 'Forza e coraggio! 🚀'
  return list[day % list.length]
}

export function getGreeting(name = '', lang = 'it') {
  const h = new Date().getHours()
  const cleanName = name ? ` ${name}` : ''
  const isEn = lang === 'en'

  if (h >= 5 && h < 12) return isEn ? `Good morning${cleanName} 🌞` : `Buongiorno${cleanName} 🌞`
  if (h >= 12 && h < 18) return isEn ? `Hello${cleanName} 👋` : `Ciao${cleanName} 👋`
  return isEn ? `Good evening${cleanName} 🌙` : `Buonasera${cleanName} 🌙`
}

// ─── LOADING TIPS ────────────────────────────────────────────────

export const LOADING_TIPS = [
  { cat: '🎙️ Colloquio', text: "Arrivare 5 minuti prima (non 20) dimostra organizzazione, non ansia." },
  { cat: '🎙️ Colloquio', text: "La domanda 'Hai domande per noi?' NON è retorica. Preparane almeno 2." },
  { cat: '🎙️ Colloquio', text: "Parla dei risultati con numeri: 'Ho aumentato X del 30%' batte 'Lavoravo su X'." },
  { cat: '🎙️ Colloquio', text: "Se non capisci una domanda, chiedi di ripeterla. È attenzione, non ignoranza." },
  { cat: '🎙️ Colloquio', text: "Fine colloquio: chiedi sempre 'Quali sono i prossimi passi?'" },
  { cat: '🎙️ Colloquio', text: "Dopo il colloquio, manda una mail di ringraziamento entro 24h. Pochi lo fanno." },
  { cat: '🎙️ Colloquio', text: "Sul salario: cerca la media su LinkedIn o Glassdoor prima di rispondere." },
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
  { cat: '🚀 Pro tip',   text: "Stai usando questa app? Sei già più organizzat* del 90% delle persone in cerca di lavoro." },
  { cat: '🚀 Pro tip',   text: "Candidarsi alle 9-11 di mattina aumenta le chance di essere visti." },
  { cat: '🚀 Pro tip',   text: "Un messaggio diretto al recruiter su LinkedIn dopo la candidatura può fare la differenza." },
]

export const LOADING_TIPS_EN = [
  { cat: '🎙️ Interview', text: "Arrive 5 minutes early (not 20) — it shows organization, not anxiety." },
  { cat: '🎙️ Interview', text: "The question 'Do you have any questions for us?' is NOT rhetorical. Prepare at least 2." },
  { cat: '🎙️ Interview', text: "Talk about results with numbers: 'I increased X by 30%' beats 'I worked on X'." },
  { cat: '🎙️ Interview', text: "If you don't understand a question, ask them to repeat it. It shows attention, not ignorance." },
  { cat: '🎙️ Interview', text: "End of interview: always ask 'What are the next steps?'" },
  { cat: '🎙️ Interview', text: "After the interview, send a thank-you email within 24h. Few people do it. Those few are remembered." },
  { cat: '🎙️ Interview', text: "On salary: research the average on LinkedIn or Glassdoor before answering." },
  { cat: '📄 CV',        text: "The perfect CV fits one page (if you have less than 10 years of experience). Less is more." },
  { cat: '📄 CV',        text: "Customize every CV. Copy keywords from the job posting — ATS systems will thank you." },
  { cat: '📄 CV',        text: "Apply even if you don't meet 100% of the requirements. Companies write their wish list." },
  { cat: '📄 CV',        text: "LinkedIn with 'Open to work' visible only to recruiters = applications that come to you." },
  { cat: '📄 CV',        text: "Gap in your CV? Don't hide it. Prepare to tell it in a positive way." },
  { cat: '💜 Mindset',  text: "Job searching is a funnel. The more you apply, the more interviews you get. It's math." },
  { cat: '💜 Mindset',  text: "A rejection is not a judgment on you. It's just a mismatch. Often not even that." },
  { cat: '💜 Mindset',  text: "Ghosting is a company's rudeness, not your fault. Period." },
  { cat: '💜 Mindset',  text: "The average response rate is under 10%. If you get more than 5%, you're already winning." },
  { cat: '💜 Mindset',  text: "Treating job searching like a real job (fixed hours, breaks) makes it less stressful." },
  { cat: '💜 Mindset',  text: "Talk about your search with friends and family. 70% of jobs are found through networking." },
  { cat: '🏆 Offer',    text: "Got an offer? You can negotiate. 85% of companies expect a counteroffer." },
  { cat: '🏆 Offer',    text: "Before signing, read the full contract. It's normal, professional, and your right." },
  { cat: '🏆 Offer',    text: "Compare the full package: salary, benefits, holidays, remote work. Pay is just one part." },
  { cat: '🚀 Pro tip',  text: "Tracking your applications (like you're doing here!) reduces the anxiety of 'how many did I send?'." },
  { cat: '🚀 Pro tip',  text: "Using this app? You're already more organized than 90% of job seekers out there." },
  { cat: '🚀 Pro tip',  text: "Applying between 9-11am increases your chances of being seen. Recruiters start fresh." },
  { cat: '🚀 Pro tip',  text: "A direct message to the recruiter on LinkedIn after applying can make all the difference." },
]

export function getRandomTip(lang = 'it') {
  const list = lang === 'en' ? LOADING_TIPS_EN : LOADING_TIPS
  return list[Math.floor(Math.random() * list.length)]
}

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