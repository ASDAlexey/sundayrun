import { FIRST_ARCHIVE_EVENT_NUMBER } from '../github/archive-index.constant';
import { EXPECTED_NEW_ENTRY, EXPECTED_RENUMBERED_STALE_EVENTS, STALE_INDEX } from '../github/archive-index.mock';
import { ArchiveIndexEntry } from '../github/archive-index.interface';
import { eventFilePaths } from '../github/event-paths';
import { EXISTING_HISTORY } from '../github/publish-event.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from '../github/spec-utils/race-fixtures';
import { FIVE_KM_DISTANCE_KM } from '../history/distance.constant';
import { FIRST_PARTICIPATION_NOTE, PERSONAL_RECORD_NOTE_PREFIX } from '../history/notes-builder.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { EventWeather } from '../weather/event-weather.interface';
import { WEATHER_MOCK } from '../weather/fetch-event-weather.mock';
import { PROTOCOL_DB_META_SCHEMA_VERSION_KEY, PROTOCOL_DB_SCHEMA_VERSION } from './protocol-db-schema.constant';
import { ProtocolDbEventRemoval, ProtocolDbEventUpdate } from './protocol-db-write.interface';

/** Publishes `RACE_EVENT` (slug 2026-06-28) with its publish-time weather; the write reads the previous state back out of the db. */
export const DB_UPDATE_MOCK: ProtocolDbEventUpdate = { event: RACE_EVENT, rows: PROTOCOL_ROWS, weather: WEATHER_MOCK };

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
    `${num(entry.medianMaleMs)}, ${num(entry.medianFemaleMs)}, ` +
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

const weatherInsert = (slug: string, weather: EventWeather): string =>
  `INSERT INTO event_weather VALUES (${q(slug)}, ${num(weather.temperatureC)}, ${num(weather.apparentC)}, ` +
  `${num(weather.precipitationMm)}, ${num(weather.windKmh)}, ${num(weather.weatherCode)})`;

/** A stale weather row for the re-published slug, so the publication exercises the upsert's UPDATE path. */
const STALE_WEATHER: EventWeather = { temperatureC: -10, apparentC: -15, precipitationMm: 5, windKmh: 40, weatherCode: 75 };

/** The seeded weather of an untouched event; a publication must leave it exactly as stored. */
export const PRESERVED_WEATHER_SLUG = STALE_INDEX.events[0].slug;

export const PRESERVED_WEATHER: EventWeather = { temperatureC: 3.5, apparentC: 1.2, precipitationMm: 0.4, windKmh: 18, weatherCode: 61 };

/**
 * The seed SQL for the previous `sundayrun.db`: the three unsorted `STALE_INDEX` events (each with the
 * preserved club meta) and `EXISTING_HISTORY`. Exported to bytes, this is the image the write reads
 * its previous state back out of.
 */
export const EXISTING_DB_SEED: readonly string[] = [
  ...STALE_INDEX.events.map((entry) => eventInsert(entry, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN)),
  ...athleteInserts(EXISTING_HISTORY),
  weatherInsert(RACE_EVENT.dateIso, STALE_WEATHER),
  weatherInsert(PRESERVED_WEATHER_SLUG, PRESERVED_WEATHER),
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
  // `readIndexFile` rebuilds from the `events` table alone, so no entry carries the joined weather.
  { ...EXPECTED_RENUMBERED_STALE_EVENTS[2], newcomerCount: 0, personalRecordCount: 0, weather: null },
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
  weatherInsert(REMOVED_SLUG, PRESERVED_WEATHER),
  META_SEED,
];

/** Removes the sole event; the read state collapses to an empty archive and rollup. */
export const SOLE_REMOVAL_MOCK: ProtocolDbEventRemoval = { slug: REMOVED_SLUG };

/** A stored `results` row as raw SQL, so a seed can carry notes written before the auto-note baseline. */
const resultInsert = (slug: string, row: ProtocolRow): string =>
  `INSERT INTO results VALUES (${q(slug)}, ${row.index}, ${q(row.fullName)}, ${q(row.time23)}, ${q(row.time5)}, ` +
  `${num(row.totalMs)}, ${num(row.distanceKm)}, ${gender(row.gender)}, ${num(row.placeM)}, ${num(row.placeF)}, ` +
  `${q(row.club)}, ${q(row.note)})`;

