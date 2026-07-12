import { FIRST_ARCHIVE_EVENT_NUMBER } from '../github/archive-index.constant';
import { EXPECTED_NEW_ENTRY, EXPECTED_RENUMBERED_STALE_EVENTS, STALE_INDEX } from '../github/archive-index.mock';
import { ArchiveIndexEntry } from '../github/archive-index.interface';
import { EXISTING_HISTORY } from '../github/publish-event.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from '../github/spec-utils/race-fixtures';
import { FIRST_PARTICIPATION_NOTE } from '../history/notes-builder.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { PROTOCOL_DB_META_SCHEMA_VERSION_KEY, PROTOCOL_DB_SCHEMA_VERSION } from './protocol-db-schema.constant';
import { ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';

/** Publishes `RACE_EVENT` (slug 2026-06-28); the write reads the previous state back out of the db. */
export const DB_UPDATE_MOCK: ProtocolDbEventUpdate = { event: RACE_EVENT, rows: PROTOCOL_ROWS };

/**
 * `PROTOCOL_ROWS` as the write stores them: the full-archive note recompute backfills the auto
 * notes (the seeds carry no earlier `results` rows, so both finishers are first-timers) while the
 * DNF row keeps its manual 'сход'.
 */
export const EXPECTED_STORED_ROWS: ProtocolRow[] = [
  { ...PROTOCOL_ROWS[0], note: FIRST_PARTICIPATION_NOTE },
  { ...PROTOCOL_ROWS[1], note: FIRST_PARTICIPATION_NOTE },
  PROTOCOL_ROWS[2],
];

/** `RACE_EVENT` as the write stores it among the seeded archive: renumbered to the middle position. */
export const RENUMBERED_RACE_EVENT: RaceEvent = { ...RACE_EVENT, number: EXPECTED_RENUMBERED_STALE_EVENTS[1].number };

/** `RACE_EVENT` as the write stores it into a fresh db: the sole event opens the numbering. */
export const SOLE_RACE_EVENT: RaceEvent = { ...RACE_EVENT, number: FIRST_ARCHIVE_EVENT_NUMBER };

/** Removes the 2026-06-28 event; the write reads the rest of the state from the db. */
export const DB_REMOVAL_MOCK: ProtocolDbEventRemoval = { slug: RACE_EVENT.dateIso };

/** Removes a slug that was never published, so the read state passes through the rewrite untouched. */
export const UNKNOWN_REMOVAL_MOCK: ProtocolDbEventRemoval = { slug: '2000-01-01' };

/** The club metadata every previously-published event carries; the archive itself never stores it. */
export const PRESERVED_CLUB_NAME = 'Старый клуб';

export const PRESERVED_CHAIRMAN = 'Старый председатель';

const q = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const num = (value: number | null): string => (value === null ? 'NULL' : String(value));

const gender = (value: string | null): string => (value === null ? 'NULL' : q(value));

const legacy = (value: string | null): string => (value === null ? 'NULL' : q(value));

/** An `events` row carrying the preserved club meta, so `readEventMeta` keeps it across the rewrite. */
function eventInsert(entry: ArchiveIndexEntry, clubName: string, chairman: string): string {
  return (
    `INSERT INTO events VALUES (${q(entry.slug)}, ${q(entry.dateIso)}, ${entry.number}, ${legacy(entry.legacyNumber)}, ${q(entry.city)}, ${q(entry.park)}, ` +
    `${q(clubName)}, ${q(chairman)}, ${entry.participantCount}, ${num(entry.finisherCount)}, ${num(entry.medianTimeMs)}, ` +
    `${num(entry.bestMaleMs)}, ${num(entry.bestFemaleMs)}, ${num(entry.newcomerCount)}, ${num(entry.personalRecordCount)})`
  );
}

function athleteInserts(history: AthletesHistory): string[] {
  const rows: string[] = [];

  for (const athlete of Object.values(history)) {
    rows.push(
      `INSERT INTO athletes VALUES (${q(athlete.key)}, ${q(athlete.displayName)}, ${gender(athlete.gender)}, ${num(athlete.bestMs)})`,
    );

    for (const run of athlete.runs) {
      rows.push(`INSERT INTO runs VALUES (${q(athlete.key)}, ${q(run.dateIso)}, ${q(run.slug)}, ${run.timeMs}, ${run.distanceKm})`);
    }

    for (const slug of athlete.participationSlugs) {
      rows.push(`INSERT INTO participations VALUES (${q(athlete.key)}, ${q(slug)})`);
    }
  }

  return rows;
}

/** A pre-existing schema-version row, so applying to these bytes exercises the meta upsert's UPDATE path. */
const META_SEED = `INSERT INTO meta VALUES ('${PROTOCOL_DB_META_SCHEMA_VERSION_KEY}', '${PROTOCOL_DB_SCHEMA_VERSION}')`;

/**
 * The seed SQL for the previous `sundayrun.db`: the three unsorted `STALE_INDEX` events (each with the
 * preserved club meta) and `EXISTING_HISTORY`. Exported to bytes, this is the image the write reads
 * its previous state back out of.
 */
export const EXISTING_DB_SEED: readonly string[] = [
  ...STALE_INDEX.events.map((entry) => eventInsert(entry, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN)),
  ...athleteInserts(EXISTING_HISTORY),
  META_SEED,
];

/**
 * The archive `readIndexFile` reads back after the publication: newest first, the stale slug
 * replaced by the fresh entry, and every number reassigned by chronological position. The
 * note-derived counters converge with the stored notes: the seeded events carry no `results`
 * rows, so theirs collapse to zero, while the published rows' backfilled first participations
 * land on the fresh entry.
 */
export const EXPECTED_APPLIED_EVENTS: ArchiveIndexEntry[] = [
  { ...EXPECTED_RENUMBERED_STALE_EVENTS[2], newcomerCount: 0, personalRecordCount: 0 },
  { ...EXPECTED_NEW_ENTRY, number: EXPECTED_RENUMBERED_STALE_EVENTS[1].number, newcomerCount: 2 },
  { ...EXPECTED_RENUMBERED_STALE_EVENTS[0], newcomerCount: 0, personalRecordCount: 0 },
];

/** The removed slug (`RACE_EVENT`), matching Мария's stale run in `EXISTING_HISTORY`. */
export const REMOVED_SLUG = RACE_EVENT.dateIso;

/** A single-event archive entry for `RACE_EVENT`, so removing it empties every table. */
const SOLE_ENTRY: ArchiveIndexEntry = {
  ...EXPECTED_NEW_ENTRY,
  finisherCount: null,
  medianTimeMs: null,
  bestMaleMs: null,
  bestFemaleMs: null,
};

/** One athlete who only ran the sole event, so its removal leaves the rollup empty. */
const SOLE_HISTORY: AthletesHistory = {
  'мария иванова': {
    key: 'мария иванова',
    displayName: 'Мария Иванова',
    gender: null,
    participationSlugs: [REMOVED_SLUG],
    runs: [{ dateIso: REMOVED_SLUG, slug: REMOVED_SLUG, timeMs: 1500000, distanceKm: 5 }],
    bestMs: 1500000,
    bestMsByYear: { '2026': 1500000 },
  },
};

/** A db holding only the event to be removed; removing it drives every empty-rewrite guard. */
export const SOLE_EVENT_DB_SEED: readonly string[] = [
  eventInsert(SOLE_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  ...athleteInserts(SOLE_HISTORY),
  META_SEED,
];

/** Removes the sole event; the read state collapses to an empty archive and rollup. */
export const SOLE_REMOVAL_MOCK: ProtocolDbEventRemoval = { slug: REMOVED_SLUG };

/** A publication carrying no result rows at all: the results insert is skipped and no athlete is created. */
export const EMPTY_ROWS_UPDATE_MOCK: ProtocolDbEventUpdate = { event: RACE_EVENT, rows: [] };

/** A publication whose sole row is a DNF: an athlete is created run-less, so the runs insert is skipped. */
export const DNF_ONLY_UPDATE_MOCK: ProtocolDbEventUpdate = { event: RACE_EVENT, rows: [PROTOCOL_ROWS[2]] };

/** The DNF athlete `DNF_ONLY_UPDATE_MOCK` produces: one run-less participation in the published event. */
export const EXPECTED_DNF_ONLY_HISTORY: AthletesHistory = {
  'петр сидоров': {
    key: 'петр сидоров',
    displayName: 'Пётр Сидоров',
    gender: null,
    participationSlugs: [REMOVED_SLUG],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
};
