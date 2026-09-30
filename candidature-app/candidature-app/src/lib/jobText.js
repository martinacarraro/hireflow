// Conservative, offline extraction. Missing or ambiguous values stay empty.
export function parseJobText(text, link = '') {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const result = {}
  const labels = {
    azienda: /^(?:azienda|company|employer)\s*:\s*(.+)$/i,
    ruolo: /^(?:ruolo|posizione|job title|position|titolo)\s*:\s*(.+)$/i,
    sede: /^(?:sede(?: di lavoro)?|luogo(?: di lavoro)?|location)\s*:\s*(.+)$/i,
  }
  for (const [field, pattern] of Object.entries(labels)) {
    const match = lines.map(line => line.match(pattern)).find(Boolean)
    if (match) result[field] = match[1].slice(0, 160)
  }
  if (!result.ruolo) {
    const title = lines.find(line => line.length < 100 && /\b(?:developer|engineer|specialist|manager|designer|analyst|sviluppatore|impiegat[oa]|addett[oa]|operai[oa]|commerciale|magazziniere|contabile)\b/i.test(line) && !/[.!?]$/.test(line))
    if (title) result.ruolo = title
  }
  // Only explicit annual gross EUR ranges; never turn monthly/net pay into RAL.
  const salaryLine = lines.find(line => /\b(?:RAL|annui|annua|annuo|annual|yearly)\b/i.test(line) && !/\b(?:netti|netto|net|mese|mensile|month)\b/i.test(line))
  if (salaryLine) {
    const match = salaryLine.match(/(?:€\s*)?(\d{2,3}(?:[.,]\d{3})|\d{5,6}|\d{2,3}\s*k)\s*(?:€|EUR)?\s*(?:-|–|—|a|to)\s*(?:€\s*)?(\d{2,3}(?:[.,]\d{3})|\d{5,6}|\d{2,3}\s*k)/i)
    if (match && /€|EUR|\bRAL\b/i.test(salaryLine) && !/\$|£|USD|GBP/i.test(salaryLine)) {
      const amount = value => /k/i.test(value) ? parseInt(value) * 1000 : Number(value.replace(/[.,]/g, ''))
      const min = amount(match[1]), max = amount(match[2])
      if (min >= 10000 && max >= min && max <= 999999) {
        result.stipendio_min = String(min)
        result.stipendio_max = String(max)
      }
    }
  }
  const candidateUrl = link.trim() || text.match(/https?:\/\/[^\s<>]+/)?.[0]
  if (candidateUrl) {
    try {
      const url = new URL(candidateUrl)
      if (['https:', 'http:'].includes(url.protocol)) {
        result.link_annuncio = url.href
        const host = url.hostname.toLowerCase()
        for (const [domain, source] of [['linkedin.com', 'LinkedIn'], ['indeed.com', 'Indeed'], ['it.indeed.com', 'Indeed'], ['infojobs.it', 'InfoJobs'], ['glassdoor.it', 'Glassdoor'], ['glassdoor.com', 'Glassdoor']]) {
          if (host === domain || host.endsWith('.' + domain)) result.fonte = source
        }
      }
    } catch { /* Invalid URLs are not proposed. */ }
  }
  return result
}
