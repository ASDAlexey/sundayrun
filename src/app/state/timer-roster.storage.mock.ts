import { Gender, GenderType } from '../core/models/gender.enum';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { PacingRow } from '../core/history/pacing.interface';
import { TimerRosterSummary } from '../core/sqlite/protocol-db-summary';
import {
  POPOV_ALEKSEY_ATHLETE_KEY,
  ROMANENKO_ATHLETE_KEY,
  ROMANENKO_LAP_MS,
  TROILIN_ATHLETE_KEY,
  TROILIN_LAP_MS,
} from '../core/timer/timer-session.mock';
import { TIMER_ROSTER_SCHEMA_VERSION } from './timer-roster.constant';
import { TimerRosterCache } from './timer-roster.interface';

/** The directory as the archive hands it over: full records, of which the cache keeps three fields. */
export const ROSTER_RECORDS: AthleteRecord[] = [
  {
    key: TROILIN_ATHLETE_KEY,
    displayName: 'Троилин Антон',
    gender: Gender.male,
    participationSlugs: ['2026-07-19'],
    runs: [{ dateIso: '2026-07-19', slug: '2026-07-19', timeMs: 1_406_000, distanceKm: 5 }],
    bestMs: 1_406_000,
    bestMsByYear: { '2026': 1_406_000 },
  },
  {
    key: ROMANENKO_ATHLETE_KEY,
    displayName: 'Романенко Елена',
    gender: Gender.female,
    participationSlugs: ['2026-07-19'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
];

/** What the cache gives back: the same people, stripped of a history the roster sheet never reads. */
export const CACHED_ROSTER_RECORDS: AthleteRecord[] = ROSTER_RECORDS.map((record) => ({
  key: record.key,
  displayName: record.displayName,
  gender: record.gender,
  participationSlugs: [],
  runs: [],
  bestMs: null,
  bestMsByYear: {},
}));

/** One archived first lap of one man and one of one woman — the whole archive of a young course. */
export const ROSTER_PACING_ROWS: PacingRow[] = [
  {
    key: TROILIN_ATHLETE_KEY,
    displayName: 'Троилин Антон',
    gender: Gender.male,
    slug: '2026-07-19',
    lapMs: TROILIN_LAP_MS,
    totalMs: 1_406_000,
  },
  {
    key: ROMANENKO_ATHLETE_KEY,
    displayName: 'Романенко Елена',
    gender: Gender.female,
    slug: '2026-07-19',
    lapMs: ROMANENKO_LAP_MS,
    totalMs: 1_700_000,
  },
];

/** The expected-lap table those rows boil down to. */
export const ROSTER_EXPECTED_LAP_ENTRIES: [string, number][] = [
  [TROILIN_ATHLETE_KEY, TROILIN_LAP_MS],
  [ROMANENKO_ATHLETE_KEY, ROMANENKO_LAP_MS],
];

/** With a single lap each, everyone's best lap is that lap. */
export const ROSTER_BEST_LAP_ENTRIES: [string, number][] = ROSTER_EXPECTED_LAP_ENTRIES;

/** Nobody is a regular yet on a course with one archived race. */
export const ROSTER_APPEARANCE_ENTRIES: [string, number][] = [
  [TROILIN_ATHLETE_KEY, 1],
  [ROMANENKO_ATHLETE_KEY, 1],
];

/** The only lap of each gender is also the record of that gender. */
export const ROSTER_COURSE_RECORD_LAP_MS: Readonly<Record<GenderType, number | null>> = {
  [Gender.male]: TROILIN_LAP_MS,
  [Gender.female]: ROMANENKO_LAP_MS,
};

/** When the cache was written — the date the offline indicator shows. */
export const ROSTER_SAVED_AT_MS = 1_784_900_000_000;

/** The cache exactly as the service holds it after a successful read. */
export const TIMER_ROSTER_CACHE: TimerRosterCache = {
  records: CACHED_ROSTER_RECORDS,
  expectedLapMs: new Map(ROSTER_EXPECTED_LAP_ENTRIES),
  bestLapMs: new Map(ROSTER_BEST_LAP_ENTRIES),
  appearanceCount: new Map(ROSTER_APPEARANCE_ENTRIES),
  courseRecordLapMs: { [Gender.male]: TROILIN_LAP_MS, [Gender.female]: ROMANENKO_LAP_MS },
  savedAtMs: ROSTER_SAVED_AT_MS,
};

const CACHED_ENTRIES = CACHED_ROSTER_RECORDS.map((record) => ({
  key: record.key,
  displayName: record.displayName,
  gender: record.gender,
}));

/**
 * The same directory as the published archive materialised it into `meta`: the three stored fields
 * per athlete and the four maps, so one keyed read replaces `ROSTER_RECORDS` + `ROSTER_PACING_ROWS`.
 */
export const ROSTER_SUMMARY: TimerRosterSummary = {
  athletes: CACHED_ENTRIES,
  expectedLapMs: new Map(ROSTER_EXPECTED_LAP_ENTRIES),
  bestLapMs: new Map(ROSTER_BEST_LAP_ENTRIES),
  appearanceCount: new Map(ROSTER_APPEARANCE_ENTRIES),
  courseRecordLapMs: ROSTER_COURSE_RECORD_LAP_MS,
};

/** A healthy payload, field by field; every broken variant below overrides one field of it. */
const STORED_ROSTER_FIELDS: Record<string, unknown> = {
  schemaVersion: TIMER_ROSTER_SCHEMA_VERSION,
  savedAtMs: ROSTER_SAVED_AT_MS,
  records: CACHED_ENTRIES,
  expectedLapMs: ROSTER_EXPECTED_LAP_ENTRIES,
  bestLapMs: ROSTER_BEST_LAP_ENTRIES,
  appearanceCount: ROSTER_APPEARANCE_ENTRIES,
  courseRecordLapMs: ROSTER_COURSE_RECORD_LAP_MS,
};

function payload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...STORED_ROSTER_FIELDS, ...overrides });
}

