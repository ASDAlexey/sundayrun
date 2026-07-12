import { buildEventResultsFile } from '../core/github/results-file';
import { NEWER_ENTRY } from '../core/github/archive-index.mock';
import { RaceEvent } from '../core/models/race-event.interface';
import { ProtocolRow } from '../core/models/protocol-row.interface';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { Gender } from '../core/models/gender.enum';
import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { createProtocolDrizzle, ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import {
  selectArchiveEvents,
  selectAthleteRecord,
  selectAthleteRecords,
  selectEventResults,
  selectOverallStats,
} from './protocol-db-queries';
import {
  ATHLETE_KEY,
  EXPECTED_ARCHIVE_EVENTS,
  EXPECTED_ATHLETE_RECORD,
  EXPECTED_EMPTY_SQL_STATS,
  EXPECTED_LEADERBOARD_RECORDS,
  EXPECTED_SQL_STATS,
  LATEST_EVENTS_LIMIT,
  POPULATED_SEED,
  UNKNOWN_ATHLETE_KEY,
  UNKNOWN_EVENT_SLUG,
} from './protocol-db-queries.mock';

/** The event NEWER_ENTRY was seeded with its club metadata, and its two result rows. */
const EXPECTED_EVENT: RaceEvent = {
  number: NEWER_ENTRY.number,
  dateIso: NEWER_ENTRY.dateIso,
  city: NEWER_ENTRY.city,
  park: NEWER_ENTRY.park,
  clubName: 'Курск бегущий',
  chairman: 'Иванов Иван',
};

const EXPECTED_EVENT_ROWS: ProtocolRow[] = [
  {
    index: 1,
    fullName: 'Мария Иванова',
    time23: '11:30',
    time5: '25:00',
    totalMs: 1500000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: Gender.female,
    placeM: null,
    placeF: 1,
    club: 'Курск бегущий',
    note: '',
  },
  {
    index: 2,
    fullName: 'Пётр Сидоров',
    time23: '',
    time5: '',
    totalMs: null,
    distanceKm: null,
    gender: null,
    placeM: null,
    placeF: null,
    club: '',
    note: 'сход',
  },
];

describe('protocol-db-queries', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  async function drizzleFor(seed: readonly string[]): Promise<ProtocolDrizzle> {
    const memory = await createMemoryProtocolDb(seed);

    close = memory.close;

    return createProtocolDrizzle(memory.db);
  }

  it('reads athletes, leaderboards, stats, archive and event results off a populated db', async () => {
    const db = await drizzleFor(POPULATED_SEED);

    await expect(selectAthleteRecord(db, ATHLETE_KEY)).resolves.toEqual(EXPECTED_ATHLETE_RECORD);
    await expect(selectAthleteRecord(db, UNKNOWN_ATHLETE_KEY), 'an unknown key resolves null').resolves.toBeNull();
    await expect(selectAthleteRecords(db)).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);
    await expect(selectOverallStats(db)).resolves.toEqual(EXPECTED_SQL_STATS);
    await expect(selectArchiveEvents(db)).resolves.toEqual(EXPECTED_ARCHIVE_EVENTS);
    await expect(selectArchiveEvents(db, LATEST_EVENTS_LIMIT)).resolves.toEqual(EXPECTED_ARCHIVE_EVENTS.slice(0, LATEST_EVENTS_LIMIT));
    await expect(selectEventResults(db, NEWER_ENTRY.slug)).resolves.toEqual(buildEventResultsFile(EXPECTED_EVENT, EXPECTED_EVENT_ROWS));
    await expect(selectEventResults(db, UNKNOWN_EVENT_SLUG), 'an unknown slug resolves null').resolves.toBeNull();
  });

  it('keeps the zero-division and empty-median guards on an empty db', async () => {
    const db = await drizzleFor([]);

    await expect(selectOverallStats(db)).resolves.toEqual(EXPECTED_EMPTY_SQL_STATS);
  });
});
