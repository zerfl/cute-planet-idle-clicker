#!/usr/bin/env node
/**
 * One-off migration: convert the public/assets PNGs to display-sized WebP.
 *
 *   node scripts/optimize-assets.mjs           # convert (writes .webp next to each .png)
 *   node scripts/optimize-assets.mjs --delete  # also delete the source PNGs
 *
 * Display sizes are generous (2x the largest rendered size) so the art stays
 * crisp on high-DPR phones. Never enlarges. Prints a size report.
 */
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join, extname } from "node:path";
import sharp from "sharp";

const MAX_WIDTH = {
  planets: 512,
  animals: 256,
  zodiac: 384,
  roguelite: 512,
  stuff: 512,
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return extname(entry.name).toLowerCase() === ".png" ? [path] : [];
  });
}

const deleteSources = process.argv.includes("--delete");
const files = walk("public/assets");

let before = 0;
let after = 0;

for (const file of files) {
  const category = file.split("/")[2];
  // Sprite sheets are sliced by hardcoded pixel frame widths — never resize.
  const isSpriteSheet = file.includes("/animated/");
  const width = isSpriteSheet ? undefined : (MAX_WIDTH[category] ?? 512);
  const out = file.replace(/\.png$/i, ".webp");

  const srcBytes = statSync(file).size;
  let pipeline = sharp(file);
  if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
  await pipeline.webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out);
  const outBytes = statSync(out).size;

  before += srcBytes;
  after += outBytes;
  if (deleteSources) unlinkSync(file);
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`${files.length} images: ${mb(before)} MB -> ${mb(after)} MB webp`);
