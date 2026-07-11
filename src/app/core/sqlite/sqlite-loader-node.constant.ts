/**
 * The sqlite-wasm binary inside the installed package, relative to the build's working directory
 * (the workspace root, which `ng build` runs from). The Node loader reads these bytes and hands them
 * to Emscripten as `wasmBinary`, so the bundled prerender never has to locate the `.wasm` next to its
 * temporary chunk — the lookup that fails with ENOENT when the default file-fetch path is used.
 */
export const SQLITE_WASM_NODE_PATH = 'node_modules/@sqlite.org/sqlite-wasm/dist/sqlite3.wasm';