/** An event published before `AUTO_NOTES_BASELINE_ISO`, so the recompute must never rewrite its notes. */
export const PRE_BASELINE_SLUG = '2023-06-04';

/** The organiser-era record note the pre-baseline event stores; it must survive the recompute verbatim. */
export const PRE_BASELINE_RECORD_NOTE = `${PERSONAL_RECORD_NOTE_PREFIX} 26:00)`;

/** The pre-baseline archive entry; the organisers' legacy number exercises the non-null `legacy` seed side. */
export const PRE_BASELINE_ENTRY: ArchiveIndexEntry = {
  slug: PRE_BASELINE_SLUG,
  dateIso: PRE_BASELINE_SLUG,
  number: FIRST_ARCHIVE_EVENT_NUMBER,
  legacyNumber: '7',
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 1,
  finisherCount: 1,
  medianTimeMs: 1560000,
  medianMaleMs: 1560000,
  medianFemaleMs: null,
  bestMaleMs: 1560000,
  bestFemaleMs: null,
  newcomerCount: null,
  personalRecordCount: null,
  weather: null,
  files: eventFilePaths(PRE_BASELINE_SLUG),
};

/** The pre-baseline event's sole stored row, carrying the preserved record note. */
export const PRE_BASELINE_ROW: ProtocolRow = {
  index: 1,
  fullName: 'Древнев Олег',
  time23: '12:00',
  time5: '26:00',
  totalMs: 1560000,
  distanceKm: FIVE_KM_DISTANCE_KM,
  gender: Gender.male,
  placeM: 1,
  placeF: null,
  club: '',
  note: PRE_BASELINE_RECORD_NOTE,
};

/** The rollup contribution of the pre-baseline event, keeping the seeded db self-consistent. */
const PRE_BASELINE_HISTORY: AthletesHistory = {
  'древнев олег': {
    key: 'древнев олег',
    displayName: 'Древнев Олег',
    gender: Gender.male,
    participationSlugs: [PRE_BASELINE_SLUG],
    runs: [{ dateIso: PRE_BASELINE_SLUG, slug: PRE_BASELINE_SLUG, timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1560000,
    bestMsByYear: { '2023': 1560000 },
  },
};

/** A db holding one pre-baseline event WITH stored results, so the note recompute meets an older slug. */
export const PRE_BASELINE_DB_SEED: readonly string[] = [
  eventInsert(PRE_BASELINE_ENTRY, PRESERVED_CLUB_NAME, PRESERVED_CHAIRMAN),
  resultInsert(PRE_BASELINE_SLUG, PRE_BASELINE_ROW),
  ...athleteInserts(PRE_BASELINE_HISTORY),
  META_SEED,
];

/** The pre-baseline event as `selectEventResults` reads it back: renumbered first, club meta preserved. */
export const PRE_BASELINE_RACE_EVENT: RaceEvent = {
  number: FIRST_ARCHIVE_EVENT_NUMBER,
  legacyNumber: PRE_BASELINE_ENTRY.legacyNumber,
  dateIso: PRE_BASELINE_SLUG,
  city: PRE_BASELINE_ENTRY.city,
  park: PRE_BASELINE_ENTRY.park,
  clubName: PRESERVED_CLUB_NAME,
  chairman: PRESERVED_CHAIRMAN,
};

/**
 * The archive after publishing `RACE_EVENT` on top of the pre-baseline seed: the counters converge
 * from the stored notes — the preserved 'ЛР' note becomes the older event's record counter while
 * the published rows' backfilled first participations land on the fresh entry.
 */
export const EXPECTED_PRE_BASELINE_EVENTS: ArchiveIndexEntry[] = [
  { ...EXPECTED_NEW_ENTRY, number: FIRST_ARCHIVE_EVENT_NUMBER + 1, newcomerCount: 2 },
  { ...PRE_BASELINE_ENTRY, newcomerCount: 0, personalRecordCount: 1 },
];

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
