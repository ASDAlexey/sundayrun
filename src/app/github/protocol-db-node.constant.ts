/**
 * The committed database, relative to the build's working directory (the workspace root): the Node
 * read adapter opens this file during the static prerender. `readFile` resolves it against `cwd`,
 * which `ng build` runs from the project root.
 */
export const PROTOCOL_DB_LOCAL_PATH = 'data/protocol.db';
