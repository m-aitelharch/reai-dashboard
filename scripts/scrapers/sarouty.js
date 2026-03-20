import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE = 'https://www.sarouty.ma';
const PAGES = 2;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function parsePrice(raw) {
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function parseArea(raw) {
  const m = raw.match(/(\d+)\s*m/i);
  return m ? parseInt(m[1], 10) : 0;
}

function parseRooms(raw) {
  const m = raw.match(/(\d+)\s*(ch|pi|room)/i);
  return m ? parseInt(m[1], 10) : 0;
}

export async function scrape() {
  const results = [];
  const endpoints = [
    '/fr/vente-immobilier-maroc',
    '/fr/location-immobilier-maroc',
  ];

  for (const ep of endpoints) {
    for (let page = 1; page <= PAGES; page++) {
      try {
        const url = `${BASE}${ep}?page=${page}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        const $ = cheerio.load(data);
        const transaction = ep.includes('location') ? 'Rent' : 'Sale';

        $('.property-card, .listing-item, [class*="PropertyCard"], article[class*="listing"]').each((_, el) => {
          try {
            const titleEl = $(el).find('h2, h3, [class*="title"]').first();
            const title = titleEl.text().trim();
            const hrefEl = $(el).find('a').first();
            const href = hrefEl.attr('href') || '';
            const listingUrl = href.startsWith('http') ? href : `${BASE}${href}`;

            const priceRaw = $(el).find('[class*="price"]').first().text().trim();
            const price = parsePrice(priceRaw);

            const text = $(el).text();
            const area = parseArea(text);
            const bedrooms = parseRooms(text);
            const location = $(el).find('[class*="location"], [class*="city"], [class*="address"]').first().text().trim();

            const imgSrc = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

            if (!title || !href || price === 0) return;

            results.push({
              id: `sarouty-${Buffer.from(listingUrl).toString('base64').slice(0, 12)}`,
              title,
              type: inferType(title),
              transaction,
              price,
              city: normalizeCity(location),
              neighborhood: '',
              address: location,
              bedrooms,
              bathrooms: Math.max(1, Math.floor(bedrooms / 2)),
              area,
              source: 'Sarouty',
              sourceUrl: BASE,
              listingUrl,
              status: 'Available',
              listed: new Date().toISOString().split('T')[0],
              features: [],
              description: title,
              contactPhone: '',
              contactEmail: '',
              lat: 0,
              lng: 0,
              images: imgSrc ? [imgSrc] : [],
              pricePerSqm: area > 0 && transaction === 'Sale' ? Math.round(price / area) : 0,
            });
          } catch (_) {}
        });
      } catch (err) {
        console.warn(`[Sarouty] ${ep} page ${page} failed: ${err.message}`);
      }
    }
  }
  return results;
}

function inferType(t) {
  const s = t.toLowerCase();
  if (s.includes('riad')) return 'Riad';
  if (s.includes('villa')) return 'Villa';
  if (s.includes('studio')) return 'Studio';
  if (s.includes('duplex')) return 'Duplex';
  if (s.includes('penthouse')) return 'Penthouse';
  if (s.includes('terrain')) return 'Land';
  if (s.includes('maison')) return 'House';
  return 'Apartment';
}

function normalizeCity(raw) {
  const map = {
    'casablanca': 'Casablanca', 'rabat': 'Rabat',
    'marrakech': 'Marrakech', 'tanger': 'Tanger',
    'fès': 'Fès', 'fes': 'Fès', 'agadir': 'Agadir',
    'meknès': 'Meknès', 'meknes': 'Meknès', 'oujda': 'Oujda',
  };
  const lower = raw.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return raw || 'Casablanca';
}
