/**
 * Self-hosts `sqlite-wasm-http` into `public/sqlite-http/` as a set of static assets.
 *
 * The library is a poison pill for Angular's Vite dev server: it spawns *classic* web workers
 * via `new Worker(new URL('./sqlite-worker.js', import.meta.url))` and reaches for Node subpath
 * imports (`#sqlite3.js`, `#sqlite3-worker1-promiser.js`). Vite's dep optimiser and import
 * analysis choke on both the moment app code imports the bare `sqlite-wasm-http` specifier.
 *
 * So we never let Vite (or the Angular builder) see the library source. esbuild pre-bundles the
 * entry and every worker it reaches into `public/sqlite-http/`, inlining the `#…` subpath glue
 * and leaving each `new URL('…', import.meta.url)` worker reference literal and relative to the
 * output dir. `sqlite-http-loader.ts` then loads the entry through a `@vite-ignore` URL import,
 * so `import.meta.url` of the loaded `index.js` is `/sqlite-http/index.js` and every sibling
 * worker / the wasm resolves next to it — identically in the dev server and the static build.
 *
 * Usage: bun scripts/build-sqlite-assets.ts (runs before `bun run build` / `bun run start`).
 * Idempotent: safe to re-run; the emitted `public/sqlite-http/` tree stays gitignored.
 */
import { copyFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { build, type BuildOptions, type Plugin } from 'esbuild';

const root = join(import.meta.dir, '..');
const packageDir = join(root, 'node_modules', 'sqlite-wasm-http');
const distDir = join(packageDir, 'dist');
const depsDir = join(packageDir, 'deps', 'dist');
const outDir = join(root, 'public', 'sqlite-http');

/**
 * `import.meta.url` does not exist in a *classic* worker (`iife`), yet the inlined sqlite3 glue
 * uses it to locate `sqlite3.wasm` / the OPFS proxy. The worker's own location keeps those urls
 * relative to `public/sqlite-http/`, exactly where the copies below land.
 */
const CLASSIC_WORKER_DEFINE = { 'import.meta.url': 'self.location.href' };

/**
 * Both VFS backends size the db from the `Content-Length` of a HEAD probe. GitHub Pages
 * gzip-encodes every response the browser accepts compressed — HEAD included — so that header
 * carries the *compressed* byte count and SQLite reads the file as truncated (`SQLITE_CORRUPT`).
 * Range responses are always served identity with a `Content-Range: bytes 0-0/<total>` trailer,
 * so the probe becomes a one-byte ranged GET and the size comes from `Content-Range`, falling
 * back to `Content-Length` for servers that ignore `Range` (where identity is the only option).
 * Applied as exact-string rewrites of the package dist so a version bump that moves the code
 * fails the build loudly instead of shipping the bug back.
 */
const SIZE_PROBE_PATCHES: Record<string, readonly { from: string; to: string }[]> = {
  'vfs-sync-http.js': [
    {
      from: "xhr.open('HEAD', url, false);",
      to: "xhr.open('GET', url, false); xhr.setRequestHeader('Range', 'bytes=0-0');",
    },
    {
      from: "fh.size = BigInt((_a = xhr.getResponseHeader('Content-Length')) !== null && _a !== void 0 ? _a : 0);",
      to: "fh.size = BigInt((xhr.getResponseHeader('Content-Range') ?? '').split('/')[1] ?? xhr.getResponseHeader('Content-Length') ?? 0);",
    },
  ],
  'vfs-http-worker.js': [
    {
      from: "entry = fetch(msg.url, { method: 'HEAD', headers: Object.assign({}, options === null || options === void 0 ? void 0 : options.headers) })",
      to: "entry = fetch(msg.url, { method: 'GET', headers: Object.assign({ Range: 'bytes=0-0' }, options === null || options === void 0 ? void 0 : options.headers) })",
    },
    {
      from: "size: BigInt((_a = head.headers.get('Content-Length')) !== null && _a !== void 0 ? _a : 0),",
      to: "size: BigInt((head.headers.get('Content-Range') ?? '').split('/')[1] ?? head.headers.get('Content-Length') ?? 0),",
    },
  ],
};

const patchSizeProbe: Plugin = {
  name: 'patch-size-probe',
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /vfs-(sync-http|http-worker)\.js$/ }, async (args) => {
      const name = args.path.split('/').pop() ?? '';
      let contents = await readFile(args.path, 'utf8');

      for (const { from, to } of SIZE_PROBE_PATCHES[name]) {
        if (!contents.includes(from)) {
          throw new Error(`patch-size-probe: pattern not found in ${name} — re-check the patch against the installed sqlite-wasm-http`);
        }

        contents = contents.replace(from, to);
      }

      return { contents, loader: 'js' };
    });
  },
};

const SHARED: BuildOptions = { bundle: true, minify: true, platform: 'browser', plugins: [patchSizeProbe] };

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// The entry the service imports (ESM): esbuild inlines the `#sqlite3-worker1-promiser` subpath and
// leaves the `./sqlite-worker.js` + `./vfs-http-worker.js` worker refs literal, relative to index.js.
await build({ ...SHARED, entryPoints: [join(distDir, 'index.js')], outfile: join(outDir, 'index.js'), format: 'esm' });

// The SQLite thread and the shared-http worker — both spawned as classic workers (no `{ type: 'module' }`).
await build({
  ...SHARED,
  entryPoints: [join(distDir, 'sqlite-worker.js')],
  outfile: join(outDir, 'sqlite-worker.js'),
  format: 'iife',
  define: CLASSIC_WORKER_DEFINE,
});
await build({
  ...SHARED,
  entryPoints: [join(distDir, 'vfs-http-worker.js')],
  outfile: join(outDir, 'vfs-http-worker.js'),
  format: 'iife',
  define: CLASSIC_WORKER_DEFINE,
});

// The worker1 promiser (inlined into index.js) spawns this one as a *module* worker, so it keeps its real `import.meta.url`.
await build({
  ...SHARED,
  entryPoints: [join(depsDir, 'sqlite3-worker1-bundler-friendly.mjs')],
  outfile: join(outDir, 'sqlite3-worker1-bundler-friendly.mjs'),
  format: 'esm',
});

// Self-contained assets the glue references by name: the OPFS async proxy (only spawned on the OPFS
// path we never take, but kept so no `new URL(...)` dangles) and the wasm binary every backend loads.
copyFileSync(join(depsDir, 'sqlite3-opfs-async-proxy.js'), join(outDir, 'sqlite3-opfs-async-proxy.js'));
copyFileSync(join(depsDir, 'sqlite3.wasm'), join(outDir, 'sqlite3.wasm'));

const emitted = [
  'index.js',
  'sqlite-worker.js',
  'vfs-http-worker.js',
  'sqlite3-worker1-bundler-friendly.mjs',
  'sqlite3-opfs-async-proxy.js',
  'sqlite3.wasm',
];

console.log('public/sqlite-http/ is up to date:');
for (const name of emitted) {
  const kib = (statSync(join(outDir, name)).size / 1024).toFixed(1);
  console.log(`  ${name.padEnd(38)} ${kib.padStart(8)} KiB`);
}
