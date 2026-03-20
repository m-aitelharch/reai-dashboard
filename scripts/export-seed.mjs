/**
 * Generates seed-properties.json from the TypeScript source.
 * Run once: node scripts/export-seed.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../reai-app/src/data/properties.ts'), 'utf8');

// Strip TS type declarations and extract the array literal
const arrayMatch = src.match(/const properties:\s*Property\[\]\s*=\s*(\[[\s\S]*?\]);\s*\nexport default/);
if (!arrayMatch) {
  console.error('Could not find properties array in source');
  process.exit(1);
}

// Evaluate the array literal (safe: it's our own source file)
// eslint-disable-next-line no-eval
const properties = eval(arrayMatch[1]);

const output = {
  updatedAt: new Date().toISOString(),
  count: properties.length,
  properties,
};

const outPath = join(__dirname, '../reai-app/src/data/seed-properties.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Wrote ${properties.length} seed properties to ${outPath}`);
