export function eligibleHire(list, profile, now = new Date()) {
  const latest = list.filter(c => c.stato === 'Assunta').map(c => {
    const at = c.hired_at || [...(c.history || [])].reverse().find(h => h.stato === 'Assunta' && h.at)?.at || profile?.hire_observed?.[c.id]
    return { id:c.id, at }
  }).filter(h => h.at && Number.isFinite(Date.parse(h.at)))
    .sort((a,b) => Date.parse(b.at)-Date.parse(a.at))
    [0]
  return latest && now-Date.parse(latest.at) >= 30*86400000 && !(profile?.new_search_asked || []).includes(`${latest.id}:${latest.at}`) ? latest : undefined
}
