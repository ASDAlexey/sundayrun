/**
 * Pre-bundles the `sqlite-wasm-http` worker into `public/` for the Angular build.
 *
 * The library spawns its SQLite thread as a *classic* worker via
 * `new Worker(new URL('./sqlite-worker.js', import.meta.url))` — a pattern esbuild (and so
 * the Angular builder) leaves untouched, expecting the file to exist next to the emitted
 * chunk at runtime. This script bundles that worker into a single classic-compatible script
 * and copies the wasm binary it loads; the Angular build then places both next to the app
 * chunks of every locale, where the relative worker/wasm urls resolve.
 *
 * Usage: bun scripts/build-sqlite-worker.ts (runs before `bun run build` / `bun run start`)
 */
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

import { build } from 'esbuild';

const root = join(import.meta.dir, '..');
const packageDir = join(root, 'node_modules', 'sqlite-wasm-http');
const publicDir = join(root, 'public');

await build({
  entryPoints: [join(packageDir, 'dist', 'sqlite-worker.js')],
  bundle: true,
  minify: true,
  // A classic worker script: the library does not pass `{ type: 'module' }` to `new Worker`.
  format: 'iife',
  platform: 'browser',
  // `import.meta.url` (how the bundled sqlite3 locates `sqlite3.wasm`) does not exist in a
  // classic worker — the worker's own location keeps the wasm url relative to `public/`.
  define: { 'import.meta.url': 'self.location.href' },
  outfile: join(publicDir, 'sqlite-worker.js'),
});

copyFileSync(join(packageDir, 'deps', 'dist', 'sqlite3.wasm'), join(publicDir, 'sqlite3.wasm'));

console.log('public/sqlite-worker.js and public/sqlite3.wasm are up to date');
