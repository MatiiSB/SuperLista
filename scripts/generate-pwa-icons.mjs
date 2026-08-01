import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

const INDIGO = "#4F46E5";

/**
 * Build the app icon SVG: a rounded indigo square with a white checkmark.
 * @param {number} glyphScale - scales the checkmark around the center; <1 pads
 *   it inward so it stays inside the maskable safe zone.
 */
function svg(glyphScale) {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="${INDIGO}"/>
  <g transform="translate(256 256) scale(${glyphScale}) translate(-256 -256)">
    <path d="M152 270 L228 346 L372 186" fill="none" stroke="#ffffff" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const base = Buffer.from(svg(1));
const maskable = Buffer.from(svg(0.7));

const jobs = [
  [base, 192, "icon-192.png"],
  [base, 512, "icon-512.png"],
  [base, 180, "apple-touch-icon.png"],
  [base, 32, "favicon-32.png"],
  [base, 16, "favicon-16.png"],
  [maskable, 192, "maskable-192.png"],
  [maskable, 512, "maskable-512.png"],
];

for (const [src, size, name] of jobs) {
  await sharp(src).resize(size, size).png().toFile(`${OUT}/${name}`);
  console.log(`✓ ${name} (${size}x${size})`);
}
console.log("PWA icons generated in public/icons/");
