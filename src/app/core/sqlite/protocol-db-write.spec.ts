import { buildEventResultsFile } from '../github/results-file';
import { EXPECTED_FIRST_PUBLISH_HISTORY, EXPECTED_PUBLISHED_HISTORY } from '../github/publish-event.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from '../github/spec-utils/race-fixtures';
import { selectEventResults } from '../../github/protocol-db-queries';
import { readHistory, readIndexFile } from './protocol-db-read';
import {
  DB_UPDATE_MOCK,
  DNF_ONLY_UPDATE_MOCK,
  EMPTY_ROWS_UPDATE_MOCK,
  EXISTING_DB_SEED,
  EXPECTED_APPLIED_EVENTS,
  EXPECTED_DNF_ONLY_HISTORY,
  EXPECTED_STORED_ROWS,
  REMOVED_SLUG,
  RENUMBERED_RACE_EVENT,
  SOLE_RACE_EVENT,
  SOLE_EVENT_DB_SEED,
  SOLE_REMOVAL_MOCK,
} from './protocol-db-write.mock';
import { applyEventToDb, removeEventFromDb } from './protocol-db-write';
import { createProtocolDrizzle, ProtocolDrizzle } from './protocol-drizzle';
import { exportMemoryProtocolDbBytes, openMemoryProtocolDbFromBytes } from './spec-utils/protocol-db-memory';

/** The real engine is slow to spin up; each roundtrip opens the wasm db a few times over. */
const ROUNDTRIP_TIMEOUT_MS = 30000;

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const real = await import('./spec-utils/real-sqlite3');

  return { default: () => real.realSqlite3Init() };
});

describe('protocol-db-write (real-engine roundtrip)', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  /** Reopens exported bytes as a drizzle handle, so the written tables can be read straight back. */
  async function reopen(bytes: Uint8Array): Promise<ProtocolDrizzle> {
    const memory = await openMemoryProtocolDbFromBytes(bytes);

    close = memory.close;

    return createProtocolDrizzle(memory.db);
  }

  it(
    'applies a publication to existing bytes: preserves club meta, rebuilds the archive and rollup and replaces only the published results',
    async () => {
      const existingBytes = await exportMemoryProtocolDbBytes(EXISTING_DB_SEED);

      const db = await reopen(await applyEventToDb(existingBytes, DB_UPDATE_MOCK));

      await expect(readHistory(db)).resolves.toEqual(EXPECTED_PUBLISHED_HISTORY);
      expect((await readIndexFile(db)).events).toEqual(EXPECTED_APPLIED_EVENTS);
      await expect(selectEventResults(db, RACE_EVENT.dateIso)).resolves.toEqual(
        buildEventResultsFile(RENUMBERED_RACE_EVENT, EXPECTED_STORED_ROWS),
      );
    },
    ROUNDTRIP_TIMEOUT_MS,
  );

  it(
    'creates a fresh db when no sundayrun.db is published yet, seeding it from the single event',
    async () => {
      const db = await reopen(await applyEventToDb(null, DB_UPDATE_MOCK));

      await expect(readHistory(db)).resolves.toEqual(EXPECTED_FIRST_PUBLISH_HISTORY);
      expect((await readIndexFile(db)).events.map((entry) => entry.slug)).toEqual([RACE_EVENT.dateIso]);
      await expect(selectEventResults(db, RACE_EVENT.dateIso)).resolves.toEqual(
        buildEventResultsFile(SOLE_RACE_EVENT, EXPECTED_STORED_ROWS),
      );
    },
    ROUNDTRIP_TIMEOUT_MS,
  );

  it(
    'removes the only event, collapsing every table to empty',
    async () => {
      const existingBytes = await exportMemoryProtocolDbBytes(SOLE_EVENT_DB_SEED);

      const db = await reopen(await removeEventFromDb(existingBytes, SOLE_REMOVAL_MOCK));

      await expect(readHistory(db)).resolves.toEqual({});
      expect((await readIndexFile(db)).events).toEqual([]);
      await expect(selectEventResults(db, REMOVED_SLUG), 'the removed slug has no results').resolves.toBeNull();
    },
    ROUNDTRIP_TIMEOUT_MS,
  );

  it(
    'publishes an event with no result rows: writes the archive entry but skips the results insert and creates no athletes',
    async () => {
      const db = await reopen(await applyEventToDb(null, EMPTY_ROWS_UPDATE_MOCK));

      await expect(readHistory(db)).resolves.toEqual({});
      expect((await readIndexFile(db)).events.map((entry) => entry.slug)).toEqual([RACE_EVENT.dateIso]);
      await expect(selectEventResults(db, RACE_EVENT.dateIso)).resolves.toEqual(buildEventResultsFile(SOLE_RACE_EVENT, []));
    },
    ROUNDTRIP_TIMEOUT_MS,
  );

  it(
    'publishes a DNF-only event: creates a run-less athlete, so the runs insert is skipped but the participation is written',
    async () => {
      const db = await reopen(await applyEventToDb(null, DNF_ONLY_UPDATE_MOCK));

      await expect(readHistory(db)).resolves.toEqual(EXPECTED_DNF_ONLY_HISTORY);
      await expect(selectEventResults(db, RACE_EVENT.dateIso)).resolves.toEqual(buildEventResultsFile(SOLE_RACE_EVENT, [PROTOCOL_ROWS[2]]));
    },
    ROUNDTRIP_TIMEOUT_MS,
  );
});
