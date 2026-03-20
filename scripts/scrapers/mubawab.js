import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE = 'https://www.mubawab.ma';
const PAGES = 2;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
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
  for (let page = 1; page <= PAGES; page++) {
    try {
      const url = `${BASE}/fr/sc/immobilier-maroc:p:${page}`;
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(data);

      $('.listingBox').each((_, el) => {
        try {
          const titleEl = $(el).find('.listingTitle, h2.listingTitle a, a.listingTitle');
          const title = titleEl.text().trim();
          const href = titleEl.attr('href') || $(el).find('a').first().attr('href') || '';
          const listingUrl = href.startsWith('http') ? href : `${BASE}${href}`;

          const priceRaw = $(el).find('.priceTag, .price, [class*="price"]').first().text().trim();
          const price = parsePrice(priceRaw);

          const transaction = priceRaw.toLowerCase().includes('locat') || priceRaw.toLowerCase().includes('/mois') ? 'Rent' : 'Sale';

          const infoText = $(el).find('.adInfoItem, .listingDetails, [class*="detail"]').text();
          const area = parseArea(infoText);
          const bedrooms = parseRooms(infoText);

          const location = $(el).find('.adLocation, .location, [class*="location"]').text().trim();
          const [neighborhood = '', city = ''] = location.split(',').map(s => s.trim()).reverse();

          const imgSrc = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

          if (!title || !listingUrl || price === 0) return;

          results.push({
            id: `mubawab-${Buffer.from(listingUrl).toString('base64').slice(0, 12)}`,
            title,
            type: inferType(title),
            transaction,
            price,
            city: normalizeCity(city || location),
            neighborhood: neighborhood || '',
            address: location,
            bedrooms,
            bathrooms: Math.max(1, Math.floor(bedrooms / 2)),
            area,
            source: 'Mubawab',
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
      console.warn(`[Mubawab] page ${page} failed: ${err.message}`);
    }
  }
  return results;
}

function inferType(title) {
  const t = title.toLowerCase();
  if (t.includes('riad')) return 'Riad';
  if (t.includes('villa')) return 'Villa';
  if (t.includes('studio')) return 'Studio';
  if (t.includes('duplex')) return 'Duplex';
  if (t.includes('penthouse')) return 'Penthouse';
  if (t.includes('terrain') || t.includes('lot')) return 'Land';
  if (t.includes('maison') || t.includes('house')) return 'House';
  return 'Apartment';
}

function normalizeCity(raw) {
  const map = {
    'casablanca': 'Casablanca', 'casa': 'Casablanca',
    'rabat': 'Rabat', 'marrakech': 'Marrakech', 'marrakesh': 'Marrakech',
    'tanger': 'Tanger', 'tangier': 'Tanger',
    'fès': 'Fès', 'fes': 'Fès',
    'agadir': 'Agadir', 'meknès': 'Meknès', 'meknes': 'Meknès', 'oujda': 'Oujda',
  };
  const lower = raw.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k)) return v;
  }
  return raw || 'Casablanca';
}
