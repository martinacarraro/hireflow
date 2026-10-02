// One model for forms, calendar, reminders and statistics. Legacy fields are
// read without rewriting storage; ambiguous old dates are never guessed.
export const CLOSED = new Set(['Rifiutata', 'Non mi piace', 'Offerta rifiutata', 'GHOSTED', 'Assunta'])
export const INTERVIEW_STATES = ['Prima call', 'Colloquio', 'Secondo colloquio']
export const localDay = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
export const parseDay = value => value ? new Date(`${value.slice(0, 10)}T00:00:00`) : null
export function elapsedDays(value, now = new Date()) {
  if (!value) return 0
  const date = parseDay(value)
  return Number.isNaN(date?.getTime()) ? 0 : Math.max(0, Math.round((parseDay(localDay(now)) - date) / 86400000))
}
export function getInterviews(c) {
  if (Array.isArray(c.interviews)) return c.interviews
  const items = []
  if (c.data_colloquio || c.ora_colloquio) items.push({
    id: 'legacy-first', order: c.stato === 'Prima call' ? 0 : 1,
    kind: c.stato === 'Prima call' ? 'call' : 'interview', date: c.data_colloquio || '', time: c.ora_colloquio || '',
    status: 'scheduled', mode: c.tipo_colloquio || '', contact: c.contatto_hr || '', notes: '',
    needsReview: c.stato === 'Secondo colloquio' && !c.data_secondo_colloquio,
  })
  if (c.data_secondo_colloquio || c.ora_secondo_colloquio) items.push({
    id: 'legacy-second', order: 2, kind: 'interview', date: c.data_secondo_colloquio || '', time: c.ora_secondo_colloquio || '',
    status: 'scheduled', mode: c.tipo_colloquio || '', contact: c.contatto_hr || '', notes: '',
  })
  return items
}
export function newInterview(order = 1) {
  return { id: globalThis.crypto?.randomUUID?.() || `meeting-${Date.now()}-${Math.random()}`, order,
    kind: order === 0 ? 'call' : 'interview', date: '', time: '', status: 'scheduled', mode: '', contact: '', notes: '' }
}
export function ensureStageInterview(c, state = c.stato) {
  const items = getInterviews(c)
  const order = { 'Prima call': 0, 'Colloquio': 1, 'Secondo colloquio': 2 }[state]
  if (order === undefined || items.some(e => e.order === order && e.status !== 'cancelled') || items.some(e => e.needsReview)) return items
  return [...items, newInterview(order)]
}
export function interviewLabel(e, en = false) {
  if (e.needsReview) return en ? 'Previous interview · check stage' : 'Colloquio precedente · verifica la fase'
  if (e.kind === 'call') return en ? 'Initial call' : 'Prima chiamata'
  if (e.kind === 'technical') return en ? 'Technical test' : 'Prova tecnica'
  return en ? `Interview ${e.order || 1}` : `${e.order || 1}° colloquio`
}
export function hasOffer(c) {
  return ['Offerta ricevuta', 'Offerta rifiutata', 'Assunta'].includes(c.stato) || !!c.offerta_risposta ||
    (c.history || []).some(h => ['Offerta ricevuta', 'Offerta rifiutata', 'Assunta'].includes(h.stato))
}
export function hasResponse(c) {
  const evidence = ['Prima call', 'Colloquio', 'Secondo colloquio', 'Offerta ricevuta', 'Assunta', 'Rifiutata']
  return evidence.includes(c.stato) || (c.history || []).some(h => evidence.includes(h.stato)) || hasOffer(c) ||
    getInterviews(c).some(e => e.date || e.status === 'completed') || !!c.ultimo_contatto
}
export function waitingSince(c) {
  const dates = [c.attesa_dal, c.ultimo_contatto, ...getInterviews(c).filter(e => e.status === 'completed').map(e => e.date)].filter(Boolean)
  return dates.sort().at(-1) || c.data_invio
}
export function upcomingInterviews(c, now = new Date(), days = 30) {
  if (c.archiviata || CLOSED.has(c.stato) || c.stato === 'Offerta ricevuta') return []
  const end = new Date(now); end.setDate(end.getDate() + days)
  return getInterviews(c).filter(e => {
    if (!e.date || e.status !== 'scheduled' || e.needsReview) return false
    const when = new Date(`${e.date}T${e.time || '23:59'}:00`)
    return when >= now && e.date <= localDay(end)
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}
export function calendarEvents(c, now = new Date()) {
  return getInterviews(c).filter(e => e.date && e.status !== 'cancelled' && !e.needsReview &&
    (!(c.archiviata || CLOSED.has(c.stato) || c.stato === 'Offerta ricevuta') || e.status === 'completed' || e.date < localDay(now)))
}
export function agendaEvents(c, now = new Date()) {
  const upcoming = new Set(upcomingInterviews(c, now, 36500).map(e=>e.id))
  const events = calendarEvents(c,now).map(e=>({...e,category:'interview',upcoming:upcoming.has(e.id)}))
  if (!c.archiviata && !CLOSED.has(c.stato)) {
    if (c.reminder_date && !c.reminder_done) events.push({id:'reminder',date:c.reminder_date,time:c.reminder_time || '',category:'reminder',notes:c.reminder_note,status:'scheduled',upcoming:c.reminder_date>=localDay(now)})
    if (c.stato==='Offerta ricevuta' && c.offerta_scadenza) events.push({id:'offer-deadline',date:c.offerta_scadenza,time:'',category:'offer',status:'scheduled',upcoming:c.offerta_scadenza>=localDay(now)})
  }
  return events
}
export function needsFollowUp(c, now = new Date()) {
  return !c.archiviata && !CLOSED.has(c.stato) && c.stato !== 'Offerta ricevuta' && !!c.data_scadenza_responso && c.data_scadenza_responso < localDay(now)
}
export function normalizeTransition(previous, data, now = new Date()) {
  const next = { ...previous, ...data }
  if (next.stato === 'Spontanea') { next.stato = 'Inviata'; next.tipo_candidatura = 'spontanea' }
  next.tipo_candidatura ||= previous?.stato === 'Spontanea' || next.fonte === 'Spontanea' ? 'spontanea' : 'annuncio'
  const oldState = previous?.stato === 'Spontanea' ? 'Inviata' : previous?.stato
  const changed = !!previous && next.stato !== oldState
  next.history = [...(previous?.history || next.history || [])]
  if (previous && !next.history.length) next.history.push({ stato: oldState, at: null })
  if (!previous || changed) next.history.push({ stato: next.stato, at: now.toISOString() })
  if (changed && next.stato === 'In attesa risposta' && data.attesa_dal === previous.attesa_dal) next.attesa_dal = localDay(now)
  if (changed && (INTERVIEW_STATES.includes(next.stato) || CLOSED.has(next.stato) || next.stato === 'Offerta ricevuta')) {
    if (previous.data_scadenza_responso) next.past_deadlines = [...(previous.past_deadlines || []), previous.data_scadenza_responso]
    next.data_scadenza_responso = null
  }
  if (changed && previous.stato === 'Assunta' && next.stato !== 'Assunta') next.offerta_risposta = null
  if (next.stato === 'Assunta') { next.offerta_risposta = 'si'; next.hire_celebrated = true }
  if (next.stato === 'Offerta rifiutata') next.offerta_risposta = 'no'
  next.interviews = getInterviews(next)
  // Mirror legacy date fields for older exports/readers; the array is authoritative.
  const first = next.interviews.find(e => e.order === 1) || next.interviews.find(e => e.order === 0)
  const second = next.interviews.find(e => e.order === 2)
  next.data_colloquio = first?.date || null; next.ora_colloquio = first?.time || null
  next.data_secondo_colloquio = second?.date || null; next.ora_secondo_colloquio = second?.time || null
  return next
}
export function validationIssues(c) {
  const issues = []
  if (!c.azienda?.trim()) issues.push('company')
  if (!c.ruolo?.trim()) issues.push('role')
  const items = getInterviews(c).filter(e => e.status !== 'cancelled' && !e.needsReview).sort((a,b) => a.order - b.order)
  const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(parseDay(d).getTime()) && localDay(parseDay(d)) === d
  if ([c.data_invio, c.attesa_dal, c.ultimo_contatto, c.reminder_date, c.offerta_scadenza, c.data_inizio, c.data_scadenza_responso, ...items.map(e => e.date)].some(d => d && !validDate(d))) issues.push('date')
  if (items.some(e => e.time && !e.date) || c.reminder_time && !c.reminder_date) issues.push('timeWithoutDate')
  if (items.some(e => e.date && c.data_invio && e.date < c.data_invio)) issues.push('beforeApplication')
  const dated = items.filter(e => e.date)
  if (dated.some((e,i) => i > 0 && `${e.date}T${e.time || '23:59'}` < `${dated[i-1].date}T${dated[i-1].time || '00:00'}`)) issues.push('sequence')
  if (items.some(e => e.status === 'completed' && e.date > localDay())) issues.push('futureCompleted')
  const nums = [c.stipendio_min, c.stipendio_max, c.offerta_ral].filter(v => v !== '' && v != null)
  if (nums.some(v => !Number.isFinite(Number(v)) || Number(v) < 0)) issues.push('salary')
  if (c.stipendio_min !== '' && c.stipendio_min != null && c.stipendio_max !== '' && c.stipendio_max != null && Number(c.stipendio_min) > Number(c.stipendio_max)) issues.push('salaryRange')
  return issues
}
export function validationMessage(code, en = false) {
  const messages = {
    company: ['Inserisci il nome dell’azienda.', 'Enter the company name.'], role: ['Inserisci il ruolo.', 'Enter the role.'],
    date: ['Controlla le date inserite.', 'Check the dates.'], timeWithoutDate: ['Hai inserito un orario senza la data.', 'A time needs a date.'],
    beforeApplication: ['Un incontro precede la candidatura: correggi la data di invio o quella dell’incontro.', 'An interview is before the application: check both dates.'],
    sequence: ['Le date degli incontri non seguono l’ordine indicato: controllale.', 'Interview dates do not match their sequence.'],
    futureCompleted: ['Un incontro futuro non può essere già svolto.', 'A future interview cannot be completed yet.'],
    salary: ['Inserisci importi validi, uguali o superiori a zero.', 'Enter valid non-negative amounts.'],
    salaryRange: ['La RAL minima non può superare la massima.', 'Minimum salary cannot exceed the maximum.'],
  }
  return messages[code]?.[en ? 1 : 0] || (en ? 'Check your entries.' : 'Controlla i dati inseriti.')
}
export function duplicateApplication(c, now = new Date()) {
  const keys = ['azienda','ruolo','sede','paese','link_annuncio','fonte','tipo_candidatura','stipendio_min','stipendio_max','priorita','orario_lavoro','tipo_contratto','modalita_lavoro','livello_ruolo','welfare','welfare_note']
  return { ...Object.fromEntries(keys.filter(k => c[k] !== undefined).map(k => [k,c[k]])), stato:'Inviata', data_invio:localDay(now), interviews:[], archiviata:false, notifiche_push:true }
}
export function flowStats(list) {
  return { total:list.length, colloqui:list.reduce((n,c) => n + getInterviews(c).filter(e => e.status === 'completed').length,0),
    colloquiThisMonth:list.reduce((n,c) => n + getInterviews(c).filter(e => e.status === 'completed' && e.date?.slice(0,7) === localDay().slice(0,7)).length,0),
    programmati:list.reduce((n,c) => n + upcomingInterviews(c, new Date(),36500).length,0),
    risposte:list.filter(hasResponse).length, offerte:list.filter(hasOffer).length,
    ghosted:list.filter(c => c.stato === 'GHOSTED').length }
}
export function dueReminders(c, now = new Date()) {
  if (c.notifiche_push === false || c.archiviata || CLOSED.has(c.stato)) return []
  const result = upcomingInterviews(c, now, 0).map(e => ({ key:`interview:${c.id}:${e.id}:${e.date}:${e.time}`, kind:'interview', date:e.date, time:e.time }))
  if (c.reminder_date && !c.reminder_done && new Date(`${c.reminder_date}T${c.reminder_time || '00:00'}:00`) <= now)
    result.push({ key:`reminder:${c.id}:${c.reminder_date}:${c.reminder_time || ''}:${c.reminder_note || ''}`, kind:'reminder', date:c.reminder_date, time:c.reminder_time, note:c.reminder_note })
  return result
}

export function shouldSuggestArchive(c, now = new Date()) {
  const since = waitingSince(c)
  return !c.archiviata && ['Inviata', 'Vista', 'Spontanea', 'In attesa risposta', 'GHOSTED'].includes(c.stato)
    && elapsedDays(since, now) >= 90
    && !upcomingInterviews(c, now, 36500).length
    && c.archive_suggestion_dismissed_for !== since
}
