import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function files(directory: string, extension: string): Promise<string[]> {
  return (await fs.readdir(directory)).filter((name) => name.endsWith(extension)).sort();
}

const originalDir = path.resolve('assets/achievements/originals');
const optimizedDir = path.resolve('assets/achievements/optimized');
const originals = await files(originalDir, '.png');
const optimized = await files(optimizedDir, '.jpg');
const errors: string[] = [];

if (originals.length !== 53) errors.push(`Expected 53 originals, found ${originals.length}`);
if (optimized.length !== 53) errors.push(`Expected 53 optimized files, found ${optimized.length}`);

const hashes = new Set<string>();
for (let week = 1; week <= 53; week += 1) {
  const name = `week-${String(week).padStart(2, '0')}`;
  const originalPath = path.join(originalDir, `${name}.png`);
  const optimizedPath = path.join(optimizedDir, `${name}.jpg`);
  try {
    const [source, output, stat, digest] = await Promise.all([
      sharp(originalPath).metadata(),
      sharp(optimizedPath).metadata(),
      fs.stat(optimizedPath),
      sharp(optimizedPath).resize(16, 16).grayscale().raw().toBuffer(),
    ]);
    if (!source.width || !source.height || source.width < 900 || source.height < 900) {
      errors.push(`${name}: original resolution is too small`);
    }
    if (output.format !== 'jpeg' || output.width !== 1080 || output.height !== 1350) {
      errors.push(`${name}: expected 1080x1350 JPEG`);
    }
    if (stat.size >= 10 * 1024 * 1024) errors.push(`${name}: exceeds Telegram 10 MB photo limit`);
    const hash = digest.toString('base64');
    if (hashes.has(hash)) errors.push(`${name}: exact low-resolution duplicate detected`);
    hashes.add(hash);
  } catch (error) {
    errors.push(`${name}: ${String(error)}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Validated 53 unique originals and 53 Telegram-ready images.');
