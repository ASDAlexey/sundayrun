import { buildEventResultsFile } from '../core/github/results-file';
import { NEWER_ENTRY } from '../core/github/archive-index.mock';
import { RaceEvent } from '../core/models/race-event.interface';
import { ProtocolRow } from '../core/models/protocol-row.interface';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { Gender } from '../core/models/gender.enum';
import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { createProtocolDrizzle, ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { EMPTY_COURSE_RECORD_HISTORY } from '../core/history/course-records.constant';
import {
  selectArchiveEvents,
  selectAthleteRecord,
  selectAthleteRecords,
  selectAthleteRunPlaces,
  selectCourseRecords,
  selectEventParticipantRuns,
  selectEventResults,
  selectEventSlugs,
  selectFiveKmFinishCountsBefore,
  selectLegendFinishes,
  selectOverallStats,
  selectYearBadgeRarity,
  selectYearReview,
} from './protocol-db-queries';
import {
  ATHLETE_KEY,
  EXPECTED_ARCHIVE_EVENTS,
  EXPECTED_ATHLETE_RECORD,
  EXPECTED_COURSE_RECORDS,
  EXPECTED_DB_YEAR_REVIEW,
  EXPECTED_EMPTY_SQL_STATS,
  EXPECTED_EVENT_SLUGS,
  EXPECTED_FINISH_COUNTS_BEFORE,
  EXPECTED_LEADERBOARD_RECORDS,
  EXPECTED_LEGEND_FINISHES,
  EXPECTED_PARTICIPANT_RUNS,
  EXPECTED_RUN_PLACES,
  EXPECTED_SQL_STATS,
  EXPECTED_WOMAN_RUN_PLACES,
  FINISH_COUNTS_BEFORE_DATE,
  LATEST_EVENTS_LIMIT,
  PARTICIPANT_RUNS_SLUG,
  POPULATED_SEED,
  REVIEW_YEAR,
  RUNLESS_ATHLETE_KEY,
  UNKNOWN_ATHLETE_KEY,
  UNKNOWN_EVENT_SLUG,
  YEAR_REVIEW_SEED,
} from './protocol-db-queries.mock';

/** The event NEWER_ENTRY was seeded with its club metadata, and its two result rows. */
const EXPECTED_EVENT: RaceEvent = {
  number: NEWER_ENTRY.number,
  legacyNumber: NEWER_ENTRY.legacyNumber,
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
    await expect(selectAthleteRunPlaces(db, ATHLETE_KEY)).resolves.toEqual(EXPECTED_RUN_PLACES);
    await expect(selectAthleteRunPlaces(db, RUNLESS_ATHLETE_KEY), 'a women’s place comes from placeF').resolves.toEqual(
      EXPECTED_WOMAN_RUN_PLACES,
    );
    await expect(selectAthleteRunPlaces(db, UNKNOWN_ATHLETE_KEY), 'an unknown key has no places').resolves.toEqual({});
    await expect(selectAthleteRecords(db)).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);
    await expect(selectCourseRecords(db)).resolves.toEqual(EXPECTED_COURSE_RECORDS);
    await expect(selectOverallStats(db)).resolves.toEqual(EXPECTED_SQL_STATS);
    await expect(selectArchiveEvents(db)).resolves.toEqual(EXPECTED_ARCHIVE_EVENTS);
    await expect(selectEventSlugs(db)).resolves.toEqual(EXPECTED_EVENT_SLUGS);
    await expect(selectArchiveEvents(db, LATEST_EVENTS_LIMIT)).resolves.toEqual(EXPECTED_ARCHIVE_EVENTS.slice(0, LATEST_EVENTS_LIMIT));
    await expect(selectEventResults(db, NEWER_ENTRY.slug)).resolves.toEqual(buildEventResultsFile(EXPECTED_EVENT, EXPECTED_EVENT_ROWS));
    await expect(selectEventResults(db, UNKNOWN_EVENT_SLUG), 'an unknown slug resolves null').resolves.toBeNull();
    await expect(selectEventParticipantRuns(db, PARTICIPANT_RUNS_SLUG)).resolves.toEqual(EXPECTED_PARTICIPANT_RUNS);
    await expect(selectEventParticipantRuns(db, UNKNOWN_EVENT_SLUG), 'an unknown slug has no participants').resolves.toEqual([]);
    await expect(
      selectFiveKmFinishCountsBefore(db, FINISH_COUNTS_BEFORE_DATE),
      'the strict cut drops the same-date run; the 2.3 km run never counts',
    ).resolves.toEqual(EXPECTED_FINISH_COUNTS_BEFORE);
    await expect(selectYearBadgeRarity(db), 'no seeded year reaches a badge — an empty rarity map').resolves.toEqual({});
    await expect(selectLegendFinishes(db)).resolves.toEqual(EXPECTED_LEGEND_FINISHES);
  });

  it('boils one year of the archive down to its review and drops corrupt gender codes from the record scan', async () => {
    const db = await drizzleFor(YEAR_REVIEW_SEED);

    await expect(selectYearReview(db, REVIEW_YEAR)).resolves.toEqual(EXPECTED_DB_YEAR_REVIEW);
    await expect(selectCourseRecords(db), 'the corrupt gender code never enters the record scan').resolves.toEqual(EXPECTED_COURSE_RECORDS);
  });

  it('keeps the zero-division and empty-median guards on an empty db', async () => {
    const db = await drizzleFor([]);

    await expect(selectOverallStats(db)).resolves.toEqual(EXPECTED_EMPTY_SQL_STATS);
    await expect(selectCourseRecords(db), 'no runs mean no record history for either gender').resolves.toEqual(EMPTY_COURSE_RECORD_HISTORY);
    await expect(selectEventSlugs(db), 'an empty archive has no chronology').resolves.toEqual([]);
    await expect(selectYearBadgeRarity(db), 'no participants — no rarity').resolves.toEqual({});
    await expect(selectLegendFinishes(db), 'an empty archive has no legend finishes').resolves.toEqual([]);
    await expect(selectFiveKmFinishCountsBefore(db, FINISH_COUNTS_BEFORE_DATE), 'no runs mean no counts').resolves.toEqual({});
  });
});
