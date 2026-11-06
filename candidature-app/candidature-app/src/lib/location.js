// Older forms silently defaulted country to Italia. Do not infer a country
// from a free-text location; retain other explicitly stored legacy countries.
export function locationText(c) {
  const place = c.sede || ''
  const placeForCompare = place.trim()
  const country = (c.paese || '').trim()
  // Preserve the exact input while typing, including a trailing space.
  if (!country || /^(italia|italy)$/i.test(country)) return place
  if (placeForCompare.toLocaleLowerCase().includes(country.toLocaleLowerCase())) return place
  return [place, country].filter(Boolean).join(', ')
}
