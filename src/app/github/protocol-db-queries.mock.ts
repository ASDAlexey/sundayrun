import { ArchiveIndexEntry } from '../core/github/archive-index.interface';
import { EXISTING_INDEX, NEWER_ENTRY, OLDER_ENTRY } from '../core/github/archive-index.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { CourseRecordHistory } from '../core/history/course-records.type';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { LegendFinish } from '../core/history/legend.interface';
import { ParticipantRun } from '../core/history/notables.interface';
import { OverallStats } from '../core/history/overall-stats.interface';
import { YearBadge } from '../core/history/year-badges.enum';
import { YearReview } from '../core/history/year-review.interface';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { Gender } from '../core/models/gender.enum';
import { ProtocolRow } from '../core/models/protocol-row.interface';

/**
 * The seed SQL and expected fixtures for the drizzle-backed `protocol-db-queries` tests. A real
 * in-memory sqlite db is loaded with these rows (via `createMemoryProtocolDb`), so every branch —
 * ranked athletes with and without season bests, a genderless athlete, even/odd/empty medians, the
 * archive limit, unknown keys/slugs — is exercised against the true engine, not a fake.
 */

const q = (value: string): string => `'${value}'`;

const num = (value: number | null): string => (value === null ? 'NULL' : String(value));

const legacy = (value: string | null): string => (value === null ? 'NULL' : q(value));

export const ATHLETE_KEY = 'иванов иван';

export const UNKNOWN_ATHLETE_KEY = 'нет такого';

export const RUNLESS_ATHLETE_KEY = 'новикова нина';

export const GENDERLESS_ATHLETE_KEY = 'соколов саша';

export const UNKNOWN_EVENT_SLUG = 'нет-такого-события';

export const LATEST_EVENTS_LIMIT = 1;

/** Athletes: a ranked man with season bests, a ranked woman without runs, a ranked genderless athlete. */
export const SEED_ATHLETES: readonly string[] = [
  `INSERT INTO athletes VALUES (${q(ATHLETE_KEY)}, ${q('Иванов Иван')}, ${q(Gender.male)}, 1500000)`,
  `INSERT INTO athletes VALUES (${q(RUNLESS_ATHLETE_KEY)}, ${q('Новикова Нина')}, ${q(Gender.female)}, 1700000)`,
  `INSERT INTO athletes VALUES (${q(GENDERLESS_ATHLETE_KEY)}, ${q('Соколов Саша')}, NULL, 1800000)`,
];

/**
 * Runs of `ATHLETE_KEY`: 2024 improves on a second run, 2025 opens with its best against a slower
 * run, and a 2.3 km run never counts. Plus one run for the median (a woman's, seeded via athletes).
 */
export const SEED_RUNS: readonly string[] = [
  `INSERT INTO runs VALUES (${q(ATHLETE_KEY)}, ${q('2024-05-05')}, ${q('2024-05-05')}, 1600000, ${FIVE_KM_DISTANCE_KM})`,
  `INSERT INTO runs VALUES (${q(ATHLETE_KEY)}, ${q('2024-06-06')}, ${q('2024-06-06')}, 1500000, ${FIVE_KM_DISTANCE_KM})`,
  `INSERT INTO runs VALUES (${q(ATHLETE_KEY)}, ${q('2025-03-03')}, ${q('2025-03-03')}, 1560000, ${FIVE_KM_DISTANCE_KM})`,
  `INSERT INTO runs VALUES (${q(ATHLETE_KEY)}, ${q('2025-04-04')}, ${q('2025-04-04')}, 999000, 2.3)`,
  `INSERT INTO runs VALUES (${q(ATHLETE_KEY)}, ${q('2025-05-05')}, ${q('2025-05-05')}, 1600000, ${FIVE_KM_DISTANCE_KM})`,
];

/** Participations of `ATHLETE_KEY`, one per run slug (including the 2.3 km event). */
export const SEED_PARTICIPATIONS: readonly string[] = ['2024-05-05', '2024-06-06', '2025-03-03', '2025-04-04', '2025-05-05'].map(
  (slug) => `INSERT INTO participations VALUES (${q(ATHLETE_KEY)}, ${q(slug)})`,
);

const eventInsert = (entry: ArchiveIndexEntry, clubName: string, chairman: string): string =>
  `INSERT INTO events VALUES (${q(entry.slug)}, ${q(entry.dateIso)}, ${entry.number}, ${legacy(entry.legacyNumber)}, ${q(entry.city)}, ${q(entry.park)}, ` +
  `${q(clubName)}, ${q(chairman)}, ${entry.participantCount}, ${num(entry.finisherCount)}, ${num(entry.medianTimeMs)}, ` +
  `${num(entry.bestMaleMs)}, ${num(entry.bestFemaleMs)}, ${num(entry.newcomerCount)}, ${num(entry.personalRecordCount)})`;

