/** Rebuilds the protocol db bytes from the current ones (`null` when the artifact does not exist yet). */
export type ProtocolDbUpdateFn = (dbBytes: Uint8Array | null) => Promise<Uint8Array>;
