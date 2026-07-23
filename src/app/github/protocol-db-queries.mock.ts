import { ArchiveIndexEntry } from '../core/github/archive-index.interface';
import { EXISTING_INDEX, NEWER_ENTRY, OLDER_ENTRY } from '../core/github/archive-index.mock';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { CourseRecordHistory } from '../core/history/course-records.type';
import { AthleteFirstLap } from '../core/history/first-lap.interface';
import { FirstLapRecords } from '../core/history/first-lap.type';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { LegendFinish } from '../core/history/legend.interface';
import { ParticipantRun } from '../core/history/notables.interface';
import { PreviousBest } from '../core/history/previous-bests.interface';
import { OverallStats } from '../core/history/overall-stats.interface';
import { PacingRow } from '../core/history/pacing.interface';
import { SeasonRun } from '../core/history/season-positions.interface';
import { RivalRun } from '../core/history/rivals.interface';
import { EventWinnerTimes } from '../core/history/runner-scores.interface';
import { EventWeatherRow } from '../core/history/weather-records.interface';
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

/** Нина's participation behind her single run, so the rarity denominator counts both starters. */
export const SEED_WOMAN_PARTICIPATION: readonly string[] = [
  `INSERT INTO participations VALUES (${q(RUNLESS_ATHLETE_KEY)}, ${q('2025-02-02')})`,
];

const eventInsert = (entry: ArchiveIndexEntry, clubName: string, chairman: string): string =>
  `INSERT INTO events VALUES (${q(entry.slug)}, ${q(entry.dateIso)}, ${entry.number}, ${legacy(entry.legacyNumber)}, ${q(entry.city)}, ${q(entry.park)}, ` +
  `${q(clubName)}, ${q(chairman)}, ${entry.participantCount}, ${num(entry.finisherCount)}, ${num(entry.medianTimeMs)}, ` +
  `${num(entry.medianMaleMs)}, ${num(entry.medianFemaleMs)}, ` +
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

/**
 * The fastest recorded splits per gender: Иванов's caps-spelled 11:15 resolves its display name
 * through the athletes table; Мария's 11:30 tie (2026-07-05 vs 2024-06-06) stays with the earlier
 * run, and her name falls back to the protocol spelling — she is not a ranked athlete. The 2.3 km
 * row (time5 empty) enters the scan but its 16:39 split is too slow to take the record.
 */
export const EXPECTED_DB_FIRST_LAP_RECORDS: FirstLapRecords = {
  [Gender.male]: {
    key: ATHLETE_KEY,
    displayName: 'Иванов Иван',
    gender: Gender.male,
    dateIso: '2024-06-06',
    slug: '2024-06-06',
    lapMs: 675000,
  },
  [Gender.female]: {
    key: 'мария иванова',
    displayName: 'Мария Иванова',
    gender: Gender.female,
    dateIso: '2024-06-06',
    slug: '2024-06-06',
    lapMs: 690000,
  },
};

/** Иванов's own best split — the caps-spelled 11:15; Мария's row at the shared event is name-matched away. */
export const EXPECTED_DB_BEST_FIRST_LAP: AthleteFirstLap = { dateIso: '2024-06-06', slug: '2024-06-06', lapMs: 675000 };

/** All of Иванов's recorded splits including the 2.3 km-only run; Мария's rival row is name-matched away. */
export const EXPECTED_DB_FIRST_LAPS: AthleteFirstLap[] = [
  { dateIso: '2024-05-05', slug: '2024-05-05', lapMs: 720000 },
  EXPECTED_DB_BEST_FIRST_LAP,
  { dateIso: '2025-04-04', slug: '2025-04-04', lapMs: 999000 },
];

/** Нина's single run resolves through the women's place column. */
export const EXPECTED_WOMAN_RUN_PLACES: Record<string, number> = { '2025-02-02': 1 };

/**
 * Edge results only the pacing spec seeds: an unparsable split and a split-bearing row without a
 * total — the pacing read drops both in code, after the SQL cut.
 */
export const SEED_PACING_EDGE_RESULTS: readonly string[] = [
  `INSERT INTO results VALUES (${q('2025-06-06')}, 1, ${q('Иванов Иван')}, ${q('сбой')}, ${q('25:00')}, 1500000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.male)}, 1, NULL, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2025-06-06')}, 2, ${q('Иванов Иван')}, ${q('12:00')}, ${q('DNF')}, NULL, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.male)}, NULL, NULL, ${q('')}, ${q('')})`,
];

