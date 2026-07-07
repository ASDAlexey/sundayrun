/** The SQL value kinds the protocol queries bind and read; blobs never occur in `protocol.db`. */
export type ProtocolDbValue = number | string | null;

/** Named statement parameters; keys carry the `$` prefix exactly as written in the SQL. */
export type ProtocolDbBindings = Record<string, ProtocolDbValue>;

/** One result row keyed by the statement's column aliases, already narrowed to the db's value kinds. */
export type ProtocolDbRow = Record<string, ProtocolDbValue>;
