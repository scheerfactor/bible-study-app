import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = (await walk('.next/static')).filter(p => /\.(js|css|woff2?)$/.test(p)).sort();
const assets = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/brand/fathers-business-bible-study-mark.png', ...[1,2,3,4].map(n => `/api/bible?part=${n}`), ...files.map(p => '/' + p.replace(/^\.next\//, '_next/'))];
const worker = await readFile('scripts/pwa/worker.js', 'utf8');
const version = createHash('sha256').update(await readFile('.next/BUILD_ID')).update(worker).update(JSON.stringify(assets)).digest('hex').slice(0,16);
await writeFile('public/sw.js', `const CACHE_NAME = 'fb-bible-offline-${version}';\nconst ASSETS = ${JSON.stringify(assets)};\n${worker}`);
const bytes = (await Promise.all(files.map(p => stat(p)))).reduce((sum,s) => sum+s.size,0);
console.log(`Offline worker: ${assets.length} public assets; ${(bytes/1024/1024).toFixed(1)} MB app assets plus KJV text. No library/audio/account caching.`);
