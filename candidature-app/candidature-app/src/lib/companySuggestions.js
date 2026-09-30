// Elenco incorporato nell'app: la ricerca avviene interamente sul dispositivo.
export const COMPANY_SUGGESTIONS = [
  ['Accenture', 'accenture.com'], ['Adidas', 'adidas.com'], ['Airbnb', 'airbnb.com'],
  ['Aldi', 'aldi.it'], ['Alibaba', 'alibaba.com'], ['Amazon', 'amazon.com'],
  ['Apple', 'apple.com'], ['Armani', 'armani.com'], ['Autogrill', 'autogrill.com'],
  ['Barilla', 'barillagroup.com'], ['Bending Spoons', 'bendingspoons.com'],
  ['Benetton', 'benettongroup.com'], ['BIP', 'bip-group.com'], ['BMW', 'bmw.com'],
  ['Bottega Veneta', 'bottegaveneta.com'], ['Brembo', 'brembo.com'],
  ['Calzedonia', 'calzedoniagroup.com'], ['Campari Group', 'camparigroup.com'],
  ['Coca-Cola', 'coca-cola.com'], ['Coin', 'coin.it'], ['Conad', 'conad.it'],
  ['Deloitte', 'deloitte.com'], ['Decathlon', 'decathlon.it'], ['Deliveroo', 'deliveroo.it'],
  ['Diesel', 'diesel.com'], ['Disney', 'disney.com'], ['Douglas', 'douglas.it'],
  ['Edison', 'edison.it'], ['Enel', 'enel.com'], ['Eni', 'eni.com'],
  ['Esselunga', 'esselunga.it'], ['EY', 'ey.com'], ['Ferrari', 'ferrari.com'],
  ['Ferrero', 'ferrero.com'], ['Fiat', 'fiat.com'], ['Fincantieri', 'fincantieri.com'],
  ['Generali', 'generali.com'], ['Google', 'google.com'], ['Gucci', 'gucci.com'],
  ['H&M', 'hm.com'], ['IKEA', 'ikea.com'], ['Iliad', 'iliad.it'],
  ['Intesa Sanpaolo', 'intesasanpaolo.com'], ['Kering', 'kering.com'],
  ['KPMG', 'kpmg.com'], ['Lamborghini', 'lamborghini.com'], ['Lego', 'lego.com'],
  ['Leroy Merlin', 'leroymerlin.it'], ['Lidl', 'lidl.it'], ['LinkedIn', 'linkedin.com'],
  ['L’Oréal', 'loreal.com'], ['Luxottica', 'essilorluxottica.com'], ['Mango', 'mango.com'],
  ['McDonald’s', 'mcdonalds.it'], ['Meta', 'meta.com'], ['Microsoft', 'microsoft.com'],
  ['Moncler', 'monclergroup.com'], ['MutuiOnline', 'gruppomol.it'], ['Netflix', 'netflix.com'],
  ['Nike', 'nike.com'], ['OVS', 'ovs.it'], ['Patagonia', 'patagonia.com'],
  ['PayPal', 'paypal.com'], ['Pirelli', 'pirelli.com'], ['Poste Italiane', 'poste.it'],
  ['Prada', 'prada.com'], ['Procter & Gamble', 'pg.com'], ['PwC', 'pwc.com'],
  ['Rai', 'rai.it'], ['Ryanair', 'ryanair.com'], ['Samsung', 'samsung.com'],
  ['Sephora', 'sephora.it'], ['Sky', 'sky.it'], ['Spotify', 'spotify.com'],
  ['Stellantis', 'stellantis.com'], ['Subito', 'subito.it'], ['Telecom Italia', 'tim.it'],
  ['Tesla', 'tesla.com'], ['TikTok', 'tiktok.com'], ['UniCredit', 'unicreditgroup.eu'],
  ['Unilever', 'unilever.com'], ['Vodafone', 'vodafone.it'], ['Volkswagen', 'volkswagen.com'],
  ['Zalando', 'zalando.it'], ['Zara', 'zara.com'], ['Zoom', 'zoom.us'],
].map(([name, domain]) => ({ name, domain }))

const normalize = value => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, '')
  .toLowerCase()

export function findCompanySuggestions(query, limit = 6) {
  const normalizedQuery = normalize(query.trim())
  if (normalizedQuery.length < 2) return []

  return COMPANY_SUGGESTIONS
    .filter(company => normalize(company.name).includes(normalizedQuery))
    .sort((a, b) => {
      const aStarts = normalize(a.name).startsWith(normalizedQuery)
      const bStarts = normalize(b.name).startsWith(normalizedQuery)
      if (aStarts !== bStarts) return aStarts ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}
