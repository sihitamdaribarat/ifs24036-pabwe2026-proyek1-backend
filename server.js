// Production entry point (nodejs-express / bun-express hosting).
// Builds the React frontend if dist/ is missing (the deploy zip excludes it),
// then starts the Express backend, which serves both /api and the SPA.
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.join(rootDir, 'dist', 'index.html');

console.log(
  `[BOOT] Runtime: ${process.versions.bun ? `bun ${process.versions.bun}` : `node ${process.version}`}`
);

if (!fs.existsSync(distIndex)) {
  console.log('[BOOT] dist/ not found, building frontend with Vite...');
  const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  const result = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  if (result.status !== 0 || !fs.existsSync(distIndex)) {
    console.error('[BOOT] Frontend build failed; the API will still start without the SPA.');
  }
}

await import('./backend/src/server.js');
