/**
 * ReAI Property Scraper
 * Runs all source scrapers in parallel using a shared Puppeteer browser,
 * deduplicates results, and writes public/properties.json for the React app.
 *
 * Runs every 8 hours via GitHub Actions.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer-core';

import { scrape as scrapeMubawab } from './scrapers/mubawab.js';
import { scrape as scrapeAvito } from './scrapers/avito.js';
import { scrape as scrapeSarouty } from './scrapers/sarouty.js';
import { scrape as scrapeYakeey } from './scrapers/yakeey.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '../reai-app/public/properties.json');
const SEED = join(__dirname, '../reai-app/src/data/seed-properties.json');

// Resolve Chromium path: CI sets CHROMIUM_PATH, otherwise try common locations
function getChromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
  ];
  for (const c of candidates) {
    try {
      const { existsSync } = await import('fs').catch(() => ({ existsSync: () => false }));
      if (existsSync(c)) return c;
    } catch (_) {}
  }
  // Default for GitHub Actions ubuntu-latest after apt install
  return '/usr/bin/chromium-browser';
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting scrape...`);

  const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';
  console.log(`  Using Chromium at: ${executablePath}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
      ],
    });
  } catch (err) {
    console.error(`  ✗ Failed to launch browser: ${err.message}`);
    console.error('  Make sure Chromium is installed: apt-get install -y chromium-browser');
    process.exit(1);
  }

  const scrapers = [
    { name: 'Mubawab', fn: scrapeMubawab },
    { name: 'Avito', fn: scrapeAvito },
    { name: 'Sarouty', fn: scrapeSarouty },
    { name: 'Yakeey', fn: scrapeYakeey },
  ];

  const settled = await Promise.allSettled(
    scrapers.map(async ({ name, fn }) => {
      const start = Date.now();
      const results = await fn(browser);
      console.log(`  ✓ ${name}: ${results.length} listings (${Date.now() - start}ms)`);
      return results;
    })
  );

  await browser.close();

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

  // Remove entries with no meaningful data or shallow/generic URLs
  function isDeepUrl(url) {
    try {
      const path = new URL(url).pathname.replace(/\/$/, '');
      const segments = path.split('/').filter(Boolean);
      return segments.length >= 2; // must have at least /category/slug depth
    } catch { return false; }
  }
  all = all.filter(p => p.title && p.price > 0 && p.listingUrl && isDeepUrl(p.listingUrl));

  console.log(`  After dedup/filter: ${all.length}`);

  // If scrapers returned too few results, fall back to seed data
  let seed = [];
  if (existsSync(SEED)) {
    const raw = JSON.parse(readFileSync(SEED, 'utf8'));
    seed = Array.isArray(raw) ? raw : (raw.properties || []);
  }

  if (all.length < 5) {
    console.log(`  ⚠ Too few live results — using seed data (${seed.length} entries)`);
    all = seed;
  } else {
    console.log(`  ✓ Using ${all.length} live results (seed data not merged)`);
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