export const STORED_ROSTER_JSON = payload();

/** A hand-truncated write. */
export const MALFORMED_ROSTER_JSON = '{"schemaVersion": 2, "records"';

/** Valid JSON that is not an object at all. */
export const NON_OBJECT_ROSTER_JSON = '42';

/** Written by another release: the entries may mean something else, so the directory is refetched. */
export const FOREIGN_SCHEMA_ROSTER_JSON = payload({ schemaVersion: TIMER_ROSTER_SCHEMA_VERSION + 1 });

/** Without a date there is nothing to show next to «актуально на», so the cache does not count. */
export const UNDATED_ROSTER_JSON = payload({ savedAtMs: 'вчера' });

/** Every list hand-edited into something that is not a list, and the record into something flat. */
export const NON_ARRAY_ROSTER_JSON = payload({
  records: 'всё пропало',
  expectedLapMs: 'и это тоже',
  bestLapMs: 'и это',
  appearanceCount: 'и даже это',
  courseRecordLapMs: 'ничего не осталось',
});

/** One entry without a key, one with a gender the site does not know, one pair missing its time. */
export const PARTLY_BROKEN_ROSTER_JSON = payload({
  records: [
    { key: '', displayName: 'Без ключа', gender: null },
    { key: 'иванов иван', displayName: 'Иванов Иван', gender: 'X' },
    ...CACHED_ENTRIES,
  ],
  expectedLapMs: [[POPOV_ALEKSEY_ATHLETE_KEY], [POPOV_ALEKSEY_ATHLETE_KEY, '11:41'], ...ROSTER_EXPECTED_LAP_ENTRIES],
  bestLapMs: [[POPOV_ALEKSEY_ATHLETE_KEY, null], ...ROSTER_BEST_LAP_ENTRIES],
  appearanceCount: [['', 3], ...ROSTER_APPEARANCE_ENTRIES],
  courseRecordLapMs: { [Gender.male]: '9:26', [Gender.female]: ROMANENKO_LAP_MS },
});

/** The same directory, minus the men's record that no longer reads as a number. */
export const PARTLY_BROKEN_ROSTER_CACHE: TimerRosterCache = {
  ...TIMER_ROSTER_CACHE,
  courseRecordLapMs: { [Gender.male]: null, [Gender.female]: ROMANENKO_LAP_MS },
};
