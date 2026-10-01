const escape = text => String(text || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
export function calendarFile({ id, title, date, time, notes = '' }) {
  if (!date) return null
  const day = date.replaceAll('-', '')
  const start = time ? `DTSTART:${day}T${time.replace(':', '')}00` : `DTSTART;VALUE=DATE:${day}`
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LeFaremoSapere//Agenda//IT','BEGIN:VEVENT',
    `UID:${escape(id)}@lefaremosapere`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,
    start, time ? 'DURATION:PT1H' : 'DURATION:P1D', `SUMMARY:${escape(title)}`, `DESCRIPTION:${escape(notes)}`,
    'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',`DESCRIPTION:${escape(title)}`,'END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n')
}
export function downloadCalendar(event) {
  const content = calendarFile(event)
  if (!content) return
  const url = URL.createObjectURL(new Blob([content], {type:'text/calendar;charset=utf-8'}))
  const a = document.createElement('a'); a.href = url; a.download = 'appuntamento.ics'
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