/** The two archive events (`EXISTING_INDEX`), each with its club metadata for the event read. */
export const SEED_EVENTS: readonly string[] = [eventInsert(NEWER_ENTRY, 'Курск бегущий', 'Иванов Иван'), eventInsert(OLDER_ENTRY, '', '')];

/** The genderless DNF result plus a female 5 km finisher on the newer event — covers `asGender`. */
export const SEED_RESULTS: readonly string[] = [
  `INSERT INTO results VALUES (${q(NEWER_ENTRY.slug)}, 1, ${q('Мария Иванова')}, ${q('11:30')}, ${q('25:00')}, 1500000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.female)}, NULL, 1, ${q('Курск бегущий')}, ${q('')})`,
  `INSERT INTO results VALUES (${q(NEWER_ENTRY.slug)}, 2, ${q('Пётр Сидоров')}, ${q('')}, ${q('')}, NULL, NULL, NULL, ` +
    `NULL, NULL, ${q('')}, ${q('сход')})`,
];

/** A woman with a single 5 km run, so the women's median is an odd (single-value) sample. */
export const SEED_WOMAN_RUN: readonly string[] = [
  `INSERT INTO runs VALUES (${q(RUNLESS_ATHLETE_KEY)}, ${q('2025-02-02')}, ${q('2025-02-02')}, 1700000, ${FIVE_KM_DISTANCE_KM})`,
];

/**
 * Protocol rows behind the seeded runs, feeding `selectAthleteRunPlaces`: places live under the
 * organisers' spellings (one row is shouted in caps), a rival's row at a shared event must be
 * matched away by name, the 2.3 km row carries no place at all, and Нина's row holds a women's
 * place — the `placeF` side of the coalesce.
 */
export const SEED_RUN_RESULTS: readonly string[] = [
  `INSERT INTO results VALUES (${q('2024-05-05')}, 1, ${q('Иванов Иван')}, ${q('12:00')}, ${q('26:40')}, 1600000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.male)}, 3, NULL, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2024-06-06')}, 1, ${q('ИВАНОВ ИВАН')}, ${q('11:15')}, ${q('25:00')}, 1500000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.male)}, 1, NULL, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2024-06-06')}, 2, ${q('Мария Иванова')}, ${q('11:30')}, ${q('25:30')}, 1530000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.female)}, NULL, 1, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2025-04-04')}, 1, ${q('Иванов Иван')}, ${q('16:39')}, ${q('')}, 999000, 2.3, ` +
    `${q(Gender.male)}, NULL, NULL, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2025-02-02')}, 1, ${q('Новикова Нина')}, ${q('13:00')}, ${q('28:20')}, 1700000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.female)}, NULL, 1, ${q('')}, ${q('')})`,
];

/** Places of `ATHLETE_KEY`'s runs: both spellings resolve; the rival row and the place-less 2.3 km row do not. */
export const EXPECTED_RUN_PLACES: Record<string, number> = { '2024-05-05': 3, '2024-06-06': 1 };

/** Нина's single run resolves through the women's place column. */
export const EXPECTED_WOMAN_RUN_PLACES: Record<string, number> = { '2025-02-02': 1 };

/** The full populated db used by most assertions. */
export const POPULATED_SEED: readonly string[] = [
  ...SEED_ATHLETES,
  ...SEED_RUNS,
  ...SEED_WOMAN_RUN,
  ...SEED_PARTICIPATIONS,
  ...SEED_EVENTS,
  ...SEED_RESULTS,
  ...SEED_RUN_RESULTS,
];

