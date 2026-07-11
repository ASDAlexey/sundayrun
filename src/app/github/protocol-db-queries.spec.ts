import { EXISTING_INDEX } from '../core/github/archive-index.mock';
import { buildEventResultsFile } from '../core/github/results-file';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { Gender } from '../core/models/gender.enum';
import {
  selectArchiveEvents,
  selectAthleteRecord,
  selectAthleteRecords,
  selectEventResults,
  selectOverallStats,
} from './protocol-db-queries';
import {
  SELECT_ATHLETE_PARTICIPATIONS_SQL,
  SELECT_ATHLETE_RUNS_SQL,
  SELECT_ATHLETE_SQL,
  SELECT_EVENT_RESULTS_SQL,
  SELECT_EVENT_SQL,
  SELECT_EVENTS_SQL,
  SELECT_LATEST_EVENTS_SQL,
  SELECT_MEDIAN_TIME_SQL,
  SELECT_OVERALL_COUNTS_SQL,
  SELECT_RANKED_ATHLETES_SQL,
  SELECT_YEAR_BEST_RUNS_SQL,
} from './protocol-db-queries.constant';
import {
  ATHLETE_PARTICIPATION_ROWS,
  ATHLETE_RUN_ROWS,
  ATHLETE_SQL_ROW,
  EMPTY_COUNTS_ROW,
  EMPTY_MEDIAN_ROW,
  EVENT_SQL_ROWS,
  EXPECTED_ATHLETE_RECORD,
  EXPECTED_EMPTY_SQL_STATS,
  EXPECTED_LEADERBOARD_RECORDS,
  EXPECTED_SQL_STATS,
  LATEST_EVENTS_LIMIT,
  MEN_MEDIAN_ROW,
  OVERALL_COUNTS_ROW,
  RANKED_ATHLETE_ROWS,
  UNKNOWN_ATHLETE_KEY,
  UNKNOWN_EVENT_SLUG,
  YEAR_BEST_ROWS,
} from './protocol-db-queries.mock';
import { ProtocolDb } from './protocol-db.interface';

describe('protocol-db-queries', () => {
  const query = vi.fn();
  const db: ProtocolDb = { query };

  beforeEach(() => {
    query.mockReset();
  });

  it('selectAthleteRecord assembles the record from three keyed selects, recomputing the year bests', async () => {
    query.mockResolvedValueOnce([ATHLETE_SQL_ROW]);
    query.mockResolvedValueOnce(ATHLETE_RUN_ROWS);
    query.mockResolvedValueOnce(ATHLETE_PARTICIPATION_ROWS);

    await expect(selectAthleteRecord(db, ATHLETE_SQL_ROW.key)).resolves.toEqual(EXPECTED_ATHLETE_RECORD);
    expect(query).toHaveBeenCalledWith(SELECT_ATHLETE_SQL, { $key: ATHLETE_SQL_ROW.key });
    expect(query).toHaveBeenCalledWith(SELECT_ATHLETE_RUNS_SQL, { $key: ATHLETE_SQL_ROW.key });
    expect(query).toHaveBeenCalledWith(SELECT_ATHLETE_PARTICIPATIONS_SQL, { $key: ATHLETE_SQL_ROW.key });
  });

  it('selectAthleteRecord resolves null for an unknown key without fetching runs', async () => {
    query.mockResolvedValueOnce([]);

    await expect(selectAthleteRecord(db, UNKNOWN_ATHLETE_KEY)).resolves.toBeNull();
    expect(query).toHaveBeenCalledExactlyOnceWith(SELECT_ATHLETE_SQL, { $key: UNKNOWN_ATHLETE_KEY });
  });

  it('selectAthleteRecords shapes leaderboard records from the ranked athletes and their season bests', async () => {
    query.mockResolvedValueOnce(RANKED_ATHLETE_ROWS);
    query.mockResolvedValueOnce(YEAR_BEST_ROWS);

    await expect(selectAthleteRecords(db)).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);
    expect(query).toHaveBeenCalledWith(SELECT_RANKED_ATHLETES_SQL);
    expect(query).toHaveBeenCalledWith(SELECT_YEAR_BEST_RUNS_SQL, { $distanceKm: FIVE_KM_DISTANCE_KM });
  });

  it('selectOverallStats combines the aggregate counts with the per-gender medians', async () => {
    query.mockResolvedValueOnce([OVERALL_COUNTS_ROW]);
    query.mockResolvedValueOnce([MEN_MEDIAN_ROW]);
    query.mockResolvedValueOnce([EMPTY_MEDIAN_ROW]);

    await expect(selectOverallStats(db)).resolves.toEqual(EXPECTED_SQL_STATS);
    expect(query).toHaveBeenCalledWith(SELECT_OVERALL_COUNTS_SQL);
    expect(query).toHaveBeenCalledWith(SELECT_MEDIAN_TIME_SQL, { $gender: Gender.male, $distanceKm: FIVE_KM_DISTANCE_KM });
    expect(query).toHaveBeenCalledWith(SELECT_MEDIAN_TIME_SQL, { $gender: Gender.female, $distanceKm: FIVE_KM_DISTANCE_KM });
  });

  it('selectOverallStats keeps the zero-division guard of the JSON path on an empty db', async () => {
    query.mockResolvedValueOnce([EMPTY_COUNTS_ROW]);
    query.mockResolvedValueOnce([EMPTY_MEDIAN_ROW]);
    query.mockResolvedValueOnce([EMPTY_MEDIAN_ROW]);

    await expect(selectOverallStats(db)).resolves.toEqual(EXPECTED_EMPTY_SQL_STATS);
  });

  it('selectArchiveEvents reconstructs the file paths and applies the optional limit', async () => {
    query.mockResolvedValueOnce(EVENT_SQL_ROWS);

    await expect(selectArchiveEvents(db)).resolves.toEqual(EXISTING_INDEX.events);
    expect(query).toHaveBeenCalledExactlyOnceWith(SELECT_EVENTS_SQL);

    query.mockResolvedValueOnce(EVENT_SQL_ROWS.slice(0, LATEST_EVENTS_LIMIT));

    await expect(selectArchiveEvents(db, LATEST_EVENTS_LIMIT)).resolves.toEqual(EXISTING_INDEX.events.slice(0, LATEST_EVENTS_LIMIT));
    expect(query).toHaveBeenLastCalledWith(SELECT_LATEST_EVENTS_SQL, { $limit: LATEST_EVENTS_LIMIT });
  });

  it('selectEventResults assembles the file from the event metadata row and its result rows', async () => {
    // The aliased event/result rows are exactly `RaceEvent` / `ProtocolRow` shaped.
    query.mockResolvedValueOnce([RACE_EVENT]);
    query.mockResolvedValueOnce(PROTOCOL_ROWS);

    await expect(selectEventResults(db, RACE_EVENT.dateIso)).resolves.toEqual(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    expect(query).toHaveBeenCalledWith(SELECT_EVENT_SQL, { $slug: RACE_EVENT.dateIso });
    expect(query).toHaveBeenCalledWith(SELECT_EVENT_RESULTS_SQL, { $slug: RACE_EVENT.dateIso });
  });

  it('selectEventResults resolves null for an unknown slug without fetching the rows', async () => {
    query.mockResolvedValueOnce([]);

    await expect(selectEventResults(db, UNKNOWN_EVENT_SLUG)).resolves.toBeNull();
    expect(query).toHaveBeenCalledExactlyOnceWith(SELECT_EVENT_SQL, { $slug: UNKNOWN_EVENT_SLUG });
  });
});
