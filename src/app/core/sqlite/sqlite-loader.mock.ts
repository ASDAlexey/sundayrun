import { vi } from 'vitest';

export const SQLITE3_INIT_MOCK = vi.fn();

/** Shape-only stand-in for the initialized namespace; the loader passes it through untouched. */
export const SQLITE3_STATIC_MOCK = { version: { libVersion: '3.53.0' } };

/** The file name Emscripten hands to `locateFile` when it goes looking for the wasm binary. */
export const SQLITE_WASM_FILE_NAME = 'sqlite3.wasm';
