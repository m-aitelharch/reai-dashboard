import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE = 'https://yakeey.com';
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
  const m = raw.match(/(\d+)\s*(ch|pi|room|chambre)/i);
  return m ? parseInt(m[1], 10) : 0;
}

export async function scrape() {
  const results = [];
  const endpoints = [
    { path: '/acheter', transaction: 'Sale' },
    { path: '/louer', transaction: 'Rent' },
  ];

  for (const { path, transaction } of endpoints) {
    for (let page = 1; page <= PAGES; page++) {
      try {
        const url = `${BASE}${path}?page=${page}`;
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        const $ = cheerio.load(data);

        // Yakeey is a Next.js / React SSR app — look for JSON in __NEXT_DATA__
        const nextDataScript = $('#__NEXT_DATA__').html();
        if (nextDataScript) {
          try {
            const json = JSON.parse(nextDataScript);
            const listings =
              json?.props?.pageProps?.listings ||
              json?.props?.pageProps?.properties ||
              json?.props?.pageProps?.data?.listings ||
              [];

            for (const item of listings) {
              const listingUrl = `${BASE}/annonce/${item.slug || item.id || ''}`;
              const price = item.price || item.Prix || 0;
              const area = item.surface || item.area || item.superficie || 0;
              const bedrooms = item.rooms || item.chambres || item.bedrooms || 0;
              const title = item.title || item.titre || item.name || '';
              const city = item.city || item.ville || item.location?.city || '';
              const neighborhood = item.neighborhood || item.quartier || item.location?.neighborhood || '';
              const imgSrc = item.image || item.thumbnail || (item.images && item.images[0]) || '';

              if (!title || price === 0) continue;

              results.push({
                id: `yakeey-${item.id || Buffer.from(listingUrl).toString('base64').slice(0, 12)}`,
                title,
                type: inferType(title + ' ' + (item.type || '')),
                transaction,
                price,
                city: normalizeCity(city),
                neighborhood,
                address: `${neighborhood}, ${city}`.trim().replace(/^,\s*/, ''),
                bedrooms,
                bathrooms: item.bathrooms || item.sallesDeBain || Math.max(1, Math.floor(bedrooms / 2)),
                area,
                source: 'Yakeey',
                sourceUrl: BASE,
                listingUrl,
                status: 'Available',
                listed: item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                features: item.features || item.amenities || [],
                description: item.description || title,
                contactPhone: item.phone || item.contact?.phone || '',
                contactEmail: item.email || item.contact?.email || '',
                lat: item.lat || item.location?.lat || 0,
                lng: item.lng || item.location?.lng || 0,
                images: imgSrc ? [imgSrc] : [],
                pricePerSqm: area > 0 && transaction === 'Sale' ? Math.round(price / area) : 0,
              });
            }
            continue; // skip cheerio parsing if JSON worked
          } catch (_) {}
        }

        // Fallback: cheerio HTML parsing
        $('[class*="PropertyCard"], [class*="property-card"], [class*="listing-card"], article').each((_, el) => {
          try {
            const titleEl = $(el).find('h2, h3, [class*="title"]').first();
            const title = titleEl.text().trim();
            const href = $(el).find('a').first().attr('href') || '';
            const listingUrl = href.startsWith('http') ? href : `${BASE}${href}`;

            const priceRaw = $(el).find('[class*="price"], [class*="Price"]').first().text().trim();
            const price = parsePrice(priceRaw);
            const text = $(el).text();
            const area = parseArea(text);
            const bedrooms = parseRooms(text);
            const location = $(el).find('[class*="location"], [class*="city"]').first().text().trim();
            const imgSrc = $(el).find('img').first().attr('src') || '';

            if (!title || !href || price === 0) return;

            results.push({
              id: `yakeey-${Buffer.from(listingUrl).toString('base64').slice(0, 12)}`,
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
              source: 'Yakeey',
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
        console.warn(`[Yakeey] ${path} page ${page} failed: ${err.message}`);
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
