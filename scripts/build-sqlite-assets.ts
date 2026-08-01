/**
 * Copies the official SQLite wasm binary to `public/sqlite3.wasm` before every build and serve.
 *
 * `@sqlite.org/sqlite-wasm`'s glue loads its binary at runtime with a bare file name, which the
 * bundler leaves relative to the app base — so the file has to sit at the web root, and
 * `sqlite-loader.ts` pins `locateFile` to it. Copying rather than importing keeps the 845 KB out of
 * every chunk graph: nothing fetches it until a page actually opens the archive.
 *
 * This script used to also self-host `sqlite-wasm-http` — a range-reading VFS whose 3.4 MB of
 * unoptimized wasm and half a megabyte of classic workers dwarfed the 1.2 MB database they existed
 * to read a page at a time, and whose HEAD size probe had to be patched because GitHub Pages
 * gzip-encodes HEAD responses and SQLite then read the file as truncated. Both the library and the
 * patch went away with `ProtocolDbService`, which now downloads the file whole and deserializes it.
 *
 * Usage: bun scripts/build-sqlite-assets.ts (runs before `bun run build` / `bun run start`).
 * Idempotent: safe to re-run; the emitted `public/sqlite3.wasm` stays gitignored.
 */
import { copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const source = join(root, 'node_modules', '@sqlite.org', 'sqlite-wasm', 'dist', 'sqlite3.wasm');
const target = join(root, 'public', 'sqlite3.wasm');

copyFileSync(source, target);

const kib = (statSync(target).size / 1024).toFixed(1);

console.log(`public/sqlite3.wasm is up to date: ${kib} KiB`);
