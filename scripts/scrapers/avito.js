import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE = 'https://www.avito.ma';
const PAGES = 2;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
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
  const m = raw.match(/(\d+)\s*(ch|pi|room|pièce)/i);
  return m ? parseInt(m[1], 10) : 0;
}

export async function scrape() {
  const results = [];
  const categories = [
    '/fr/maroc/appartements--vente',
    '/fr/maroc/villas--vente',
    '/fr/maroc/appartements--location',
  ];

  for (const cat of categories) {
    for (let page = 1; page <= PAGES; page++) {
      try {
        const url = `${BASE}${cat}?o=${page}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        const $ = cheerio.load(data);

        // Avito listing cards
        $('[class*="sc-"] article, .listing-card, [data-testid="regular-ad"]').each((_, el) => {
          try {
            const titleEl = $(el).find('h3, h2, [class*="title"]').first();
            const title = titleEl.text().trim();
            const hrefEl = $(el).find('a[href*="/fr/"]').first();
            const href = hrefEl.attr('href') || '';
            const listingUrl = href.startsWith('http') ? href : `${BASE}${href}`;

            const priceRaw = $(el).find('[class*="price"], .price').first().text().trim();
            const price = parsePrice(priceRaw);
            const transaction = cat.includes('location') ? 'Rent' : 'Sale';

            const details = $(el).text();
            const area = parseArea(details);
            const bedrooms = parseRooms(details);

            const locationEl = $(el).find('[class*="location"], [class*="city"], .adLocation').first();
            const location = locationEl.text().trim();

            const imgSrc = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

            if (!title || !href || price === 0) return;

            results.push({
              id: `avito-${Buffer.from(listingUrl).toString('base64').slice(0, 12)}`,
              title,
              type: inferType(title + ' ' + cat),
              transaction,
              price,
              city: normalizeCity(location),
              neighborhood: '',
              address: location,
              bedrooms,
              bathrooms: Math.max(1, Math.floor(bedrooms / 2)),
              area,
              source: 'Avito',
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
        console.warn(`[Avito] ${cat} page ${page} failed: ${err.message}`);
      }
    }
  }
  return results;
}

function inferType(s) {
  const t = s.toLowerCase();
  if (t.includes('riad')) return 'Riad';
  if (t.includes('villa')) return 'Villa';
  if (t.includes('studio')) return 'Studio';
  if (t.includes('duplex')) return 'Duplex';
  if (t.includes('penthouse')) return 'Penthouse';
  if (t.includes('terrain')) return 'Land';
  if (t.includes('maison')) return 'House';
  return 'Apartment';
}

function normalizeCity(raw) {
  const map = {
    'casablanca': 'Casablanca', 'casa': 'Casablanca',
    'rabat': 'Rabat', 'marrakech': 'Marrakech',
    'tanger': 'Tanger', 'fès': 'Fès', 'fes': 'Fès',
    'agadir': 'Agadir', 'meknès': 'Meknès', 'meknes': 'Meknès', 'oujda': 'Oujda',
  };
  const lower = raw.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return raw || 'Casablanca';
}
