/**
 * Generates the PWA icon set from a single inline SVG design (a simple,
 * geometric open-book glyph -- deliberately not Arabic text, since
 * rasterizing shaped Arabic glyphs through the SVG renderer used here isn't
 * reliable without a guaranteed-present shaping font). Run via `pnpm icons:build`;
 * output is committed (icons rarely change and don't need a network fetch).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT_DIR = join(process.cwd(), "public", "icons");

const OBSIDIAN = "#0b0f0e";
const EMERALD = "#10b981";

/** `padding` is the fraction of the canvas kept clear on each side (for maskable safe zones). */
function bookSvg(size: number, padding: number): string {
  const p = size * padding;
  const inner = size - p * 2;
  const cx = size / 2;
  const cy = size / 2;
  const spineW = inner * 0.06;
  const pageW = inner * 0.42;
  const pageH = inner * 0.62;
  const topY = cy - pageH / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${OBSIDIAN}"/>
  <g fill="none" stroke="${EMERALD}" stroke-width="${inner * 0.045}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M ${cx} ${topY + inner * 0.02} C ${cx - pageW * 0.15} ${topY - inner * 0.04}, ${cx - pageW} ${topY}, ${cx - pageW} ${topY + inner * 0.06} L ${cx - pageW} ${topY + pageH - inner * 0.06} C ${cx - pageW} ${topY + pageH}, ${cx - pageW * 0.15} ${topY + pageH + inner * 0.02}, ${cx} ${topY + pageH - inner * 0.02}" />
    <path d="M ${cx} ${topY + inner * 0.02} C ${cx + pageW * 0.15} ${topY - inner * 0.04}, ${cx + pageW} ${topY}, ${cx + pageW} ${topY + inner * 0.06} L ${cx + pageW} ${topY + pageH - inner * 0.06} C ${cx + pageW} ${topY + pageH}, ${cx + pageW * 0.15} ${topY + pageH + inner * 0.02}, ${cx} ${topY + pageH - inner * 0.02}" />
  </g>
  <rect x="${cx - spineW / 2}" y="${topY + inner * 0.02}" width="${spineW}" height="${pageH - inner * 0.02}" fill="${EMERALD}"/>
</svg>`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const targets: { name: string; size: number; padding: number }[] = [
    { name: "icon-192.png", size: 192, padding: 0.08 },
    { name: "icon-512.png", size: 512, padding: 0.08 },
    { name: "icon-maskable-512.png", size: 512, padding: 0.2 },
    { name: "apple-touch-icon.png", size: 180, padding: 0.12 },
  ];

  for (const t of targets) {
    const svg = bookSvg(t.size, t.padding);
    await sharp(Buffer.from(svg)).png().toFile(join(OUT_DIR, t.name));
    console.log(`Wrote ${t.name}`);
  }

  // Favicon SVG (crisp at any size, used directly by app/icon.svg too).
  writeFileSync(join(OUT_DIR, "favicon.svg"), bookSvg(64, 0.08));
  console.log("Wrote favicon.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