export const EXPECTED_ATHLETE_RECORD: AthleteRecord = {
  key: ATHLETE_KEY,
  displayName: 'Иванов Иван',
  gender: Gender.male,
  participationSlugs: ['2024-05-05', '2024-06-06', '2025-03-03', '2025-04-04', '2025-05-05'],
  runs: [
    { dateIso: '2024-05-05', slug: '2024-05-05', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
    { dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
    { dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
    { dateIso: '2025-04-04', slug: '2025-04-04', timeMs: 999000, distanceKm: 2.3 },
    { dateIso: '2025-05-05', slug: '2025-05-05', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
  ],
  bestMs: 1500000,
  bestMsByYear: { '2024': 1500000, '2025': 1560000 },
};

export const EXPECTED_LEADERBOARD_RECORDS: AthleteRecord[] = [
  {
    key: ATHLETE_KEY,
    displayName: 'Иванов Иван',
    gender: Gender.male,
    participationSlugs: [],
    runs: [
      { dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1500000,
    bestMsByYear: { '2024': 1500000, '2025': 1560000 },
  },
  {
    key: RUNLESS_ATHLETE_KEY,
    displayName: 'Новикова Нина',
    gender: Gender.female,
    participationSlugs: [],
    runs: [{ dateIso: '2025-02-02', slug: '2025-02-02', timeMs: 1700000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1700000,
    bestMsByYear: { '2025': 1700000 },
  },
  {
    key: GENDERLESS_ATHLETE_KEY,
    displayName: 'Соколов Саша',
    gender: null,
    participationSlugs: [],
    runs: [],
    bestMs: 1800000,
    bestMsByYear: {},
  },
];

/**
 * The men's record opens with the 2024-05-05 run and improves on 2024-06-06; the slower 2025 runs
 * and the 2.3 km run never enter. The women's record is Нина's single run.
 */
export const EXPECTED_COURSE_RECORDS: CourseRecordHistory = {
  [Gender.male]: [
    {
      key: ATHLETE_KEY,
      displayName: 'Иванов Иван',
      gender: Gender.male,
      dateIso: '2024-05-05',
      slug: '2024-05-05',
      timeMs: 1600000,
      previousMs: null,
    },
    {
      key: ATHLETE_KEY,
      displayName: 'Иванов Иван',
      gender: Gender.male,
      dateIso: '2024-06-06',
      slug: '2024-06-06',
      timeMs: 1500000,
      previousMs: 1600000,
    },
  ],
  [Gender.female]: [
    {
      key: RUNLESS_ATHLETE_KEY,
      displayName: 'Новикова Нина',
      gender: Gender.female,
      dateIso: '2025-02-02',
      slug: '2025-02-02',
      timeMs: 1700000,
      previousMs: null,
    },
  ],
};

/**
 * `count()` over runs counts all six seeded runs (the man's four 5 km runs, his 2.3 km run and the
 * woman's single 5 km run); `finishersCount` is the two distinct athletes. Median is per 5 km sample:
 * the man's four times (1600000, 1500000, 1560000, 1600000) average their middle pair (1560000,
 * 1600000) to 1580000; the woman's single 1700000 is her own median.
 */
export const EXPECTED_SQL_STATS: OverallStats = {
  eventsCount: 2,
  finishesCount: 6,
  finishersCount: 2,
  averageFinishes: 3,
  medianTimeMenMs: 1580000,
  medianTimeWomenMs: 1700000,
};

export const EXPECTED_EMPTY_SQL_STATS: OverallStats = {
  eventsCount: 0,
  finishesCount: 0,
  finishersCount: 0,
  averageFinishes: 0,
  medianTimeMenMs: 0,
  medianTimeWomenMs: 0,
};

/** The archive as the queries serve it, newest first (`EXISTING_INDEX.events` already sorted). */
export const EXPECTED_ARCHIVE_EVENTS: ArchiveIndexEntry[] = EXISTING_INDEX.events;

/** The seeded events oldest first — the chronology `selectEventSlugs` serves. */
export const EXPECTED_EVENT_SLUGS: string[] = [OLDER_ENTRY.slug, NEWER_ENTRY.slug];

/** Both seeded events fall into 2026, so its first race date is the older slug. */
export const EXPECTED_FIRST_EVENT_DATE_BY_YEAR: Record<string, string> = { '2026': OLDER_ENTRY.slug };

/** The `RACE_EVENT` (slug = its dateIso) with its club metadata, for the results-service read. */
export const SEED_RACE_EVENT: readonly string[] = [
  `INSERT INTO events VALUES (${q(RACE_EVENT.dateIso)}, ${q(RACE_EVENT.dateIso)}, ${RACE_EVENT.number}, ${legacy(RACE_EVENT.legacyNumber)}, ${q(RACE_EVENT.city)}, ` +
    `${q(RACE_EVENT.park)}, ${q(RACE_EVENT.clubName)}, ${q(RACE_EVENT.chairman)}, ${PROTOCOL_ROWS.length}, NULL, NULL, NULL, NULL, NULL, NULL)`,
];

const resultInsert = (row: ProtocolRow): string =>
  `INSERT INTO results VALUES (${q(RACE_EVENT.dateIso)}, ${row.index}, ${q(row.fullName)}, ${q(row.time23)}, ${q(row.time5)}, ` +
  `${num(row.totalMs)}, ${num(row.distanceKm)}, ${row.gender === null ? 'NULL' : q(row.gender)}, ${num(row.placeM)}, ` +
  `${num(row.placeF)}, ${q(row.club)}, ${q(row.note)})`;

/** Every `PROTOCOL_ROWS` row of the `RACE_EVENT`, so `selectEventResults` rebuilds the same file. */
export const SEED_RACE_RESULTS: readonly string[] = PROTOCOL_ROWS.map(resultInsert);

/** The 2024-05-05 event: `ATHLETE_KEY` is its only 5 km finisher among the seeded runs. */
export const PARTICIPANT_RUNS_SLUG = '2024-05-05';

/** His full 5 km chronology (the 2.3 km run never enters), as `selectEventParticipantRuns` serves it. */
export const EXPECTED_PARTICIPANT_RUNS: ParticipantRun[] = [
  { athleteKey: ATHLETE_KEY, dateIso: '2024-05-05', slug: '2024-05-05', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
  { athleteKey: ATHLETE_KEY, dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { athleteKey: ATHLETE_KEY, dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
  { athleteKey: ATHLETE_KEY, dateIso: '2025-05-05', slug: '2025-05-05', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
];

/** The year the review test reads — the one holding both seeded 2024 events and runs. */
export const REVIEW_YEAR = '2024';

/** The years the seeded events span, newest first — what `loadYears` serves the switcher. */
export const EXPECTED_REVIEW_YEARS: string[] = ['2026', REVIEW_YEAR];

/** The 2024 events behind the year-review read; the first carries the organisers' legacy number. */
export const SEED_YEAR_EVENTS: readonly string[] = [
  `INSERT INTO events VALUES (${q('2024-05-05')}, ${q('2024-05-05')}, 1, ${legacy('3')}, ${q('Курск')}, ${q('Боева дача')}, ` +
    `${q('')}, ${q('')}, 1, 1, 1600000, 1600000, NULL, NULL, NULL)`,
  `INSERT INTO events VALUES (${q('2024-06-06')}, ${q('2024-06-06')}, 2, ${legacy(null)}, ${q('Курск')}, ${q('Боева дача')}, ` +
    `${q('')}, ${q('')}, 2, 2, 1560000, 1500000, NULL, NULL, NULL)`,
];

/** A corrupt gender code the typed write can never produce; every read must coerce it to genderless. */
export const CORRUPT_GENDER_ATHLETE_KEY = 'хитров ян';

export const SEED_CORRUPT_GENDER: readonly string[] = [
  `INSERT INTO athletes VALUES (${q(CORRUPT_GENDER_ATHLETE_KEY)}, ${q('Хитров Ян')}, ${q('X')}, 1620000)`,
  `INSERT INTO runs VALUES (${q(CORRUPT_GENDER_ATHLETE_KEY)}, ${q('2024-06-06')}, ${q('2024-06-06')}, 1620000, ${FIVE_KM_DISTANCE_KM})`,
];

/** `POPULATED_SEED` plus the 2024 events and the corrupt-gender athlete — the year-review db. */
export const YEAR_REVIEW_SEED: readonly string[] = [...POPULATED_SEED, ...SEED_YEAR_EVENTS, ...SEED_CORRUPT_GENDER];

/**
 * `selectYearReview(db, REVIEW_YEAR)` over `YEAR_REVIEW_SEED`: Иванов's two 2024 runs make the
 * men's median and best, the corrupt-gender run counts as a genderless finish, only Иванов's
 * first participation falls into 2024, and no stored note carries a personal record.
 */
export const EXPECTED_DB_YEAR_REVIEW: YearReview = {
  year: REVIEW_YEAR,
  eventCount: 2,
  finishCount: 3,
  finisherCount: 2,
  newcomerCount: 1,
  personalRecordCount: 0,
  medianTimeMenMs: 1550000,
  medianTimeWomenMs: null,
  bestMale: { key: ATHLETE_KEY, displayName: 'Иванов Иван', timeMs: 1500000, slug: '2024-06-06' },
  bestFemale: null,
  mostActive: [
    { key: ATHLETE_KEY, displayName: 'Иванов Иван', finishCount: 2 },
    { key: CORRUPT_GENDER_ATHLETE_KEY, displayName: 'Хитров Ян', finishCount: 1 },
  ],
  badgeHolders: [{ badge: YearBadge.newYearRace, holders: [{ key: ATHLETE_KEY, displayName: 'Иванов Иван' }] }],
  firstEventSlug: '2024-05-05',
};

/** Every seeded finish (the 2.3 km run included) oldest first, as `selectLegendFinishes` serves it. */
export const EXPECTED_LEGEND_FINISHES: LegendFinish[] = [
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2024-05-05' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2024-06-06' },
  { key: RUNLESS_ATHLETE_KEY, displayName: 'Новикова Нина', dateIso: '2025-02-02' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-03-03' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-04-04' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-05-05' },
];
