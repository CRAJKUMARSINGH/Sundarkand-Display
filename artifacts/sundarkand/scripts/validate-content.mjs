/**
 * Lightweight content integrity check for Sundarkand verse data.
 * Asserts doha markers run 1..60 with no gaps or duplicates.
 *
 * Usage: node scripts/validate-content.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const textPath = join(__dirname, "../src/data/sundarkandText.ts");
const source = readFileSync(textPath, "utf8");

const rawMatch = source.match(/export const SUNDARKAND_RAW = `([\s\S]*?)`;/);
if (!rawMatch) {
  console.error("FAIL: could not extract SUNDARKAND_RAW from sundarkandText.ts");
  process.exit(1);
}

const raw = rawMatch[1];
const markers = [...raw.matchAll(/^॥ दोहा (\d+) ॥$/gm)].map(m => Number(m[1]));

const expected = Array.from({ length: 60 }, (_, i) => i + 1);
const found = [...new Set(markers)].sort((a, b) => a - b);
const duplicates = markers.filter((n, i) => markers.indexOf(n) !== i);
const missing = expected.filter(n => !found.includes(n));
const extra = found.filter(n => n < 1 || n > 60);

let ok = true;

if (markers.length !== 60) {
  console.error(`FAIL: expected 60 doha markers, found ${markers.length}`);
  ok = false;
}
if (duplicates.length) {
  console.error(`FAIL: duplicate doha numbers: ${[...new Set(duplicates)].join(", ")}`);
  ok = false;
}
if (missing.length) {
  console.error(`FAIL: missing doha numbers: ${missing.join(", ")}`);
  ok = false;
}
if (extra.length) {
  console.error(`FAIL: out-of-range doha numbers: ${extra.join(", ")}`);
  ok = false;
}

if (ok) {
  console.log("OK: 60 doha markers (1..60), no gaps or duplicates.");
  process.exit(0);
}

process.exit(1);
