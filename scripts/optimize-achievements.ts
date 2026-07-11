import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const originalDir = path.resolve('assets/achievements/originals');
const optimizedDir = path.resolve('assets/achievements/optimized');
await fs.mkdir(optimizedDir, { recursive: true });

for (let week = 1; week <= 53; week += 1) {
  const name = `week-${String(week).padStart(2, '0')}`;
  await sharp(path.join(originalDir, `${name}.png`))
    .resize(1080, 1350, { fit: 'contain', background: '#ffffff', withoutEnlargement: false })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(path.join(optimizedDir, `${name}.jpg`));
}

console.log('Optimized 53 achievements to 1080x1350 JPEG.');