/**
 * Every split-bearing 5 km finish, oldest first: both of Иванов's spellings resolve to one key,
 * Мария falls back to the protocol spelling, and the 2.3 km-only run plus the split-less DNF row
 * never enter the scan.
 */
export const EXPECTED_DB_PACING_ROWS: PacingRow[] = [
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', gender: Gender.male, slug: '2024-05-05', lapMs: 720000, totalMs: 1600000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', gender: Gender.male, slug: '2024-06-06', lapMs: 675000, totalMs: 1500000 },
  { key: 'мария иванова', displayName: 'Мария Иванова', gender: Gender.female, slug: '2024-06-06', lapMs: 690000, totalMs: 1530000 },
  { key: RUNLESS_ATHLETE_KEY, displayName: 'Новикова Нина', gender: Gender.female, slug: '2025-02-02', lapMs: 780000, totalMs: 1700000 },
  { key: 'мария иванова', displayName: 'Мария Иванова', gender: Gender.female, slug: NEWER_ENTRY.slug, lapMs: 690000, totalMs: 1500000 },
];

/**
 * Stored 9:00 readings: two on the run-history events (the newer of which kept only the temperature)
 * and one on the newer archive event, so `selectArchiveEvents` joins a real reading there while the
 * older archive event, left unseeded, exercises the null branch.
 */
export const SEED_WEATHER: readonly string[] = [
  `INSERT INTO event_weather VALUES (${q('2024-05-05')}, -2.5, -6, 0, 14.3, 3)`,
  `INSERT INTO event_weather VALUES (${q('2024-06-06')}, 21.4, NULL, NULL, NULL, NULL)`,
  `INSERT INTO event_weather VALUES (${q(NEWER_ENTRY.slug)}, 24.6, 25.1, 0, 9.4, 1)`,
];

export const EXPECTED_DB_WEATHER_ROWS: EventWeatherRow[] = [
  { slug: '2024-05-05', temperatureC: -2.5, apparentC: -6, precipitationMm: 0, windKmh: 14.3, weatherCode: 3 },
  { slug: '2024-06-06', temperatureC: 21.4, apparentC: null, precipitationMm: null, windKmh: null, weatherCode: null },
  { slug: NEWER_ENTRY.slug, temperatureC: 24.6, apparentC: 25.1, precipitationMm: 0, windKmh: 9.4, weatherCode: 1 },
];

