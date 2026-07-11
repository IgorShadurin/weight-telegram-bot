import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDir = path.resolve('assets/achievements/optimized');
const tileWidth = 216;
const tileHeight = 270;
const columns = 8;
const rows = 7;
const composites: Array<{ input: Buffer; left: number; top: number }> = [];

for (let week = 1; week <= 53; week += 1) {
  const image = await sharp(path.join(sourceDir, `week-${String(week).padStart(2, '0')}.jpg`))
    .resize(tileWidth, tileHeight)
    .toBuffer();
  composites.push({
    input: image,
    left: ((week - 1) % columns) * tileWidth,
    top: Math.floor((week - 1) / columns) * tileHeight,
  });
}

await fs.mkdir('tmp', { recursive: true });
await sharp({ create: { width: columns * tileWidth, height: rows * tileHeight, channels: 3, background: '#ffffff' } })
  .composite(composites)
  .jpeg({ quality: 88 })
  .toFile('tmp/achievements-contact-sheet.jpg');
console.log('Saved tmp/achievements-contact-sheet.jpg');
