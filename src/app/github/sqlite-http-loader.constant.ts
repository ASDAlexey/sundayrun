/**
 * The self-hosted `sqlite-wasm-http` entry, relative to `<base href>` so every locale build and
 * deploy sub-path resolves it against its own root (like the self-hosted fonts and workers).
 * `scripts/build-sqlite-assets.ts` emits it into `public/sqlite-http/` before every build/serve.
 */
export const SQLITE_HTTP_MODULE_PATH = 'sqlite-http/index.js';
