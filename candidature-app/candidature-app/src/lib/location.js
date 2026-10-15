// Older forms silently defaulted country to Italia. Do not infer a country
// from a free-text location; retain other explicitly stored legacy countries.
export function locationText(c) {
  const place = (c.sede || '').trim()
  const country = (c.paese || '').trim()
  if (!country || /^(italia|italy)$/i.test(country)) return place
  if (place.toLocaleLowerCase().includes(country.toLocaleLowerCase())) return place
  return [place, country].filter(Boolean).join(', ')
}