/** The full populated db used by most assertions. */
export const POPULATED_SEED: readonly string[] = [
  ...SEED_ATHLETES,
  ...SEED_RUNS,
  ...SEED_WOMAN_RUN,
  ...SEED_PARTICIPATIONS,
  ...SEED_WOMAN_PARTICIPATION,
  ...SEED_EVENTS,
  ...SEED_RESULTS,
  ...SEED_RUN_RESULTS,
  ...SEED_WEATHER,
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

/**
 * A materialised `overallStats` row whose numbers deliberately differ from `EXPECTED_SQL_STATS`, so
 * a test that seeds it proves `selectOverallStats` reads the stored value instead of re-aggregating.
 */
export const STORED_STATS: OverallStats = {
  eventsCount: 99,
  finishesCount: 888,
  finishersCount: 77,
  averageFinishes: 11.5,
  medianTimeMenMs: 1500000,
  medianTimeWomenMs: 1600000,
};

export const SEED_STORED_STATS: readonly string[] = [`INSERT INTO meta VALUES (${q('overallStats')}, ${q(JSON.stringify(STORED_STATS))})`];

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

/** The seeded per-gender winning times, oldest event first — the runner-score denominators. */
export const EXPECTED_WINNER_TIMES: EventWinnerTimes[] = [
  { slug: OLDER_ENTRY.slug, dateIso: OLDER_ENTRY.dateIso, bestMaleMs: OLDER_ENTRY.bestMaleMs, bestFemaleMs: OLDER_ENTRY.bestFemaleMs },
  { slug: NEWER_ENTRY.slug, dateIso: NEWER_ENTRY.dateIso, bestMaleMs: NEWER_ENTRY.bestMaleMs, bestFemaleMs: NEWER_ENTRY.bestFemaleMs },
];

/** Both seeded events fall into 2026, so its first race date is the older slug. */
export const EXPECTED_FIRST_EVENT_DATE_BY_YEAR: Record<string, string> = { '2026': OLDER_ENTRY.slug };

/** The `RACE_EVENT` (slug = its dateIso) with its club metadata, for the results-service read. */
export const SEED_RACE_EVENT: readonly string[] = [
  `INSERT INTO events VALUES (${q(RACE_EVENT.dateIso)}, ${q(RACE_EVENT.dateIso)}, ${RACE_EVENT.number}, ${legacy(RACE_EVENT.legacyNumber)}, ${q(RACE_EVENT.city)}, ` +
    `${q(RACE_EVENT.park)}, ${q(RACE_EVENT.clubName)}, ${q(RACE_EVENT.chairman)}, ${PROTOCOL_ROWS.length}, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
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

/** Cut at the last seeded run date: the same-date run stays out (republish safety), the 2.3 km run never counts. */
export const FINISH_COUNTS_BEFORE_DATE = '2025-05-05';

/** Иван's three earlier 5 km runs and Нина's single one, as `selectFiveKmFinishCountsBefore` serves them. */
export const EXPECTED_FINISH_COUNTS_BEFORE: Record<string, number> = {
  [ATHLETE_KEY]: 3,
  [RUNLESS_ATHLETE_KEY]: 1,
};

/** Иван's 1500000 of 2024-06-06 beats his other earlier runs; the same-date 2025-05-05 run stays out. */
export const EXPECTED_PREVIOUS_BESTS_BEFORE: Record<string, PreviousBest> = {
  [ATHLETE_KEY]: { slug: '2024-06-06', dateIso: '2024-06-06', timeMs: 1500000 },
  [RUNLESS_ATHLETE_KEY]: { slug: '2025-02-02', dateIso: '2025-02-02', timeMs: 1700000 },
};

/** The season the bump-chart read cuts to — the one holding runs of both seeded genders. */
export const SEASON_RUNS_YEAR = '2025';

/** The seeded 2025 five-km finishes oldest first: Нина's single run, then Иван's two (2.3 km never counts). */
export const EXPECTED_SEASON_RUNS: SeasonRun[] = [
  { key: RUNLESS_ATHLETE_KEY, displayName: 'Новикова Нина', gender: Gender.female, dateIso: '2025-02-02', timeMs: 1700000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', gender: Gender.male, dateIso: '2025-03-03', timeMs: 1560000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', gender: Gender.male, dateIso: '2025-05-05', timeMs: 1600000 },
];

/**
 * Season-lap edge rows: a corrupt gender code and an unparseable split never reach the lap
 * standings; the stranger outside the athletes table keeps the protocol spelling of his name.
 */
export const SEED_SEASON_LAP_EDGE_RESULTS: readonly string[] = [
  `INSERT INTO results VALUES (${q('2025-03-03')}, 9, ${q('Кривой Пол')}, ${q('10:00')}, ${q('22:00')}, 1320000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q('x')}, NULL, NULL, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2025-03-03')}, 10, ${q('Битый Сплит')}, ${q('junk')}, ${q('23:00')}, 1380000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.male)}, 2, NULL, ${q('')}, ${q('')})`,
  `INSERT INTO results VALUES (${q('2025-03-03')}, 11, ${q('Незнакомец Ник')}, ${q('11:00')}, ${q('24:00')}, 1440000, ` +
    `${FIVE_KM_DISTANCE_KM}, ${q(Gender.male)}, 3, NULL, ${q('')}, ${q('')})`,
];

/**
 * The lap standings source of the seeded 2025: every recorded split enters regardless of a 5 km
 * finish, so Иван's 2.3 km-only row joins Нина's. The 2024 rows, the corrupt gender code and the
 * unparseable split all stay out; display names resolve through the athletes table.
 */
export const EXPECTED_SEASON_LAP_RUNS: SeasonRun[] = [
  { key: RUNLESS_ATHLETE_KEY, displayName: 'Новикова Нина', gender: Gender.female, dateIso: '2025-02-02', timeMs: 780000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', gender: Gender.male, dateIso: '2025-04-04', timeMs: 999000 },
];

/** With the edge seed on top: the stranger joins under the protocol spelling of his name, in slug order. */
export const EXPECTED_SEASON_LAP_RUNS_WITH_EDGES: SeasonRun[] = [
  EXPECTED_SEASON_LAP_RUNS[0],
  { key: 'незнакомец ник', displayName: 'Незнакомец Ник', gender: Gender.male, dateIso: '2025-03-03', timeMs: 660000 },
  EXPECTED_SEASON_LAP_RUNS[1],
];

/** Only the stranger survives the edge rows: the corrupt gender and the junk split are skipped. */
export const EXPECTED_EDGE_FIRST_LAP_RECORDS: FirstLapRecords = {
  [Gender.male]: {
    key: 'незнакомец ник',
    displayName: 'Незнакомец Ник',
    gender: Gender.male,
    dateIso: '2025-03-03',
    slug: '2025-03-03',
    lapMs: 660000,
  },
  [Gender.female]: null,
};

/** The year the review test reads — the one holding both seeded 2024 events and runs. */
export const REVIEW_YEAR = '2024';

/** The years the seeded events span, newest first — what `loadYears` serves the switcher. */
export const EXPECTED_REVIEW_YEARS: string[] = ['2026', REVIEW_YEAR];

/** The 2024 events behind the year-review read; the first carries the organisers' legacy number. */
export const SEED_YEAR_EVENTS: readonly string[] = [
  `INSERT INTO events VALUES (${q('2024-05-05')}, ${q('2024-05-05')}, 1, ${legacy('3')}, ${q('Курск')}, ${q('Боева дача')}, ` +
    `${q('')}, ${q('')}, 1, 1, 1600000, NULL, NULL, 1600000, NULL, NULL, NULL)`,
  `INSERT INTO events VALUES (${q('2024-06-06')}, ${q('2024-06-06')}, 2, ${legacy(null)}, ${q('Курск')}, ${q('Боева дача')}, ` +
    `${q('')}, ${q('')}, 2, 2, 1560000, NULL, NULL, 1500000, NULL, NULL, NULL)`,
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
  bestMen: [{ key: ATHLETE_KEY, displayName: 'Иванов Иван', timeMs: 1500000, dateIso: '2024-06-06', slug: '2024-06-06' }],
  bestWomen: [],
  mostActive: [
    { key: ATHLETE_KEY, displayName: 'Иванов Иван', finishCount: 2 },
    { key: CORRUPT_GENDER_ATHLETE_KEY, displayName: 'Хитров Ян', finishCount: 1 },
  ],
  badgeHolders: [{ badge: YearBadge.newYearRace, holders: [{ key: ATHLETE_KEY, displayName: 'Иванов Иван' }] }],
  firstEventSlug: '2024-05-05',
};

/** Иван's own 5 km rows — no other athlete shares his events in `POPULATED_SEED`. */
export const EXPECTED_LONE_RIVAL_RUNS: RivalRun[] = [
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2024-05-05', slug: '2024-05-05', timeMs: 1600000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1500000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-03-03', slug: '2025-03-03', timeMs: 1560000 },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-05-05', slug: '2025-05-05', timeMs: 1600000 },
];

/**
 * Over `YEAR_REVIEW_SEED` Хитров shares the 2024-06-06 event, so his row joins Иван's own; Нина's
 * unshared run and the 2.3 km one stay out.
 */
export const EXPECTED_RIVAL_RUNS: RivalRun[] = [
  EXPECTED_LONE_RIVAL_RUNS[0],
  EXPECTED_LONE_RIVAL_RUNS[1],
  { key: CORRUPT_GENDER_ATHLETE_KEY, displayName: 'Хитров Ян', dateIso: '2024-06-06', slug: '2024-06-06', timeMs: 1620000 },
  EXPECTED_LONE_RIVAL_RUNS[2],
  EXPECTED_LONE_RIVAL_RUNS[3],
];

/** Every seeded finish (the 2.3 km run included) oldest first, as `selectLegendFinishes` serves it. */
export const EXPECTED_LEGEND_FINISHES: LegendFinish[] = [
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2024-05-05' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2024-06-06' },
  { key: RUNLESS_ATHLETE_KEY, displayName: 'Новикова Нина', dateIso: '2025-02-02' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-03-03' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-04-04' },
  { key: ATHLETE_KEY, displayName: 'Иванов Иван', dateIso: '2025-05-05' },
];
