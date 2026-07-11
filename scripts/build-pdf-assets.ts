/**
 * Self-hosts the pdf.js worker into `public/pdf/` as a static asset.
 *
 * pdf.js renders off a web worker pointed at by `GlobalWorkerOptions.workerSrc`. A bare
 * `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` is NOT emitted by the Angular
 * builder — esbuild only treats *relative* `new URL(..., import.meta.url)` strings as asset urls,
 * not bare package specifiers — so the worker would 404 at runtime. Instead we copy the pre-bundled
 * (self-contained) worker next to the app and point `workerSrc` at it against `document.baseURI`,
 * surviving the deploy sub-path and locale prefix, exactly like the self-hosted sqlite assets and fonts.
 *
 * Usage: bun scripts/build-pdf-assets.ts (runs before `bun run build` / `bun run start`).
 * Idempotent: safe to re-run; the emitted `public/pdf/` tree stays gitignored.
 */
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const source = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const outDir = join(root, 'public', 'pdf');
const outFile = join(outDir, 'pdf.worker.min.mjs');

mkdirSync(outDir, { recursive: true });
copyFileSync(source, outFile);

const kib = (statSync(outFile).size / 1024).toFixed(1);

console.log(`public/pdf/ is up to date:\n  pdf.worker.min.mjs ${kib.padStart(8)} KiB`);
