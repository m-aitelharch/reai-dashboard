/**
 * ReAI Property Scraper
 * Runs all source scrapers in parallel, deduplicates results,
 * and writes public/properties.json for the React app to consume.
 *
 * Runs every 8 hours via GitHub Actions.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { scrape as scrapeMubawab } from './scrapers/mubawab.js';
import { scrape as scrapeAvito } from './scrapers/avito.js';
import { scrape as scrapeSarouty } from './scrapers/sarouty.js';
import { scrape as scrapeYakeey } from './scrapers/yakeey.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '../reai-app/public/properties.json');
const SEED = join(__dirname, '../reai-app/src/data/seed-properties.json');

async function run() {
  console.log(`[${new Date().toISOString()}] Starting scrape...`);

  const scrapers = [
    { name: 'Mubawab', fn: scrapeMubawab },
    { name: 'Avito', fn: scrapeAvito },
    { name: 'Sarouty', fn: scrapeSarouty },
    { name: 'Yakeey', fn: scrapeYakeey },
  ];

  const settled = await Promise.allSettled(
    scrapers.map(async ({ name, fn }) => {
      const start = Date.now();
      const results = await fn();
      console.log(`  ✓ ${name}: ${results.length} listings (${Date.now() - start}ms)`);
      return results;
    })
  );

  let all = [];
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      all.push(...res.value);
    } else {
      console.warn(`  ✗ ${scrapers[i].name}: ${res.reason?.message}`);
    }
  });

  console.log(`  Total scraped: ${all.length}`);

  // Deduplicate by listingUrl
  const seen = new Set();
  all = all.filter(p => {
    if (seen.has(p.listingUrl)) return false;
    seen.add(p.listingUrl);
    return true;
  });

  // Remove entries with no meaningful data
  all = all.filter(p => p.title && p.price > 0 && p.listingUrl);

  console.log(`  After dedup/filter: ${all.length}`);

  // If scrapers returned too few results, merge with seed data
  let seed = [];
  if (existsSync(SEED)) {
    seed = JSON.parse(readFileSync(SEED, 'utf8'));
  }

  if (all.length < 5) {
    console.log(`  ⚠ Too few live results — using seed data (${seed.length} entries)`);
    all = seed;
  } else {
    // Prepend any seed entries whose IDs aren't already in live results
    const liveIds = new Set(all.map(p => p.id));
    const missingSeeds = seed.filter(p => !liveIds.has(p.id));
    if (missingSeeds.length) {
      console.log(`  + Merging ${missingSeeds.length} seed entries not found live`);
      all = [...all, ...missingSeeds];
    }
  }

  const output = {
    updatedAt: new Date().toISOString(),
    count: all.length,
    properties: all,
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`[${new Date().toISOString()}] Written ${all.length} properties → ${OUTPUT}`);
}

run().catch(err => {
  console.error('Scraper failed:', err);
  process.exit(1);
});
