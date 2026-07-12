import { PROTOCOL_ROWS, RACE_EVENT } from '../github/spec-utils/race-fixtures';
import { ProtocolDbEventUpdate } from './protocol-db-write.interface';

/** Opaque bytes handed to the write path; the fake engine rejects them at `deserialize`. */
export const EXISTING_DB_BYTES_MOCK = new Uint8Array([1, 2, 3, 4]);

/** Any publication payload — the write fails before it is ever rolled up. */
export const DB_UPDATE_MOCK: ProtocolDbEventUpdate = { event: RACE_EVENT, rows: PROTOCOL_ROWS };
